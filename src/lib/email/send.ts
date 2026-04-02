import { resend } from '@/lib/resend/client';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

const FROM_ADDRESSES = {
  gestion: `LEOGRAPHY <gestion@leography.fr>`,
  contact: `LEOGRAPHY <contact@leography.fr>`,
  kevin: `Kevin — LEOGRAPHY <kevin@leography.fr>`,
} as const;

export async function sendEmail({
  to,
  subject,
  html,
  from = FROM_ADDRESSES.gestion,
  replyTo = 'contact@leography.fr',
}: SendEmailParams) {
  return resend.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
  });
}

export { FROM_ADDRESSES };
