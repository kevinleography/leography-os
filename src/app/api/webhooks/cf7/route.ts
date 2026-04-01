import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications/client';
import type { WebhookCF7Payload } from '@/types/database';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_CF7_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: WebhookCF7Payload = await request.json();

  // Check if contact already exists by email
  let contactId: string | null = null;
  if (body.email) {
    const { data: existing } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      contactId = existing.id;
    }
  }

  // Create new contact if not found
  if (!contactId) {
    const nameParts = body.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { data: newContact } = await supabaseAdmin
      .from('contacts')
      .insert({
        type: 'lead',
        first_name: firstName,
        last_name: lastName,
        email: body.email,
        phone: body.phone,
        company: body.company,
        source: body.source_page || 'contact-form-7',
        notes: body.message,
      })
      .select()
      .single();

    contactId = newContact?.id ?? null;
  }

  // Log interaction
  if (contactId) {
    await supabaseAdmin.from('interactions').insert({
      contact_id: contactId,
      type: 'webhook',
      subject: 'Formulaire de contact',
      content: body.message || `Nouveau lead via CF7: ${body.name}`,
      date: new Date().toISOString(),
    });
  }

  // Notify admin
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (admins?.[0]) {
    await createNotification({
      userId: admins[0].id,
      title: 'Nouveau lead CF7',
      message: `${body.name} (${body.email}) via formulaire de contact`,
      type: 'info',
      source: 'n8n',
      entityType: 'contact',
      entityId: contactId ?? undefined,
    });
  }

  return NextResponse.json({ success: true, contact_id: contactId });
}
