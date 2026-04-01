import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Image, FileCode } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  contract: <FileText className="h-5 w-5" />,
  brief: <FileCode className="h-5 w-5" />,
  asset: <Image className="h-5 w-5" />,
  report: <FileText className="h-5 w-5" />,
};

export default async function PortalFilesPage() {
  const { data: files } = await supabaseAdmin
    .from('client_files')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fichiers</h1>
      <p className="text-[var(--color-text-secondary)]">Vos documents et livrables partagés.</p>

      <div className="space-y-3">
        {(files ?? []).map((file: any) => (
          <Card key={file.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-glass)] flex items-center justify-center text-[var(--color-text-muted)]">
                  {typeIcons[file.category] || <FileText className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(file.created_at)}</p>
                </div>
              </div>
              <Badge variant="secondary">{file.category}</Badge>
            </CardContent>
          </Card>
        ))}
        {(files ?? []).length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)]">Aucun fichier partagé.</p>
        )}
      </div>
    </div>
  );
}
