import { supabaseAdmin } from '@/lib/supabase/admin';
import { AuditPage } from '@/components/audit/audit-page';

export default async function AuditListPage() {
  const { data: audits } = await supabaseAdmin
    .from('web_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return <AuditPage initialAudits={audits ?? []} />;
}
