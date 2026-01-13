import * as jwt from 'jsonwebtoken';
import { render } from '@react-email/render';
import React from 'react';
import type { UUID } from 'common/types/index.ts';
import { LogLevel } from 'common/types/index.ts';
import env from 'server/src/config/Env.ts';
import type { CustomEmailTemplate } from 'server/src/entity/application/ApplicationEntity.ts';
import type { ThreadDetails } from 'server/src/util/email.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import { getReplyToEmailAddress } from 'server/src/email/utils.ts';
import { logServerEvent } from 'server/src/entity/event/EventMutator.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import { DEFAULT_EMAIL_LOGO_WIDTH } from 'common/const/Sizes.ts';
import {
  AUTH0_CUSTOM_LOGIN_DOMAIN,
  CONSOLE_ORIGIN,
} from 'common/const/Urls.ts';
import { AUTH0_CLIENT_ID } from 'common/const/Ids.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import type { NotificationType } from 'server/src/entity/notification/NotificationEntity.ts';
import { resend } from 'server/src/email/resend.ts';
import { MentionNotification } from 'server/src/email/templates/MentionNotification.tsx';
import { ThreadResolve } from 'server/src/email/templates/ThreadResolve.tsx';
import { ShareToEmail } from 'server/src/email/templates/ShareToEmail.tsx';
import { ConsoleInvite } from 'server/src/email/templates/ConsoleInvite.tsx';
import { AccessGranted } from 'server/src/email/templates/AccessGranted.tsx';
import { AccessDenied } from 'server/src/email/templates/AccessDenied.tsx';
import { AccessRequest } from 'server/src/email/templates/AccessRequest.tsx';

type UnsubscribeThreadTokenData = {
  threadID: UUID;
  userID: UUID;
  orgID: UUID;
  appID: UUID | null;
};

export type ActionIcon = 'mention' | 'task' | 'paperclip';

export const encodeUnsubscribeThreadToken = (
  data: UnsubscribeThreadTokenData,
) => jwt.sign(data, env.EMAIL_LINKS_TOKEN_SECRET, { algorithm: 'HS512' });

export const decodeUnsubscribeThreadToken = (token: string) =>
  jwt.verify(token, env.EMAIL_LINKS_TOKEN_SECRET, {
    algorithms: ['HS512'],
  }) as UnsubscribeThreadTokenData;

// Helper to determine if we should show "Powered by Cord" based on customer tier
async function shouldShowPoweredBy(context: RequestContext): Promise<boolean> {
  if (!context.application?.customerID) {
    return true;
  }
  const customer = await context.loaders.customerLoader.load(
    context.application.customerID,
  );
  const tier = customer?.pricingTier;
  // Pro and scale tiers should not show "Powered by Cord"
  return tier !== 'pro' && tier !== 'scale';
}

export type SendActionEmailNotificationData = {
  context: RequestContext;
  recipientEmail: string;
  actionText: string;
  actionIconType: ActionIcon;
  pageName: string;
  pageURL: string;
  providerName: string | undefined;
  unsubscribeURL: string;
  partnerDetails: CustomEmailTemplate | undefined;
  threadDetails: ThreadDetails;
  emailNotification: EmailOutboundNotificationEntity;
  notificationType: NotificationType;
  inviteURL?: string | null;
};
/*
  Common function used to send thread-action and reply notifications.
  They are similar in that they both notify of an action eg resolving
  /unresolving a thread or a reply or @mention message.
  */
