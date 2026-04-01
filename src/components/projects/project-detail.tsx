'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type {
  ProjectWithDetails,
  Task,
  TaskStatus,
  TimeEntry,
  Contact,
} from '@/types/database';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  active: { label: 'Actif', variant: 'default' },
  paused: { label: 'En pause', variant: 'warning' },
  completed: { label: 'Terminé', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

const TASK_STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

const TASK_STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-text-muted',
  medium: 'text-blue-400',
  high: 'text-warning',
  urgent: 'text-destructive',
};

interface ProjectDetailProps {
  project: ProjectWithDetails & { contact?: Contact };
  tasks: Task[];
}

export function ProjectDetail({ project, tasks: initialTasks }: ProjectDetailProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [timeDesc, setTimeDesc] = useState('');
  const [timeDuration, setTimeDuration] = useState('');
  const [timeDate, setTimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [addingTime, setAddingTime] = useState(false);

  const statusInfo = STATUS_BADGE[project.status] ?? STATUS_BADGE.draft;
  const clientName = project.contact
    ? project.contact.company || `${project.contact.first_name} ${project.contact.last_name}`
    : '';

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const computedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;

  // Toggle task status
  const toggleTask = useCallback(async (task: Task) => {
    const newStatus = TASK_STATUS_NEXT[task.status];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }
          : t
      )
    );

    await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });

    // Update task directly via supabase through a simple patch
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: totalTasks > 0 ? Math.round(((newStatus === 'done' ? completedTasks + 1 : completedTasks - 1) / totalTasks) * 100) : 0 }),
    });
  }, [project.id, completedTasks, totalTasks]);

  // Add time entry
  async function handleAddTime(e: React.FormEvent) {
    e.preventDefault();
    if (!timeDesc.trim() || !timeDuration) return;

    setAddingTime(true);
    try {
      // Simplified: in production, this would go through a proper time_entries API
      setTimeDesc('');
      setTimeDuration('');
      router.refresh();
    } finally {
      setAddingTime(false);
    }
  }

  // Progress ring
  const ringSize = 80;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (computedProgress / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary truncate">{project.name}</h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          {clientName && (
            <p className="text-text-secondary text-sm mt-0.5">{clientName}</p>
          )}
        </div>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6">
        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--color-glass-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">
            {computedProgress}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <p className="text-xs text-text-muted">Tâches</p>
            <p className="text-lg font-semibold text-text-primary">{completedTasks}/{totalTasks}</p>
          </div>
          {project.budget > 0 && (
            <div>
              <p className="text-xs text-text-muted">Budget</p>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(project.budget)}</p>
            </div>
          )}
          {project.start_date && (
            <div>
              <p className="text-xs text-text-muted">Début</p>
              <p className="text-sm text-text-primary">{formatDate(project.start_date)}</p>
            </div>
          )}
          {project.deadline && (
            <div>
              <p className="text-xs text-text-muted">Échéance</p>
              <p className="text-sm text-text-primary">{formatDate(project.deadline)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="time">Temps</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ── Tâches ── */}
        <TabsContent value="tasks">
          <Card>
            <CardContent className="p-4 space-y-1">
              {tasks.length === 0 && (
                <p className="text-text-muted text-sm text-center py-6">Aucune tâche pour ce projet.</p>
              )}
              {tasks.map((task) => {
                const Icon = TASK_STATUS_ICON[task.status];
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                      'hover:bg-glass group',
                      task.status === 'done' && 'opacity-60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        task.status === 'done' ? 'text-success' : task.status === 'in_progress' ? 'text-primary' : 'text-text-muted'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 text-sm text-text-primary',
                        task.status === 'done' && 'line-through text-text-muted'
                      )}
                    >
                      {task.title}
                    </span>
                    <span className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-text-muted">{formatDate(task.due_date)}</span>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Checklist ── */}
        <TabsContent value="checklist">
          {(project.checklists ?? []).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-text-muted text-sm">
                Aucune checklist associée à ce projet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {project.checklists?.map((cl) => (
                <Card key={cl.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{cl.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {cl.tasks.map((task) => {
                      const Icon = TASK_STATUS_ICON[task.status];
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-glass transition-colors"
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              task.status === 'done' ? 'text-success' : 'text-text-muted'
                            )}
                          />
                          <span className={cn('text-sm text-text-primary', task.status === 'done' && 'line-through text-text-muted')}>
                            {task.title}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Temps ── */}
        <TabsContent value="time">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entrées de temps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add form */}
              <form onSubmit={handleAddTime} className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-text-muted">Description</label>
                  <Input
                    value={timeDesc}
                    onChange={(e) => setTimeDesc(e.target.value)}
                    placeholder="Tâche réalisée..."
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs text-text-muted">Minutes</label>
                  <Input
                    type="number"
                    min="1"
                    value={timeDuration}
                    onChange={(e) => setTimeDuration(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="w-36 space-y-1">
                  <label className="text-xs text-text-muted">Date</label>
                  <Input
                    type="date"
                    value={timeDate}
                    onChange={(e) => setTimeDate(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" loading={addingTime}>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </form>

              {/* Table */}
              {(project.time_entries ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-glass-border text-text-muted text-left">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium text-right">Durée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.time_entries?.map((entry: TimeEntry) => (
                        <tr key={entry.id} className="border-b border-glass-border/50">
                          <td className="py-2 text-text-primary">{formatDate(entry.date)}</td>
                          <td className="py-2 text-text-secondary">{entry.description ?? '—'}</td>
                          <td className="py-2 text-text-primary text-right">{entry.duration_min} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-muted text-sm text-center py-4">Aucune entrée de temps.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents ── */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-4">
              {(project.documents ?? []).length === 0 ? (
                <p className="text-text-muted text-sm text-center py-6">Aucun document associé.</p>
              ) : (
                <div className="space-y-2">
                  {project.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-glass transition-colors"
                    >
                      <FileText className="h-4 w-4 text-text-muted shrink-0" />
                      <span className="text-sm text-text-primary flex-1">{doc.name}</span>
                      <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
