import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('quotes')
      .select('*, contacts(first_name, last_name, company, email)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
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

    // Auto-generate reference: DEV-YYYYMM-XXX
    const now = new Date();
    const prefix = `DEV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { count } = await supabaseAdmin
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .like('reference', `${prefix}%`);
    const ref = `${prefix}-${String((count ?? 0) + 1).padStart(3, '0')}`;

    const { data, error } = await supabaseAdmin
      .from('quotes')
      .insert({
        contact_id: body.contact_id,
        deal_id: body.deal_id || null,
        reference: body.reference || ref,
        amount_ht: body.amount_ht,
        amount_ttc: body.amount_ttc,
        status: body.status || 'draft',
        valid_until: body.valid_until || null,
      })
      .select('*, contacts(first_name, last_name, company)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Also store as document
    await supabaseAdmin.from('documents').insert({
      contact_id: body.contact_id,
      type: 'contract',
      name: `Devis ${ref}`,
      storage_path: `quotes/${data.id}.json`,
      file_size: 0,
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
