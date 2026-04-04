import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch payment from Supabase
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
    }

    const stripeId = payment.stripe_payment_id;

    if (!stripeId) {
      return NextResponse.json(
        { error: 'Aucun document Stripe disponible pour ce paiement.' },
        { status: 404 }
      );
    }

    // If it's a Stripe Invoice ID (in_ prefix) → redirect to invoice PDF
    if (stripeId.startsWith('in_')) {
      const invoice = await stripe.invoices.retrieve(stripeId);
      if (invoice.invoice_pdf) {
        return NextResponse.redirect(invoice.invoice_pdf);
      }
      if (invoice.hosted_invoice_url) {
        return NextResponse.redirect(invoice.hosted_invoice_url);
      }
      return NextResponse.json(
        { error: 'Le PDF de la facture n\'est pas encore disponible.' },
        { status: 404 }
      );
    }

    // If it's a payment_intent (pi_ prefix) → find receipt via charge
    if (stripeId.startsWith('pi_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripeId);
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge as any)?.id;

      if (chargeId) {
        const charge = await stripe.charges.retrieve(chargeId);
        if (charge.receipt_url) {
          return NextResponse.redirect(charge.receipt_url);
        }
      }

      return NextResponse.json(
        { error: 'Aucun reçu disponible — le paiement n\'a pas encore été traité.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Type de paiement Stripe non reconnu.' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('Receipt error:', err);
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la récupération du document' },
      { status: 500 }
    );
  }
}
