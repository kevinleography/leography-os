import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { FileCheck, MessageSquare, FolderOpen, Clock } from 'lucide-react';

export default async function PortalHome() {
  // TODO: Get contact_id from auth session portal user
  // For now, show a placeholder
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Bienvenue sur votre espace client</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Suivez l'avancement de vos projets et validez les livrables.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/portal/validations">
          <Card className="hover:border-[var(--color-glass-border-hover)] transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="font-medium">Validations</p>
                <p className="text-sm text-[var(--color-text-muted)]">Livrables en attente</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/messages">
          <Card className="hover:border-[var(--color-glass-border-hover)] transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-sm text-[var(--color-text-muted)]">Échangez avec nous</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/files">
          <Card className="hover:border-[var(--color-glass-border-hover)] transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-[var(--color-success)]" />
              </div>
              <div>
                <p className="font-medium">Fichiers</p>
                <p className="text-sm text-[var(--color-text-muted)]">Documents partagés</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
