'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, ArrowLeft, ChevronRight, Mail, Video, FileText, Bot,
  History, Target, Phone, RefreshCw, X, Zap, AlertCircle, StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const app = {
  color: 'bg-blue-500',
  text: 'text-blue-500',
  bgLight: 'bg-blue-500/10',
  gradient: 'from-blue-400 to-blue-600',
};

// Blueprint V8 §4.2 — table contacts
interface Contact {
  id: string;
  type: 'lead' | 'client' | 'partenaire';
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profession: string;
  source: string;
  score: number;
  assigned_to: string | null;
  stripe_customer_id: string | null;
  portal_user_id: string | null;
  friction_points: any;
  notes: string;
  created_at: string;
  updated_at: string;
  // Enrichis par GET /api/contacts/[id]
  interactions?: Interaction[];
  deals?: Deal[];
  documents?: Doc[];
}

interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'audit' | 'webhook';
  subject: string;
  content: string;
  date: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage?: { name: string; color: string };
}

interface Doc {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

const INTERACTION_ICONS: Record<string, { icon: typeof Mail; bg: string; text: string }> = {
  email: { icon: Mail, bg: 'bg-slate-100', text: 'text-slate-500' },
  call: { icon: Phone, bg: 'bg-blue-100', text: 'text-blue-500' },
  meeting: { icon: Video, bg: 'bg-purple-100', text: 'text-purple-500' },
  note: { icon: StickyNote, bg: 'bg-amber-100', text: 'text-amber-500' },
  audit: { icon: Bot, bg: 'bg-purple-100', text: 'text-purple-500' },
  webhook: { icon: Zap, bg: 'bg-emerald-100', text: 'text-emerald-500' },
};

const TYPE_LABELS: Record<string, string> = {
  lead: 'Lead',
  client: 'Client',
  partenaire: 'Partenaire',
};

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeoutState] = useState<NodeJS.Timeout | null>(null);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scoring, setScoring] = useState(false);

  // New contact form state (Blueprint V8 fields)
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    profession: '',
    type: 'lead' as const,
    source: 'site_web',
    notes: '',
  });

  // Fetch contacts list
  const fetchContacts = useCallback(async (search?: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/contacts?${params}`);
      const { data } = await res.json();
      setContacts(data || []);
    } catch {
      console.error('[CRM] Erreur chargement contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchContacts(value);
    }, 400);
    setSearchTimeoutState(timeout);
  };

  // Fetch contact detail with interactions, deals, documents
  const selectContact = async (id: string) => {
    setSelectedContactId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error('Contact introuvable');
      const data: Contact = await res.json();
      setActiveContact(data);
    } catch {
      console.error('[CRM] Erreur chargement fiche contact');
      setActiveContact(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create contact
  const handleCreate = async () => {
    if (!newContact.first_name && !newContact.last_name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur création');
      }
      const created: Contact = await res.json();
      setContacts(prev => [created, ...prev]);
      setShowNewContactForm(false);
      setNewContact({ first_name: '', last_name: '', email: '', phone: '', company: '', profession: '', type: 'lead', source: 'site_web', notes: '' });
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Trigger IA scoring
  const handleScore = async () => {
    if (!activeContact) return;
    setScoring(true);
    try {
      const res = await fetch(`/api/contacts/${activeContact.id}/score`, { method: 'POST' });
      if (!res.ok) throw new Error('Échec scoring');
      const { score, reason } = await res.json();
      setActiveContact(prev => prev ? { ...prev, score } : prev);
      setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, score } : c));
    } catch {
      alert('Erreur lors du scoring IA. Vérifiez la configuration Anthropic.');
    } finally {
      setScoring(false);
    }
  };

  // Format date relative
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Forte probabilité de closing';
    if (score >= 50) return 'Potentiel modéré';
    if (score > 0) return 'À qualifier';
    return 'Non scoré';
  };

  if (loading && contacts.length === 0) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          {selectedContactId && (
            <button onClick={() => { setSelectedContactId(null); setActiveContact(null); }} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-800">
            {selectedContactId
              ? activeContact
                ? `${activeContact.first_name} ${activeContact.last_name}`
                : 'Chargement...'
              : 'Répertoire'}
          </h2>
        </div>
        {!selectedContactId && (
          <button
            onClick={() => setShowNewContactForm(true)}
            className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
          >
            <Plus size={18} /> Nouveau Contact
          </button>
        )}
      </div>

      {/* ========== LIST VIEW ========== */}
      {!selectedContactId ? (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex-1">
          <div className="p-4 border-b border-slate-200/50 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher un contact..."
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-slate-200/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
              <tr className="border-b border-slate-200/50 text-slate-500 text-sm">
                <th className="p-4 font-medium">Nom</th>
                <th className="p-4 font-medium">Entreprise</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Score IA</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    {searchQuery ? `Aucun résultat pour « ${searchQuery} »` : 'Aucun contact. Créez votre premier contact.'}
                  </td>
                </tr>
              )}
              {contacts.map(contact => (
                <tr
                  key={contact.id}
                  onClick={() => selectContact(contact.id)}
                  className="border-b border-slate-200/30 hover:bg-white/40 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-medium text-slate-800">{contact.first_name} {contact.last_name}</td>
                  <td className="p-4 text-slate-600">{contact.company || '—'}</td>
                  <td className="p-4 text-slate-600">{contact.email || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${app.bgLight} ${app.text}`}>{TYPE_LABELS[contact.type] || contact.type}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-1.5 w-16">
                        <div className={`${app.color} h-1.5 rounded-full`} style={{ width: `${contact.score || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{contact.score || 0}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1 hover:bg-slate-200/50 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========== DETAIL VIEW ========== */
        loadingDetail ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeContact ? (
          <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-6">
            {/* Contact header card */}
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 text-2xl font-bold shadow-inner">
                {activeContact.first_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800">{activeContact.first_name} {activeContact.last_name}</h3>
                <p className="text-slate-500 font-medium">{activeContact.company || activeContact.profession || '—'}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {activeContact.email && (
                    <a href={`mailto:${activeContact.email}`} className="text-sm text-blue-500 hover:underline flex items-center gap-1"><Mail size={14}/> {activeContact.email}</a>
                  )}
                  {activeContact.phone && (
                    <a href={`tel:${activeContact.phone}`} className="text-sm text-slate-500 hover:underline flex items-center gap-1"><Phone size={14}/> {activeContact.phone}</a>
                  )}
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${app.bgLight} ${app.text}`}>{TYPE_LABELS[activeContact.type] || activeContact.type}</span>
                  {activeContact.source && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500">{activeContact.source}</span>
                  )}
                </div>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/50 text-center min-w-[120px]">
                <p className="text-xs text-slate-500 font-medium mb-1">Score IA</p>
                <div className="text-3xl font-bold text-blue-600">{activeContact.score || 0}</div>
                <p className="text-[10px] text-slate-400 mt-1">{scoreLabel(activeContact.score || 0)}</p>
                <button
                  onClick={handleScore}
                  disabled={scoring}
                  className="mt-2 px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 mx-auto"
                >
                  {scoring ? <RefreshCw size={12} className="animate-spin" /> : <Bot size={12} />}
                  {scoring ? 'Scoring...' : 'Re-scorer'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Interactions timeline */}
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={18} className="text-slate-400"/> Historique des interactions</h4>
                  {(!activeContact.interactions || activeContact.interactions.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
                      Aucune interaction enregistrée
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {activeContact.interactions.map((interaction) => {
                        const config = INTERACTION_ICONS[interaction.type] || INTERACTION_ICONS.note;
                        const Icon = config.icon;
                        return (
                          <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white ${config.bg} ${config.text} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                              <Icon size={16} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/50 p-4 rounded-xl border border-slate-200/50 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-bold text-slate-800 text-sm">{interaction.subject || interaction.type}</h5>
                                <time className="text-xs font-medium text-slate-400">{formatDate(interaction.date)}</time>
                              </div>
                              {interaction.content && (
                                <p className="text-sm text-slate-500">{interaction.content.length > 200 ? interaction.content.slice(0, 200) + '...' : interaction.content}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Friction points if any */}
                {activeContact.friction_points && Object.keys(activeContact.friction_points).length > 0 && (
                  <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-red-400"/> Points de friction</h4>
                    <div className="space-y-2">
                      {(Array.isArray(activeContact.friction_points) ? activeContact.friction_points : []).map((fp: string, i: number) => (
                        <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800 flex items-start gap-2">
                          <span className="mt-0.5">•</span> {fp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {activeContact.notes && (
                  <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><StickyNote size={18} className="text-slate-400"/> Notes</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{activeContact.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                {/* Deals */}
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-slate-400"/> Opportunités (Deals)</h4>
                  {(!activeContact.deals || activeContact.deals.length === 0) ? (
                    <p className="text-sm text-slate-400 text-center py-4">Aucun deal</p>
                  ) : (
                    activeContact.deals.map(deal => (
                      <div key={deal.id} className="p-3 bg-white/50 border border-slate-200/50 rounded-xl mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-slate-800 text-sm">{deal.title}</h5>
                          <span className="text-sm font-bold text-slate-800">
                            {new Intl.NumberFormat('fr-FR').format(deal.value || 0)} €
                          </span>
                        </div>
                        {deal.stage && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">{deal.stage.name}</span>
                        )}
                        {deal.probability > 0 && (
                          <span className="ml-2 text-xs text-slate-400">{deal.probability}%</span>
                        )}
                      </div>
                    ))
                  )}
                  <button className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors">
                    + Ajouter un deal
                  </button>
                </div>

                {/* Documents */}
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-slate-400"/> Documents liés</h4>
                  {(!activeContact.documents || activeContact.documents.length === 0) ? (
                    <p className="text-sm text-slate-400 text-center py-4">Aucun document</p>
                  ) : (
                    <div className="space-y-2">
                      {activeContact.documents.map(doc => {
                        const isAudit = doc.type === 'report' || doc.name?.toLowerCase().includes('audit');
                        return (
                          <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-lg cursor-pointer transition-colors">
                            {isAudit ? <Bot size={16} className="text-purple-400" /> : <FileText size={16} className="text-red-400" />}
                            <span className="text-sm font-medium text-slate-700 flex-1 truncate">{doc.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">Contact introuvable</div>
        )
      )}

      {/* ========== NEW CONTACT MODAL ========== */}
      <AnimatePresence>
        {showNewContactForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
              onClick={() => setShowNewContactForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800">Nouveau Contact</h3>
                  <button onClick={() => setShowNewContactForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prénom</label>
                      <input
                        type="text"
                        value={newContact.first_name}
                        onChange={e => setNewContact({ ...newContact, first_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom</label>
                      <input
                        type="text"
                        value={newContact.last_name}
                        onChange={e => setNewContact({ ...newContact, last_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={newContact.phone}
                        onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Entreprise</label>
                      <input
                        type="text"
                        value={newContact.company}
                        onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                      <select
                        value={newContact.type}
                        onChange={e => setNewContact({ ...newContact, type: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      >
                        <option value="lead">Lead</option>
                        <option value="client">Client</option>
                        <option value="partenaire">Partenaire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Profession</label>
                      <input
                        type="text"
                        value={newContact.profession}
                        onChange={e => setNewContact({ ...newContact, profession: e.target.value })}
                        placeholder="avocat, notaire, architecte..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Source</label>
                    <select
                      value={newContact.source}
                      onChange={e => setNewContact({ ...newContact, source: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    >
                      <option value="site_web">Site web</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="recommandation">Recommandation</option>
                      <option value="webhook_cf7">Formulaire CF7</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                    <textarea
                      value={newContact.notes}
                      onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 resize-none"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowNewContactForm(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || (!newContact.first_name && !newContact.last_name)}
                    className={`${app.color} text-white px-6 py-2 rounded-xl font-medium shadow-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50`}
                  >
                    {creating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {creating ? 'Création...' : 'Créer le contact'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
