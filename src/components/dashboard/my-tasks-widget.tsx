'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/types/database';

interface MyTasksWidgetProps {
  tasks: Task[];
}

const priorityConfig: Record<TaskPriority, { label: string; variant: 'destructive' | 'warning' | 'default' | 'secondary' }> = {
  urgent: { label: 'Urgent', variant: 'destructive' },
  high: { label: 'Haute', variant: 'warning' },
  medium: { label: 'Moyenne', variant: 'default' },
  low: { label: 'Basse', variant: 'secondary' },
};

export function MyTasksWidget({ tasks: initialTasks }: MyTasksWidgetProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const toggleTask = useCallback(async (taskId: string) => {
    setCompleting((prev) => new Set([...prev, taskId]));

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'done' as const, completed_at: new Date().toISOString() } : t
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() }),
      });

      if (!response.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: 'todo' as const, completed_at: null } : t
          )
        );
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: 'todo' as const, completed_at: null } : t
        )
      );
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, []);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'done');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Mes taches</CardTitle>
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Voir tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {pendingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-success/40 mb-2" />
            <p className="text-sm text-text-muted">Aucune tache aujourd&apos;hui</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {pendingTasks.slice(0, 5).map((task) => {
              const isDone = task.status === 'done';
              const isLoading = completing.has(task.id);
              const config = priorityConfig[task.priority];

              return (
                <li
                  key={task.id}
                  className={cn(
                    'flex items-start gap-3 p-2.5 rounded-xl transition-all hover:bg-bg-tertiary/50',
                    isDone && 'opacity-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    disabled={isLoading || isDone}
                    className="mt-0.5 shrink-0 transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-text-muted hover:text-primary" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm text-text-primary truncate',
                        isDone && 'line-through text-text-muted'
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                        {config.label}
                      </Badge>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-[10px] text-text-muted">
                          <Clock className="w-3 h-3" />
                          {formatTime(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
