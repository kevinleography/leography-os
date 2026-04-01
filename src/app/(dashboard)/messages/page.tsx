import { supabaseAdmin } from '@/lib/supabase/admin';
import { MessagesPage } from '@/components/messages/messages-page';

async function getConversations() {
  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select('*, contacts(first_name, last_name, company, email)')
    .order('last_message_at', { ascending: false });

  const enriched = await Promise.all(
    (conversations ?? []).map(async (conv: any) => {
      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('content, created_at, is_read, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false);

      return {
        ...conv,
        last_message: messages?.[0] ?? null,
        unread_count: count ?? 0,
      };
    })
  );

  return enriched;
}

export default async function Messages() {
  const conversations = await getConversations();

  return (
    <div className="page-wrapper h-[calc(100vh-11rem)]">
      <MessagesPage conversations={conversations} />
    </div>
  );
}