export async function sendActionEmailNotification({
  context,
  recipientEmail,
  actionText,
  actionIconType,
  pageName,
  pageURL,
  unsubscribeURL,
  partnerDetails,
  threadDetails,
  emailNotification,
  notificationType,
  inviteURL,
}: SendActionEmailNotificationData) {
  if (process.env.IS_TEST) {
    return;
  }

  const {
    firstMessageDetails,
    firstMessageUserDetails,
    previousMessageDetails,
    previousMessageUserDetails,
    currentMessageDetails,
    currentMessageUserDetails,
    messagesCountLeft,
  } = threadDetails;

  const threadingHeaders = await getThreadingHeaders(emailNotification);
  const showPoweredBy = await shouldShowPoweredBy(context);

  // See https://stackoverflow.com/questions/1027395/detecting-outlook-autoreply-out-of-office-emails#comment64988838_25324691
  // Request that MS Exchange does not send automated replies (like Out of Office)
  // back to this email
  const noAutoResponseHeader = { 'X-Auto-Response-Suppress': 'OOF' };

  const unsubscribeHeaders = {
    'List-Unsubscribe': `<${unsubscribeURL}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };

  let eventType = '';
  let emailType = '';
  if (notificationType === 'reply') {
    eventType = 'email-mention-notification-sent-v2';
    emailType = 'mention v2';
  } else if (notificationType === 'thread_action') {
    eventType = 'email-thread-action-notification-sent';
    emailType = 'thread action';
  }

  // Determine which template to use and render with appropriate props
  const commonProps = {
    action: actionText,
    pageName,
    pageURL,
    currentMessageDetails,
    currentMessageUserDetails,
    previousMessageDetails: previousMessageDetails || undefined,
    previousMessageUserDetails: previousMessageUserDetails || undefined,
    firstMessageDetails: firstMessageDetails || undefined,
    firstMessageUserDetails: firstMessageUserDetails || undefined,
    messagesCountLeft,
    unsubscribeURL,
    partnerName: partnerDetails?.partnerName || undefined,
    partnerImageURL: partnerDetails?.imageURL || undefined,
    imageHeight: partnerDetails?.logoConfig?.height || 'auto',
    imageWidth: partnerDetails?.logoConfig?.width || DEFAULT_EMAIL_LOGO_WIDTH,
    showPoweredBy,
  };

  const html = await render(
    notificationType === 'thread_action'
      ? React.createElement(ThreadResolve, commonProps)
      : React.createElement(MentionNotification, {
          ...commonProps,
          actionIcon: actionIconType,
          inviteURL: inviteURL || undefined,
        }),
  );

  const subject =
    notificationType === 'thread_action'
      ? `${currentMessageUserDetails.name} ${actionText} ${pageName}`
      : `${currentMessageUserDetails.name} ${actionText} on ${pageName}`;

  const { error } = await resend.emails.send({
    from:
      partnerDetails?.sender ??
      'Datapeople <notifications@share.datapeople.io>',
    to: recipientEmail,
    replyTo: getReplyToEmailAddress(
      context.logger,
      partnerDetails?.sender ??
        `Datapeople <notifications@share.datapeople.io>`,
      emailNotification.id,
    ),
    subject,
    html,
    headers: {
      ...threadingHeaders,
      ...noAutoResponseHeader,
      ...unsubscribeHeaders,
    },
  });

  if (error) {
    context.logger.error(
      `Failed sending ${emailType} email to ${recipientEmail}`,
      {
        error: error.message || error,
        from_address:
          partnerDetails?.sender ??
          'Datapeople <notifications@share.datapeople.io>',
        to_address: recipientEmail,
      },
    );
    return false;
  }

  context.logger.info(`Sent ${emailType} email to ${recipientEmail}`);
  logServerEvent({
    session: context.session,
    type: eventType,
    logLevel: LogLevel.DEBUG,
    payload: {
      from:
        partnerDetails?.sender ??
        'Datapeople <notifications@share.datapeople.io>',
      to: recipientEmail,
    },
  });

  return true;
}

// the EmailEmail repetition is intentional
export async function sendShareThreadToEmailEmail(
  context: RequestContext,
  recipientEmail: string,
  pageName: string,
  pageURL: string,
  partnerDetails: CustomEmailTemplate | undefined,
  threadDetails: ThreadDetails,
  emailNotification: EmailOutboundNotificationEntity | null,
  inviteURL?: string | null,
) {
  if (process.env.IS_TEST) {
    return true;
  }

  const {
    senderName,
    firstMessageDetails,
    firstMessageUserDetails,
    previousMessageDetails,
    previousMessageUserDetails,
    currentMessageDetails,
    currentMessageUserDetails,
    messagesCountLeft,
  } = threadDetails;

  const showPoweredBy = await shouldShowPoweredBy(context);

  const html = await render(
    React.createElement(ShareToEmail, {
      senderName,
      pageName,
      pageURL,
      currentMessageDetails,
      currentMessageUserDetails,
      previousMessageDetails: previousMessageDetails || undefined,
      previousMessageUserDetails: previousMessageUserDetails || undefined,
      firstMessageDetails: firstMessageDetails || undefined,
      firstMessageUserDetails: firstMessageUserDetails || undefined,
      messagesCountLeft,
      partnerName: partnerDetails?.partnerName || undefined,
      partnerImageURL: partnerDetails?.imageURL || undefined,
      imageHeight: partnerDetails?.logoConfig?.height || 'auto',
      imageWidth: partnerDetails?.logoConfig?.width || DEFAULT_EMAIL_LOGO_WIDTH,
      inviteURL: inviteURL || undefined,
      showPoweredBy,
    }),
  );

  const subject = `${senderName} shared a thread with you on ${pageName}`;

  const { error } = await resend.emails.send({
    from:
      partnerDetails?.sender ??
      'Datapeople <notifications@share.datapeople.io>',
    to: recipientEmail,
    replyTo: emailNotification
      ? getReplyToEmailAddress(
          context.logger,
          partnerDetails?.sender ??
            `Datapeople <notifications@share.datapeople.io>`,
          emailNotification.id,
        )
      : (partnerDetails?.sender ??
        `Datapeople <notifications@share.datapeople.io>`),
    subject,
    html,
  });

  if (error) {
    context.logger.error(
      `Failed sending shareThreadToEmail email to ${recipientEmail}`,
      {
        error: error.message || error,
      },
    );
    return false;
  }

  context.logger.info(`Sent shareThreadToEmail email to ${recipientEmail}`);
  logServerEvent({
    session: context.session,
    type: 'email-share-thread-to-email-sent',
    logLevel: LogLevel.DEBUG,
    payload: {
      from:
        partnerDetails?.sender ??
        'Datapeople <notifications@share.datapeople.io>',
      to: recipientEmail,
    },
  });

  return true;
}

type ThreadingHeaders =
  | {
      'Message-ID': string;
    }
  | {
      'Message-ID': string;
      'In-Reply-To': string;
      References: string;
    };
// Returns the email headers Message-ID, In-Reply-To and References to enable
// threading of emails (in the email client) for the same Cord thread.
// We also use these headers when handling inbound replies in ResendWebhookHandler
// if the notificationID is not in the 'to' address.
async function getThreadingHeaders(
  emailNotification: EmailOutboundNotificationEntity,
): Promise<ThreadingHeaders> {
  const isFirstEmail =
    (await EmailOutboundNotificationEntity.count({
      where: {
        email: emailNotification.email,
        threadID: emailNotification.threadID,
      },
    })) === 1;

  if (isFirstEmail) {
    return {
      'Message-ID': `<thread-${emailNotification.threadID}@parse.cord.datapeople.io>`,
    };
  } else {
    return {
      'Message-ID': `<notif-${emailNotification.id}@parse.cord.datapeople.io>`,
      'In-Reply-To': `<thread-${emailNotification.threadID}@parse.cord.datapeople.io>`,
      References: `<thread-${emailNotification.threadID}@parse.cord.datapeople.io>`,
    };
  }
}

export async function sendEmailInviteConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  inviterName: string,
  customerID: UUID,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const customer = await CustomerEntity.findByPk(customerID);

  if (!customer) {
    throw new Error('No customer, no customer invite!');
  }

  const inviteLink = encodeURI(
    `https://${AUTH0_CUSTOM_LOGIN_DOMAIN}/authorize?` +
      'response_type=code&' +
      `client_id=${AUTH0_CLIENT_ID}&` +
      `redirect_uri=${CONSOLE_ORIGIN}/login&` +
      'scope=openid email profile&' +
      'screen_hint=signup&' +
      `login_hint=${recipientEmail}`,
  );

  const html = await render(
    React.createElement(ConsoleInvite, {
      inviteLink,
      inviterName,
      customerName: customer.name,
    }),
  );

  const subject = `${inviterName} has invited you to join ${customer.name}'s Cord console account`;

  const { error } = await resend.emails.send({
    from: 'Datapeople <notifications@share.datapeople.io>',
    to: recipientEmail,
    subject,
    html,
  });

  if (error) {
    context.logger.error(`Failed sending email to ${recipientEmail}`, {
      error: error.message || error,
    });
    return false;
  }

  context.logger.info(`Sent email to invite ${recipientEmail} to cord console`);
  logServerEvent({
    session: context.session,
    type: 'email-invite-console-user',
    logLevel: LogLevel.DEBUG,
    payload: {
      from: 'Datapeople <notifications@share.datapeople.io>',
      to: recipientEmail,
    },
  });

  return true;
}

export async function sendAccessGrantedEmailToConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  customer: CustomerEntity,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const html = await render(
    React.createElement(AccessGranted, {
      consoleLink: `${CONSOLE_ORIGIN}/login`,
      customerName: customer.name,
    }),
  );

  const subject = `Access granted to ${customer.name} in Cord console`;

  const { error } = await resend.emails.send({
    from: 'Datapeople <notifications@share.datapeople.io>',
    to: recipientEmail,
    subject,
    html,
  });

  if (error) {
    context.logger.error(`Failed sending email to ${recipientEmail}`, {
      error: error.message || error,
    });
    return false;
  }

  context.logger.info(
    `Sent email to ${recipientEmail} to notify access granted to customer in cord console`,
  );
  logServerEvent({
    session: context.session,
    type: 'email-granted-access-console-user',
    logLevel: LogLevel.DEBUG,
    payload: {
      from: 'Datapeople <notifications@share.datapeople.io>',
      to: recipientEmail,
      customerID: customer.id,
    },
  });

  return true;
}

export async function sendAccessDeniedEmailToConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  customer: CustomerEntity,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const html = await render(
    React.createElement(AccessDenied, {
      consoleLink: `${CONSOLE_ORIGIN}/login?newcustomer=true`,
      customerName: customer.name,
    }),
  );

  const subject = `Access denied to ${customer.name} in Cord console`;

  const { error } = await resend.emails.send({
    from: 'Datapeople <notifications@share.datapeople.io>',
    to: recipientEmail,
    subject,
    html,
  });

  if (error) {
    context.logger.error(`Failed sending email to ${recipientEmail}`, {
      error: error.message || error,
    });
    return false;
  }

  context.logger.info(
    `Sent email to ${recipientEmail} to notify access denied to customer in cord console`,
  );
  logServerEvent({
    session: context.session,
    type: 'email-denied-access-console-user',
    logLevel: LogLevel.DEBUG,
    payload: {
      from: 'Datapeople <notifications@share.datapeople.io>',
      to: recipientEmail,
      customerID: customer.id,
    },
  });

  return true;
}

