import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('project_id');
    const contactId = searchParams.get('contact_id');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('documents')
      .select(
        '*, contacts(first_name, last_name, company), projects(name)',
        { count: 'exact' }
      );

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        project_id: body.project_id || null,
        contact_id: body.contact_id || null,
        type: body.type || 'asset',
        name: body.name,
        storage_path: body.storage_path || '',
        uploaded_by: body.uploaded_by || null,
        file_size: body.file_size || 0,
      })
      .select('*, contacts(first_name, last_name, company), projects(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
