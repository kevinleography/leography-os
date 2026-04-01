'use client';

import { ContactWithDetails } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from './score-badge';
import { InteractionTimeline } from './interaction-timeline';
import { FrictionPoints } from './friction-points';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Mail, Phone, Building2, MapPin, ArrowLeft, Bot, Target, FolderKanban } from 'lucide-react';
import Link from 'next/link';

interface Props {
  contact: ContactWithDetails;
}

export function ContactDetail({ contact }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/crm">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">{contact.first_name} {contact.last_name}</h1>
        <Badge variant={contact.type === 'client' ? 'success' : contact.type === 'lead' ? 'default' : 'secondary'}>
          {contact.type}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <a href={`mailto:${contact.email}`} className="text-[var(--color-primary)] hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>{contact.company}</span>
                </div>
              )}
              {contact.profession && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>{contact.profession}</span>
                </div>
              )}
              {contact.notes && <p className="text-sm text-[var(--color-text-secondary)] mt-4">{contact.notes}</p>}
            </CardContent>
          </Card>

          <Tabs defaultValue="interactions">
            <TabsList>
              <TabsTrigger value="interactions">Interactions ({contact.interactions?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="deals">Deals ({contact.deals?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="projects">Projets ({contact.projects?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="audits">Audits ({contact.audits?.length ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="interactions">
              <InteractionTimeline interactions={contact.interactions ?? []} contactId={contact.id} />
            </TabsContent>
            <TabsContent value="deals">
              <div className="space-y-3">
                {(contact.deals ?? []).map((deal) => (
                  <Card key={deal.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{formatCurrency(deal.value)}</p>
                      </div>
                      <Badge>{deal.probability}%</Badge>
                    </CardContent>
                  </Card>
                ))}
                {(contact.deals ?? []).length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Aucun deal</p>}
              </div>
            </TabsContent>
            <TabsContent value="projects">
              <div className="space-y-3">
                {(contact.projects ?? []).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover:border-[var(--color-glass-border-hover)] transition-colors cursor-pointer">
                      <CardContent className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">{project.type}</p>
                        </div>
                        <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>{project.status}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {(contact.projects ?? []).length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Aucun projet</p>}
              </div>
            </TabsContent>
            <TabsContent value="audits">
              <div className="space-y-3">
                {(contact.audits ?? []).map((audit) => (
                  <Link key={audit.id} href={`/audit/${audit.id}`}>
                    <Card className="hover:border-[var(--color-glass-border-hover)] transition-colors cursor-pointer">
                      <CardContent className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-medium">{audit.url}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">{formatDate(audit.created_at)}</p>
                        </div>
                        <span className="text-2xl font-bold">{audit.overall_score}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {(contact.audits ?? []).length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Aucun audit</p>}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center py-6">
              <ScoreBadge score={contact.score} size="lg" />
              <p className="text-sm text-[var(--color-text-muted)] mt-2">Score IA</p>
            </CardContent>
          </Card>

          <FrictionPoints points={contact.friction_points ?? []} />

          <Card>
            <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/audit?contact=${contact.id}`} className="block">
                <Button variant="outline" className="w-full justify-start gap-2"><Bot className="h-4 w-4" />Lancer un audit</Button>
              </Link>
              <Button variant="outline" className="w-full justify-start gap-2"><Target className="h-4 w-4" />Créer un deal</Button>
              <Button variant="outline" className="w-full justify-start gap-2"><FolderKanban className="h-4 w-4" />Créer un projet</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
