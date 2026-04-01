'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { Contact } from '@/types/database';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface QuoteLine {
  description: string;
  quantity: number;
  unit_price: number;
}

const TVA_RATE = 0; // DOM-TOM : pas de TVA en Guadeloupe/Martinique/Réunion (octroi de mer applicable séparément)

export function QuoteForm({ open, onOpenChange, onSuccess }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [lines, setLines] = useState<QuoteLine[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch('/api/contacts?limit=200')
        .then((r) => r.json())
        .then((d) => setContacts(d.data ?? []));
    }
  }, [open]);

  const totalHT = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
  const totalTTC = totalHT * (1 + TVA_RATE);

  function updateLine(index: number, field: keyof QuoteLine, value: string | number) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!contactId || lines.every((l) => !l.description)) return;
    setSaving(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const res = await fetch('/api/finance/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          deal_id: dealId || null,
          amount_ht: totalHT,
          amount_ttc: totalTTC,
          valid_until: validUntil.toISOString(),
          lines,
        }),
      });
      if (res.ok) {
        onOpenChange(false);
        onSuccess();
        setLines([{ description: '', quantity: 1, unit_price: 0 }]);
        setContactId('');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
      <DialogHeader><DialogTitle>Nouveau devis</DialogTitle></DialogHeader>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Contact */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Client *</label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full h-10 rounded-lg px-3 text-sm bg-[rgba(255,255,255,0.05)] border border-[var(--color-glass-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Sélectionner un client</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Validité */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Validité (jours)</label>
          <Input
            type="number"
            value={validDays}
            onChange={(e) => setValidDays(Number(e.target.value))}
            min={1}
          />
        </div>

        {/* Lignes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Lignes du devis</label>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input
                value={line.description}
                onChange={(e) => updateLine(i, 'description', e.target.value)}
                placeholder="Description"
                className="flex-1"
              />
              <Input
                type="number"
                value={line.quantity}
                onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
                className="w-20"
                min={1}
              />
              <Input
                type="number"
                value={line.unit_price}
                onChange={(e) => updateLine(i, 'unit_price', Number(e.target.value))}
                placeholder="Prix €"
                className="w-28"
                min={0}
                step={0.01}
              />
              {lines.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeLine(i)} className="text-[var(--color-text-muted)]">
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addLine}>
            + Ajouter une ligne
          </Button>
        </div>

        {/* Totaux */}
        <div className="p-3 rounded-lg bg-[var(--color-glass)] border border-[var(--color-glass-border)]">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Total HT</span>
            <span className="font-medium">{formatCurrency(totalHT)}</span>
          </div>
          {TVA_RATE > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[var(--color-text-muted)]">TVA ({(TVA_RATE * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(totalTTC - totalHT)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mt-1 pt-1 border-t border-[var(--color-glass-border)]">
            <span className="font-medium">Total TTC</span>
            <span className="font-bold text-[var(--color-primary)]">{formatCurrency(totalTTC)}</span>
          </div>
        </div>

        <Button onClick={handleSubmit} loading={saving} className="w-full" disabled={!contactId}>
          Créer le devis
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
