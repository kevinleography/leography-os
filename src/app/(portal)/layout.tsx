import Link from 'next/link';
import { Home, FileCheck, MessageSquare, FileText, LogOut } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="bg-glow" />
      <header className="sticky top-0 z-50 border-b border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/portal" className="text-lg font-bold text-[var(--color-primary)]">
            Leography
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/portal" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1">
              <Home className="h-4 w-4" />Accueil
            </Link>
            <Link href="/portal/validations" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1">
              <FileCheck className="h-4 w-4" />Validations
            </Link>
            <Link href="/portal/messages" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />Messages
            </Link>
            <Link href="/portal/files" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1">
              <FileText className="h-4 w-4" />Fichiers
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
