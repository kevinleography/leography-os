'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Zap,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Note, AIExtractedAction, Contact, Project } from '@/types/database';

interface NoteEditorProps {
  note: Note;
  onUpdated: (note: Note) => void;
  onDeleted: (id: string) => void;
}

export function NoteEditor({ note, onUpdated, onDeleted }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [contactId, setContactId] = useState(note.contact_id ?? '');
  const [projectId, setProjectId] = useState(note.project_id ?? '');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [extractedActions, setExtractedActions] = useState<AIExtractedAction[]>(
    note.ai_extracted_actions ?? []
  );
  const [deleting, setDeleting] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch contacts & projects for selects
  useEffect(() => {
    fetch('/api/contacts?limit=200')
      .then((r) => r.json())
      .then((res) => setContacts(res.data ?? []))
      .catch(() => {});
    fetch('/api/projects')
      .then((r) => r.json())
      .then((res) => setProjects(res.data ?? []))
      .catch(() => {});
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Commencez à écrire votre note...',
      }),
    ],
    content: note.content_json && Object.keys(note.content_json).length > 0 ? note.content_json : undefined,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-text-primary',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON(), editor.getText());
    },
    onBlur: ({ editor }) => {
      save(editor.getJSON(), editor.getText());
    },
  });

  const save = useCallback(
    async (contentJson: Record<string, any>, contentText: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content_json: contentJson,
          content_text: contentText,
          contact_id: contactId || null,
          project_id: projectId || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
      }
    },
    [note.id, title, contactId, projectId, onUpdated]
  );

  const debouncedSave = useCallback(
    (contentJson: Record<string, any>, contentText: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        save(contentJson, contentText);
      }, 1500);
    },
    [save]
  );

  // Save title/contact/project on blur
  const saveMeta = useCallback(() => {
    if (!editor) return;
    save(editor.getJSON(), editor.getText());
  }, [editor, save]);

  // Dispatch
  async function handleDispatch() {
    setDispatching(true);
    try {
      const res = await fetch('/api/notes/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: note.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setExtractedActions(data.actions ?? []);
        onUpdated({ ...note, is_dispatched: true, ai_extracted_actions: data.actions ?? [] });
      }
    } finally {
      setDispatching(false);
    }
  }

  // Delete
  async function handleDelete() {
    if (!confirm('Supprimer cette note ?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted(note.id);
      }
    } finally {
      setDeleting(false);
    }
  }

  const selectClasses =
    'flex h-9 w-full rounded-[10px] px-3 py-1.5 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]';

  const ACTION_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
    task: { label: 'Tâche', variant: 'default' },
    rdv: { label: 'RDV', variant: 'success' },
    deadline: { label: 'Échéance', variant: 'warning' },
    friction: { label: 'Point de friction', variant: 'destructive' },
    reminder: { label: 'Rappel', variant: 'secondary' },
  };

  return (
    <div className="h-full flex flex-col bg-glass backdrop-blur-2xl border border-glass-border rounded-2xl overflow-hidden">
      {/* Title */}
      <div className="p-4 border-b border-glass-border space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveMeta}
          placeholder="Titre de la note..."
          className="text-lg font-semibold border-none bg-transparent px-0 focus:shadow-none"
        />

        {/* Meta selects */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <select
              value={contactId}
              onChange={(e) => { setContactId(e.target.value); }}
              onBlur={saveMeta}
              className={selectClasses}
            >
              <option value="">Contact (optionnel)</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ? `${c.company} — ` : ''}
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); }}
              onBlur={saveMeta}
              className={selectClasses}
            >
              <option value="">Projet (optionnel)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-glass-border/50">
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-5 bg-glass-border mx-1" />
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleDispatch}
            loading={dispatching}
            disabled={note.is_dispatched}
            className="gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            {note.is_dispatched ? 'Dispatché' : 'Dispatcher'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className="text-text-muted hover:text-destructive h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Extracted actions */}
      {extractedActions.length > 0 && (
        <div className="border-t border-glass-border p-4 space-y-2 max-h-48 overflow-y-auto">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Actions extraites par IA
          </p>
          {extractedActions.map((action, i) => {
            const info = ACTION_TYPE_LABELS[action.type] ?? ACTION_TYPE_LABELS.task;
            return (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg px-3 py-2 bg-glass/50"
              >
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{action.title}</span>
                    <Badge variant={info.variant} className="text-[10px]">{info.label}</Badge>
                  </div>
                  {action.details && (
                    <p className="text-xs text-text-muted mt-0.5">{action.details}</p>
                  )}
                  {action.due_date && (
                    <p className="text-xs text-text-secondary mt-0.5">{formatDate(action.due_date)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-lg transition-all duration-150',
        active
          ? 'bg-primary/20 text-primary'
          : 'text-text-muted hover:text-text-primary hover:bg-glass'
      )}
    >
      {children}
    </button>
  );
}
