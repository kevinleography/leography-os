import { supabaseAdmin } from '@/lib/supabase/admin';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import type {
  Task,
  ActivityLog,
  Deal,
  PipelineStage,
  SiteMonitor,
  AdBudgetAlert,
  DashboardStats,
} from '@/types/database';

async function getDashboardData(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const [
    paymentsMonth,
    paymentsPreviousMonth,
    activeSubscriptions,
    contactsActive,
    contactsNewWeek,
    projectsActive,
    projectsUrgent,
    deals,
    stages,
    tasksDueToday,
    recentActivity,
    sitesDown,
    adSnapshots,
    adBudgets,
  ] = await Promise.all([
    supabaseAdmin
      .from('payments')
      .select('amount, type')
      .eq('status', 'succeeded')
      .gte('paid_at', startOfMonth),
    supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('paid_at', startOfPreviousMonth)
      .lte('paid_at', endOfPreviousMonth),
    supabaseAdmin
      .from('subscriptions')
      .select('monthly_amount')
      .eq('status', 'active'),
    supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'lead'),
    supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'lead')
      .gte('created_at', startOfWeek.toISOString()),
    supabaseAdmin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('deadline', new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()),
    supabaseAdmin
      .from('deals')
      .select('id, value, stage_id'),
    supabaseAdmin
      .from('pipeline_stages')
      .select('id, name, position, color')
      .order('position'),
    supabaseAdmin
      .from('tasks')
      .select('*')
      .gte('due_date', todayStart)
      .lte('due_date', todayEnd)
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('site_monitors')
      .select('*')
      .eq('is_active', true)
      .not('last_status', 'is', null)
      .or('last_status.lt.200,last_status.gte.400'),
    supabaseAdmin
      .from('ad_spend_snapshots')
      .select('roas, amount_spent')
      .gte('date', startOfMonth),
    supabaseAdmin
      .from('ad_budgets')
      .select('id, monthly_budget, ad_account_id, ad_accounts(name, platform, contact_id, contacts(company, first_name, last_name))')
  ]);

  const paymentsData = (paymentsMonth.data ?? []) as { amount: number; type: string }[];
  const ca_month = paymentsData.reduce((sum, p) => sum + p.amount, 0);
  const ca_oneshot = paymentsData
    .filter((p) => p.type === 'one_shot' || p.type === 'acompte' || p.type === 'solde')
    .reduce((sum, p) => sum + p.amount, 0);
  const ca_previous_month = (paymentsPreviousMonth.data ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + p.amount,
    0
  );

  const subscriptionsData = (activeSubscriptions.data ?? []) as { monthly_amount: number }[];
  const ca_mrr = subscriptionsData.reduce((sum, s) => sum + s.monthly_amount, 0);

  const dealsData = (deals.data ?? []) as Deal[];
  const stagesData = (stages.data ?? []) as PipelineStage[];
  const deals_total_value = dealsData.reduce((sum, d) => sum + d.value, 0);
  const deals_count_by_stage: Record<string, number> = {};
  for (const stage of stagesData) {
    deals_count_by_stage[stage.name] = dealsData.filter((d) => d.stage_id === stage.id).length;
  }

  const snapshots = (adSnapshots.data ?? []) as { roas: number; amount_spent: number }[];
  const totalSpent = snapshots.reduce((sum, s) => sum + s.amount_spent, 0);
  const totalRevenue = snapshots.reduce((sum, s) => sum + s.roas * s.amount_spent, 0);
  const roas_global = totalSpent > 0 ? totalRevenue / totalSpent : 0;

  const budgetsData = (adBudgets.data ?? []) as any[];
  const ads_alerts: AdBudgetAlert[] = [];
  for (const b of budgetsData) {
    const budgetSnapshots = (
      await supabaseAdmin
        .from('ad_spend_snapshots')
        .select('amount_spent')
        .eq('ad_budget_id', b.id)
        .gte('date', startOfMonth)
    ).data ?? [];
    const spent = budgetSnapshots.reduce((sum: number, s: { amount_spent: number }) => sum + s.amount_spent, 0);
    const percent = b.monthly_budget > 0 ? (spent / b.monthly_budget) * 100 : 0;
    if (percent >= (b.alert_threshold ?? 80)) {
      const account = b.ad_accounts as any;
      const contact = account?.contacts as any;
      ads_alerts.push({
        client_name: contact?.company || `${contact?.first_name ?? ''} ${contact?.last_name ?? ''}`.trim() || 'Client',
        platform: account?.platform ?? 'google_ads',
        budget: b.monthly_budget,
        spent,
        percent: Math.round(percent),
      });
    }
  }

  const ads_budget_used_percent =
    budgetsData.length > 0
      ? Math.round(
          ads_alerts.reduce((sum, a) => sum + a.percent, 0) / budgetsData.length
        )
      : 0;

  return {
    ca_month,
    ca_mrr,
    ca_oneshot,
    ca_previous_month,
    prospects_active: contactsActive.count ?? 0,
    prospects_new_week: contactsNewWeek.count ?? 0,
    projects_active: projectsActive.count ?? 0,
    projects_urgent: projectsUrgent.count ?? 0,
    deals_total_value,
    deals_count_by_stage,
    ads_budget_used_percent,
    ads_alerts,
    tasks_today: (tasksDueToday.data ?? []) as Task[],
    reminders_today: [],
    next_rdv: [],
    recent_activity: (recentActivity.data ?? []) as ActivityLog[],
    roas_global: Math.round(roas_global * 100) / 100,
    sites_down: (sitesDown.data ?? []) as SiteMonitor[],
  };
}

async function getRevenueHistory() {
  const months: { month: string; mrr: number; oneshot: number }[] = [];
  const now = new Date();

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

    const payments = (data ?? []) as { amount: number; type: string }[];
    const mrr = payments
      .filter((p) => p.type === 'abonnement')
      .reduce((s, p) => s + p.amount, 0);
    const oneshot = payments
      .filter((p) => p.type !== 'abonnement')
      .reduce((s, p) => s + p.amount, 0);

    months.push({ month: monthLabel, mrr, oneshot });
  }

  return months;
}

async function getPipelineStages() {
  const { data: stages } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id, name, position, color')
    .order('position');

  const { data: deals } = await supabaseAdmin
    .from('deals')
    .select('id, value, stage_id');

  return (stages ?? []).map((stage: any) => {
    const stageDeals = (deals ?? []).filter((d: any) => d.stage_id === stage.id);
    return {
      id: stage.id,
      name: stage.name,
      color: stage.color,
      count: stageDeals.length,
      value: stageDeals.reduce((sum: number, d: any) => sum + d.value, 0),
    };
  });
}

async function getSiteAlerts() {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sslExpiring } = await supabaseAdmin
    .from('site_monitors')
    .select('url, ssl_valid_until')
    .eq('is_active', true)
    .not('ssl_valid_until', 'is', null)
    .lte('ssl_valid_until', thirtyDays);

  return (sslExpiring ?? []) as { url: string; ssl_valid_until: string }[];
}

export default async function DashboardPage() {
  const [stats, revenueHistory, pipelineStages, sslAlerts] = await Promise.all([
    getDashboardData(),
    getRevenueHistory(),
    getPipelineStages(),
    getSiteAlerts(),
  ]);

  return (
    <div className="page-wrapper space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Tableau de bord</h1>
      </div>
      <DashboardContent
        stats={stats}
        revenueHistory={revenueHistory}
        pipelineStages={pipelineStages}
        sslAlerts={sslAlerts}
      />
    </div>
  );
}
