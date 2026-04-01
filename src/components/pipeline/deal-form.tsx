'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PipelineStage, Contact, CreateDealPayload } from '@/types/database';
import { cn } from '@/lib/utils';

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
  onSuccess: () => void;
}

const selectClasses = cn(
  'flex h-10 w-full rounded-[10px] px-3 py-2 text-sm',
  'bg-[rgba(255,255,255,0.05)] backdrop-blur-xl',
  'border border-glass-border',
  'text-text-primary',
  'transition-all duration-200',
  'focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

export function DealForm({ open, onOpenChange, stages, onSuccess }: DealFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [stageId, setStageId] = useState('');
  const [value, setValue] = useState('');
  const [probability, setProbability] = useState('50');
  const [expectedClose, setExpectedClose] = useState('');

  // Fetch contacts when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingContacts(true);
    fetch('/api/contacts')
      .then((res) => res.json())
      .then((data) => {
        setContacts(data.data ?? data ?? []);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, [open]);

  // Set default stage
  useEffect(() => {
    if (stages.length > 0 && !stageId) {
      setStageId(stages[0].id);
    }
  }, [stages, stageId]);

  function resetForm() {
    setTitle('');
    setContactId('');
    setStageId(stages[0]?.id ?? '');
    setValue('');
    setProbability('50');
    setExpectedClose('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !contactId || !stageId) return;

    setLoading(true);

    const payload: CreateDealPayload = {
      title,
      contact_id: contactId,
      stage_id: stageId,
      value: value ? parseFloat(value) : undefined,
      probability: probability ? parseInt(probability, 10) : undefined,
      expected_close: expectedClose || undefined,
    };

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
      }
    } catch {
      // Error silently handled - could add toast later
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau deal</DialogTitle>
          <DialogDescription>
            Cr{'\u00e9'}ez un nouveau deal dans votre pipeline commercial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Titre <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ex: Site web - Entreprise ABC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Contact <span className="text-destructive">*</span>
            </label>
            <select
              className={selectClasses}
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
              disabled={loadingContacts}
            >
              <option value="">
                {loadingContacts ? 'Chargement...' : 'S\u00e9lectionner un contact'}
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                  {c.company ? ` - ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {'\u00c9'}tape <span className="text-destructive">*</span>
            </label>
            <select
              className={selectClasses}
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              required
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Value + Probability row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Valeur (EUR)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Probabilit{'\u00e9'} (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="50"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
              />
            </div>
          </div>

          {/* Expected close */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Date de cl{'\u00f4'}ture pr{'\u00e9'}vue
            </label>
            <Input
              type="date"
              value={expectedClose}
              onChange={(e) => setExpectedClose(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" loading={loading} disabled={!title || !contactId}>
              Cr{'\u00e9'}er le deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
