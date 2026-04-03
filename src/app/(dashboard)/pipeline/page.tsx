'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

const app = {
  color: 'bg-orange-500',
  text: 'text-orange-500',
  bgLight: 'bg-orange-500/10',
  gradient: 'from-orange-400 to-orange-600',
};

const BLUEPRINT_STAGES = [
  'Nouveau',
  'Contacté',
  'Audit envoyé',
  'Appel',
  'Proposition',
  'Négociation',
  'Gagné',
  'Perdu',
];

interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
}

interface DealRaw {
  id: string;
  title: string;
  value: number | null;
  probability: number | null;
  expected_close: string | null;
  assigned_to: string | null;
  contact_id: string | null;
  stage_id: string | null;
  stage: Stage;
  contact: Contact;
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return '—';
  return `${amount.toLocaleString('fr-FR')} €`;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<DealRaw[]>([]);
  const [stages, setStages] = useState<string[]>(BLUEPRINT_STAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/deals?limit=100')
      .then(res => res.json())
      .then((data: DealRaw[]) => {
        const list = Array.isArray(data) ? data : [];
        setDeals(list);

        if (list.length > 0) {
          const stageMap = new Map<string, number>();
          list.forEach(d => {
            if (d.stage?.name && !stageMap.has(d.stage.name)) {
              stageMap.set(d.stage.name, d.stage.position ?? 999);
            }
          });
          const sorted = [...stageMap.entries()]
            .sort((a, b) => a[1] - b[1])
            .map(([name]) => name);
          if (sorted.length > 0) setStages(sorted);
        }
      })
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Opportunités</h2>
        <button className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}>
          <Plus size={18} /> Nouveau Deal
        </button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 flex-1 hide-scrollbar">
        {stages.map(stage => (
          <div key={stage} className="min-w-[280px] w-[280px] flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">{stage}</h3>
              <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded-full text-slate-500">{deals.filter(d => d.stage?.name === stage).length || 0}</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : deals.filter(d => d.stage?.name === stage).map(deal => (
              <div key={deal.id} className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                <h4 className="font-bold text-slate-800 mb-1">{deal.title || 'Sans titre'}</h4>
                <p className="text-sm text-slate-500 mb-3">{deal.contact?.company || deal.contact?.first_name || '—'}</p>
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${app.text}`}>{formatAmount(deal.value)}</span>
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                    {(deal.contact?.company || deal.contact?.first_name || '—').charAt(0)}
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-medium hover:border-slate-400 hover:text-slate-500 transition-colors flex items-center justify-center gap-2">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
