'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, ArrowRight } from 'lucide-react';

export function AuditShortcut() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  function handleLaunch() {
    if (url.trim()) {
      router.push(`/audit?url=${encodeURIComponent(url.trim())}`);
    } else {
      router.push('/audit');
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[var(--color-primary)]" />
          Audit IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Analysez un site web en quelques secondes avec l'IA.
        </p>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemple.com"
          onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
        />
        <Button onClick={handleLaunch} className="w-full gap-2">
          Lancer l'audit <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
