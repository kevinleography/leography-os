// Branded email templates for LEOGRAPHY OS
// All automated emails use gestion@leography.fr

const BRAND_COLOR = '#6366f1';
const BRAND_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
const BG_COLOR = '#0f0f13';
const CARD_BG = '#1a1a24';
const TEXT_PRIMARY = '#f0f0f5';
const TEXT_SECONDARY = '#9ca3af';
const BORDER_COLOR = '#2a2a3a';

function baseLayout(content: string, preheader?: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LEOGRAPHY</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:${BG_COLOR};max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="background:${BRAND_GRADIENT};-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                LEOGRAPHY
              </div>
            </td>
          </tr>
          <!-- Content Card -->
          <tr>
            <td style="background-color:${CARD_BG};border-radius:16px;border:1px solid ${BORDER_COLOR};padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:${TEXT_SECONDARY};line-height:1.5;">
                LEOGRAPHY — Agence digitale DOM-TOM<br/>
                <a href="https://leography.fr" style="color:${BRAND_COLOR};text-decoration:none;">leography.fr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};line-height:1.3;">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:${TEXT_SECONDARY};line-height:1.6;">${text}</p>`;
}

function ctaButton(text: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="background:${BRAND_GRADIENT};border-radius:10px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:${TEXT_SECONDARY};border-bottom:1px solid ${BORDER_COLOR};">${label}</td>
    <td align="right" style="padding:8px 0;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};border-bottom:1px solid ${BORDER_COLOR};">${value}</td>
  </tr>`;
}

function infoTable(rows: { label: string; value: string }[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    ${rows.map((r) => infoRow(r.label, r.value)).join('')}
  </table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BORDER_COLOR};margin:24px 0;" />`;
}

// --- Template functions ---

export function quoteEmail(params: {
  clientName: string;
  reference: string;
  amount: string;
  validUntil: string;
  viewUrl: string;
}) {
  const content = [
    heading('Nouveau devis'),
    paragraph(`Bonjour ${params.clientName},`),
    paragraph('Veuillez trouver ci-dessous votre devis. Vous pouvez le consulter et l\'accepter en ligne.'),
    infoTable([
      { label: 'Référence', value: params.reference },
      { label: 'Montant TTC', value: params.amount },
      { label: 'Valide jusqu\'au', value: params.validUntil },
    ]),
    ctaButton('Consulter le devis', params.viewUrl),
    paragraph('Si vous avez des questions, n\'hésitez pas à nous contacter.'),
    divider(),
    paragraph('Cordialement,<br/><strong>L\'équipe LEOGRAPHY</strong>'),
  ].join('');

  return {
    subject: `Devis ${params.reference} — LEOGRAPHY`,
    html: baseLayout(content, `Votre devis ${params.reference} est prêt`),
  };
}

export function invoiceEmail(params: {
  clientName: string;
  reference: string;
  amount: string;
  dueDate: string;
  payUrl: string;
}) {
  const content = [
    heading('Facture'),
    paragraph(`Bonjour ${params.clientName},`),
    paragraph('Votre facture est disponible. Vous pouvez la régler en ligne via le lien ci-dessous.'),
    infoTable([
      { label: 'Référence', value: params.reference },
      { label: 'Montant TTC', value: params.amount },
      { label: 'Échéance', value: params.dueDate },
    ]),
    ctaButton('Payer maintenant', params.payUrl),
    paragraph('Le paiement est sécurisé via Stripe.'),
    divider(),
    paragraph('Cordialement,<br/><strong>L\'équipe LEOGRAPHY</strong>'),
  ].join('');

  return {
    subject: `Facture ${params.reference} — LEOGRAPHY`,
    html: baseLayout(content, `Facture ${params.reference} à régler`),
  };
}

export function signatureRequestEmail(params: {
  clientName: string;
  documentName: string;
  signUrl: string;
}) {
  const content = [
    heading('Signature requise'),
    paragraph(`Bonjour ${params.clientName},`),
    paragraph(`Le document <strong>${params.documentName}</strong> nécessite votre signature électronique.`),
    ctaButton('Signer le document', params.signUrl),
    paragraph('La signature est sécurisée et juridiquement valable via DocuSeal.'),
    divider(),
    paragraph('Cordialement,<br/><strong>L\'équipe LEOGRAPHY</strong>'),
  ].join('');

  return {
    subject: `Signature requise — ${params.documentName}`,
    html: baseLayout(content, `Document à signer : ${params.documentName}`),
  };
}

export function paymentConfirmationEmail(params: {
  clientName: string;
  reference: string;
  amount: string;
  date: string;
}) {
  const content = [
    heading('Paiement confirmé ✓'),
    paragraph(`Bonjour ${params.clientName},`),
    paragraph('Nous confirmons la bonne réception de votre paiement. Merci !'),
    infoTable([
      { label: 'Référence', value: params.reference },
      { label: 'Montant', value: params.amount },
      { label: 'Date', value: params.date },
    ]),
    paragraph('Un reçu est disponible dans votre espace client.'),
    divider(),
    paragraph('Cordialement,<br/><strong>L\'équipe LEOGRAPHY</strong>'),
  ].join('');

  return {
    subject: `Paiement confirmé — ${params.reference}`,
    html: baseLayout(content, `Paiement de ${params.amount} confirmé`),
  };
}

export function welcomeEmail(params: {
  clientName: string;
  portalUrl: string;
}) {
  const content = [
    heading('Bienvenue chez LEOGRAPHY'),
    paragraph(`Bonjour ${params.clientName},`),
    paragraph('Votre espace client est prêt. Vous y retrouverez vos projets, documents, factures et validations.'),
    ctaButton('Accéder à mon espace', params.portalUrl),
    paragraph('N\'hésitez pas à nous contacter pour toute question.'),
    divider(),
    paragraph('Cordialement,<br/><strong>L\'équipe LEOGRAPHY</strong>'),
  ].join('');

  return {
    subject: 'Bienvenue chez LEOGRAPHY',
    html: baseLayout(content, 'Votre espace client LEOGRAPHY est prêt'),
  };
}

export function notificationEmail(params: {
  clientName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const content = [
    heading(params.title),
    paragraph(`Bonjour ${params.clientName},`),
    paragraph(params.message),
    params.actionUrl && params.actionLabel
      ? ctaButton(params.actionLabel, params.actionUrl)
      : '',
    divider(),
    paragraph('Cordialement,<br/><strong>L\'équipe LEOGRAPHY</strong>'),
  ].join('');

  return {
    subject: `${params.title} — LEOGRAPHY`,
    html: baseLayout(content),
  };
}
