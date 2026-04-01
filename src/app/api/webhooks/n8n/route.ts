import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/client';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, data } = body;

  switch (action) {
    case 'audit_complete': {
      // n8n finished processing an audit
      const { audit_id, scores, ai_summary, ai_recommendations, report_html } = data;
      await supabaseAdmin
        .from('web_audits')
        .update({
          status: 'completed',
          overall_score: scores.overall,
          seo_score: scores.seo,
          performance_score: scores.performance,
          mobile_score: scores.mobile,
          security_score: scores.security,
          ai_summary,
          ai_recommendations,
          report_html,
        })
        .eq('id', audit_id);
      break;
    }

    case 'site_down': {
      // Site monitoring alert
      const { monitor_id, url, status_code } = data;
      await supabaseAdmin
        .from('site_monitors')
        .update({ last_status: status_code, last_checked_at: new Date().toISOString() })
        .eq('id', monitor_id);

      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (admins?.[0]) {
        await createNotification({
          userId: admins[0].id,
          title: 'Site DOWN',
          message: `${url} renvoie ${status_code}`,
          type: 'error',
          source: 'n8n',
        });
      }
      break;
    }

    case 'ad_spend_update': {
      // Daily ad spend sync
      const { ad_budget_id, snapshot } = data;
      await supabaseAdmin.from('ad_spend_snapshots').insert({
        ad_budget_id,
        ...snapshot,
      });
      break;
    }

    case 'notification': {
      // Generic notification from n8n
      const { user_id, title, message, type } = data;
      await createNotification({
        userId: user_id,
        title,
        message,
        type: type || 'info',
        source: 'n8n',
      });
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
