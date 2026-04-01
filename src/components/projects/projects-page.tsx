'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Users } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProjectForm } from './project-form';
import type { Project, ProjectStatus, Contact } from '@/types/database';

type ProjectWithContact = Project & {
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name' | 'company'>;
};

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Terminés', value: 'completed' },
  { label: 'Brouillons', value: 'draft' },
];

const STATUS_BADGE: Record<ProjectStatus, { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  active: { label: 'Actif', variant: 'default' },
  paused: { label: 'En pause', variant: 'warning' },
  completed: { label: 'Terminé', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  website: 'Site Web',
  seo: 'SEO',
  ads: 'Publicité',
  system: 'Système',
};

interface ProjectsPageProps {
  initialProjects: ProjectWithContact[];
}

export function ProjectsPage({ initialProjects }: ProjectsPageProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);

  const filtered = filter === 'all'
    ? projects
    : projects.filter((p) => p.status === filter);

  function handleProjectCreated(project: ProjectWithContact) {
    setProjects((prev) => [project, ...prev]);
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projets</h1>
          <p className="text-text-secondary mt-1">
            {projects.length} projet{projects.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              filter === f.value
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-text-muted hover:text-text-primary hover:bg-glass'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project) => {
          const statusInfo = STATUS_BADGE[project.status];
          const clientName = project.contact
            ? project.contact.company || `${project.contact.first_name} ${project.contact.last_name}`
            : 'Non assigné';

          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary/40 transition-all duration-200 cursor-pointer group h-full">
                <CardContent className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-text-secondary text-sm">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{clientName}</span>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  {/* Type badge */}
                  <Badge variant="outline" className="text-xs">
                    {TYPE_LABELS[project.type] ?? project.type}
                  </Badge>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Progression</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                    {project.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(project.deadline)}</span>
                      </div>
                    )}
                    {project.budget > 0 && (
                      <span className="ml-auto">{formatCurrency(project.budget)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          Aucun projet trouvé pour ce filtre.
        </div>
      )}

      {/* Form dialog */}
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