/**
 * Used for when a console user requests access to an existing customer
 */
async function sendRequestAccessEmailToConsoleUser(
  context: RequestContext,
  recipientEmail: string,
  requesterEmail: string,
  customerName: string,
  customerID: UUID,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const html = await render(
    React.createElement(AccessRequest, {
      senderEmail: requesterEmail,
      customerName,
      viewAccessRequestsLink: `${CONSOLE_ORIGIN}/usermanagement`,
    }),
  );

  const subject = `${requesterEmail} has requested access to ${customerName} in Cord console`;

  const { error } = await resend.emails.send({
    from: 'Datapeople <notifications@share.datapeople.io>',
    to: recipientEmail,
    subject,
    html,
  });

  if (error) {
    context.logger.error(`Failed sending email to ${recipientEmail}`, {
      error: error.message || error,
    });
    return false;
  }

  context.logger.info(
    `Sent request access email to ${recipientEmail} to cord console`,
  );
  logServerEvent({
    session: context.session,
    type: 'email-request-access-customer',
    logLevel: LogLevel.DEBUG,
    payload: {
      from: 'Datapeople <notifications@share.datapeople.io>',
      to: recipientEmail,
      customerID,
    },
  });

  return true;
}

export async function sendAccessRequestToCustomerConsoleUsers(
  context: RequestContext,
  requesterEmail: string,
  customerID: UUID,
) {
  if (process.env.IS_TEST) {
    return;
  }

  const customer = await CustomerEntity.findByPk(customerID);

  if (!customer) {
    throw new Error('No customer, no customer invite!');
  }
  const approvedCustomerConsoleUsers =
    await context.loaders.consoleUserLoader.loadConsoleUsersForCustomer(
      customerID,
    );

  if (approvedCustomerConsoleUsers.length === 0) {
    throw new Error('No console users in this customer');
  }

  return await Promise.all(
    approvedCustomerConsoleUsers.map((consoleUser) =>
      sendRequestAccessEmailToConsoleUser(
        context,
        consoleUser.email,
        requesterEmail,
        customer.name,
        customer.id,
      ),
    ),
  );
}

// Legacy SendGrid template IDs - no longer used with React Email templates
// These are kept for backwards compatibility with the feature flag system
export const DEFAULT_MENTION_NOTIFICATION_V2_TEMPLATE_ID = '';
export const DEFAULT_SHARE_TO_EMAIL_TEMPLATE_ID = '';
export const DEFAULT_THREAD_RESOLVE_TEMPLATE_ID = '';
