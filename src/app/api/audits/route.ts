import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import type { LaunchAuditPayload } from '@/types/database';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const contactId = searchParams.get('contact_id');

    let query = supabaseAdmin
      .from('web_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LaunchAuditPayload = await request.json();

    if (!body.url) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 });
    }

    // Create audit entry with pending status
    const shareToken = randomUUID();

    const { data: audit, error } = await supabaseAdmin
      .from('web_audits')
      .insert({
        url: body.url,
        contact_id: body.contact_id || null,
        status: 'pending',
        overall_score: 0,
        seo_score: 0,
        performance_score: 0,
        mobile_score: 0,
        security_score: 0,
        audit_data: {},
        ai_recommendations: [],
        share_token: shareToken,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger n8n webhook (fire and forget)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(`${webhookUrl}/webhook/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_id: audit.id,
          url: body.url,
        }),
      }).catch(() => {
        // Non-blocking — n8n webhook failure should not block response
      });
    }

    return NextResponse.json(audit, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
