'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Bot, Zap, Bell, CreditCard, Calendar, LineChart, Kanban, Briefcase,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  Area, AreaChart, ResponsiveContainer,
} from 'recharts';

const APPS = {
  dashboard: { gradient: 'from-slate-200 to-slate-300' },
  finances: { gradient: 'from-amber-400 to-amber-600', color: 'bg-amber-500', bgLight: 'bg-amber-500/10', text: 'text-amber-500' },
  agenda: { gradient: 'from-red-400 to-red-600', color: 'bg-red-500', text: 'text-red-500' },
  performances: { gradient: 'from-emerald-400 to-emerald-600', text: 'text-emerald-500', bgLight: 'bg-emerald-500/10' },
  lab: { gradient: 'from-purple-400 to-purple-600', color: 'bg-purple-500' },
  pipeline: { gradient: 'from-orange-400 to-orange-600', color: 'bg-orange-500', text: 'text-orange-500' },
  projects: { gradient: 'from-indigo-400 to-indigo-600', color: 'bg-indigo-500', text: 'text-indigo-500' },
};

const Widget = ({ size = 'small', app, children, className = '', solid = false, onClick }: {
  size?: 'small' | 'medium' | 'large';
  app: { gradient: string };
  children: React.ReactNode;
  className?: string;
  solid?: boolean;
  onClick?: () => void;
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`${sizeClasses[size]} ${solid ? `bg-gradient-to-br ${app.gradient} text-white border-white/20` : 'bg-white/60 backdrop-blur-2xl text-slate-800 border-white/60'} rounded-3xl border shadow-lg overflow-hidden p-5 flex flex-col relative ${className}`}
    >
      {!solid && <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${app.gradient} -z-10`} />}
      {children}
    </motion.div>
  );
};

interface Meeting {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface Project {
  id: string;
  name: string;
  client_name: string;
  progress: number;
  status: string;
}

interface FinanceStats {
  mrr: number;
  ca_month: number;
}

interface AdSnapshot {
  date: string;
  roas: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [notifications] = useState<{ id: string; appId: keyof typeof APPS; title: string; message: string; time: string }[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dealsCount, setDealsCount] = useState<number | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [performanceData, setPerformanceData] = useState<AdSnapshot[]>([]);

  useEffect(() => {
    // Fetch upcoming meetings (interactions type=meeting, future dates)
    fetch('/api/contacts?limit=1')
      .catch(() => {});

    // Meetings from interactions
    fetch('/api/messages?type=meeting&limit=5')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    // Fetch real upcoming meetings from Supabase interactions
    const today = new Date().toISOString();
    fetch(`/api/search?q=&type=interactions&filters=${encodeURIComponent(JSON.stringify({ type: 'meeting', date_gte: today }))}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.results) {
          setMeetings(data.results.slice(0, 3).map((m: any) => ({
            id: m.id,
            title: m.title || m.notes || 'Rendez-vous',
            date: m.date,
            type: m.channel || 'Visio',
          })));
        }
      })
      .catch(() => {});

    // Fetch deals count
    fetch('/api/deals')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          const active = data.filter((d: any) => {
            const stage = d.stage?.name?.toLowerCase() || '';
            return stage !== 'gagné' && stage !== 'perdu';
          });
          setDealsCount(active.length);
        }
      })
      .catch(() => {});

    // Fetch finance stats (MRR)
    fetch('/api/finance')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.stats) {
          setFinanceStats({ mrr: data.stats.mrr, ca_month: data.stats.ca_month });
        }
      })
      .catch(() => {});

    // Fetch recent projects
    fetch('/api/projects')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data && Array.isArray(data.data)) {
          setProjects(data.data.slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.name,
            client_name: p.client_name || '',
            progress: p.progress || 0,
            status: p.status,
          })));
        } else if (Array.isArray(data)) {
          setProjects(data.slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.name,
            client_name: p.client_name || '',
            progress: p.progress || 0,
            status: p.status,
          })));
        }
      })
      .catch(() => {});

    // Fetch ad performance data
    fetch('/api/ads')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.snapshots && Array.isArray(data.snapshots)) {
          setPerformanceData(data.snapshots.slice(-7).map((s: any) => ({
            date: new Date(s.date || s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            roas: s.roas || (s.revenue && s.spend ? s.revenue / s.spend : 0),
          })));
        } else if (Array.isArray(data)) {
          setPerformanceData(data.slice(-7).map((s: any) => ({
            date: new Date(s.date || s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            roas: s.roas || (s.revenue && s.spend ? s.revenue / s.spend : 0),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const avgRoas = performanceData.length > 0
    ? (performanceData.reduce((s, d) => s + d.roas, 0) / performanceData.length).toFixed(1)
    : '—';

  const formatCurrency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div className="absolute inset-0 pt-12 pb-28 px-4 sm:px-12 overflow-y-auto hide-scrollbar">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Bonjour, Kevin</h1>
          <p className="text-slate-600 mt-1 font-medium">Voici ce qui se passe aujourd&apos;hui.</p>
        </div>

        {/* Intelligent Dispatching Input */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm rounded-2xl p-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <input
              type="text"
              placeholder="Demande à l'IA de créer un projet, une facture, un audit..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 placeholder-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.toLowerCase();
                  if (val.includes('projet')) router.push('/projects');
                  else if (val.includes('facture') || val.includes('devis')) router.push('/finance');
                  else if (val.includes('audit')) router.push('/audit');
                  else if (val.includes('contact') || val.includes('client')) router.push('/crm');
                  else if (val.includes('rdv') || val.includes('rendez')) router.push('/agenda');
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                const val = input.value.toLowerCase();
                if (val.includes('projet')) router.push('/projects');
                else if (val.includes('facture') || val.includes('devis')) router.push('/finance');
                else if (val.includes('audit')) router.push('/audit');
                else if (val.includes('contact') || val.includes('client')) router.push('/crm');
                else if (val.includes('rdv') || val.includes('rendez')) router.push('/agenda');
                input.value = '';
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Zap size={16} className="text-amber-400 fill-amber-400" />
              Générer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 auto-rows-[160px]">

          {/* Notification Center Widget */}
          <Widget size="large" app={{ ...APPS.dashboard, gradient: 'from-slate-200 to-slate-300' }} className="hidden lg:flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Bell size={20} className="text-slate-800" />
              <h3 className="font-semibold">Centre de Notifications</h3>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 hide-scrollbar pr-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center mt-10">Aucune notification récente</p>
              ) : (
                notifications.map(notif => {
                  const app = APPS[notif.appId];
                  return (
                    <div key={notif.id} className="flex gap-3 p-3 rounded-2xl bg-white/50 border border-white/60 shadow-sm cursor-pointer hover:bg-white/70 transition-colors" onClick={() => router.push(`/${notif.appId}`)}>
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white shrink-0`} />
                      <div>
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-semibold text-slate-800 text-xs">{notif.title}</span>
                          <span className="text-[10px] text-slate-500">{notif.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-tight">{notif.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Widget>

          {/* Finances Widget (Solid) */}
          <Widget size="medium" app={APPS.finances} solid className="cursor-pointer" onClick={() => router.push('/finance')}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <CreditCard size={24} className="text-white" />
              </div>
              {financeStats && financeStats.ca_month > 0 && (
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-md">Ce mois</span>
              )}
            </div>
            <div className="mt-auto">
              <p className="text-white/80 text-sm font-medium">Revenu Récurrent (MRR)</p>
              <h3 className="text-3xl font-bold tracking-tight">
                {financeStats ? formatCurrency(financeStats.mrr) : '—'}
              </h3>
            </div>
          </Widget>

          {/* Agenda Widget (Translucent) */}
          <Widget size="medium" app={APPS.agenda} className="cursor-pointer" onClick={() => router.push('/agenda')}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className={APPS.agenda.text} />
              <h3 className="font-semibold">Prochains RDV</h3>
            </div>
            <div className="space-y-3 flex-1 overflow-hidden">
              {meetings.length === 0 ? (
                <p className="text-sm text-slate-500 text-center mt-4">Aucun rendez-vous à venir</p>
              ) : (
                meetings.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-full py-2 rounded-full ${APPS.agenda.color}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {m.type}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Widget>

          {/* Performances Widget (Translucent) */}
          <Widget size="large" app={APPS.performances} className="cursor-pointer" onClick={() => router.push('/ads')}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <LineChart size={20} className={APPS.performances.text} />
                <h3 className="font-semibold">ROAS Global</h3>
              </div>
              <span className={`text-xs font-medium ${APPS.performances.bgLight} ${APPS.performances.text} px-2 py-1 rounded-full`}>30 derniers jours</span>
            </div>
            <div className="flex-1 w-full -ml-4">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorRoas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="roas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRoas)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">Aucune donnée publicitaire</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-sm text-slate-500 font-medium">Moyenne</p>
                <p className="text-2xl font-bold text-slate-800">{avgRoas !== '—' ? `${avgRoas}x` : '—'}</p>
              </div>
              {performanceData.length >= 2 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  performanceData[performanceData.length - 1].roas >= performanceData[performanceData.length - 2].roas
                    ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {performanceData[performanceData.length - 1].roas >= performanceData[performanceData.length - 2].roas
                    ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  <span>{(performanceData[performanceData.length - 1].roas - performanceData[performanceData.length - 2].roas).toFixed(1)}</span>
                </div>
              )}
            </div>
          </Widget>

          {/* Lab IA Widget (Solid) */}
          <Widget size="small" app={APPS.lab} solid className="cursor-pointer justify-between" onClick={() => router.push('/audit')}>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md w-fit">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight mb-1">Générer un Audit IA</h3>
              <p className="text-white/80 text-xs">Analyse instantanée</p>
            </div>
          </Widget>

          {/* Pipeline Widget (Translucent) */}
          <Widget size="small" app={APPS.pipeline} className="cursor-pointer" onClick={() => router.push('/pipeline')}>
            <div className="flex items-center gap-2 mb-2">
              <Kanban size={20} className={APPS.pipeline.text} />
              <h3 className="font-semibold">Deals Actifs</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <span className={`text-4xl font-bold ${APPS.pipeline.text}`}>{dealsCount !== null ? dealsCount : '—'}</span>
              <span className="text-sm text-slate-500 font-medium mt-1">En cours</span>
            </div>
          </Widget>

          {/* Projects Widget (Translucent) */}
          <Widget size="medium" app={APPS.projects} className="cursor-pointer" onClick={() => router.push('/projects')}>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={20} className={APPS.projects.text} />
              <h3 className="font-semibold">Projets Récents</h3>
            </div>
            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center mt-4">Aucun projet en cours</p>
              ) : (
                projects.map(p => (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-slate-500">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className={`${APPS.projects.color} h-2 rounded-full`} style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Widget>

        </div>
      </div>
    </div>
  );
}
