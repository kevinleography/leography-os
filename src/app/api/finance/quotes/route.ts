import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { quoteEmail, signatureRequestEmail } from '@/lib/email/templates';
import { createSubmission } from '@/lib/docuseal/client';
import { formatCurrency } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('quotes')
      .select('*, contacts(first_name, last_name, company, email)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Auto-generate reference: DEV-YYYYMM-XXX
    const now = new Date();
    const prefix = `DEV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { count } = await supabaseAdmin
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .like('reference', `${prefix}%`);
    const ref = `${prefix}-${String((count ?? 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabaseAdmin
      .from('quotes')
      .insert({
        contact_id: body.contact_id,
        deal_id: body.deal_id || null,
        reference: body.reference || ref,
        amount_ht: body.amount_ht,
        amount_ttc: body.amount_ttc,
        status: body.status || 'draft',
        valid_until: body.valid_until || null,
      })
      .select('*, contacts(first_name, last_name, company)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch contact details for Stripe + email
    const contact = data.contacts as any;
    const { data: contactFull } = await supabaseAdmin
      .from('contacts')
      .select('email, stripe_customer_id')
      .eq('id', body.contact_id)
      .single();

    const clientEmail = contactFull?.email;
    const clientName = contact
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      : 'Client';
    const validDate = body.valid_until
      ? new Date(body.valid_until).toLocaleDateString('fr-FR')
      : '';

    // --- Create Stripe Quote for PDF generation ---
    let stripeQuoteId: string | null = null;
    let hostedQuoteUrl: string | null = null;
    let stripePdfUrl: string | null = null;

    try {
      // Get or create Stripe customer
      let customerId = contactFull?.stripe_customer_id;
      if (!customerId && clientEmail) {
        const customer = await stripe.customers.create({
          email: clientEmail,
          name: clientName,
          metadata: { contact_id: body.contact_id },
        });
        customerId = customer.id;
        await supabaseAdmin
          .from('contacts')
          .update({ stripe_customer_id: customerId })
          .eq('id', body.contact_id);
      }

      if (customerId) {
        // Create a Stripe Product for this quote
        const product = await stripe.products.create({
          name: `Devis ${ref}`,
          description: body.description || `Prestation LEOGRAPHY — ${ref}`,
          metadata: { leography_quote_id: data.id },
        });

        // Create Stripe Quote
        const stripeQuote = await stripe.quotes.create({
          customer: customerId,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product: product.id,
                unit_amount: Math.round(body.amount_ttc || body.amount_ht),
              },
              quantity: 1,
            },
          ],
          expires_at: body.valid_until
            ? Math.floor(new Date(body.valid_until).getTime() / 1000)
            : Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days default
          metadata: {
            leography_quote_id: data.id,
            reference: ref,
          },
        });

        // Finalize the quote to make PDF available
        const finalizedQuote = await stripe.quotes.finalizeQuote(stripeQuote.id);

        stripeQuoteId = finalizedQuote.id;
        hostedQuoteUrl = (finalizedQuote as any).hosted_quote_url || null;
        stripePdfUrl = (finalizedQuote as any).pdf || null;

        // Save Stripe quote ID on our quote
        await supabaseAdmin
          .from('quotes')
          .update({ stripe_payment_id: stripeQuoteId })
          .eq('id', data.id);
      }
    } catch (stripeErr: any) {
      // Stripe quote creation failed — continue with jspdf fallback
      console.error('Stripe quote creation failed:', stripeErr?.message || stripeErr);
      // Store error for debugging (non-blocking)
      await supabaseAdmin
        .from('quotes')
        .update({ pdf_url: `stripe_error: ${stripeErr?.message || 'unknown'}` })
        .eq('id', data.id)
        .then(() => {}, () => {});
    }

    // Also store as document
    await supabaseAdmin.from('documents').insert({
      contact_id: body.contact_id,
      type: 'contract',
      name: `Devis ${ref}`,
      storage_path: `quotes/${data.id}.json`,
      file_size: 0,
    });

    // Determine the best URL for the client
    const viewUrl = hostedQuoteUrl
      || `${process.env.NEXT_PUBLIC_APP_URL}/api/finance/quotes/${data.id}/pdf`;

    // Send DocuSeal signature request + branded email
    const templateId = process.env.DOCUSEAL_QUOTE_TEMPLATE_ID;
    let signUrl = viewUrl;

    if (templateId && clientEmail) {
      try {
        const submission = await createSubmission({
          template_id: parseInt(templateId, 10),
          send_email: false,
          submitters: [
            { email: clientEmail, name: clientName, role: 'Client' },
          ],
        });

        const submissionId = String(
          Array.isArray(submission) ? submission[0]?.id : submission?.id
        );
        const slug = Array.isArray(submission)
          ? submission[0]?.slug
          : submission?.slug;

        if (slug) signUrl = `https://docuseal.com/s/${slug}`;

        await supabaseAdmin
          .from('documents')
          .update({
            docuseal_id: submissionId,
            signature_status: 'pending',
          })
          .eq('storage_path', `quotes/${data.id}.json`);

        await supabaseAdmin
          .from('quotes')
          .update({ docuseal_submission_id: submissionId })
          .eq('id', data.id);

        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            ...signatureRequestEmail({
              clientName,
              documentName: `Devis ${ref}`,
              signUrl,
            }),
          }).catch(() => {});
        }
      } catch {
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            ...quoteEmail({
              clientName,
              reference: ref,
              amount: formatCurrency(body.amount_ttc || body.amount_ht),
              validUntil: validDate,
              viewUrl,
            }),
          }).catch(() => {});
        }
      }
    } else if (clientEmail) {
      await sendEmail({
        to: clientEmail,
        ...quoteEmail({
          clientName,
          reference: ref,
          amount: formatCurrency(body.amount_ttc || body.amount_ht),
          validUntil: validDate,
          viewUrl,
        }),
      }).catch(() => {});
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
