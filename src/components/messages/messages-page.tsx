'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  MessageSquare,
  User,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeDate } from '@/lib/utils';

interface ConversationWithPreview {
  id: string;
  contact_id: string | null;
  project_id: string | null;
  subject: string | null;
  last_message_at: string;
  contacts: {
    first_name: string;
    last_name: string;
    company: string | null;
    email: string | null;
  } | null;
  last_message: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string | null;
  } | null;
  unread_count: number;
}

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  attachments: any[];
  users?: { full_name: string; avatar_url: string | null } | null;
}

interface MessagesPageProps {
  conversations: ConversationWithPreview[];
}

function contactDisplayName(contacts: ConversationWithPreview['contacts']): string {
  if (!contacts) return 'Inconnu';
  const name = `${contacts.first_name ?? ''} ${contacts.last_name ?? ''}`.trim();
  return name || contacts.email || 'Inconnu';
}

export function MessagesPage({ conversations: initialConversations }: MessagesPageProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? conversations.filter((c) => {
        const name = contactDisplayName(c.contacts).toLowerCase();
        const subject = (c.subject ?? '').toLowerCase();
        const s = search.toLowerCase();
        return name.includes(s) || subject.includes(s);
      })
    : conversations;

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages/${selectedId}`);
        const json = await res.json();
        setMessages(json.data ?? []);
        // Update unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, unread_count: 0 } : c))
        );
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
        // Update last message in conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  last_message: {
                    content: msg.content,
                    created_at: msg.created_at,
                    is_read: false,
                    sender_id: msg.sender_id,
                  },
                  last_message_at: msg.created_at,
                }
              : c
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Left sidebar - Conversations list */}
      <Card className="w-80 shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-glass-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">
              Aucune conversation
            </div>
          ) : (
            filtered.map((conv) => {
              const name = contactDisplayName(conv.contacts);
              const preview = conv.last_message?.content ?? conv.subject ?? '';
              const isActive = conv.id === selectedId;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-glass-border transition-colors',
                    isActive
                      ? 'bg-primary-light'
                      : 'hover:bg-glass-hover'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-text-primary truncate">
                          {name}
                        </span>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conv.subject && (
                        <p className="text-xs text-text-secondary truncate mt-0.5">
                          {conv.subject}
                        </p>
                      )}
                      <p className="text-xs text-text-muted truncate mt-0.5">
                        {preview.slice(0, 60)}
                        {preview.length > 60 ? '...' : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-text-muted whitespace-nowrap mt-0.5">
                      {formatRelativeDate(conv.last_message_at)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Right panel - Messages thread */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p>Selectionnez une conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-glass-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-text-primary">
                  {selectedConversation
                    ? contactDisplayName(selectedConversation.contacts)
                    : ''}
                </p>
                {selectedConversation?.subject && (
                  <p className="text-xs text-text-muted">
                    {selectedConversation.subject}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">
                  Aucun message dans cette conversation
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id !== null;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        isOwn ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2.5',
                          isOwn
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-glass border border-glass-border text-text-primary rounded-bl-md'
                        )}
                      >
                        {msg.users?.full_name && !isOwn && (
                          <p className="text-xs font-medium text-text-secondary mb-1">
                            {msg.users.full_name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={cn(
                            'text-[10px] mt-1',
                            isOwn ? 'text-white/60' : 'text-text-muted'
                          )}
                        >
                          {formatRelativeDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-glass-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Ecrire un message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  loading={sending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
