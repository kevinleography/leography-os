import { Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CALCOM_URL = process.env.NEXT_PUBLIC_CALCOM_URL || 'https://cal.leography.fr';

export default function AgendaPage() {
  return (
    <div className="page-wrapper space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Agenda</h1>
        <a
          href={CALCOM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir Cal.com
        </a>
      </div>

      {/* Cal.com embed */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-2xl">
          <iframe
            src={CALCOM_URL}
            className="w-full border-0"
            style={{ height: '600px' }}
            title="Cal.com - Agenda"
          />
        </CardContent>
      </Card>

      {/* Upcoming events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Prochains rendez-vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-text-muted mb-4" />
            <p className="text-text-secondary">
              Aucun rendez-vous a venir
            </p>
            <p className="text-sm text-text-muted mt-1">
              Les rendez-vous planifies via Cal.com apparaitront ici.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
