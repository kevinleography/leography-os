import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import type { CreateContactPayload } from '@/types/database';

async function notifyN8n(webhookEnvKey: string, payload: Record<string, any>) {
  const url = process.env[webhookEnvKey];
  if (!url) {
    console.error(`[n8n] Variable d'environnement ${webhookEnvKey} non configurée — webhook ignoré`);
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[n8n] Échec appel webhook ${webhookEnvKey}:`, err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const sortField = searchParams.get('sort') || 'created_at';
    const sortDirection = searchParams.get('direction') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    if (type) {
      query = query.eq('type', type);
    }

    query = query
      .order(sortField, { ascending: sortDirection === 'asc' })
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
    const body: CreateContactPayload = await request.json();

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fire-and-forget: notify n8n (WF-01 capture prospect)
    notifyN8n('N8N_WEBHOOK_NEW_CONTACT', {
      event: 'contact.created',
      contact: data,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
