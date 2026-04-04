import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { invoiceEmail } from '@/lib/email/templates';
import { formatCurrency } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.contact_id || !body.amount) {
      return NextResponse.json({ error: 'contact_id et amount requis' }, { status: 400 });
    }

    // Amount comes in cents from frontend
    const amountCents = Math.round(body.amount);

    // Fetch contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, company, stripe_customer_id')
      .eq('id', body.contact_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
    }

    const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.company || 'Client';

    // Get or create Stripe customer
    let customerId = contact.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: contact.email || undefined,
        name: clientName,
        metadata: { contact_id: contact.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('contacts')
        .update({ stripe_customer_id: customerId })
        .eq('id', contact.id);
    }

    // Auto-generate reference: FAC-YYYYMM-XXX
    const now = new Date();
    const prefix = `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { count } = await supabaseAdmin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
    const ref = `${prefix}-${String((count ?? 0) + 1).padStart(3, '0')}`;

    // Create Stripe Invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: {
        contact_id: contact.id,
        reference: ref,
      },
    });

    // Add line item
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: stripeInvoice.id,
      amount: amountCents,
      currency: 'eur',
      description: body.description || `Prestation LEOGRAPHY — ${ref}`,
    });

    // Finalize the invoice (generates PDF)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

    // Send the invoice via Stripe (sends email with payment link)
    const sentInvoice = await stripe.invoices.sendInvoice(stripeInvoice.id);

    const invoicePdfUrl = sentInvoice.invoice_pdf || finalizedInvoice.invoice_pdf;
    const hostedUrl = sentInvoice.hosted_invoice_url || finalizedInvoice.hosted_invoice_url;

    // Store in payments table
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        contact_id: contact.id,
        stripe_payment_id: stripeInvoice.id,
        amount: amountCents / 100,
        type: 'one_shot',
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 400 });
    }

    // Also send branded email with payment link
    if (contact.email && hostedUrl) {
      await sendEmail({
        to: contact.email,
        ...invoiceEmail({
          clientName,
          reference: ref,
          amount: formatCurrency(amountCents / 100),
          dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('fr-FR'),
          payUrl: hostedUrl,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      ...payment,
      stripe_invoice_id: stripeInvoice.id,
      invoice_pdf: invoicePdfUrl,
      hosted_url: hostedUrl,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Invoice creation error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}
