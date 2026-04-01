'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Globe, Shield, TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { SiteMonitor, AdBudgetAlert } from '@/types/database';
import type { SslAlert } from './dashboard-content';

interface Props {
  sitesDown: SiteMonitor[];
  adsAlerts: AdBudgetAlert[];
  sslAlerts: SslAlert[];
}

export function AlertsWidget({ sitesDown, adsAlerts, sslAlerts }: Props) {
  const totalAlerts = sitesDown.length + adsAlerts.length + sslAlerts.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
          Alertes
          {totalAlerts > 0 && (
            <Badge variant="destructive">{totalAlerts}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Aucune alerte active</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {sitesDown.map((site) => (
              <div key={site.id} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-destructive-light)]">
                <Globe className="h-4 w-4 text-[var(--color-destructive)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{site.url}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Site DOWN — {site.last_status}</p>
                </div>
              </div>
            ))}
            {adsAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-warning-light)]">
                <TrendingUp className="h-4 w-4 text-[var(--color-warning)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{alert.client_name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {alert.platform} — {alert.percent}% du budget
                  </p>
                </div>
              </div>
            ))}
            {sslAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-warning-light)]">
                <Shield className="h-4 w-4 text-[var(--color-warning)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{alert.url}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    SSL expire le {formatDate(alert.ssl_valid_until)}
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
