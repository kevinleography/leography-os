import { supabaseAdmin } from '@/lib/supabase/admin';
import { AuditReport } from '@/components/audit/audit-report';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuditDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: audit, error } = await supabaseAdmin
    .from('web_audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !audit) {
    notFound();
  }

  return <AuditReport audit={audit} />;
}
