import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch quote with contact
    const { data: quote, error } = await supabaseAdmin
      .from('quotes')
      .select('*, contacts(first_name, last_name, email, stripe_customer_id)')
      .eq('id', id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    if (quote.status !== 'accepted') {
      return NextResponse.json({ error: 'Le devis doit être accepté' }, { status: 400 });
    }

    const contact = quote.contacts as any;

    // Get or create Stripe customer
    let customerId = contact?.stripe_customer_id;
    if (!customerId && contact?.email) {
      const customer = await stripe.customers.create({
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`,
        metadata: { contact_id: quote.contact_id },
      });
      customerId = customer.id;

      // Save Stripe customer ID on contact
      await supabaseAdmin
        .from('contacts')
        .update({ stripe_customer_id: customerId })
        .eq('id', quote.contact_id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: !customerId ? contact?.email : undefined,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Devis ${quote.reference}`,
              description: `Paiement du devis ${quote.reference}`,
            },
            unit_amount: Math.round(quote.amount_ttc * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        quote_id: id,
        contact_id: quote.contact_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/finance?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/finance?payment=cancelled`,
    });

    // Save Stripe payment link on quote
    await supabaseAdmin
      .from('quotes')
      .update({ stripe_payment_id: session.id })
      .eq('id', id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
