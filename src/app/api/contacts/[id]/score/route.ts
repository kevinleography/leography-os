import { supabaseAdmin } from '@/lib/supabase/admin';
import { anthropic, MODELS } from '@/lib/claude/client';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Fetch contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Fetch interactions and deals in parallel
    const [interactionsResult, dealsResult] = await Promise.all([
      supabaseAdmin
        .from('interactions')
        .select('*')
        .eq('contact_id', id)
        .order('date', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('deals')
        .select('*, stage:pipeline_stages(*)')
        .eq('contact_id', id),
    ]);

    const interactions = interactionsResult.data || [];
    const deals = dealsResult.data || [];

    const prompt = `You are a CRM scoring assistant. Analyze this contact and their activity to produce an engagement/potential score from 0 to 100.

CONTACT:
- Name: ${contact.first_name} ${contact.last_name}
- Type: ${contact.type}
- Company: ${contact.company || 'N/A'}
- Email: ${contact.email || 'N/A'}
- Phone: ${contact.phone || 'N/A'}
- Source: ${contact.source || 'N/A'}
- Notes: ${contact.notes || 'None'}

INTERACTIONS (${interactions.length} total, most recent first):
${interactions.map((i: any) => `- [${i.date}] ${i.type}: ${i.subject || ''} ${i.content ? '- ' + i.content.substring(0, 200) : ''}`).join('\n') || 'No interactions'}

DEALS (${deals.length} total):
${deals.map((d: any) => `- ${d.title}: €${d.value} (probability: ${d.probability}%, stage: ${d.stage?.name || 'unknown'})`).join('\n') || 'No deals'}

Score this contact from 0 to 100 based on:
- Engagement level (frequency and recency of interactions)
- Deal pipeline value and probability
- Completeness of contact information
- Overall business potential

Respond with ONLY a JSON object: { "score": <number>, "reason": "<brief explanation>" }`;

    const message = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse score from response
    let score = 50;
    let reason = '';
    try {
      const parsed = JSON.parse(responseText);
      score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      reason = parsed.reason || '';
    } catch {
      // Fallback: try to extract number from text
      const match = responseText.match(/\d+/);
      if (match) {
        score = Math.max(0, Math.min(100, parseInt(match[0], 10)));
      }
    }

    // Update contact score
    const { error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({ score })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ score, reason });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
