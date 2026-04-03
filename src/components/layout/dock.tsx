'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home, Users, Kanban, Bot, Calendar, Briefcase, LineChart, MessageSquare,
  FileText, CreditCard, Settings,
} from 'lucide-react';

const APPS = [
  { id: 'dashboard', href: '/dashboard', icon: Home, label: 'Bureau', gradient: 'from-slate-700 to-slate-900' },
  { id: 'contacts', href: '/crm', icon: Users, label: 'Contacts', gradient: 'from-blue-400 to-blue-600' },
  { id: 'pipeline', href: '/pipeline', icon: Kanban, label: 'Pipeline', gradient: 'from-orange-400 to-orange-600' },
  { id: 'lab', href: '/audit', icon: Bot, label: 'Lab IA', gradient: 'from-purple-400 to-purple-600' },
  { id: 'agenda', href: '/agenda', icon: Calendar, label: 'Agenda', gradient: 'from-red-400 to-red-600' },
  { id: 'projects', href: '/projects', icon: Briefcase, label: 'Projets', gradient: 'from-indigo-400 to-indigo-600' },
  { id: 'performances', href: '/ads', icon: LineChart, label: 'Performances', gradient: 'from-emerald-400 to-emerald-600' },
  { id: 'messages', href: '/messages', icon: MessageSquare, label: 'Messages', gradient: 'from-teal-400 to-teal-600' },
  { id: 'documents', href: '/documents/notes', icon: FileText, label: 'Docs & Notes IA', gradient: 'from-sky-400 to-sky-600' },
  { id: 'finances', href: '/finance', icon: CreditCard, label: 'Finances', gradient: 'from-amber-400 to-amber-600' },
  { id: 'settings', href: '/settings', icon: Settings, label: 'Réglages', gradient: 'from-slate-500 to-slate-700' },
] as const;

export function Dock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-end gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 bg-white/40 backdrop-blur-3xl rounded-3xl border border-white/50 shadow-2xl max-w-[95vw] overflow-x-auto hide-scrollbar">
        {APPS.map(app => {
          const isActive = pathname === app.href || pathname.startsWith(app.href + '/');
          const Icon = app.icon;
          return (
            <Link
              key={app.id}
              href={app.href}
              className="relative group outline-none"
            >
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 group-active:scale-95 border border-white/20`}>
                <Icon size={24} className="opacity-90 drop-shadow-sm" />
              </div>
              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-black/60 rounded-full" />
              )}
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                {app.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
