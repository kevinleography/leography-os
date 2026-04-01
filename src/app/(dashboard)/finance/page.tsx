import { supabaseAdmin } from '@/lib/supabase/admin';
import { FinancePage } from '@/components/finance/finance-page';
import type { Payment, Quote, Subscription } from '@/types/database';

async function getFinanceData() {
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
  const quotes = (quotesRes.data ?? []) as (Quote & { contacts: any })[];
  const subscriptions = (subscriptionsRes.data ?? []) as (Subscription & { contacts: any })[];

  // Stats
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

  // Revenue history (6 months)
  const revenueHistory: { month: string; mrr: number; oneshot: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' });

    const { data } = await supabaseAdmin
      .from('payments')
      .select('amount, type')
      .eq('status', 'succeeded')
      .gte('paid_at', start)
      .lte('paid_at', end);

    const mp = (data ?? []) as { amount: number; type: string }[];
    revenueHistory.push({
      month: monthLabel,
      mrr: mp.filter((p) => p.type === 'abonnement').reduce((s, p) => s + p.amount, 0),
      oneshot: mp.filter((p) => p.type !== 'abonnement').reduce((s, p) => s + p.amount, 0),
    });
  }

  return {
    payments,
    quotes,
    subscriptions,
    stats: { ca_month, mrr, oneshot },
    revenueHistory,
  };
}

export default async function Finance() {
  const data = await getFinanceData();

  return (
    <div className="page-wrapper space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Finance</h1>
      </div>
      <FinancePage
        payments={data.payments}
        quotes={data.quotes}
        subscriptions={data.subscriptions}
        stats={data.stats}
        revenueHistory={data.revenueHistory}
      />
    </div>
  );
}
