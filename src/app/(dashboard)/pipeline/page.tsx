'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [stageObjects, setStageObjects] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStageId, setModalStageId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formContactId, setFormContactId] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/deals?limit=100')
      .then(res => res.json())
      .then((data: DealRaw[]) => {
        const list = Array.isArray(data) ? data : [];
        setDeals(list);

        if (list.length > 0) {
          const stageMap = new Map<string, Stage>();
          list.forEach(d => {
            if (d.stage?.name && !stageMap.has(d.stage.name)) {
              stageMap.set(d.stage.name, d.stage);
            }
          });
          const sorted = [...stageMap.entries()]
            .sort((a, b) => (a[1].position ?? 999) - (b[1].position ?? 999));
          if (sorted.length > 0) {
            setStages(sorted.map(([name]) => name));
            setStageObjects(sorted.map(([, stage]) => stage));
          }
        }
      })
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (preselectedStageName?: string) => {
    const matched = stageObjects.find(s => s.name === preselectedStageName);
    setModalStageId(matched?.id ?? stageObjects[0]?.id ?? '');
    setFormTitle('');
    setFormValue('');
    setFormContactId('');
    setShowModal(true);

    if (contacts.length === 0) {
      fetch('/api/contacts?limit=100')
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : data?.data ?? [];
          setContacts(list);
        })
        .catch(() => {});
    }
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !modalStageId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          value: formValue ? parseFloat(formValue) : null,
          contact_id: formContactId || null,
          stage_id: modalStageId,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const newDeal = await res.json();
      setDeals(prev => [...prev, newDeal]);
      setShowModal(false);
    } catch {
      // stay open on error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Opportunités</h2>
        <button
          onClick={() => openModal()}
          className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
        >
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
            <button
              onClick={() => openModal(stage)}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-medium hover:border-slate-400 hover:text-slate-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-6 w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Nouveau Deal</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Ex: Refonte site web"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{"Valeur (€)"}</label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    placeholder="5000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
                  <select
                    value={formContactId}
                    onChange={e => setFormContactId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-all text-slate-800"
                  >
                    <option value="">Aucun contact</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}{c.company ? ` — ${c.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{"Étape"}</label>
                  <select
                    value={modalStageId}
                    onChange={e => setModalStageId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 transition-all text-slate-800"
                  >
                    {stageObjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formTitle.trim() || !modalStageId || submitting}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium shadow-md transition-all ${app.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Envoi...' : 'Créer le deal'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
