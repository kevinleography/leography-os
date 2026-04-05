import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

function generateFallbackPdf(quote: any): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const contact = quote.contacts as any;
  const clientName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : '—';
  const clientEmail = contact?.email || '';
  const ref = quote.reference || '—';
  const amountHt = (quote.amount_ht || 0) / 100;
  const amountTtc = (quote.amount_ttc || quote.amount_ht || 0) / 100;
  const tva = amountTtc - amountHt;
  const validUntil = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('fr-FR')
    : '—';
  const createdAt = quote.created_at
    ? new Date(quote.created_at).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  const pageW = 210;
  let y = 20;

  // Header gradient bar
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, pageW, 40, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('LEOGRAPHY', 20, 28);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Agence digitale — DOM-TOM', 20, 35);

  // Reference & date
  y = 55;
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`DEVIS ${ref}`, 20, y);

  y += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 120);
  doc.text(`Date : ${createdAt}`, 20, y);
  doc.text(`Valide jusqu'au : ${validUntil}`, 20, y + 6);

  // Client info box
  y += 20;
  doc.setFillColor(248, 248, 255);
  doc.roundedRect(120, y - 6, 70, 28, 3, 3, 'F');
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', 125, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(clientName, 125, y + 7);
  if (clientEmail) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 120);
    doc.text(clientEmail, 125, y + 14);
  }

  // Company info
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('LEOGRAPHY', 20, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 120);
  doc.text('contact@leography.fr', 20, y + 14);

  // Table header
  y += 40;
  doc.setFillColor(99, 102, 241);
  doc.rect(20, y, pageW - 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, y + 7);
  doc.text('Montant HT', 145, y + 7, { align: 'right' });
  doc.text('Montant TTC', pageW - 25, y + 7, { align: 'right' });

  // Table row
  y += 10;
  doc.setFillColor(250, 250, 255);
  doc.rect(20, y, pageW - 40, 12, 'F');
  doc.setTextColor(30, 30, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Prestation LEOGRAPHY', 25, y + 8);
  doc.text(`${amountHt.toFixed(2)} €`, 145, y + 8, { align: 'right' });
  doc.text(`${amountTtc.toFixed(2)} €`, pageW - 25, y + 8, { align: 'right' });

  // Totals
  y += 20;
  doc.setDrawColor(230, 230, 240);
  doc.line(110, y, pageW - 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 120);
  doc.text('Total HT', 115, y);
  doc.setTextColor(30, 30, 50);
  doc.text(`${amountHt.toFixed(2)} €`, pageW - 25, y, { align: 'right' });

  y += 7;
  doc.setTextColor(100, 100, 120);
  doc.text('TVA (20%)', 115, y);
  doc.setTextColor(30, 30, 50);
  doc.text(`${tva.toFixed(2)} €`, pageW - 25, y, { align: 'right' });

  y += 2;
  doc.setDrawColor(230, 230, 240);
  doc.line(110, y + 2, pageW - 20, y + 2);

  y += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Total TTC', 115, y);
  doc.text(`${amountTtc.toFixed(2)} €`, pageW - 25, y, { align: 'right' });

  // Footer
  const footerY = 275;
  doc.setDrawColor(230, 230, 240);
  doc.line(20, footerY, pageW - 20, footerY);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 165);
  doc.setFont('helvetica', 'normal');
  doc.text('LEOGRAPHY — Agence digitale DOM-TOM — leography.fr — contact@leography.fr', pageW / 2, footerY + 6, { align: 'center' });
  doc.text(`Devis ${ref} généré le ${new Date().toLocaleDateString('fr-FR')}`, pageW / 2, footerY + 11, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: quote, error } = await supabaseAdmin
      .from('quotes')
      .select('*, contacts(first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    const stripeQuoteId = quote.stripe_payment_id;
    const reference = quote.reference || id;

    // Try Stripe PDF first
    if (stripeQuoteId && stripeQuoteId.startsWith('qt_')) {
      try {
        const pdf = await stripe.quotes.pdf(stripeQuoteId);
        const chunks: Uint8Array[] = [];

        if (typeof (pdf as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of pdf as any) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
        } else {
          const reader = (pdf as any).body?.getReader?.();
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
          }
        }

        if (chunks.length > 0) {
          const buffer = Buffer.concat(chunks);
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="Devis-${reference}.pdf"`,
              'Content-Length': buffer.length.toString(),
            },
          });
        }
      } catch (stripeErr) {
        console.error('Stripe PDF failed, falling back to jspdf:', stripeErr);
      }
    }

    // Fallback: generate PDF with jspdf
    const buffer = generateFallbackPdf(quote);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Devis-${reference}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('PDF download error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors du téléchargement du PDF' },
      { status: 500 }
    );
  }
}
