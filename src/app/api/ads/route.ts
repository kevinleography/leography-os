import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('ad_accounts')
      .select('*, contacts(first_name, last_name, company)');

    if (accountsError) {
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }

    const enriched = await Promise.all(
      (accounts ?? []).map(async (account: any) => {
        const [budgetsRes, snapshotsRes] = await Promise.all([
          supabaseAdmin
            .from('ad_budgets')
            .select('*')
            .eq('ad_account_id', account.id),
          supabaseAdmin
            .from('ad_spend_snapshots')
            .select('*')
            .in(
              'ad_budget_id',
              (
                await supabaseAdmin
                  .from('ad_budgets')
                  .select('id')
                  .eq('ad_account_id', account.id)
              ).data?.map((b: any) => b.id) ?? []
            )
            .gte('date', thirtyDaysAgo)
            .order('date', { ascending: true }),
        ]);

        return {
          ...account,
          budgets: budgetsRes.data ?? [],
          snapshots: snapshotsRes.data ?? [],
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
