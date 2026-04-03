'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Users,
  Target,
  Bot,
  FolderKanban,
  FileText,
  CreditCard,
  BarChart3,
  MessageSquare,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Accueil', gradient: 'from-slate-700 to-slate-900' },
  { href: '/crm', icon: Users, label: 'Répertoire', gradient: 'from-blue-400 to-blue-600' },
  { href: '/pipeline', icon: Target, label: 'Pipeline', gradient: 'from-orange-400 to-orange-600' },
  { href: '/audit', icon: Bot, label: 'Audit IA', gradient: 'from-purple-400 to-purple-600' },
  { href: '/projects', icon: FolderKanban, label: 'Projets', gradient: 'from-indigo-400 to-indigo-600' },
  { href: '/documents/notes', icon: FileText, label: 'Notes', gradient: 'from-sky-400 to-sky-600' },
  { href: '/finance', icon: CreditCard, label: 'Finance', gradient: 'from-amber-400 to-amber-600' },
  { href: '/ads', icon: BarChart3, label: 'Ads', gradient: 'from-emerald-400 to-emerald-600' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', gradient: 'from-teal-400 to-teal-600' },
  { href: '/settings', icon: Settings, label: 'Réglages', gradient: 'from-slate-500 to-slate-700' },
] as const;

export function Dock() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-end gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-white/40 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl max-w-[95vw] overflow-x-auto hide-scrollbar">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative group outline-none"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.div
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-linear-to-br ${item.gradient} flex items-center justify-center text-white shadow-md border border-white/20`}
                whileHover={{ scale: 1.15, y: -8 }}
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon size={24} className="opacity-90 drop-shadow-sm" />
              </motion.div>

              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-black/60 rounded-full" />
              )}

              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-lg pointer-events-none whitespace-nowrap shadow-xl border border-white/10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
