'use client';

import { useState } from 'react';
import {
  TrendingUp,
  RefreshCcw,
  CreditCard,
  FileText,
  Repeat,
  DollarSign,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { QuoteForm } from '@/components/finance/quote-form';
import type {
  Payment,
  Quote,
  Subscription,
  QuoteStatus,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionPack,
} from '@/types/database';

interface FinancePageProps {
  payments: (Payment & { contacts: any })[];
  quotes: (Quote & { contacts: any })[];
  subscriptions: (Subscription & { contacts: any })[];
  stats: { ca_month: number; mrr: number; oneshot: number };
  revenueHistory: { month: string; mrr: number; oneshot: number }[];
}

const quoteStatusConfig: Record<QuoteStatus, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoye', variant: 'default' },
  accepted: { label: 'Accepte', variant: 'success' },
  rejected: { label: 'Refuse', variant: 'destructive' },
  expired: { label: 'Expire', variant: 'warning' },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'warning' },
  succeeded: { label: 'Reussi', variant: 'success' },
  failed: { label: 'Echoue', variant: 'destructive' },
  refunded: { label: 'Rembourse', variant: 'secondary' },
};

const subscriptionStatusConfig: Record<SubscriptionStatus, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  active: { label: 'Actif', variant: 'success' },
  paused: { label: 'En pause', variant: 'warning' },
  cancelled: { label: 'Annule', variant: 'destructive' },
  past_due: { label: 'Impaye', variant: 'destructive' },
};

const packLabels: Record<SubscriptionPack, string> = {
  presence: 'Presence',
  performance: 'Performance',
  systeme_total: 'Systeme Total',
};

const paymentTypeLabels: Record<string, string> = {
  acompte: 'Acompte',
  solde: 'Solde',
  abonnement: 'Abonnement',
  one_shot: 'One-shot',
};

function contactName(contacts: any): string {
  if (!contacts) return '-';
  const name = `${contacts.first_name ?? ''} ${contacts.last_name ?? ''}`.trim();
  return contacts.company ? `${name} (${contacts.company})` : name;
}

export function FinancePage({
  payments,
  quotes,
  subscriptions,
  stats,
  revenueHistory,
}: FinancePageProps) {
  const [quotesList, setQuotesList] = useState(quotes);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  function refreshQuotes() {
    fetch('/api/finance/quotes')
      .then((r) => r.json())
      .then((d) => setQuotesList(d.data ?? []));
  }

  async function handleQuoteAccept(id: string) {
    try {
      // 1. Update status to accepted
      const res = await fetch(`/api/finance/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });
      if (res.ok) {
        setQuotesList((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: 'accepted' as QuoteStatus } : q))
        );
        // 2. Create Stripe Checkout for this quote
        const checkoutRes = await fetch(`/api/finance/quotes/${id}/checkout`, { method: 'POST' });
        if (checkoutRes.ok) {
          const { url } = await checkoutRes.json();
          if (url) window.open(url, '_blank');
        }
      }
    } catch {
      // silently fail
    }
  }

  async function handleQuoteAction(id: string, status: QuoteStatus) {
    try {
      const res = await fetch(`/api/finance/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setQuotesList((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status } : q))
        );
      }
    } catch {
      // silently fail
    }
  }

  async function handleQuoteDelete(id: string) {
    try {
      const res = await fetch(`/api/finance/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuotesList((prev) => prev.filter((q) => q.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">
          <TrendingUp className="w-4 h-4 mr-1.5" />
          Vue d&apos;ensemble
        </TabsTrigger>
        <TabsTrigger value="quotes">
          <FileText className="w-4 h-4 mr-1.5" />
          Devis
        </TabsTrigger>
        <TabsTrigger value="subscriptions">
          <Repeat className="w-4 h-4 mr-1.5" />
          Abonnements
        </TabsTrigger>
        <TabsTrigger value="payments">
          <CreditCard className="w-4 h-4 mr-1.5" />
          Paiements
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium">
                CA du mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {formatCurrency(stats.ca_month)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium flex items-center gap-1.5">
                <RefreshCcw className="w-3.5 h-3.5" />
                MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats.mrr)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-secondary font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                One-shot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(stats.oneshot)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenus sur 6 mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistory}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOneshot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorMrr)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="oneshot"
                    name="One-shot"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorOneshot)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Quotes Tab */}
      <TabsContent value="quotes">
        <div className="flex justify-end mb-4">
          <Button onClick={() => setQuoteFormOpen(true)} className="gap-2">
            <FileText className="w-4 h-4" />
            Nouveau devis
          </Button>
        </div>
        <QuoteForm open={quoteFormOpen} onOpenChange={setQuoteFormOpen} onSuccess={refreshQuotes} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant HT</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Valide jusqu&apos;au</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-text-muted py-8">
                  Aucun devis
                </TableCell>
              </TableRow>
            ) : (
              quotesList.map((quote) => {
                const statusCfg = quoteStatusConfig[quote.status];
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">{quote.reference}</TableCell>
                    <TableCell>{contactName(quote.contacts)}</TableCell>
                    <TableCell>{formatCurrency(quote.amount_ht)}</TableCell>
                    <TableCell>{formatCurrency(quote.amount_ttc)}</TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {quote.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Envoyer"
                            onClick={() => handleQuoteAction(quote.id, 'sent')}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {quote.status === 'sent' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Accepter + Paiement Stripe"
                              onClick={() => handleQuoteAccept(quote.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Refuser"
                              onClick={() => handleQuoteAction(quote.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          onClick={() => handleQuoteDelete(quote.id)}
                        >
                          <Trash2 className="w-4 h-4 text-text-muted" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Subscriptions Tab */}
      <TabsContent value="subscriptions">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Pack</TableHead>
              <TableHead>Montant mensuel</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Debut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-muted py-8">
                  Aucun abonnement
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => {
                const statusCfg = subscriptionStatusConfig[sub.status];
                return (
                  <TableRow key={sub.id}>
                    <TableCell>{contactName(sub.contacts)}</TableCell>
                    <TableCell>
                      <Badge variant="default">{packLabels[sub.pack_type]}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(sub.monthly_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(sub.start_date)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Payments Tab */}
      <TabsContent value="payments">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-muted py-8">
                  Aucun paiement
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const statusCfg = paymentStatusConfig[payment.status];
                return (
                  <TableRow key={payment.id}>
                    <TableCell>{contactName(payment.contacts)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {paymentTypeLabels[payment.type] ?? payment.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
