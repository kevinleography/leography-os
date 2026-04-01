import { supabaseAdmin } from '@/lib/supabase/admin';
import type { NotificationType, NotificationSource } from '@/types/database';

const NTFY_URL = process.env.NTFY_URL || '';

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  source = 'system',
  entityType,
  entityId,
}: {
  userId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  source?: NotificationSource;
  entityType?: string;
  entityId?: string;
}) {
  const { data } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    source,
    entity_type: entityType,
    entity_id: entityId,
  }).select().single();

  // Push to ntfy if configured
  if (NTFY_URL) {
    try {
      await fetch(NTFY_URL, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': type === 'error' ? '5' : type === 'warning' ? '4' : '3',
          'Tags': type === 'error' ? 'x' : type === 'warning' ? 'warning' : type === 'success' ? 'white_check_mark' : 'information_source',
        },
        body: message || title,
      });
    } catch {
      // ntfy push is best-effort
    }
  }

  return data;
}
