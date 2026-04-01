import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('conversations')
      .select('*, contacts(first_name, last_name, company, email)')
      .order('last_message_at', { ascending: false });

    const { data: conversations, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch last message for each conversation
    const enriched = await Promise.all(
      (conversations ?? []).map(async (conv: any) => {
        const { data: messages } = await supabaseAdmin
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0] ?? null;

        // Count unread
        const { count } = await supabaseAdmin
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false);

        return {
          ...conv,
          last_message: lastMessage,
          unread_count: count ?? 0,
        };
      })
    );

    // Filter by search if provided
    let result = enriched;
    if (search) {
      const s = search.toLowerCase();
      result = enriched.filter((c: any) => {
        const contact = c.contacts;
        const name = `${contact?.first_name ?? ''} ${contact?.last_name ?? ''}`.toLowerCase();
        const company = (contact?.company ?? '').toLowerCase();
        const subject = (c.subject ?? '').toLowerCase();
        return name.includes(s) || company.includes(s) || subject.includes(s);
      });
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        contact_id: body.contact_id,
        subject: body.subject || null,
        project_id: body.project_id || null,
        last_message_at: new Date().toISOString(),
      })
      .select('*, contacts(first_name, last_name, company)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
