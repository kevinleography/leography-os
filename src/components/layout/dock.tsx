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
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/crm', icon: Users, label: 'Repertoire' },
  { href: '/pipeline', icon: Target, label: 'Pipeline' },
  { href: '/audit', icon: Bot, label: 'Audit IA' },
  { href: '/projects', icon: FolderKanban, label: 'Projets' },
  { href: '/documents/notes', icon: FileText, label: 'Notes' },
  { href: '/finance', icon: CreditCard, label: 'Finance' },
  { href: '/ads', icon: BarChart3, label: 'Ads' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/settings', icon: Settings, label: 'Reglages' },
] as const;

export function Dock() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div
        className={cn(
          'flex items-center gap-1 px-3 py-2',
          'bg-glass backdrop-blur-2xl',
          'border border-glass-border',
          'rounded-2xl',
          'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        )}
      >
        {navItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.div
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-200',
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-hover'
                )}
                whileHover={{ scale: 1.3, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  layoutId="dock-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute -top-10 left-1/2 -translate-x-1/2',
                      'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
                      'bg-bg-tertiary/90 backdrop-blur-xl',
                      'border border-glass-border',
                      'text-text-primary',
                      'pointer-events-none'
                    )}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
