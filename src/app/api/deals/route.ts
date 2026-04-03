import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import type { CreateDealPayload } from '@/types/database';

async function notifyN8n(webhookEnvKey: string, payload: Record<string, any>) {
  const url = process.env[webhookEnvKey];
  if (!url) {
    console.error(`[n8n] Variable d'environnement ${webhookEnvKey} non configurée — webhook ignoré`);
    return;
  }
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) { console.error(`[n8n] Échec webhook ${webhookEnvKey}:`, err); }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const contactId = searchParams.get('contact_id');

    let query = supabaseAdmin
      .from('deals')
      .select('*, stage:pipeline_stages(*), contact:contacts(id, first_name, last_name, company, email)');

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateDealPayload = await request.json();

    const { data, error } = await supabaseAdmin
      .from('deals')
      .insert(body)
      .select('*, stage:pipeline_stages(*), contact:contacts(id, first_name, last_name, company, email)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    notifyN8n('N8N_WEBHOOK_NEW_DEAL', { event: 'deal.created', deal: data, timestamp: new Date().toISOString() });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
