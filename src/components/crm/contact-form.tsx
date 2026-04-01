'use client';

import { useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Contact, ContactType } from '@/types/database';

const contactSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  profession: z.string().optional(),
  type: z.enum(['lead', 'client', 'partenaire']),
  source: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSuccess: () => void;
}

const sourceOptions = [
  'Site web',
  'Recommandation',
  'Google Ads',
  'Réseaux sociaux',
  'Salon / Événement',
  'Prospection',
  'Autre',
];

export function ContactForm({ open, onOpenChange, contact, onSuccess }: ContactFormProps) {
  const isEditing = !!contact;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ContactFormData>({
    first_name: contact?.first_name ?? '',
    last_name: contact?.last_name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    company: contact?.company ?? '',
    profession: contact?.profession ?? '',
    type: contact?.type ?? 'lead',
    source: contact?.source ?? '',
    notes: contact?.notes ?? '',
  });

  function updateField<K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...result.data,
        email: result.data.email || undefined,
      };

      const url = isEditing ? `/api/contacts/${contact.id}` : '/api/contacts';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Erreur lors de la sauvegarde');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setErrors({ _form: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le contact' : 'Nouveau contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors._form && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {errors._form}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Prénom *</label>
              <Input
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="Jean"
                className={cn(errors.first_name && 'border-red-500')}
              />
              {errors.first_name && <p className="text-xs text-red-400">{errors.first_name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Nom *</label>
              <Input
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Dupont"
                className={cn(errors.last_name && 'border-red-500')}
              />
              {errors.last_name && <p className="text-xs text-red-400">{errors.last_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="jean@exemple.com"
                className={cn(errors.email && 'border-red-500')}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Téléphone</label>
              <Input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="0690 12 34 56"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Entreprise</label>
              <Input
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="SARL Exemple"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Profession</label>
              <Input
                value={form.profession}
                onChange={(e) => updateField('profession', e.target.value)}
                placeholder="Gérant, Directeur..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Type</label>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value as ContactType)}
                className="flex h-10 w-full rounded-[10px] px-3 py-2 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary transition-all duration-200 focus:outline-none focus:border-primary"
              >
                <option value="lead">Lead</option>
                <option value="client">Client</option>
                <option value="partenaire">Partenaire</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Source</label>
              <select
                value={form.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="flex h-10 w-full rounded-[10px] px-3 py-2 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary transition-all duration-200 focus:outline-none focus:border-primary"
              >
                <option value="">Sélectionner...</option>
                {sourceOptions.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes sur le contact..."
              rows={3}
              className="flex w-full rounded-[10px] px-3 py-2 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer le contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
