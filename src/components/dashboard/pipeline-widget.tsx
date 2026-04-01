'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { PipelineStageData } from '@/components/dashboard/dashboard-content';

interface PipelineWidgetProps {
  stages: PipelineStageData[];
  totalValue: number;
}

export function PipelineWidget({ stages, totalValue }: PipelineWidgetProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Pipeline commerciale</CardTitle>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatCurrency(totalValue)}
          </p>
          <p className="text-xs text-text-muted">Valeur totale du pipeline</p>
        </div>
        <Link
          href="/pipeline"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Voir tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage) => {
            const widthPercent = Math.max((stage.count / maxCount) * 100, 4);
            return (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs">
                      {stage.count} deal{stage.count > 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-text-primary text-xs">
                      {formatCurrency(stage.value)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500')}
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stage.color || 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {stages.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              Aucun deal dans le pipeline
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
