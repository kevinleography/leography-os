'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Search, Loader2, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreGauge } from '@/components/audit/score-gauge';
import { formatDate } from '@/lib/utils';
import type { WebAudit, AuditStatus } from '@/types/database';

interface AuditPageProps {
  initialAudits: WebAudit[];
}

const STATUS_CONFIG: Record<AuditStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending: { label: 'En attente', variant: 'secondary' },
  processing: { label: 'En cours', variant: 'warning' },
  completed: { label: 'Terminé', variant: 'success' },
  error: { label: 'Erreur', variant: 'destructive' },
};

export function AuditPage({ initialAudits }: AuditPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contact');

  const [url, setUrl] = useState('');
  const [audits, setAudits] = useState<WebAudit[]>(initialAudits);
  const [loading, setLoading] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);

  // Poll for audit completion
  useEffect(() => {
    if (!pollingId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/audits/${pollingId}`);
        if (!res.ok) return;
        const audit: WebAudit = await res.json();

        setAudits((prev) =>
          prev.map((a) => (a.id === audit.id ? audit : a))
        );

        if (audit.status === 'completed' || audit.status === 'error') {
          setPollingId(null);
        }
      } catch {
        // silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pollingId]);

  const handleLaunch = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    try {
      const payload: { url: string; contact_id?: string } = { url: url.trim() };
      if (contactId) payload.contact_id = contactId;

      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur lors du lancement');

      const audit: WebAudit = await res.json();
      setAudits((prev) => [audit, ...prev]);
      setPollingId(audit.id);
      setUrl('');
    } catch {
      // Could add toast here
    } finally {
      setLoading(false);
    }
  }, [url, contactId]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Audit IA</h1>
        <p className="text-text-secondary mt-1">
          Analysez n&apos;importe quel site web avec notre intelligence artificielle
        </p>
      </div>

      {/* Launch form */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemple.com"
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
              />
            </div>
            <Button onClick={handleLaunch} loading={loading} disabled={!url.trim()}>
              <Search className="w-4 h-4" />
              Lancer l&apos;audit
            </Button>
          </div>
          {contactId && (
            <p className="text-xs text-text-muted mt-2">
              Audit lié au contact : {contactId}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Polling indicator */}
      {pollingId && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Analyse en cours... Les résultats apparaîtront automatiquement.
        </div>
      )}

      {/* Audit list */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Audits récents
        </h2>

        {audits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">
                Aucun audit pour le moment. Lancez votre premier audit ci-dessus.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {audits.map((audit) => (
              <AuditCard
                key={audit.id}
                audit={audit}
                onClick={() => {
                  if (audit.status === 'completed') {
                    router.push(`/audit/${audit.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditCard({ audit, onClick }: { audit: WebAudit; onClick: () => void }) {
  const status = STATUS_CONFIG[audit.status];
  const isClickable = audit.status === 'completed';

  return (
    <Card
      className={isClickable ? 'cursor-pointer hover:border-glass-border-hover transition-all' : ''}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-5 flex items-center gap-5">
        {/* Score gauge or skeleton */}
        <div className="relative shrink-0">
          {audit.status === 'completed' ? (
            <ScoreGauge score={audit.overall_score} size={64} />
          ) : audit.status === 'processing' || audit.status === 'pending' ? (
            <Skeleton className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full border border-destructive/30 flex items-center justify-center">
              <span className="text-xs text-destructive">Err</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary truncate">
              {audit.url}
            </span>
            <ExternalLink className="w-3 h-3 text-text-muted shrink-0" />
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(audit.created_at)}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <Badge variant={status.variant}>{status.label}</Badge>

        {/* Sub-scores (only if completed) */}
        {audit.status === 'completed' && (
          <div className="hidden md:flex items-center gap-4 text-xs text-text-secondary">
            <div className="text-center">
              <div className="font-semibold text-text-primary">{audit.seo_score}</div>
              <div>SEO</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-text-primary">{audit.performance_score}</div>
              <div>Perf</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-text-primary">{audit.mobile_score}</div>
              <div>Mobile</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-text-primary">{audit.security_score}</div>
              <div>Sécu</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
