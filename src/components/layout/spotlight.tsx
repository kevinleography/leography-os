'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User, FolderKanban, Target, CheckSquare, FileText, Loader2 } from 'lucide-react';

interface SpotlightProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'contact' | 'projet' | 'deal' | 'tache' | 'note';
  title: string;
  subtitle?: string;
  href: string;
}

const typeConfig = {
  contact: { label: 'Contacts', icon: User },
  projet: { label: 'Projets', icon: FolderKanban },
  deal: { label: 'Deals', icon: Target },
  tache: { label: 'Taches', icon: CheckSquare },
  note: { label: 'Notes', icon: FileText },
} as const;

const typeOrder: Array<SearchResult['type']> = ['contact', 'projet', 'deal', 'tache', 'note'];

export function Spotlight({ open, onClose }: SpotlightProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      setResults([]);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const flatResults = results;

  const groupedResults = typeOrder
    .map((type) => ({
      type,
      ...typeConfig[type],
      items: flatResults.filter((r) => r.type === type),
    }))
    .filter((group) => group.items.length > 0);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onClose();
      router.push(result.href);
    },
    [onClose, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-slate-900/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input row */}
            <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher des contacts, projets, deals..."
                className="flex-1 bg-transparent border-none outline-none text-xl text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={onClose}
                className="flex items-center justify-center shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
              >
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-500">
                  ESC
                </kbd>
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto p-2">
              {query.trim() && !loading && flatResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Search className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm">Aucun résultat pour « {query} »</p>
                  <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
                </div>
              )}

              {!query.trim() && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Search className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm">Commencez à taper pour rechercher</p>
                </div>
              )}

              {groupedResults.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.type} className="mb-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <GroupIcon className="w-3.5 h-3.5" />
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const itemIndex = flatResults.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-100 ${
                            itemIndex === selectedIndex
                              ? 'bg-indigo-500/15 text-slate-800'
                              : 'text-slate-600 hover:bg-white/60'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
