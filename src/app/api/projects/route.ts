import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import type { CreateProjectPayload } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const contactId = searchParams.get('contact_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('projects')
      .select('*, contact:contacts(id, first_name, last_name, company)');

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectPayload = await request.json();

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        contact_id: body.contact_id,
        name: body.name,
        type: body.type,
        status: 'draft',
        start_date: body.start_date ?? null,
        deadline: body.deadline ?? null,
        budget: body.budget ?? 0,
        progress: 0,
      })
      .select('*, contact:contacts(id, first_name, last_name, company)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // If a checklist template was specified, create checklist + tasks
    if (body.checklist_template_id && data) {
      const { data: template } = await supabaseAdmin
        .from('checklist_templates')
        .select('*')
        .eq('id', body.checklist_template_id)
        .single();

      if (template) {
        const { data: checklist } = await supabaseAdmin
          .from('project_checklists')
          .insert({
            project_id: data.id,
            template_id: template.id,
            name: template.name,
          })
          .select()
          .single();

        if (checklist && template.items) {
          const tasks = template.items.map((item: { label: string; description?: string; order: number }) => ({
            title: item.label,
            description: item.description ?? null,
            project_id: data.id,
            checklist_id: checklist.id,
            status: 'todo',
            priority: 'medium',
            position: item.order,
            source: 'sop',
          }));

          await supabaseAdmin.from('tasks').insert(tasks);
        }
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
