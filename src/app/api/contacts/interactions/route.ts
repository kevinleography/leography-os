import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload = {
      contact_id: body.contact_id,
      type: body.type,
      subject: body.subject,
      content: body.content,
      date: body.date || new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('interactions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
