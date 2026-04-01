import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/client';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any;
      const contactId = session.metadata?.contact_id;
      const quoteId = session.metadata?.quote_id;
      if (contactId) {
        await supabaseAdmin.from('payments').insert({
          contact_id: contactId,
          stripe_payment_id: session.payment_intent,
          amount: (session.amount_total || 0) / 100,
          type: 'one_shot',
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        });
      }
      // If tied to a quote, update the quote and create a receipt document
      if (quoteId) {
        const { data: quote } = await supabaseAdmin
          .from('quotes')
          .select('reference, contact_id')
          .eq('id', quoteId)
          .single();
        if (quote) {
          await supabaseAdmin
            .from('quotes')
            .update({ stripe_payment_id: session.payment_intent as string })
            .eq('id', quoteId);
          // Store payment receipt as a document
          await supabaseAdmin.from('documents').insert({
            contact_id: quote.contact_id,
            type: 'report',
            name: `Reçu paiement - Devis ${quote.reference}`,
            storage_path: `receipts/${quoteId}-${session.payment_intent}.json`,
            file_size: 0,
          });
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as any;
      const subId = invoice.subscription;
      if (subId) {
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('stripe_sub_id', subId)
          .single();

        if (sub) {
          await supabaseAdmin.from('payments').insert({
            contact_id: sub.contact_id,
            subscription_id: sub.id,
            stripe_payment_id: invoice.payment_intent,
            amount: invoice.amount_paid / 100,
            type: 'abonnement',
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          });

          await supabaseAdmin
            .from('subscriptions')
            .update({ stripe_status: 'active', status: 'active' })
            .eq('id', sub.id);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      const subId = invoice.subscription;
      if (subId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ stripe_status: 'past_due', status: 'past_due' })
          .eq('stripe_sub_id', subId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled', stripe_status: 'canceled' })
        .eq('stripe_sub_id', subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
