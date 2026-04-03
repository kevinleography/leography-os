import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, invoiceNumber, amount, from } = body;
    const fromEmail = from && ['gestion@leography.fr', 'contact@leography.fr'].includes(from) ? from : 'gestion@leography.fr';

    if (!to || !subject) {
      return NextResponse.json({ error: 'Destinataire et sujet requis' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">LEOGRAPHY</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Facture ${invoiceNumber || ''}</p>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
            <pre style="font-family: Inter, sans-serif; white-space: pre-wrap; color: #475569; line-height: 1.6;">${message || ''}</pre>
            ${amount ? `<div style="margin-top: 24px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Montant total</p>
              <p style="margin: 8px 0 0; font-size: 28px; font-weight: 800; color: #1e293b;">${(amount / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
            </div>` : ''}
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
