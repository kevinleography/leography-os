'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/crm': 'Repertoire',
  '/pipeline': 'Pipeline',
  '/audit': 'Audit IA',
  '/projects': 'Projets',
  '/documents/notes': 'Notes',
  '/finance': 'Finance',
  '/ads': 'Ads',
  '/messages': 'Messages',
  '/settings': 'Reglages',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path)) return title;
  }
  return 'LEOGRAPHY OS';
}

interface HeaderProps {
  title?: string;
  onSearchOpen: () => void;
}

export function Header({ title, onSearchOpen }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = title ?? getPageTitle(pathname);
  const notificationCount = 0;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-16',
        'flex items-center justify-between px-6',
        'bg-glass backdrop-blur-2xl',
        'border-b border-glass-border'
      )}
    >
      {/* Left: Page title */}
      <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search button */}
        <button
          onClick={onSearchOpen}
          className={cn(
            'flex items-center gap-2 h-9 px-3 rounded-lg',
            'bg-glass border border-glass-border',
            'text-text-secondary text-sm',
            'hover:bg-glass-hover hover:border-glass-border-hover',
            'transition-all duration-200'
          )}
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Rechercher</span>
          <kbd
            className={cn(
              'hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded',
              'bg-glass border border-glass-border',
              'text-[10px] text-text-muted font-mono'
            )}
          >
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-lg',
            'text-text-secondary',
            'hover:bg-glass-hover hover:text-text-primary',
            'transition-all duration-200'
          )}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'w-4 h-4 rounded-full',
                'bg-destructive text-[10px] font-bold text-white'
              )}
            >
              {notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-full',
            'bg-primary/20 text-primary text-sm font-semibold',
            'border border-primary/30',
            'hover:bg-primary/30',
            'transition-all duration-200'
          )}
        >
          KL
        </button>
      </div>
    </header>
  );
}
