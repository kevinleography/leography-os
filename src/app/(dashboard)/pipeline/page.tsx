import { supabaseAdmin } from '@/lib/supabase/admin';
import { KanbanBoard } from '@/components/pipeline/kanban-board';
import type { PipelineStage, DealWithRelations } from '@/types/database';

export default async function PipelinePage() {
  const { data: stages } = await supabaseAdmin
    .from('pipeline_stages')
    .select('*')
    .order('position')
    .returns<PipelineStage[]>();

  const { data: deals } = await supabaseAdmin
    .from('deals')
    .select('*, contact:contacts(first_name, last_name, company), stage:pipeline_stages(*)')
    .order('created_at', { ascending: false })
    .returns<DealWithRelations[]>();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pipeline</h1>
        <p className="text-text-secondary text-sm mt-1">
          Suivez vos deals en cours et g{'\u00e9'}rez votre pipeline commercial.
        </p>
      </div>
      <KanbanBoard
        stages={stages ?? []}
        initialDeals={deals ?? []}
      />
    </div>
  );
}
