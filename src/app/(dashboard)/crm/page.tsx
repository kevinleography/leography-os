import { supabaseAdmin } from '@/lib/supabase/admin';
import { ContactsPage } from '@/components/crm/contacts-page';

export default async function CRMPage() {
  const { data: contacts, count } = await supabaseAdmin
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: stages } = await supabaseAdmin
    .from('pipeline_stages')
    .select('*')
    .order('position');

  return <ContactsPage initialContacts={contacts ?? []} totalCount={count ?? 0} stages={stages ?? []} />;
}
