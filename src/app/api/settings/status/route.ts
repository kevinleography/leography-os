import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const statuses: Record<string, boolean> = {};

  // Supabase: try a simple query
  try {
    const { error } = await supabaseAdmin.from('contacts').select('id').limit(1);
    statuses.supabase = !error;
  } catch {
    statuses.supabase = false;
  }

  // Stripe
  statuses.stripe = !!process.env.STRIPE_SECRET_KEY;

  // Resend
  statuses.resend = !!process.env.RESEND_API_KEY;

  // n8n
  statuses.n8n = !!process.env.N8N_BASE_URL;

  // Cal.com
  statuses.calcom = !!process.env.NEXT_PUBLIC_CALCOM_URL;

  // DocuSeal
  statuses.docuseal = !!process.env.DOCUSEAL_API_KEY;

  return NextResponse.json(statuses);
}
