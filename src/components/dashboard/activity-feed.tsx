'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/utils';
import { Activity } from 'lucide-react';
import type { ActivityLog } from '@/types/database';

interface Props {
  activities: ActivityLog[];
}

const actionLabels: Record<string, string> = {
  'contact.created': 'Nouveau contact',
  'deal.created': 'Nouveau deal',
  'deal.stage_changed': 'Deal déplacé',
  'project.created': 'Nouveau projet',
  'task.completed': 'Tâche terminée',
  'audit.completed': 'Audit terminé',
  'payment.received': 'Paiement reçu',
  'note.dispatched': 'Note dispatchée',
};

export function ActivityFeed({ activities }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Aucune activité récente</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {actionLabels[activity.action] || activity.action}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatRelativeDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
