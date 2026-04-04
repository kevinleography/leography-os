import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch quote from Supabase
    const { data: quote, error } = await supabaseAdmin
      .from('quotes')
      .select('*, contacts(first_name, last_name, email)')
      .eq('id', id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    const stripeQuoteId = quote.stripe_payment_id;

    if (!stripeQuoteId || !stripeQuoteId.startsWith('qt_')) {
      return NextResponse.json(
        { error: 'Aucun PDF Stripe disponible pour ce devis. Recréez le devis.' },
        { status: 404 }
      );
    }

    // Stream the PDF from Stripe
    const pdf = await stripe.quotes.pdf(stripeQuoteId);

    // Collect chunks into a buffer
    const chunks: Uint8Array[] = [];
    const reader = (pdf as any).body?.getReader?.();

    if (reader) {
      // Web ReadableStream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } else if (typeof (pdf as any)[Symbol.asyncIterator] === 'function') {
      // Node.js readable stream
      for await (const chunk of pdf as any) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
    } else {
      // Try arrayBuffer
      const arrayBuffer = await (pdf as any).arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
    }

    const buffer = Buffer.concat(chunks);
    const reference = quote.reference || id;

    return new NextResponse(buffer, {
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
