#!/usr/bin/env -S node --enable-source-maps

/**
 * Use this script to test sending emails via our Resend account.
 *
 * For example, one thing you might find this script useful for is validating
 * that you've correctly added support for a new email domain. So e.g. when
 * you've added somecustomer.com as a supported domain in our Resend account,
 * you can use this script to send an email *from* someaddress@somecustomer.com
 * and verify that it arrives. (If the domain is misconfigured in Resend, the
 * call to the Resend API will fail and the script will print an error.)
 *
 *     ./scripts/send-mail.ts \
 *         --to <your username>@datapeople.io \
 *         --from foo@somecustomer.com
 */

import path from 'path';
import url from 'url';
import yargs from 'yargs';
import { Resend } from 'resend';
import 'dotenv/config.js';
import env from 'server/src/config/Env.ts';

const resend = new Resend(env.RESEND_API_KEY);

const argv = yargs(process.argv.slice(2)).option({
  to: {
    description: 'email address to send to',
    type: 'string',
    demandOption: true,
  },
  from: {
    description: 'email address to send from',
    type: 'string',
    default: 'test@cord.fyi',
  },
  message: {
    description: 'message to send',
    type: 'string',
    default: `This is a test email from ${path.basename(
      url.fileURLToPath(import.meta.url),
    )}`,
  },
  subject: {
    description: 'subject of the email',
    type: 'string',
    default: `Test email`,
  },
}).argv;

if (!argv.to.endsWith('@datapeople.io')) {
  console.error('Please use a @datapeople.io email address for the to field');
  process.exit(1);
}

const { data, error } = await resend.emails.send({
  to: argv.to,
  from: argv.from,
  subject: argv.subject,
  text: argv.message,
});

if (error) {
  console.error(JSON.stringify(error, null, 2));
  process.exit(1);
}

console.log('Email sent successfully:', data);
process.exit(0);
