import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;

  const [contacts, deals, projects, notes] = await Promise.all([
    supabaseAdmin
      .from('contacts')
      .select('id, first_name, last_name, email, company, type')
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern}`)
      .limit(5),
    supabaseAdmin
      .from('deals')
      .select('id, title, value')
      .ilike('title', pattern)
      .limit(5),
    supabaseAdmin
      .from('projects')
      .select('id, name, type, status')
      .ilike('name', pattern)
      .limit(5),
    supabaseAdmin
      .from('notes')
      .select('id, title')
      .ilike('title', pattern)
      .limit(5),
  ]);

  const results = [
    ...(contacts.data ?? []).map((c) => ({
      type: 'contact' as const,
      id: c.id,
      title: `${c.first_name} ${c.last_name}`,
      subtitle: c.company || c.email,
      href: `/crm/${c.id}`,
    })),
    ...(deals.data ?? []).map((d) => ({
      type: 'deal' as const,
      id: d.id,
      title: d.title,
      subtitle: `${d.value}€`,
      href: '/pipeline',
    })),
    ...(projects.data ?? []).map((p) => ({
      type: 'project' as const,
      id: p.id,
      title: p.name,
      subtitle: p.type,
      href: `/projects/${p.id}`,
    })),
    ...(notes.data ?? []).map((n) => ({
      type: 'note' as const,
      id: n.id,
      title: n.title,
      subtitle: 'Note',
      href: '/notes',
    })),
  ];

  return NextResponse.json({ results });
}
