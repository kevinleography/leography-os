import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Fetch contact with related data
    const [contactRes, interactionsRes, dealsRes, documentsRes] = await Promise.all([
      supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('interactions')
        .select('*')
        .eq('contact_id', id)
        .order('date', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('deals')
        .select('*, stage:pipeline_stages(name, color)')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('documents')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (contactRes.error) {
      return NextResponse.json({ error: contactRes.error.message }, { status: 404 });
    }

    return NextResponse.json({
      ...contactRes.data,
      interactions: interactionsRes.data || [],
      deals: dealsRes.data || [],
      documents: documentsRes.data || [],
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
      .from('contacts')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fire-and-forget: notify n8n
    notifyN8n('N8N_WEBHOOK_CONTACT_UPDATED', {
      event: 'contact.updated',
      contact: data,
      changes: Object.keys(body),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from('contacts')
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
