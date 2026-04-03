'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const app = {
  color: 'bg-emerald-500',
  text: 'text-emerald-500',
  bgLight: 'bg-emerald-500/10',
  gradient: 'from-emerald-400 to-emerald-600',
};

interface Snapshot {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpa: number;
}

interface AdAccount {
  id: string;
  platform: string;
  account_name: string;
  currency: string;
  status: string;
  ad_budgets?: { daily_budget: number; monthly_budget: number }[];
  ad_spend_snapshots?: Snapshot[];
}

interface ChartPoint {
  date: string;
  google: number;
  meta: number;
}

interface KpiData {
  roas: number;
  cpa: number;
  totalSpend: number;
}

export default function AdsPage() {
  const [performanceData, setPerformanceData] = useState<ChartPoint[]>([]);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/ads')
      .then(res => res.json())
      .then(json => {
        const data: AdAccount[] = json?.data;
        if (!data || data.length === 0) return;

        const googleAccounts = data.filter(a => a.platform?.toLowerCase().includes('google'));
        const metaAccounts = data.filter(a => a.platform?.toLowerCase().includes('meta') || a.platform?.toLowerCase().includes('facebook'));

        const byDate: Record<string, { google: number; meta: number }> = {};

        for (const account of googleAccounts) {
          for (const snap of account.ad_spend_snapshots ?? []) {
            const d = snap.date?.slice(0, 10) ?? '';
            if (!byDate[d]) byDate[d] = { google: 0, meta: 0 };
            byDate[d].google += snap.roas ?? 0;
          }
        }
        for (const account of metaAccounts) {
          for (const snap of account.ad_spend_snapshots ?? []) {
            const d = snap.date?.slice(0, 10) ?? '';
            if (!byDate[d]) byDate[d] = { google: 0, meta: 0 };
            byDate[d].meta += snap.roas ?? 0;
          }
        }

        const chartPoints: ChartPoint[] = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, vals]) => ({
            date: date.slice(5).replace('-', '/'),
            google: parseFloat(vals.google.toFixed(2)),
            meta: parseFloat(vals.meta.toFixed(2)),
          }));

        if (chartPoints.length > 0) setPerformanceData(chartPoints);

        const allSnapshots: Snapshot[] = data.flatMap(a => a.ad_spend_snapshots ?? []);
        if (allSnapshots.length > 0) {
          const totalSpend = allSnapshots.reduce((s, snap) => s + (snap.spend ?? 0), 0);
          const avgRoas = allSnapshots.reduce((s, snap) => s + (snap.roas ?? 0), 0) / allSnapshots.length;
          const avgCpa = allSnapshots.reduce((s, snap) => s + (snap.cpa ?? 0), 0) / allSnapshots.length;
          setKpi({ roas: avgRoas, cpa: avgCpa, totalSpend });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const roasDisplay = kpi ? `${kpi.roas.toFixed(1)}x` : '\u2014';
  const cpaDisplay = kpi ? `${kpi.cpa.toFixed(1)} \u20ac` : '\u2014';
  const spendDisplay = kpi
    ? `${Math.round(kpi.totalSpend).toLocaleString('fr-FR')} \u20ac`
    : '\u2014';

  const hasData = performanceData.length > 0 || kpi !== null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Performances Publicitaires</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <select className="w-full sm:w-auto bg-white/50 border border-slate-200/50 rounded-xl px-4 py-2 outline-none font-medium text-slate-700">
            <option>30 derniers jours</option>
            <option>Ce mois-ci</option>
            <option>Mois dernier</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-center">Aucune donn&eacute;e publicitaire. Configurez vos comptes Google/Meta Ads dans n8n.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <p className="text-slate-500 font-medium mb-1">ROAS Global</p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-bold text-slate-800">{roasDisplay}</h3>
                {kpi && <span className="text-emerald-500 font-medium flex items-center mb-1"><ArrowUpRight size={18} /></span>}
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <p className="text-slate-500 font-medium mb-1">CPA Moyen</p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-bold text-slate-800">{cpaDisplay}</h3>
                {kpi && <span className="text-emerald-500 font-medium flex items-center mb-1"><ArrowDownRight size={18} /></span>}
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <p className="text-slate-500 font-medium mb-1">D&eacute;penses Totales</p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl font-bold text-slate-800">{spendDisplay}</h3>
                {kpi && <span className="text-red-500 font-medium flex items-center mb-1"><ArrowUpRight size={18} /></span>}
              </div>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm flex-1 min-h-[400px]">
            <h3 className="font-bold text-slate-800 mb-6">&Eacute;volution ROAS (Google vs Meta)</h3>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                  />
                  <Line type="monotone" dataKey="google" name="Google Ads" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="meta" name="Meta Ads" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Aucune donn&eacute;e de performance disponible</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
