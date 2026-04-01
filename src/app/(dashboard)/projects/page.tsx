import { supabaseAdmin } from '@/lib/supabase/admin';
import { ProjectsPage } from '@/components/projects/projects-page';

export default async function ProjectsRoute() {
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*, contact:contacts(id, first_name, last_name, company)')
    .order('updated_at', { ascending: false });

  return <ProjectsPage initialProjects={projects ?? []} />;
}
