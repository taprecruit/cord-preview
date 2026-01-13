#!/usr/bin/env -S node --enable-source-maps

/**
 * Creates a test email notification record for testing webhook functionality.
 * 
 * Usage:
 *   ./scripts/create-test-email-notification.ts --email your-email@datapeople.io
 * 
 * This will create an email notification and print the UUID that you can use
 * in the reply-to address: commenting-{uuid}@share.datapeople.io
 */

import 'dotenv/config.js';
import yargs from 'yargs';
import { v4 as uuid } from 'uuid';
import { initSequelize, getSequelize } from 'server/src/entity/sequelize.ts';
import { EmailOutboundNotificationEntity } from 'server/src/entity/email_notification/EmailOutboundNotificationEntity.ts';
import { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import { ThreadEntity } from 'server/src/entity/thread/ThreadEntity.ts';
import { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import { ApplicationEntity } from 'server/src/entity/application/ApplicationEntity.ts';
import { CustomerEntity } from 'server/src/entity/customer/CustomerEntity.ts';
import { OrgMembersEntity } from 'server/src/entity/org_members/OrgMembersEntity.ts';
import { PageEntity } from 'server/src/entity/page/PageEntity.ts';
import { AuthProviderType } from 'server/src/auth/index.ts';
import { Viewer } from 'server/src/auth/index.ts';
import { UserMutator } from 'server/src/entity/user/UserMutator.ts';

const argv = await yargs(process.argv.slice(2))
  .option('email', {
    description: 'Email address for the notification',
    type: 'string',
    demandOption: true,
  })
  .option('user-id', {
    description: 'User ID (optional - will use first user if not provided)',
    type: 'string',
  })
  .option('thread-id', {
    description: 'Thread ID (optional - will use first thread if not provided)',
    type: 'string',
  })
  .option('org-id', {
    description: 'Org ID (optional - will use first org if not provided)',
    type: 'string',
  })
  .parse();

async function createTestDataIfNeeded() {
  // Check if we have any data
  const existingUser = await UserEntity.findOne();
  const existingOrg = await OrgEntity.findOne();
  const existingThread = await ThreadEntity.findOne();

  if (existingUser && existingOrg && existingThread) {
    return {
      userID: existingUser.id,
      orgID: existingOrg.id,
      threadID: existingThread.id,
      threadOrgID: existingThread.orgID,
    };
  }

  console.log('Creating test data (user, org, thread)...');

  // Create customer
  const customer = await CustomerEntity.create({
    name: 'Test Customer',
  });

  // Create application
  const application = await ApplicationEntity.create({
    name: 'Test Application',
    sharedSecret: 'test-secret',
    customerID: customer.id,
  });

  // Create org
  const org = await OrgEntity.create({
    id: uuid(),
    state: 'active',
    name: 'Test Org',
    externalID: 'test-org',
    externalProvider: AuthProviderType.PLATFORM,
    platformApplicationID: application.id,
  });

  // Create user
  const viewer = Viewer.createServiceViewer();
  const userMutator = new UserMutator(viewer, null);
  const user = await getSequelize().transaction(async (transaction) => {
    const [newUser] = await userMutator.findOrCreateExternalUser(
      {
        externalID: `test-user-${uuid()}`,
        externalProvider: AuthProviderType.PLATFORM,
        platformApplicationID: application.id,
        email: argv.email,
        name: 'Test User',
        screenName: null,
        profilePictureURL: null,
        state: 'active',
      },
      transaction,
    );

    // Add user to org
    await OrgMembersEntity.findOrCreate({
      where: {
        userID: newUser.id,
        orgID: org.id,
      },
      defaults: {} as any,
      transaction,
    });

    return newUser;
  });

  // Create page
  const pageContextHash = uuid();
  const page = await PageEntity.create({
    id: uuid(),
    orgID: org.id,
    contextHash: pageContextHash,
    contextData: {},
  });

  // Create thread
  const thread = await ThreadEntity.create({
    id: uuid(),
    orgID: org.id,
    name: 'Test Thread',
    url: 'https://example.com/test-thread',
    platformApplicationID: application.id,
    pageContextHash: page.contextHash,
  });

  console.log('✅ Test data created!');
  return {
    userID: user.id,
    orgID: org.id,
    threadID: thread.id,
    threadOrgID: thread.orgID,
  };
}

async function main() {
  await initSequelize('script');

  let userID = argv['user-id'];
  let threadID = argv['thread-id'];
  let orgID = argv['org-id'];
  let threadOrgID = orgID;

  // If not provided, try to find existing records or create test data
  if (!userID || !threadID || !orgID) {
    const testData = await createTestDataIfNeeded();
    userID = userID || testData.userID;
    threadID = threadID || testData.threadID;
    orgID = orgID || testData.orgID;
    threadOrgID = threadOrgID || testData.threadOrgID;
  }

  // Validate provided IDs exist
  if (userID) {
    const user = await UserEntity.findByPk(userID);
    if (!user) {
      console.error(`User ${userID} not found`);
      process.exit(1);
    }
    console.log(`Using user ID: ${userID}`);
  }

  if (orgID) {
    const org = await OrgEntity.findByPk(orgID);
    if (!org) {
      console.error(`Org ${orgID} not found`);
      process.exit(1);
    }
    console.log(`Using org ID: ${orgID}`);
  }

  if (threadID) {
    const thread = await ThreadEntity.findByPk(threadID);
    if (!thread) {
      console.error(`Thread ${threadID} not found`);
      process.exit(1);
    }
    threadOrgID = thread.orgID;
    console.log(`Using thread ID: ${threadID}`);
  }

  // Create the email notification
  const emailNotification = await EmailOutboundNotificationEntity.create({
    id: uuid(),
    userID,
    orgID,
    threadID,
    threadOrgID,
    email: argv.email,
  });

  console.log('\n✅ Email notification created!');
  console.log(`\nUUID: ${emailNotification.id}`);
  console.log(`\nReply-to address: commenting-${emailNotification.id}@share.datapeople.io`);
  console.log(`\nYou can now send a test email to this address to test the webhook.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);

