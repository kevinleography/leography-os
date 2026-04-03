'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Search, Upload, Download, FileText, Folder, Image as ImageIcon,
  FolderPlus, Lock, FileKey, BookOpen, Bold, Italic, List, StickyNote, X
} from 'lucide-react';

const app = {
  color: 'bg-sky-500',
  text: 'text-sky-500',
  bgLight: 'bg-sky-500/10',
  gradient: 'from-sky-400 to-sky-600',
};

interface DocFile {
  id: string;
  name: string;
  type: string;
  file_size: number;
  created_at: string;
  storage_path: string;
  projects?: { name: string } | null;
  contacts?: { first_name: string; last_name: string; company: string } | null;
}

interface VaultItem {
  id: string;
  service_name: string;
  login: string;
  encrypted_password: string;
  category: string;
  contacts?: { first_name: string; last_name: string; company: string } | null;
}

interface NoteItem {
  id: string;
  title: string;
  content_text: string;
  content_json: Record<string, unknown>;
  updated_at: string;
  tags?: string[];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ext;
}

function NotesEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Commencez à écrire votre note...' }),
    ],
    content: '',
  });

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
      const contentText = editor?.getText() ?? '';
      const contentJson = editor?.getJSON() ?? {};
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content_text: contentText,
          content_json: contentJson,
          tags,
        }),
      });
      onSaved();
      onClose();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col overflow-hidden h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Nouvelle Note</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de la note..."
            className="flex-1 bg-transparent outline-none font-bold text-slate-800 text-lg"
          />
        </div>
        <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3 text-slate-500">
          <button onClick={() => editor?.chain().focus().toggleBold().run()} className="hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"><Bold size={16}/></button>
          <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"><Italic size={16}/></button>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors"><List size={16}/></button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <EditorContent editor={editor} className="prose prose-sm max-w-none text-slate-800 outline-none min-h-full" />
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="Tags (séparés par virgule)..."
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none text-slate-600"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className={`${app.color} text-white px-4 py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50`}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'files' | 'vault' | 'notes') || 'files';
  const [activeTab, setActiveTab] = useState<'files' | 'vault' | 'notes'>(initialTab);
  const [isDragging, setIsDragging] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [search, setSearch] = useState('');
  const [revealedVault, setRevealedVault] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<DocFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(true);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Download file from Supabase storage
  const handleDownload = async (file: DocFile) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(file.storage_path, 60);
      if (error || !data?.signedUrl) {
        alert('Impossible de générer le lien de téléchargement.');
        return;
      }
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert('Erreur lors du téléchargement.');
    }
  };

  // Create a new folder (project placeholder)
  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('projects').insert({ name, type: 'other', status: 'active' });
      if (error) throw error;
      // Refresh files to pick up new project folder
      const res = await fetch('/api/documents');
      const json = await res.json();
      setFiles(json?.data ?? []);
      setNewFolderName('');
    } catch {
      alert('Erreur lors de la création du dossier.');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Fetch documents
  useEffect(() => {
    setLoadingFiles(true);
    fetch('/api/documents')
      .then(res => res.json())
      .then(json => setFiles(json?.data ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoadingFiles(false));
  }, []);

  // Fetch vault (client_credentials) via Supabase client
  useEffect(() => {
    setLoadingVault(true);
    const supabase = createClient();
    supabase
      .from('client_credentials')
      .select('*, contacts(first_name, last_name, company)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setVaultItems([]);
        } else {
          setVaultItems((data as VaultItem[] | null) ?? []);
        }
        setLoadingVault(false);
      });
  }, []);

  // Fetch notes
  const fetchNotes = useCallback(() => {
    setLoadingNotes(true);
    fetch('/api/notes')
      .then(res => res.json())
      .then(json => setNotes(json?.data ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false));
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.projects?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content_text ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Get unique project folders from files
  const folders = [...new Set(files.map(f => f.projects?.name).filter(Boolean))] as string[];

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-slate-800">Docs & Notes</h2>
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 shadow-sm w-full sm:w-auto">
            <button onClick={() => setActiveTab('files')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'files' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Folder size={14}/> Fichiers
            </button>
            <button onClick={() => setActiveTab('vault')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'vault' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Lock size={14}/> Coffre-fort
            </button>
            <button onClick={() => setActiveTab('notes')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <BookOpen size={14}/> Notes IA
            </button>
          </div>
        </div>
        {activeTab === 'files' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full sm:w-auto justify-center ${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
          >
            <Upload size={18} /> Importer
          </button>
        )}
        {activeTab === 'notes' && (
          <button
            onClick={() => setShowNoteEditor(true)}
            className={`w-full sm:w-auto justify-center ${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
          >
            <Plus size={18} /> Nouvelle Note
          </button>
        )}
        {activeTab === 'vault' && (
          <button
            className={`w-full sm:w-auto justify-center ${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
          >
            <Plus size={18} /> Nouveau Secret
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200/50 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
          />
        </div>
      </div>

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="flex-1 flex flex-col gap-4">
          {/* Drag & Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? 'border-sky-400 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300 bg-white/30'}`}
          >
            <Upload size={24} className={`mb-2 ${isDragging ? 'text-sky-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-slate-600">Glissez vos fichiers ici ou <span className={app.text}>cliquez pour importer</span></p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, FIGMA — Max 50 Mo</p>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" multiple />

          {/* Folders */}
          {folders.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {folders.map(folder => (
                <div key={folder} className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl border border-white/60 shadow-sm cursor-pointer hover:bg-white/80 transition-colors whitespace-nowrap">
                  <Folder size={16} className={app.text} />
                  <span className="text-sm font-medium text-slate-700">{folder}</span>
                </div>
              ))}
              {creatingFolder ? (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); } }}
                    placeholder="Nom du dossier..."
                    autoFocus
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 w-40"
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim()}
                    className={`${app.color} text-white px-3 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
                  >
                    OK
                  </button>
                  <button
                    onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 transition-colors whitespace-nowrap"
                >
                  <FolderPlus size={16} /> Nouveau dossier
                </button>
              )}
            </div>
          )}

          {/* File list */}
          <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex-1">
            {loadingFiles ? (
              <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText size={32} className="mx-auto opacity-30 mb-3" />
                <p className="text-sm font-medium text-slate-500">Aucun document</p>
                <p className="text-xs text-slate-400 mt-1">Uploadez vos premiers fichiers.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 text-slate-500 text-sm">
                    <th className="p-4 font-medium">Nom</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Projet</th>
                    <th className="p-4 font-medium hidden md:table-cell">Taille</th>
                    <th className="p-4 font-medium hidden md:table-cell">Date</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(file => {
                    const ext = getFileType(file.name);
                    return (
                      <tr key={file.id} className="border-b border-slate-200/30 hover:bg-white/40 transition-colors cursor-pointer">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${app.bgLight} ${app.text} flex items-center justify-center shrink-0`}>
                              {ext === 'pdf' ? <FileText size={16} /> : ext === 'fig' || ext === 'figma' ? <ImageIcon size={16} /> : <FileText size={16} />}
                            </div>
                            <span className="font-medium text-slate-800 text-sm truncate">{file.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-sm hidden sm:table-cell">{file.projects?.name ?? '-'}</td>
                        <td className="p-4 text-slate-500 text-sm hidden md:table-cell">{formatSize(file.file_size)}</td>
                        <td className="p-4 text-slate-500 text-sm hidden md:table-cell">{formatDate(file.created_at)}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                            className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Vault Tab */}
      {activeTab === 'vault' && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Coffre-fort sécurisé</p>
              <p className="text-xs text-amber-700 mt-0.5">Les mots de passe sont chiffrés AES-256. Seuls les administrateurs y ont accès.</p>
            </div>
          </div>
          {loadingVault ? (
            <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
          ) : vaultItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileKey size={32} className="mx-auto opacity-30 mb-3" />
              <p className="text-sm font-medium text-slate-500">Aucun accès enregistré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaultItems.map(item => (
                <div key={item.id} className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${app.bgLight} ${app.text} flex items-center justify-center shrink-0`}>
                        <FileKey size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.service_name}</h4>
                        <p className="text-xs text-slate-500">{item.category ?? (item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}` : '')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500">Login</span>
                      <span className="text-xs font-medium text-slate-700">{item.login}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500">Mot de passe</span>
                      <button
                        onClick={() => setRevealedVault(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                        className={`text-xs font-medium ${revealedVault.includes(item.id) ? 'text-slate-700' : `${app.text}`}`}
                      >
                        {revealedVault.includes(item.id) ? '••••••••••' : 'Afficher'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col">
          {loadingNotes ? (
            <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
          ) : filteredNotes.length === 0 && !search ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <StickyNote size={32} className="opacity-30 mb-3" />
              <p className="text-sm font-medium text-slate-500">Aucune note</p>
              <p className="text-xs text-slate-400 mt-1">Créez votre première note.</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => setShowNoteEditor(true)}
                  className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group"
                >
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${app.bgLight} ${app.text} group-hover:scale-110 transition-transform`}>
                      <StickyNote size={16}/>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(note.updated_at)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{note.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-3">{note.content_text}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {(note.tags ?? []).map(tag => (
                      <span key={tag} className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${app.bgLight} ${app.text}`}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div
                onClick={() => setShowNoteEditor(true)}
                className="bg-white/30 backdrop-blur-md p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 min-h-[160px]"
              >
                <Plus size={24} />
                <span className="text-sm font-medium">Nouvelle note</span>
              </div>
            </div>
          )}
        </div>
      )}

      {showNoteEditor && <NotesEditor onClose={() => setShowNoteEditor(false)} onSaved={fetchNotes} />}
    </div>
  );
}
