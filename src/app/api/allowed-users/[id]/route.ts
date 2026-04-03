import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const updates: Record<string, string> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.role === 'admin' || body.role === 'collaborator') updates.role = body.role;

  const { data, error } = await supabaseAdmin
    .from('allowed_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminEmail = await requireAdmin(request);
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await context.params;

  // Prevent deleting yourself
  const { data: target } = await supabaseAdmin
    .from('allowed_users')
    .select('email')
    .eq('id', id)
    .single();

  if (target?.email?.toLowerCase() === adminEmail.toLowerCase()) {
    return NextResponse.json({ error: 'Impossible de supprimer votre propre accès' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('allowed_users')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
