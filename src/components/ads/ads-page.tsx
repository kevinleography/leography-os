'use client';

import {
  TrendingUp,
  Target,
  MousePointerClick,
  Eye,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import type { AdPlatform, AdSpendSnapshot, AdBudget } from '@/types/database';

interface AdAccountWithData {
  id: string;
  platform: AdPlatform;
  account_id: string;
  name: string;
  contact_id: string;
  contacts: { first_name: string; last_name: string; company: string | null } | null;
  budgets: AdBudget[];
  snapshots: AdSpendSnapshot[];
}

interface AdsPageProps {
  accounts: AdAccountWithData[];
}

const platformConfig: Record<AdPlatform, { label: string; variant: 'default' | 'warning' }> = {
  google_ads: { label: 'Google Ads', variant: 'default' },
  meta_ads: { label: 'Meta Ads', variant: 'warning' },
};

export function AdsPage({ accounts }: AdsPageProps) {
  // Global stats
  const totalBudget = accounts.reduce(
    (sum, a) => sum + a.budgets.reduce((bs, b) => bs + b.monthly_budget, 0),
    0
  );
  const totalSpend = accounts.reduce(
    (sum, a) => sum + a.snapshots.reduce((ss, s) => ss + s.amount_spent, 0),
    0
  );
  const totalImpressions = accounts.reduce(
    (sum, a) => sum + a.snapshots.reduce((ss, s) => ss + s.impressions, 0),
    0
  );
  const totalClicks = accounts.reduce(
    (sum, a) => sum + a.snapshots.reduce((ss, s) => ss + s.clicks, 0),
    0
  );
  const totalConversions = accounts.reduce(
    (sum, a) => sum + a.snapshots.reduce((ss, s) => ss + s.conversions, 0),
    0
  );
  const totalRevenue = accounts.reduce(
    (sum, a) => sum + a.snapshots.reduce((ss, s) => ss + s.roas * s.amount_spent, 0),
    0
  );
  const globalRoas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;
  const globalCpc = totalClicks > 0 ? Math.round((totalSpend / totalClicks) * 100) / 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Depenses totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(totalSpend)}
            </div>
            <p className="text-xs text-text-muted mt-1">
              sur {formatCurrency(totalBudget)} de budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              ROAS global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{globalRoas}x</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary font-medium flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              CPC moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(globalCpc)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-secondary font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalConversions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-account cards */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-text-muted">Aucun compte publicitaire configure</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {accounts.map((account) => {
            const platCfg = platformConfig[account.platform];
            const accountBudget = account.budgets.reduce((s, b) => s + b.monthly_budget, 0);
            const accountSpend = account.snapshots.reduce((s, snap) => s + snap.amount_spent, 0);
            const accountImpressions = account.snapshots.reduce((s, snap) => s + snap.impressions, 0);
            const accountClicks = account.snapshots.reduce((s, snap) => s + snap.clicks, 0);
            const accountConversions = account.snapshots.reduce((s, snap) => s + snap.conversions, 0);
            const accountRevenue = account.snapshots.reduce(
              (s, snap) => s + snap.roas * snap.amount_spent,
              0
            );
            const accountRoas =
              accountSpend > 0
                ? Math.round((accountRevenue / accountSpend) * 100) / 100
                : 0;
            const accountCpc =
              accountClicks > 0
                ? Math.round((accountSpend / accountClicks) * 100) / 100
                : 0;
            const budgetPercent =
              accountBudget > 0 ? Math.round((accountSpend / accountBudget) * 100) : 0;

            // Aggregate snapshots by date for chart
            const byDate: Record<string, number> = {};
            for (const snap of account.snapshots) {
              const d = snap.date.slice(0, 10);
              byDate[d] = (byDate[d] ?? 0) + snap.amount_spent;
            }
            const chartData = Object.entries(byDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, amount]) => ({
                date: new Date(date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                }),
                amount,
              }));

            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <Badge variant={platCfg.variant}>{platCfg.label}</Badge>
                  </div>
                  {account.contacts && (
                    <p className="text-sm text-text-muted">
                      {account.contacts.company ||
                        `${account.contacts.first_name} ${account.contacts.last_name}`}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary">Budget utilise</span>
                      <span className="text-text-primary font-medium">
                        {formatCurrency(accountSpend)} / {formatCurrency(accountBudget)} ({budgetPercent}%)
                      </span>
                    </div>
                    <Progress
                      value={budgetPercent}
                      className={budgetPercent >= 90 ? '[&>div]:bg-destructive' : budgetPercent >= 70 ? '[&>div]:bg-warning' : ''}
                    />
                  </div>

                  {/* Spend chart */}
                  {chartData.length > 0 && (
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v}€`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px',
                              color: '#f8fafc',
                            }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Bar
                            dataKey="amount"
                            name="Depenses"
                            fill={account.platform === 'google_ads' ? '#8b5cf6' : '#3b82f6'}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary">Impressions:</span>
                      <span className="font-medium text-text-primary">
                        {accountImpressions.toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MousePointerClick className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary">Clics:</span>
                      <span className="font-medium text-text-primary">
                        {accountClicks.toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary">Conversions:</span>
                      <span className="font-medium text-text-primary">{accountConversions}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary">CPC:</span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(accountCpc)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary">ROAS:</span>
                      <span className="font-medium text-primary">{accountRoas}x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
