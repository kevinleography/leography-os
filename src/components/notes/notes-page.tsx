'use client';

import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NoteEditor } from './note-editor';
import type { Note } from '@/types/database';

interface NotesPageProps {
  initialNotes: Note[];
}

export function NotesPage({ initialNotes }: NotesPageProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content_text.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  async function handleCreateNote() {
    setCreating(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nouvelle note',
          content_json: {},
          content_text: '',
        }),
      });

      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setSelectedId(note.id);
      }
    } finally {
      setCreating(false);
    }
  }

  function handleNoteUpdated(updated: Note) {
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? updated : n))
    );
  }

  function handleNoteDeleted(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(notes.find((n) => n.id !== id)?.id ?? null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Notes IA</h1>
        <Button onClick={handleCreateNote} loading={creating}>
          <Plus className="h-4 w-4" />
          Nouvelle note
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <div className="w-80 shrink-0 flex flex-col bg-glass backdrop-blur-2xl border border-glass-border rounded-2xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-glass-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-text-muted text-sm text-center py-8">Aucune note.</p>
            )}
            {filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-glass-border/50 transition-all duration-150',
                  'hover:bg-glass',
                  selectedId === note.id && 'bg-primary/10 border-l-2 border-l-primary'
                )}
              >
                <div className="flex items-start gap-2">
                  {!note.is_dispatched && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {note.title || 'Sans titre'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatRelativeDate(note.updated_at)}
                    </p>
                  </div>
                  {note.is_dispatched && (
                    <Badge variant="success" className="text-[10px] shrink-0">
                      Dispatché
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onUpdated={handleNoteUpdated}
              onDeleted={handleNoteDeleted}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-glass backdrop-blur-2xl border border-glass-border rounded-2xl">
              <p className="text-text-muted">Sélectionnez ou créez une note</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
