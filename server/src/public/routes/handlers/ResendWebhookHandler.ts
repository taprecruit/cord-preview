import type { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { v4 as uuid } from 'uuid';
import { LogLevel } from 'common/types/index.ts';
import { contextWithSession } from 'server/src/RequestContext.ts';
import { getSequelize } from 'server/src/entity/sequelize.ts';
import { Viewer } from 'server/src/auth/index.ts';
import type { RelevantHeaders } from 'server/src/email/utils.ts';
import {
  emailTextToMessageContent,
  getNotification,
  parseRelevantHeaders,
  parseEmailAddress,
} from 'server/src/email/utils.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { MessageMutator } from 'server/src/entity/message/MessageMutator.ts';
import {
  FeatureFlags,
  getTypedFeatureFlagValue,
} from 'server/src/featureflags/index.ts';
import { EventMutator } from 'server/src/entity/event/EventMutator.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { LinkedOrgsEntity } from 'server/src/entity/linked_orgs/LinkedOrgsEntity.ts';
import { anonymousLogger, Logger } from 'server/src/logging/Logger.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { executeNewMessageCreationTasks } from 'server/src/message/executeMessageTasks.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import env from 'server/src/config/Env.ts';
import { resend } from 'server/src/email/resend.ts';
import type { RequestWithRawBody } from 'server/src/middleware/encoding.ts';

export default async function ResendWebhookHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  let logger = anonymousLogger();

  logger.debug('ResendWebhookHandler', {
    body: req.body,
    headers: req.headers,
    headerNames: Object.keys(req.headers),
  });

  // Verify webhook signature using Svix (Resend uses Svix for webhook delivery)
  // Svix sends: svix-id, svix-signature, svix-timestamp headers
  const svixId = req.headers['svix-id'] as string | undefined;
  const svixSignature = req.headers['svix-signature'] as string | undefined;
  const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;

  // For local development, allow skipping signature verification if RESEND_WEBHOOK_SECRET is not set
  const isLocalDev = process.env.NODE_ENV === 'development';
  const hasWebhookSecret = !!env.RESEND_WEBHOOK_SECRET;

  // Verify signature using Svix library if we have a secret configured
  if (hasWebhookSecret) {
    if (!svixSignature || !svixId || !svixTimestamp) {
      logger.warn('Missing required Svix headers for signature verification', {
        hasSignature: !!svixSignature,
        hasId: !!svixId,
        hasTimestamp: !!svixTimestamp,
        availableHeaders: Object.keys(req.headers),
      });
      return res.status(401).end();
    }

    // Get raw body for signature verification (Svix requires the raw body, not parsed JSON)
    if (!('rawBody' in req)) {
      logger.warn(
        'Missing rawBody in request - signature verification requires raw request body',
      );
      return res.status(400).end();
    }

    const rawBody = (req as RequestWithRawBody).rawBody.toString('utf-8');

    try {
      const wh = new Webhook(env.RESEND_WEBHOOK_SECRET);
      const headers = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      };

      // Verify the webhook signature - this will throw if invalid
      wh.verify(rawBody, headers);
      logger.debug('Svix webhook signature verified successfully');
    } catch (err) {
      logger.warn('Invalid Svix webhook signature', {
        error: err instanceof Error ? err.message : String(err),
      });
      return res.status(401).end();
    }
  } else if (isLocalDev) {
    // In local dev without secret, allow the request but warn
    if (!svixSignature) {
      logger.warn(
        'Missing Svix webhook signature, but allowing in local dev without secret',
      );
    } else {
      logger.warn(
        'Svix webhook signature present but RESEND_WEBHOOK_SECRET not configured, skipping verification',
      );
    }
  } else {
    // In production, require signature
    if (!svixSignature) {
      logger.warn('Missing Svix webhook signature in production');
      return res.status(401).end();
    }
  }

  // Resend webhook payload structure:
  // { type: "email.received", data: { from, to: [...], subject, attachments: [...], ... } }
  const reqBody: { [k: string]: unknown } | null | undefined = req.body;
  if (reqBody === null || reqBody === undefined) {
    logger.warn('request body missing');
    return res.end();
  }

  // Verify this is an email.received event
  if (typeof reqBody.type !== 'string' || reqBody.type !== 'email.received') {
    logger.debug('Not an email.received event, ignoring', {
      type: String(reqBody.type),
    });
    return res.end();
  }

  // Extract email data from the nested data field
  const emailData = reqBody.data as { [k: string]: unknown } | undefined;
  if (!emailData || typeof emailData !== 'object') {
    logger.warn('Missing email data in Resend webhook payload');
    return res.end();
  }

  // Resend sends 'to' as an array, take the first recipient
  const toAddresses = emailData.to as string[] | undefined;
  if (!Array.isArray(toAddresses) || toAddresses.length === 0) {
    logger.warn('Email "To" address is missing or empty');
    return res.end();
  }
  const toAddress = toAddresses[0];

  // Validate this is a Cord commenting email
  // Format: commenting-{uuid}@share.datapeople.io
  const toAddressDomain = toAddress.split('@')[1]?.toLowerCase();
  const toAddressLocal = toAddress.split('@')[0]?.toLowerCase();

  if (toAddressDomain !== 'share.datapeople.io') {
    logger.debug('Email not sent to share.datapeople.io, ignoring', {
      toAddress,
      domain: toAddressDomain,
    });
    return res.end();
  }

  if (!toAddressLocal?.startsWith('commenting-')) {
    logger.debug(
      'Email not a Cord commenting email (missing commenting- prefix), ignoring',
      {
        toAddress,
        localPart: toAddressLocal,
      },
    );
    return res.end();
  }

  // Extract email address from 'from' field (may be "Name <email@domain.com>" format)
  const fromField = emailData.from as string | undefined;
  if (typeof fromField !== 'string') {
    logger.warn('Email "From" address is missing');
    return res.end();
  }
  // Parse the from field to extract just the email address
  let fromAddress: string;
  try {
    const parsed = parseEmailAddress(fromField);
    fromAddress = parsed.address;
  } catch (e) {
    logger.warn('Failed to parse from address, using as-is', { fromField });
    fromAddress = fromField;
  }

  // Resend webhooks don't include email body, headers, or attachments - only metadata
  // We need to fetch the full email content via Resend API using email_id
  // See: https://resend.com/docs/api-reference/emails/retrieve-received-email
  const emailId = emailData.email_id as string | undefined;
  if (!emailId) {
    logger.warn(
      'Missing email_id in Resend webhook payload, cannot fetch email content',
    );
    return res.end();
  }

  // Fetch the full email content from Resend API
  // Response structure: { object, id, to, from, created_at, subject, html, text, headers, attachments, ... }
  let emailContent: {
    text?: string | null;
    html?: string | null;
    headers?: Record<string, string>;
    attachments?: Array<{ id: string; filename: string }>;
  };
  try {
    const emailResponse = await resend.emails.receiving.get(emailId);
    if (emailResponse.error) {
      logger.error('Failed to fetch email content from Resend API', {
        email_id: emailId,
        error: emailResponse.error,
      });
      return res.end();
    }
    emailContent = emailResponse.data || {};
  } catch (e) {
    logger.logException('Exception fetching email content from Resend API', e, {
      email_id: emailId,
    });
    return res.end();
  }

  // Parse headers from the fetched email content
  // Resend returns headers as an object: { "return-path": "...", "mime-version": "1.0", ... }
  let headers: RelevantHeaders | undefined;
  const messageId = emailData.message_id as string | undefined;

  if (emailContent.headers && typeof emailContent.headers === 'object') {
    // Convert headers object to string format for parsing
    const headersObj = emailContent.headers;
    const headersString = Object.entries(headersObj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    headers = parseRelevantHeaders(headersString);
  } else if (messageId) {
    // Fallback: use message_id if headers aren't available
    headers = {
      messageID: messageId,
      inReplyTo: undefined,
      autoSubmitted: undefined,
    };
  }

  // Check for auto-submitted emails
  if (headers?.autoSubmitted && headers?.autoSubmitted !== 'no') {
    logger.warn('Email reply was autogenerated, discarding', {
      autoSubmitted: headers.autoSubmitted,
      messageID: headers?.messageID,
    });
    return res.end();
  }

  const notification = await getNotification(
    toAddress,
    headers?.inReplyTo,
    fromAddress,
    logger,
  );
  if (notification === null) {
    logger.warn(
      'Notification id is not present in email address, could not be derived from headers, or notification is not present in db',
      {
        toAddress,
        inReplyTo: headers?.inReplyTo,
        fromAddress,
        messageID: headers?.messageID,
      },
    );
    return res.end();
  }

  // Check the user is still part of the org and is active
  const [orgMember, user, thread] = await Promise.all([
    OrgMembersEntity.findOne({
      where: {
        userID: notification.userID,
        orgID: notification.orgID,
      },
    }),
    UserEntity.findOne({
      where: {
        id: notification.userID,
      },
    }),
    ThreadEntity.findByPk(notification.threadID),
  ]);

  if (!orgMember) {
    logger.warn('User who sent the email is no longer part of the org', {
      userID: notification.userID,
      orgID: notification.orgID,
    });
    return res.end();
  }
  if (!user || user.state !== 'active') {
    logger.warn('User who sent the email is no longer active', {
      userID: notification.userID,
      orgID: notification.orgID,
      state: user?.state,
    });
    return res.end();
  }
  if (!thread) {
    logger.warn('Cannot add message to non-existent thread');
    return res.end();
  }

  const [org, application] = await Promise.all([
    OrgEntity.findByPk(notification.orgID),
    ApplicationEntity.findByPk(thread.platformApplicationID),
  ]);

  if (!org) {
    logger.warn('Org not found', {
      orgID: notification.orgID,
      notificationId: notification.id,
    });
    return res.end();
  }
  if (!application) {
    logger.warn('Application not found', {
      platformApplicationID: user.platformApplicationID,
      notificationID: notification.id,
    });
    return res.end();
  }
  const flagsUser = {
    userID: notification.userID,
    orgID: notification.orgID,
    platformApplicationID: org.platformApplicationID ?? 'extension',
    version: null,
    customerID: application?.customerID,
  };
  const emailRepliesEnabled = await getTypedFeatureFlagValue(
    FeatureFlags.EMAIL_REPLIES,
    flagsUser,
  );
  if (!emailRepliesEnabled) {
    return res.end();
  }

  // Deal with the case where a platform user has mentioned a non-platform user
  // in their slack org
  if (
    notification.threadOrgID &&
    notification.orgID !== notification.threadOrgID
  ) {
    const linkedOrg = await LinkedOrgsEntity.findOne({
      where: {
        sourceOrgID: notification.threadOrgID,
        linkedOrgID: notification.orgID,
      },
    });
    if (!linkedOrg) {
      logger.error('Email reply: linked org not found', {
        threadOrgId: notification.threadOrgID,
        notificationId: notification.id,
      });
      return res.end();
    }
  }

  // Extract email text content from the fetched email
  const emailText = emailContent.text;
  if (!emailText || typeof emailText !== 'string' || emailText.length === 0) {
    logger.warn('Email text body is missing or empty', {
      email_id: emailId,
      hasText: !!emailContent.text,
      hasHtml: !!emailContent.html,
    });
    return res.end();
  }

  const viewer = await Viewer.createLoggedInPlatformViewer({ user, org });

  logger = new Logger(viewer);

  try {
    const context = await contextWithSession(
      { viewer },
      getSequelize(),
      null,
      null,
    );

    // Use attachments from the fetched email content (not webhook metadata)
    // Resend API returns: [{ id, filename, content_type, content_disposition, content_id }]
    const attachments = emailContent.attachments;
    const attachmentsCount = Array.isArray(attachments)
      ? attachments.length
      : 0;

    const content = emailTextToMessageContent(
      emailText,
      String(attachmentsCount),
    );

    const message = await new MessageMutator(
      viewer,
      context.loaders,
    ).createMessage({
      id: uuid(),
      thread,
      content,
      url: null,
      replyToEmailNotificationID: notification.id,
    });

    const page = await PageEntity.findOne({
      where: {
        contextHash: thread?.pageContextHash,
      },
    });

    if (!page) {
      throw new Error(
        `Could not find page for message ${message.id} and thread ${thread?.id}`,
      );
    }
    await executeNewMessageCreationTasks({
      context,
      flagsUser,
      application,
      page,
      thread,
      message,
      fileAttachments: [],
      annotationAttachments: [],
      isFirstMessage: false,
      task: null,
      screenshotAttachment: null,
      sendNotifications: !!viewer.platformApplicationID,
      subscribeToThread: false,
    });

    // Don't replace viewer's org ID for logging event
    const eventMutator = new EventMutator(
      (
        await contextWithSession(
          {
            viewer: Viewer.createLoggedInViewer(
              notification.userID,
              notification.orgID,
            ),
          },
          getSequelize(),
          null,
          null,
        )
      ).session,
    );
    await eventMutator.createEvent({
      pageLoadID: null,
      installationID: null,
      eventNumber: null,
      clientTimestamp: new Date(Date.now()),
      logLevel: LogLevel.DEBUG,
      type: 'reply-via-email',
      payload: {
        messageID: message.id,
        notificationID: notification.id,
        resendEmailID: emailData.email_id as string | undefined,
        resendMessageID: headers?.messageID || messageId,
      },
      metadata: {},
    });
  } catch (e) {
    logger.logException('failed to create a message from email reply', e);
  }

  return res.end();
}
