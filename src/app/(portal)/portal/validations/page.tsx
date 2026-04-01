import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ExternalLink, Check, RotateCcw } from 'lucide-react';

const statusMap = {
  pending: { label: 'En attente', variant: 'warning' as const },
  approved: { label: 'Approuvé', variant: 'success' as const },
  revision_requested: { label: 'Révision demandée', variant: 'destructive' as const },
};

export default async function ValidationsPage() {
  const { data: validations } = await supabaseAdmin
    .from('client_validations')
    .select('*, project:projects(name)')
    .order('submitted_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Validations</h1>
      <p className="text-[var(--color-text-secondary)]">Consultez et validez les livrables de vos projets.</p>

      <div className="space-y-4">
        {(validations ?? []).map((v: any) => {
          const status = statusMap[v.status as keyof typeof statusMap];
          return (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium">{v.title}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {v.project?.name} — {formatDate(v.submitted_at)}
                  </p>
                  {v.description && <p className="text-sm text-[var(--color-text-secondary)]">{v.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {v.preview_url && (
                    <a href={v.preview_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(validations ?? []).length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">Aucune validation en attente.</p>
        )}
      </div>
    </div>
  );
}
