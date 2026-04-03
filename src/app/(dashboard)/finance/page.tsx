'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CreditCard, FileText, Send, Download, RefreshCw, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const app = {
  color: 'bg-amber-500',
  gradient: 'from-amber-400 to-amber-600',
  text: 'text-amber-500',
  bgLight: 'bg-amber-500/10',
};

interface Invoice {
  id: string;
  number: string;
  client: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  email?: string;
}

interface Quote {
  id: string;
  number: string;
  client: string;
  description: string;
  amount: number;
  status: string;
  docuseal_submission_id?: string | null;
}

interface Stats {
  ca_month: number;
  mrr: number;
  oneshot: number;
  annual_total: number;
}

export default function Finance() {
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  // Quote creation modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ contact_id: '', amount_ht: '', description: '', valid_until: '' });
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; label: string }[]>([]);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Invoice creation modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ contact_id: '', amount: '', description: '' });
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<Stats>({ ca_month: 0, mrr: 0, oneshot: 0, annual_total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      const [paymentsRes, quotesRes, subscriptionsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*, contacts(first_name, last_name, company, email)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('quotes')
          .select('*, contacts(first_name, last_name, company, email)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('subscriptions')
          .select('monthly_amount, status')
          .eq('status', 'active'),
      ]);

      const payments = paymentsRes.data ?? [];
      const quotesData = quotesRes.data ?? [];
      const subscriptions = subscriptionsRes.data ?? [];

      const mrr = subscriptions.reduce((sum: number, s: any) => sum + (s.monthly_amount || 0), 0);
      const monthPayments = payments.filter(
        (p: any) => p.status === 'succeeded' && p.paid_at && new Date(p.paid_at) >= new Date(startOfMonth)
      );
      const ca_month = monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const oneshot = monthPayments
        .filter((p: any) => p.type !== 'abonnement')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      const yearPayments = payments.filter(
        (p: any) => p.status === 'succeeded' && p.paid_at && new Date(p.paid_at) >= new Date(startOfYear)
      );
      const annual_total = yearPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      const invoiceList: Invoice[] = payments.slice(0, 5).map((p: any) => ({
        id: p.id,
        number: p.invoice_number || `INV-${p.id.slice(0, 6).toUpperCase()}`,
        client: p.contacts
          ? `${p.contacts.first_name || ''} ${p.contacts.last_name || ''}`.trim() || p.contacts.company || '—'
          : '—',
        date: p.paid_at
          ? new Date(p.paid_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        amount: p.amount || 0,
        status: p.status === 'succeeded' ? 'paid' : p.status === 'pending' ? 'pending' : 'overdue',
        email: p.contacts?.email,
      }));

      const quoteList: Quote[] = quotesData.slice(0, 5).map((q: any) => ({
        id: q.id,
        number: q.quote_number || `EST-${q.id.slice(0, 6).toUpperCase()}`,
        client: q.contacts
          ? `${q.contacts.first_name || ''} ${q.contacts.last_name || ''}`.trim() || q.contacts.company || '—'
          : '—',
        description: q.title || q.description || 'Devis',
        amount: q.total_amount || q.amount || 0,
        status: q.status || 'pending',
        docuseal_submission_id: q.docuseal_submission_id,
      }));

      setInvoices(invoiceList);
      setQuotes(quoteList);
      setStats({ ca_month, mrr, oneshot, annual_total });
      setLoading(false);
    }

    load();
  }, []);

  // Load contacts for modals
  useEffect(() => {
    fetch('/api/contacts?limit=100')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data) {
          setContacts(d.data.map((c: any) => ({
            id: c.id,
            label: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company || c.email,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateQuote = async () => {
    if (!quoteForm.contact_id || !quoteForm.amount_ht) return;
    setCreatingQuote(true);
    setQuoteError(null);
    try {
      const amountHt = Math.round(parseFloat(quoteForm.amount_ht) * 100);
      const amountTtc = Math.round(amountHt * 1.2);
      const res = await fetch('/api/finance/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: quoteForm.contact_id,
          amount_ht: amountHt,
          amount_ttc: amountTtc,
          description: quoteForm.description,
          valid_until: quoteForm.valid_until || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setQuoteError(err.error || 'Erreur');
        return;
      }
      setShowQuoteModal(false);
      setQuoteForm({ contact_id: '', amount_ht: '', description: '', valid_until: '' });
      // Reload data
      window.location.reload();
    } catch {
      setQuoteError('Erreur réseau');
    } finally {
      setCreatingQuote(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.contact_id || !invoiceForm.amount) return;
    setCreatingInvoice(true);
    setInvoiceError(null);
    try {
      const amount = Math.round(parseFloat(invoiceForm.amount) * 100);
      const supabase = createClient();
      const { error } = await supabase.from('payments').insert({
        contact_id: invoiceForm.contact_id,
        amount,
        type: 'one_shot',
        status: 'pending',
        description: invoiceForm.description,
      });
      if (error) {
        setInvoiceError(error.message);
        return;
      }
      setShowInvoiceModal(false);
      setInvoiceForm({ contact_id: '', amount: '', description: '' });
      window.location.reload();
    } catch {
      setInvoiceError('Erreur réseau');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const openSendPanel = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSendEmail(invoice.email || '');
    setSendSubject(`Facture ${invoice.number} - Leography`);
    setSendMessage(`Bonjour,\n\nVeuillez trouver ci-joint la facture ${invoice.number} pour nos prestations.\n\nMerci de procéder au règlement sous 30 jours.\n\nCordialement,\nL'équipe Leography`);
    setIsSendingInvoice(true);
  };

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sendEmail,
          subject: sendSubject,
          message: sendMessage,
          invoiceNumber: selectedInvoice.number,
          amount: selectedInvoice.amount,
        }),
      });
      if (!res.ok) throw new Error('Échec envoi');
      setIsSendingInvoice(false);
    } catch {
      alert('Erreur lors de l\'envoi. Vérifiez la configuration Resend.');
    } finally {
      setIsSending(false);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount / 100) + ' €';

  const annualGoal = 50000000; // 500 000 € in cents
  const annualPct = Math.min(Math.round((stats.annual_total / annualGoal) * 100), 100);

  const statusLabel: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Payée', cls: 'bg-emerald-100 text-emerald-700' },
    pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
    overdue: { label: 'En retard', cls: 'bg-red-100 text-red-700' },
  };

  const quoteStatusLabel: Record<string, { label: string; cls: string }> = {
    pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
    sent: { label: 'Envoyé', cls: 'bg-sky-100 text-sky-700' },
    accepted: { label: 'Accepté', cls: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Refusé', cls: 'bg-red-100 text-red-700' },
    draft: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-700' },
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Finances & Facturation</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowQuoteModal(true)} className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors">
            <Plus size={18} /> Nouveau Devis
          </button>
          <button onClick={() => setShowInvoiceModal(true)} className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}>
            <Plus size={18} /> Créer Facture
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`bg-gradient-to-br ${app.gradient} p-8 rounded-3xl shadow-lg text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <CreditCard size={120} />
          </div>
          <p className="font-medium text-white/80 mb-2">Chiffre d'Affaires (Mois)</p>
          <h3 className="text-5xl font-bold tracking-tight mb-6">
            {loading ? '—' : formatAmount(stats.ca_month)}
          </h3>
          <div className="flex gap-6">
            <div>
              <p className="text-white/60 text-sm mb-1">MRR</p>
              <p className="font-semibold text-xl">{loading ? '—' : formatAmount(stats.mrr)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">One-shot</p>
              <p className="font-semibold text-xl">{loading ? '—' : formatAmount(stats.oneshot)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm flex flex-col justify-center">
          <h3 className="font-bold text-slate-800 mb-4">Objectif Annuel</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-600">
              Atteint : {loading ? '—' : formatAmount(stats.annual_total)}
            </span>
            <span className="font-medium text-slate-800">Objectif : 500 000 €</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
            <div className={`${app.color} h-4 rounded-full transition-all duration-700`} style={{ width: `${annualPct}%` }} />
          </div>
          <p className="text-sm text-slate-500">{annualPct}% de l'objectif atteint. Continuez comme ça !</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden flex flex-col p-6">
          <h3 className="font-bold text-slate-800 mb-4">Factures Récentes</h3>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-slate-300" size={24} />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Aucune facture</div>
            ) : (
              invoices.map((inv) => {
                const st = statusLabel[inv.status] || statusLabel.pending;
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/60 hover:shadow-sm transition-all cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className={`w-10 h-10 rounded-xl ${app.bgLight} ${app.text} flex items-center justify-center shrink-0`}>
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">Facture #{inv.number}</p>
                        <p className="text-sm text-slate-500 truncate">{inv.client} • {inv.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-bold text-slate-800">{formatAmount(inv.amount)}</span>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${st.cls}`}>{st.label}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); openSendPanel(inv); }}
                          className="text-sky-500 hover:text-sky-700 bg-sky-50 p-2 rounded-lg transition-colors"
                          title="Envoyer par email"
                        >
                          <Send size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); alert('Génération PDF à venir — utilisez l\'envoi par email pour le moment.'); }} className="text-slate-400 hover:text-slate-600" title="Télécharger PDF"><Download size={18} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden flex flex-col p-6">
          <h3 className="font-bold text-slate-800 mb-4">Devis en cours</h3>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-slate-300" size={24} />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Aucun devis</div>
            ) : (
              quotes.map((q) => {
                const st = quoteStatusLabel[q.status] || quoteStatusLabel.pending;
                return (
                  <div
                    key={q.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/60 hover:shadow-sm transition-all cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">Devis #{q.number}</p>
                        <p className="text-sm text-slate-500 truncate">{q.client} • {q.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-bold text-slate-800">{formatAmount(q.amount)}</span>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${st.cls}`}>{st.label}</span>
                        <button onClick={(e) => { e.stopPropagation(); alert('Génération PDF à venir — utilisez l\'envoi par email pour le moment.'); }} className="text-slate-400 hover:text-slate-600" title="Télécharger PDF"><Download size={18} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Slide-over for sending invoice */}
      <AnimatePresence>
        {isSendingInvoice && selectedInvoice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 rounded-3xl"
              onClick={() => setIsSendingInvoice(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 rounded-r-3xl border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-tr-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Envoyer la facture</h3>
                  <p className="text-sm text-slate-500">Facture #{selectedInvoice.number}</p>
                </div>
                <button onClick={() => setIsSendingInvoice(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Destinataire</label>
                  <input
                    type="email"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sujet</label>
                  <input
                    type="text"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                  <textarea
                    rows={6}
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 resize-none"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">Facture_{selectedInvoice.number}.pdf</p>
                    <p className="text-xs text-slate-500">PDF généré</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><Download size={16} /></button>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-br-3xl">
                <button
                  onClick={handleSendInvoice}
                  disabled={isSending}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <><RefreshCw size={18} className="animate-spin" /> Envoi en cours...</>
                  ) : (
                    <><Send size={18} /> Envoyer via Resend</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quote Creation Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50" onClick={() => setShowQuoteModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Nouveau Devis</h3>
                  <button onClick={() => setShowQuoteModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Client</label>
                    <select value={quoteForm.contact_id} onChange={e => setQuoteForm(f => ({ ...f, contact_id: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20">
                      <option value="">Sélectionner un client</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Montant HT (€)</label>
                    <input type="number" step="0.01" value={quoteForm.amount_ht} onChange={e => setQuoteForm(f => ({ ...f, amount_ht: e.target.value }))} placeholder="1500.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                    <input type="text" value={quoteForm.description} onChange={e => setQuoteForm(f => ({ ...f, description: e.target.value }))} placeholder="Refonte site web" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valide jusqu&apos;au</label>
                    <input type="date" value={quoteForm.valid_until} onChange={e => setQuoteForm(f => ({ ...f, valid_until: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  {quoteError && <p className="text-sm text-red-600">{quoteError}</p>}
                  <button onClick={handleCreateQuote} disabled={creatingQuote || !quoteForm.contact_id || !quoteForm.amount_ht} className={`w-full ${app.color} text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50`}>
                    {creatingQuote ? <><Loader2 size={18} className="animate-spin" /> Création...</> : <><Plus size={18} /> Créer le devis</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invoice Creation Modal */}
      <AnimatePresence>
        {showInvoiceModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50" onClick={() => setShowInvoiceModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Créer une Facture</h3>
                  <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Client</label>
                    <select value={invoiceForm.contact_id} onChange={e => setInvoiceForm(f => ({ ...f, contact_id: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20">
                      <option value="">Sélectionner un client</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Montant TTC (€)</label>
                    <input type="number" step="0.01" value={invoiceForm.amount} onChange={e => setInvoiceForm(f => ({ ...f, amount: e.target.value }))} placeholder="1800.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                    <input type="text" value={invoiceForm.description} onChange={e => setInvoiceForm(f => ({ ...f, description: e.target.value }))} placeholder="Prestation web" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20" />
                  </div>
                  {invoiceError && <p className="text-sm text-red-600">{invoiceError}</p>}
                  <button onClick={handleCreateInvoice} disabled={creatingInvoice || !invoiceForm.contact_id || !invoiceForm.amount} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {creatingInvoice ? <><Loader2 size={18} className="animate-spin" /> Création...</> : <><CreditCard size={18} /> Créer la facture</>}
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
