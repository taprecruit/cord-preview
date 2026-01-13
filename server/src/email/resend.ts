import { Resend } from 'resend';
import env from 'server/src/config/Env.ts';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required');
    }
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export const resend = {
  get emails() {
    return getResendClient().emails;
  },
};
