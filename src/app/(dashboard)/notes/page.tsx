import { supabaseAdmin } from '@/lib/supabase/admin';
import { NotesPage } from '@/components/notes/notes-page';

export default async function NotesRoute() {
  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(50);

  return <NotesPage initialNotes={notes ?? []} />;
}
