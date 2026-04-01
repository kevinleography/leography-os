'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function PortalMessagesPage() {
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <Card>
        <CardContent className="py-6">
          <div className="h-[400px] flex items-center justify-center text-[var(--color-text-muted)]">
            <p>Aucun message pour le moment.</p>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-glass-border)]">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1"
            />
            <Button disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
