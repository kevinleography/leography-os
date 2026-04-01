'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/lib/utils';
import { Mail, Phone, Calendar, FileText, Bot, Webhook, Plus, Send } from 'lucide-react';
import type { Interaction, InteractionType } from '@/types/database';

const iconMap: Record<InteractionType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  audit: <Bot className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
};

const typeLabels: Record<InteractionType, string> = {
  email: 'Email',
  call: 'Appel',
  meeting: 'Réunion',
  note: 'Note',
  audit: 'Audit',
  webhook: 'Webhook',
};

interface Props {
  interactions: Interaction[];
  contactId: string;
}

export function InteractionTimeline({ interactions, contactId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<InteractionType>('note');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!subject.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/contacts/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, type, subject, content }),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Interactions</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border border-[var(--color-glass-border)] space-y-3">
            <div className="flex gap-2">
              {(Object.keys(typeLabels) as InteractionType[]).slice(0, 4).map((t) => (
                <Button key={t} variant={type === t ? 'default' : 'outline'} size="sm" onClick={() => setType(t)}>
                  {typeLabels[t]}
                </Button>
              ))}
            </div>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet" />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Détails..."
              className="w-full h-20 glass-input px-3 py-2 text-sm resize-none"
            />
            <Button onClick={handleSubmit} loading={saving} size="sm">
              <Send className="h-4 w-4 mr-1" />Enregistrer
            </Button>
          </div>
        )}

        {interactions.length === 0 && !showForm && (
          <p className="text-sm text-[var(--color-text-muted)]">Aucune interaction</p>
        )}

        <div className="relative">
          {interactions.length > 0 && (
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--color-glass-border)]" />
          )}
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="flex gap-4 relative">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-glass)] border border-[var(--color-glass-border)] flex items-center justify-center text-[var(--color-text-muted)] z-10">
                  {iconMap[interaction.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{typeLabels[interaction.type]}</Badge>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatRelativeDate(interaction.date)}</span>
                  </div>
                  {interaction.subject && <p className="text-sm font-medium mt-1">{interaction.subject}</p>}
                  {interaction.content && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{interaction.content}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
