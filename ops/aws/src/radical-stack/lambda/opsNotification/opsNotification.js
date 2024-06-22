const https = require('https');
const { inspect } = require('util');

const handler = async (input) => {
  for (const { Sns: sns } of input.Records) {
    // sns.TopiArn looks like
    // `arn:aws:sns:eu-west-2:869934154475:ops-notifications-loadtest`.
    // We only want the bit after the last colon.
    const topic = sns.TopicArn.replace(/^.*:/, '');
    const path = {
      // #ops
      'ops-notifications-prod': 'REPLACE WITH SLACK HOOK',
      // #ops-staging
      'ops-notifications-staging': 'REPLACE WITH SLACK HOOK',
      // #ops-loadtest
      'ops-notifications-loadtest': 'REPLACE WITH SLACK HOOK',
    }[topic];

    if (path) {
      const { Subject: subject, Message: message } = sns;

      const slackMessage = {
        text: subject,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: subject,
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: formatMessage(message),
            },
          },
        ],
      };

      await post(slackMessage, path);
    }
  }
};

function formatMessage(msg) {
  try {
    // Message payload is often JSON, including when the message was generated
    // by an alarm
    msg = JSON.parse(msg);
  } catch (_) {
    // If the message can't be parsed as JSON, just return it as-is.
    return msg;
  }

  // If the message was generated by an alarm, it contains the following fields:
  const { OldStateValue, NewStateValue, NewStateReason } = msg;
  if (OldStateValue && NewStateValue && NewStateReason) {
    return `${OldStateValue} -> ${NewStateValue}\n\n${NewStateReason}`;
  }

  // If the message was in JSON format and we haven't formatted it in a specific
  // way above, return this as a fallback.
  return `\`\`\`\n${inspect(msg, false, 10, false)}\n\`\`\``;
}

const post = (message, path) =>
  new Promise((resolve, reject) => {
    const options = {
      host: 'hooks.slack.com',
      port: '443',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let buffer = '';
      res.on('data', (chunk) => (buffer += chunk));
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', (e) => reject(e.message));
    req.write(JSON.stringify(message));
    req.end();
  });

exports.handler = handler;