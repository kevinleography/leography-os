import { supabaseAdmin } from '@/lib/supabase/admin';
import { ContactDetail } from '@/components/crm/contact-detail';
import { notFound } from 'next/navigation';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (!contact) notFound();

  const [
    { data: deals },
    { data: interactions },
    { data: projects },
    { data: audits },
  ] = await Promise.all([
    supabaseAdmin.from('deals').select('*, stage:pipeline_stages(*)').eq('contact_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('interactions').select('*').eq('contact_id', id).order('date', { ascending: false }).limit(20),
    supabaseAdmin.from('projects').select('*').eq('contact_id', id),
    supabaseAdmin.from('web_audits').select('*').eq('contact_id', id).order('created_at', { ascending: false }),
  ]);

  return (
    <ContactDetail
      contact={{ ...contact, deals: deals ?? [], interactions: interactions ?? [], projects: projects ?? [], audits: audits ?? [] }}
    />
  );
}
