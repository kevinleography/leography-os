import { supabaseAdmin } from '@/lib/supabase/admin';
import { DocumentsPageClient } from '@/components/documents/documents-page';
import type { Document } from '@/types/database';

async function getDocuments() {
  const { data, count } = await supabaseAdmin
    .from('documents')
    .select(
      '*, contacts(first_name, last_name, company), projects(name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    documents: (data ?? []) as (Document & { contacts: any; projects: any })[],
    count: count ?? 0,
  };
}

export default async function DocumentsPage() {
  const { documents, count } = await getDocuments();

  return (
    <div className="page-wrapper space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Documents</h1>
      </div>
      <DocumentsPageClient documents={documents} totalCount={count} />
    </div>
  );
}
