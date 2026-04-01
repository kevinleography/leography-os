'use client';

import { motion } from 'motion/react';
import type { DashboardStats } from '@/types/database';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { PipelineWidget } from '@/components/dashboard/pipeline-widget';
import { RevenueWidget } from '@/components/dashboard/revenue-widget';
import { MyTasksWidget } from '@/components/dashboard/my-tasks-widget';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { AuditShortcut } from '@/components/dashboard/audit-shortcut';
import { AlertsWidget } from '@/components/dashboard/alerts-widget';

export interface PipelineStageData {
  id: string;
  name: string;
  color: string;
  count: number;
  value: number;
}

export interface RevenueMonth {
  month: string;
  mrr: number;
  oneshot: number;
}

export interface SslAlert {
  url: string;
  ssl_valid_until: string;
}

interface DashboardContentProps {
  stats: DashboardStats;
  revenueHistory: RevenueMonth[];
  pipelineStages: PipelineStageData[];
  sslAlerts: SslAlert[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export function DashboardContent({
  stats,
  revenueHistory,
  pipelineStages,
  sslAlerts,
}: DashboardContentProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Row 1: Stat cards */}
      <motion.div variants={itemVariants}>
        <StatsGrid stats={stats} />
      </motion.div>

      {/* Row 2: Pipeline + Revenue + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <PipelineWidget
            stages={pipelineStages}
            totalValue={stats.deals_total_value}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <RevenueWidget data={revenueHistory} />
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <MyTasksWidget tasks={stats.tasks_today} />
        </motion.div>
      </div>

      {/* Row 3: Activity + Audit + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <ActivityFeed activities={stats.recent_activity} />
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <AuditShortcut />
        </motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <AlertsWidget
            sitesDown={stats.sites_down}
            adsAlerts={stats.ads_alerts}
            sslAlerts={sslAlerts}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
