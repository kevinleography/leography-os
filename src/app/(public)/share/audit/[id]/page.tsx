import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { AuditReport } from '@/components/audit/audit-report';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicAuditPage({ params }: Props) {
  const { id } = await params;

  const { data: audit, error } = await supabaseAdmin
    .from('web_audits')
    .select('*')
    .eq('share_token', id)
    .eq('status', 'completed')
    .single();

  if (error || !audit) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-glow" />

      {/* Header branding */}
      <header className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-text-primary">Leography</span>
          </div>
          <span className="text-xs text-text-muted">Rapport d&apos;audit</span>
        </div>
      </header>

      {/* Report content */}
      <main className="px-6 py-10">
        <AuditReport audit={audit} readOnly />
      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8 text-center">
        <p className="text-sm text-text-muted">
          Audit réalisé par{' '}
          <a
            href="https://leography.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Leography
          </a>
          {' '}&mdash; Agence digitale
        </p>
      </footer>
    </div>
  );
}
