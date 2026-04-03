import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;

  const { data } = await supabaseAdmin
    .from('allowed_users')
    .select('role')
    .eq('email', session.user.email.toLowerCase())
    .single();

  if (!data || data.role !== 'admin') return null;
  return session.user.email;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('allowed_users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || '').trim();
  const role = body.role === 'admin' ? 'admin' : 'collaborator';

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('allowed_users')
    .insert({ email, name, role })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet email est déjà autorisé' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
