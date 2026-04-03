'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Check,
  Globe,
  Shield,
  Smartphone,
  Zap,
  Search,
  AlertTriangle,
  Info,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge } from '@/components/audit/score-gauge';
import { formatDate } from '@/lib/utils';
import type { WebAudit, AuditRecommendation } from '@/types/database';

interface AuditReportProps {
  audit: WebAudit;
  readOnly?: boolean;
}

const CATEGORY_CONFIG: Record<
  AuditRecommendation['category'],
  { label: string; icon: React.ElementType; color: string }
> = {
  seo: { label: 'SEO', icon: Search, color: 'text-primary' },
  performance: { label: 'Performance', icon: Zap, color: 'text-warning' },
  mobile: { label: 'Mobile', icon: Smartphone, color: 'text-accent' },
  security: { label: 'Sécurité', icon: Shield, color: 'text-success' },
  accessibility: { label: 'Accessibilité', icon: Globe, color: 'text-text-secondary' },
};

const PRIORITY_CONFIG: Record<
  AuditRecommendation['priority'],
  { label: string; variant: 'destructive' | 'warning' | 'secondary' }
> = {
  critical: { label: 'Critique', variant: 'destructive' },
  important: { label: 'Important', variant: 'warning' },
  improvement: { label: 'Amélioration', variant: 'secondary' },
};

const PRIORITY_ORDER: AuditRecommendation['priority'][] = ['critical', 'important', 'improvement'];

export function AuditReport({ audit, readOnly = false }: AuditReportProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/audit/${audit.share_token}`
      : '';

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  // Group recommendations by category
  const grouped = (audit.ai_recommendations ?? []).reduce<
    Record<string, AuditRecommendation[]>
  >((acc, rec) => {
    if (!acc[rec.category]) acc[rec.category] = [];
    acc[rec.category].push(rec);
    return acc;
  }, {});

  // Sort within each group by priority
  Object.values(grouped).forEach((recs) =>
    recs.sort(
      (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    )
  );

  const scoreCards = [
    { key: 'seo_score' as const, label: 'SEO', icon: Search },
    { key: 'performance_score' as const, label: 'Performance', icon: Zap },
    { key: 'mobile_score' as const, label: 'Mobile', icon: Smartphone },
    { key: 'security_score' as const, label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!readOnly && (
            <Button variant="ghost" size="icon" onClick={() => router.push('/audit')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-text-primary truncate max-w-md">
              {audit.url}
            </h1>
            <p className="text-sm text-text-muted">{formatDate(audit.created_at)}</p>
          </div>
        </div>
        {!readOnly && (
          <Button variant="outline" onClick={handleShare}>
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Lien copié !' : 'Partager'}
          </Button>
        )}
      </div>

      {/* Overall score */}
      <Card>
        <CardContent className="p-8 flex flex-col items-center">
          <p className="text-sm text-text-secondary mb-4">Score global</p>
          <div className="relative">
            <ScoreGauge score={audit.overall_score} size={160} />
          </div>
        </CardContent>
      </Card>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {scoreCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-text-secondary">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <div className="relative">
                <ScoreGauge score={audit[key]} size={96} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary */}
      {audit.ai_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Synthèse IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary leading-relaxed whitespace-pre-line">
              {audit.ai_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">Recommandations</h2>

          {Object.entries(grouped).map(([category, recs]) => {
            const config = CATEGORY_CONFIG[category as AuditRecommendation['category']];
            if (!config) return null;
            const CategoryIcon = config.icon;

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CategoryIcon className={`w-5 h-5 ${config.color}`} />
                    {config.label}
                    <Badge variant="secondary" className="ml-auto">
                      {recs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recs.map((rec, i) => {
                    const priorityCfg = PRIORITY_CONFIG[rec.priority];
                    return (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-xl bg-glass/50 border border-glass-border"
                      >
                        <div className="shrink-0 mt-0.5">
                          {rec.priority === 'critical' ? (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          ) : rec.priority === 'important' ? (
                            <ChevronUp className="w-4 h-4 text-warning" />
                          ) : (
                            <Info className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-text-primary">
                              {rec.title}
                            </span>
                            <Badge variant={priorityCfg.variant} className="text-[10px]">
                              {priorityCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {rec.description}
                          </p>
                          {rec.impact && (
                            <p className="text-xs text-text-muted mt-1">
                              Impact : {rec.impact}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
