import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, data } = body;

    switch (event_type) {
      case 'submission.completed': {
        // Find document by docuseal_id
        const submissionId = String(data.id);
        const { data: doc } = await supabaseAdmin
          .from('documents')
          .select('id, contact_id, name')
          .eq('docuseal_id', submissionId)
          .single();

        if (doc) {
          await supabaseAdmin
            .from('documents')
            .update({ signature_status: 'signed' })
            .eq('id', doc.id);
        }

        // Also update any quote with this docuseal_submission_id → mark accepted
        const { data: quote } = await supabaseAdmin
          .from('quotes')
          .select('id, reference, contact_id')
          .eq('docuseal_submission_id', submissionId)
          .single();

        if (quote) {
          await supabaseAdmin
            .from('quotes')
            .update({ status: 'accepted' })
            .eq('id', quote.id);
        }

        // Notify the first admin user
        const { data: admin } = await supabaseAdmin
          .from('users')
          .select('id')
          .limit(1)
          .single();
        if (admin) {
          await createNotification({
            userId: admin.id,
            type: 'success',
            title: quote ? 'Devis signé' : 'Document signé',
            message: quote
              ? `Le devis ${quote.reference} a été signé par le client`
              : `Le document "${doc?.name}" a été signé`,
            entityType: quote ? 'quote' : 'document',
            entityId: quote?.id || doc?.id,
          });
        }
        break;
      }

      case 'submission.expired': {
        const submissionId = String(data.id);
        await supabaseAdmin
          .from('documents')
          .update({ signature_status: 'expired' })
          .eq('docuseal_id', submissionId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
