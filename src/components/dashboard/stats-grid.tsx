'use client';

import {
  TrendingUp,
  TrendingDown,
  Euro,
  Users,
  FolderKanban,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types/database';

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const caChange =
    stats.ca_previous_month > 0
      ? Math.round(
          ((stats.ca_month - stats.ca_previous_month) / stats.ca_previous_month) * 100
        )
      : stats.ca_month > 0
        ? 100
        : 0;

  const cards = [
    {
      label: 'CA du mois',
      value: formatCurrency(stats.ca_month),
      icon: Euro,
      iconColor: 'text-success',
      iconBg: 'bg-success/10',
      change: caChange,
      changeLabel: 'vs mois dernier',
    },
    {
      label: 'Prospects actifs',
      value: stats.prospects_active.toString(),
      icon: Users,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      badge:
        stats.prospects_new_week > 0
          ? `+${stats.prospects_new_week} cette semaine`
          : null,
      badgeVariant: 'success' as const,
    },
    {
      label: 'Projets en cours',
      value: stats.projects_active.toString(),
      icon: FolderKanban,
      iconColor: 'text-accent',
      iconBg: 'bg-accent/10',
      badge:
        stats.projects_urgent > 0
          ? `${stats.projects_urgent} urgent${stats.projects_urgent > 1 ? 's' : ''}`
          : null,
      badgeVariant: 'warning' as const,
    },
    {
      label: 'ROAS global',
      value: `${stats.roas_global.toFixed(1)}x`,
      icon: Target,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10',
      change: stats.roas_global >= 3 ? 1 : stats.roas_global >= 1 ? 0 : -1,
      changeLabel: stats.roas_global >= 3 ? 'Excellent' : stats.roas_global >= 1 ? 'Rentable' : 'Sous objectif',
      hidePercent: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl',
                  card.iconBg
                )}
              >
                <card.icon className={cn('w-5 h-5', card.iconColor)} />
              </div>
              {card.badge && (
                <Badge variant={card.badgeVariant}>{card.badge}</Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-text-primary tracking-tight">
                {card.value}
              </p>
              <p className="text-sm text-text-secondary">{card.label}</p>
            </div>
            {card.change !== undefined && (
              <div className="flex items-center gap-1.5 mt-2">
                {card.change > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                ) : card.change < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                ) : null}
                <span
                  className={cn(
                    'text-xs font-medium',
                    card.change > 0
                      ? 'text-success'
                      : card.change < 0
                        ? 'text-destructive'
                        : 'text-text-muted'
                  )}
                >
                  {!card.hidePercent && `${card.change > 0 ? '+' : ''}${card.change}%`}
                  {card.changeLabel && (
                    <span className="text-text-muted ml-1">{card.changeLabel}</span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
