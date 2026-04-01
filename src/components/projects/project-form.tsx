'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Contact, ProjectType } from '@/types/database';

const PROJECT_TYPES: { label: string; value: ProjectType }[] = [
  { label: 'Site Web', value: 'website' },
  { label: 'SEO', value: 'seo' },
  { label: 'Publicité', value: 'ads' },
  { label: 'Système', value: 'system' },
];

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: any) => void;
}

export function ProjectForm({ open, onOpenChange, onCreated }: ProjectFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('website');
  const [contactId, setContactId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/contacts?limit=200')
        .then((r) => r.json())
        .then((res) => setContacts(res.data ?? []))
        .catch(() => {});
    }
  }, [open]);

  function reset() {
    setName('');
    setType('website');
    setContactId('');
    setStartDate('');
    setDeadline('');
    setBudget('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contactId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          contact_id: contactId,
          start_date: startDate || undefined,
          deadline: deadline || undefined,
          budget: budget ? parseFloat(budget) : undefined,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        onCreated(project);
        reset();
      }
    } finally {
      setLoading(false);
    }
  }

  const selectClasses =
    'flex h-10 w-full rounded-[10px] px-3 py-2 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau projet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Nom du projet</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Refonte site vitrine"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProjectType)}
              className={selectClasses}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Client</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={selectClasses}
              required
            >
              <option value="">Sélectionner un client...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} — ` : ''}
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Date de début</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Échéance</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Budget (EUR)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={loading} disabled={!name.trim() || !contactId}>
              Créer le projet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
