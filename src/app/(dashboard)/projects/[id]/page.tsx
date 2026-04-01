import { supabaseAdmin } from '@/lib/supabase/admin';
import { ProjectDetail } from '@/components/projects/project-detail';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailRoute({ params }: Props) {
  const { id } = await params;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('*, contact:contacts(id, first_name, last_name, company, email, phone)')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  const [
    { data: checklists },
    { data: tasks },
    { data: timeEntries },
    { data: documents },
  ] = await Promise.all([
    supabaseAdmin
      .from('project_checklists')
      .select('*')
      .eq('project_id', id),
    supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('position'),
    supabaseAdmin
      .from('time_entries')
      .select('*')
      .eq('project_id', id)
      .order('date', { ascending: false }),
    supabaseAdmin
      .from('documents')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const projectWithDetails = {
    ...project,
    checklists: (checklists ?? []).map((cl) => ({
      ...cl,
      tasks: (tasks ?? []).filter((t) => t.checklist_id === cl.id),
    })),
    time_entries: timeEntries ?? [],
    documents: documents ?? [],
  };

  return <ProjectDetail project={projectWithDetails} tasks={tasks ?? []} />;
}
