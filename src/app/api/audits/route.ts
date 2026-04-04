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

async function runAudit(auditId: string, url: string) {
  try {
    // Normalize URL
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    // Call Google PageSpeed Insights API (free, no key required for basic usage)
    const categories = ['performance', 'seo', 'accessibility', 'best-practices'];
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&${categories.map(c => `category=${c}`).join('&')}`;

    const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(60000) });

    if (!psiRes.ok) {
      await supabaseAdmin.from('web_audits').update({
        status: 'error',
        ai_summary: `Erreur PageSpeed: ${psiRes.status} - Vérifiez que l'URL ${targetUrl} est accessible.`,
      }).eq('id', auditId);
      return;
    }

    const psi = await psiRes.json();
    const lighthouse = psi.lighthouseResult;

    if (!lighthouse) {
      await supabaseAdmin.from('web_audits').update({
        status: 'error',
        ai_summary: 'Impossible d\'analyser ce site. Vérifiez l\'URL.',
      }).eq('id', auditId);
      return;
    }

    const perfScore = Math.round((lighthouse.categories?.performance?.score || 0) * 100);
    const seoScore = Math.round((lighthouse.categories?.seo?.score || 0) * 100);
    const a11yScore = Math.round((lighthouse.categories?.accessibility?.score || 0) * 100);
    const bpScore = Math.round((lighthouse.categories?.['best-practices']?.score || 0) * 100);
    const overallScore = Math.round((perfScore + seoScore + a11yScore + bpScore) / 4);

    // Extract key audit findings
    const audits = lighthouse.audits || {};
    const failedAudits: string[] = [];
    const passedAudits: string[] = [];

    for (const [, audit] of Object.entries(audits) as [string, any][]) {
      if (audit.score === 0 && audit.title) failedAudits.push(audit.title);
      else if (audit.score === 1 && audit.title) passedAudits.push(audit.title);
    }

    // Build recommendations from failed audits
    const recommendations = failedAudits.slice(0, 10).map((title, i) => ({
      id: i + 1,
      category: 'general',
      priority: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
      title,
      description: `Ce critère n'est pas satisfait pour ${targetUrl}.`,
    }));

    // Build summary
    const summary = `**Analyse de ${targetUrl}**\n\n` +
      `- Performance : ${perfScore}/100\n` +
      `- SEO : ${seoScore}/100\n` +
      `- Accessibilité : ${a11yScore}/100\n` +
      `- Bonnes pratiques : ${bpScore}/100\n` +
      `- **Score global : ${overallScore}/100**\n\n` +
      `${failedAudits.length} points à améliorer identifiés, ${passedAudits.length} critères validés.`;

    // Update audit in Supabase
    await supabaseAdmin.from('web_audits').update({
      status: 'completed',
      overall_score: overallScore,
      performance_score: perfScore,
      seo_score: seoScore,
      mobile_score: a11yScore,
      security_score: bpScore,
      ai_summary: summary,
      ai_recommendations: recommendations,
      audit_data: {
        performance: perfScore,
        seo: seoScore,
        accessibility: a11yScore,
        bestPractices: bpScore,
        failedAudits: failedAudits.slice(0, 20),
        passedCount: passedAudits.length,
        failedCount: failedAudits.length,
        fetchTime: lighthouse.fetchTime,
        finalUrl: lighthouse.finalUrl,
      },
    }).eq('id', auditId);

    // Fire n8n webhook if configured (non-blocking)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(`${webhookUrl}/webhook/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit_id: auditId, url: targetUrl, overall_score: overallScore }),
      }).catch(() => {});
    }
  } catch (err) {
    await supabaseAdmin.from('web_audits').update({
      status: 'error',
      ai_summary: 'Erreur lors de l\'analyse. Le site est peut-être inaccessible ou le délai a expiré.',
    }).eq('id', auditId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LaunchAuditPayload = await request.json();

    if (!body.url) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 });
    }

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

    // Run audit in background (fire-and-forget)
    runAudit(audit.id, body.url);

    return NextResponse.json(audit, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
