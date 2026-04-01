'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { FrictionPoint } from '@/types/database';

const severityColors: Record<string, string> = {
  low: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  medium: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  high: 'bg-[var(--color-destructive-light)] text-[var(--color-destructive)]',
};

interface Props {
  points: FrictionPoint[];
}

export function FrictionPoints({ points }: Props) {
  if (points.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
          Points de friction ({points.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {points.map((point, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-glass)]">
            <Badge className={severityColors[point.severity]}>
              {point.severity}
            </Badge>
            <p className="text-sm text-[var(--color-text-secondary)] flex-1">{point.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
