import { supabaseAdmin } from '@/lib/supabase/admin';
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

    // Also store as document
    await supabaseAdmin.from('documents').insert({
      contact_id: body.contact_id,
      type: 'contract',
      name: `Devis ${ref}`,
      storage_path: `quotes/${data.id}.json`,
      file_size: 0,
    });

    // Send DocuSeal signature request + branded email
    const contact = data.contacts as any;
    const { data: contactFull } = await supabaseAdmin
      .from('contacts')
      .select('email')
      .eq('id', body.contact_id)
      .single();

    const clientEmail = contactFull?.email;
    const clientName = contact
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      : 'Client';
    const validDate = body.valid_until
      ? new Date(body.valid_until).toLocaleDateString('fr-FR')
      : '';

    const templateId = process.env.DOCUSEAL_QUOTE_TEMPLATE_ID;
    let signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/validations`;

    // Create DocuSeal submission if template is configured
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

        // Save DocuSeal submission ID on the quote document
        await supabaseAdmin
          .from('documents')
          .update({
            docuseal_id: submissionId,
            signature_status: 'pending',
          })
          .eq('storage_path', `quotes/${data.id}.json`);

        // Also save on the quote itself
        await supabaseAdmin
          .from('quotes')
          .update({ docuseal_submission_id: submissionId })
          .eq('id', data.id);

        // Send signature request email
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
        // DocuSeal failed — fall back to regular quote email
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            ...quoteEmail({
              clientName,
              reference: ref,
              amount: formatCurrency(body.amount_ttc),
              validUntil: validDate,
              viewUrl: signUrl,
            }),
          }).catch(() => {});
        }
      }
    } else if (clientEmail) {
      // No DocuSeal template — send standard quote email
      await sendEmail({
        to: clientEmail,
        ...quoteEmail({
          clientName,
          reference: ref,
          amount: formatCurrency(body.amount_ttc),
          validUntil: validDate,
          viewUrl: signUrl,
        }),
      }).catch(() => {});
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
