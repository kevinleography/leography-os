'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showScoreButton?: boolean;
  contactId?: string;
  onScoreUpdated?: (score: number) => void;
}

function getScoreColor(score: number) {
  if (score <= 30) return { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', ring: 'ring-red-500/20' };
  if (score <= 60) return { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', ring: 'ring-amber-500/20' };
  return { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', ring: 'ring-emerald-500/20' };
}

function getScoreLabel(score: number) {
  if (score <= 30) return 'Froid';
  if (score <= 60) return 'Tiède';
  return 'Chaud';
}

export function ScoreBadge({ score, size = 'sm', showScoreButton = false, contactId, onScoreUpdated }: ScoreBadgeProps) {
  const [isScoring, setIsScoring] = useState(false);
  const colors = getScoreColor(score);

  async function handleScore() {
    if (!contactId) return;
    setIsScoring(true);
    try {
      const res = await fetch('/api/contacts/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (res.ok) {
        const data = await res.json();
        onScoreUpdated?.(data.score);
      }
    } finally {
      setIsScoring(false);
    }
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            'relative flex items-center justify-center w-24 h-24 rounded-full border-2',
            colors.bg, colors.border
          )}
        >
          <span className={cn('text-3xl font-bold', colors.text)}>{score}</span>
        </div>
        <span className={cn('text-sm font-medium', colors.text)}>{getScoreLabel(score)}</span>
        {showScoreButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleScore}
            loading={isScoring}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Scorer avec IA
          </Button>
        )}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full border',
            colors.bg, colors.border
          )}
        >
          <span className={cn('text-lg font-bold', colors.text)}>{score}</span>
        </div>
        {showScoreButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleScore}
            loading={isScoring}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-full text-xs font-semibold border',
          colors.bg, colors.border, colors.text
        )}
      >
        {score}
      </span>
    </div>
  );
}
