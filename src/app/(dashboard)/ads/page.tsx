import { supabaseAdmin } from '@/lib/supabase/admin';
import { AdsPage } from '@/components/ads/ads-page';

async function getAdsData() {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: accounts } = await supabaseAdmin
    .from('ad_accounts')
    .select('*, contacts(first_name, last_name, company)');

  const enriched = await Promise.all(
    (accounts ?? []).map(async (account: any) => {
      const { data: budgets } = await supabaseAdmin
        .from('ad_budgets')
        .select('*')
        .eq('ad_account_id', account.id);

      const budgetIds = (budgets ?? []).map((b: any) => b.id);

      let snapshots: any[] = [];
      if (budgetIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('ad_spend_snapshots')
          .select('*')
          .in('ad_budget_id', budgetIds)
          .gte('date', thirtyDaysAgo)
          .order('date', { ascending: true });
        snapshots = data ?? [];
      }

      return {
        ...account,
        budgets: budgets ?? [],
        snapshots,
      };
    })
  );

  return enriched;
}

export default async function Ads() {
  const accounts = await getAdsData();

  return (
    <div className="page-wrapper space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Publicite</h1>
      </div>
      <AdsPage accounts={accounts} />
    </div>
  );
}
