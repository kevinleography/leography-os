import { NextRequest, NextResponse } from 'next/server';
import { createSubmission } from '@/lib/docuseal/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { signatureRequestEmail } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, contact_id, document_name } = body;

    // Fetch contact
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('first_name, last_name, email')
      .eq('id', contact_id)
      .single();

    if (!contact?.email) {
      return NextResponse.json({ error: 'Contact sans email' }, { status: 400 });
    }

    // Create DocuSeal submission (no auto email — we send our branded one)
    const submission = await createSubmission({
      template_id,
      send_email: false,
      submitters: [
        {
          email: contact.email,
          name: `${contact.first_name} ${contact.last_name}`,
          role: 'Client',
        },
      ],
    });

    const signUrl = `https://docuseal.com/s/${submission[0]?.slug || submission.slug}`;

    // Send branded email
    const emailContent = signatureRequestEmail({
      clientName: `${contact.first_name} ${contact.last_name}`,
      documentName: document_name || 'Document',
      signUrl,
    });

    await sendEmail({
      to: contact.email,
      ...emailContent,
    });

    // Update document with DocuSeal ID if we have a document
    if (body.document_id) {
      await supabaseAdmin
        .from('documents')
        .update({
          docuseal_id: String(submission[0]?.id || submission.id),
          signature_status: 'pending',
        })
        .eq('id', body.document_id);
    }

    return NextResponse.json({
      submission,
      sign_url: signUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
