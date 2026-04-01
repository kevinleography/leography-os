import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { Payment, Subscription } from '@/types/database';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [paymentsRes, quotesRes, subscriptionsRes] = await Promise.all([
      supabaseAdmin
        .from('payments')
        .select('*, contacts(first_name, last_name, company)')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('quotes')
        .select('*, contacts(first_name, last_name, company)')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('subscriptions')
        .select('*, contacts(first_name, last_name, company)')
        .order('created_at', { ascending: false }),
    ]);

    const payments = (paymentsRes.data ?? []) as (Payment & { contacts: any })[];
    const subscriptions = (subscriptionsRes.data ?? []) as (Subscription & { contacts: any })[];

    const monthPayments = payments.filter(
      (p) => p.status === 'succeeded' && p.paid_at && new Date(p.paid_at) >= new Date(startOfMonth)
    );
    const ca_month = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const mrr = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.monthly_amount, 0);
    const oneshot = monthPayments
      .filter((p) => p.type === 'one_shot' || p.type === 'acompte' || p.type === 'solde')
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      quotes: quotesRes.data ?? [],
      subscriptions,
      stats: { ca_month, mrr, oneshot },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
