import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*, contact:contacts(id, first_name, last_name, company, email, phone)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const [
      { data: tasks },
      { data: timeEntries },
      { data: checklists },
      { data: documents },
    ] = await Promise.all([
      supabaseAdmin.from('tasks').select('*').eq('project_id', id).order('position'),
      supabaseAdmin.from('time_entries').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabaseAdmin.from('project_checklists').select('*').eq('project_id', id),
      supabaseAdmin.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      ...project,
      tasks: tasks ?? [],
      time_entries: timeEntries ?? [],
      checklists: (checklists ?? []).map((cl) => ({
        ...cl,
        tasks: (tasks ?? []).filter((t) => t.checklist_id === cl.id),
      })),
      documents: documents ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(body)
      .eq('id', id)
      .select('*, contact:contacts(id, first_name, last_name, company)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
