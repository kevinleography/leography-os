import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const contactId = searchParams.get('contact_id');
    const projectId = searchParams.get('project_id');

    let query = supabaseAdmin
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

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
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        title: body.title ?? 'Nouvelle note',
        content_json: body.content_json ?? {},
        content_text: body.content_text ?? '',
        contact_id: body.contact_id ?? null,
        project_id: body.project_id ?? null,
        user_id: body.user_id ?? '00000000-0000-0000-0000-000000000000', // placeholder until auth
        ai_extracted_actions: [],
        is_dispatched: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
