'use client';

import { useState } from 'react';
import {
  User as UserIcon,
  Users,
  Link2,
  Bell,
  Save,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Database,
  CreditCard,
  Send,
  Workflow,
  Calendar,
  FileSignature,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { User, UserRole } from '@/types/database';

interface SettingsPageProps {
  users: User[];
}

const roleConfig: Record<UserRole, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' }> = {
  admin: { label: 'Admin', variant: 'default' },
  manager: { label: 'Manager', variant: 'success' },
  member: { label: 'Membre', variant: 'secondary' },
  client: { label: 'Client', variant: 'warning' },
};

interface ServiceCardData {
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  configUrl?: string;
}

const services: ServiceCardData[] = [
  {
    name: 'Supabase',
    description: 'Base de donnees & authentification',
    icon: <Database className="w-5 h-5" />,
    connected: true,
    configUrl: 'https://supabase.com/dashboard',
  },
  {
    name: 'Stripe',
    description: 'Paiements & abonnements',
    icon: <CreditCard className="w-5 h-5" />,
    connected: false,
    configUrl: 'https://dashboard.stripe.com',
  },
  {
    name: 'Resend',
    description: "Envoi d'emails transactionnels",
    icon: <Send className="w-5 h-5" />,
    connected: false,
    configUrl: 'https://resend.com/emails',
  },
  {
    name: 'n8n',
    description: 'Automatisations & workflows',
    icon: <Workflow className="w-5 h-5" />,
    connected: false,
  },
  {
    name: 'Cal.com',
    description: 'Prise de rendez-vous',
    icon: <Calendar className="w-5 h-5" />,
    connected: false,
    configUrl: 'https://cal.com',
  },
  {
    name: 'Documenso',
    description: 'Signatures electroniques',
    icon: <FileSignature className="w-5 h-5" />,
    connected: false,
    configUrl: 'https://documenso.com',
  },
];

export function SettingsPage({ users }: SettingsPageProps) {
  const [profile, setProfile] = useState({
    full_name: users[0]?.full_name ?? '',
    email: users[0]?.email ?? '',
    avatar_url: users[0]?.avatar_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    email_new_lead: true,
    email_payment: true,
    email_task_assigned: true,
    push_new_message: true,
    push_budget_alert: true,
    push_site_down: true,
    digest_weekly: false,
  });

  async function handleSaveProfile() {
    if (!users[0]) return;
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: users[0].id, ...profile }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">
          <UserIcon className="w-4 h-4 mr-1.5" />
          Profil
        </TabsTrigger>
        <TabsTrigger value="team">
          <Users className="w-4 h-4 mr-1.5" />
          Equipe
        </TabsTrigger>
        <TabsTrigger value="connections">
          <Link2 className="w-4 h-4 mr-1.5" />
          Connexions
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="w-4 h-4 mr-1.5" />
          Notifications
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Gerez votre profil utilisateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                Nom complet
              </label>
              <Input
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                Email
              </label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                URL Avatar
              </label>
              <Input
                value={profile.avatar_url}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, avatar_url: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile} loading={saving}>
                <Save className="w-4 h-4 mr-1.5" />
                Enregistrer
              </Button>
              {saved && (
                <span className="text-sm text-success flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Sauvegarde
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Team Tab */}
      <TabsContent value="team">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Membres de l&apos;equipe</CardTitle>
              <CardDescription>{users.length} membre(s)</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-1.5" />
              Inviter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => {
                const roleCfg = roleConfig[user.role];
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-glass border border-glass-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-text-primary">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
                      {user.is_active ? (
                        <span className="w-2 h-2 rounded-full bg-success" title="Actif" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-text-muted" title="Inactif" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Connections Tab */}
      <TabsContent value="connections">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.name}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-glass border border-glass-border flex items-center justify-center text-text-secondary">
                    {service.icon}
                  </div>
                  {service.connected ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connecte
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="w-3 h-3 mr-1" />
                      Non connecte
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-text-primary">{service.name}</h3>
                <p className="text-sm text-text-muted mt-1">{service.description}</p>
                {service.configUrl && (
                  <a
                    href={service.configUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
                  >
                    <Link2 className="w-3 h-3" />
                    Configurer
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Preferences de notification</CardTitle>
            <CardDescription>
              Choisissez quand et comment etre notifie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Notifications email
              </h4>
              <div className="space-y-3">
                {([
                  { key: 'email_new_lead', label: 'Nouveau prospect' },
                  { key: 'email_payment', label: 'Paiement recu' },
                  { key: 'email_task_assigned', label: 'Tache assignee' },
                ] as const).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-glass border border-glass-border cursor-pointer"
                  >
                    <span className="text-sm text-text-primary">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications[key]}
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        notifications[key] ? 'bg-primary' : 'bg-bg-tertiary'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifications[key] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications push
              </h4>
              <div className="space-y-3">
                {([
                  { key: 'push_new_message', label: 'Nouveau message' },
                  { key: 'push_budget_alert', label: 'Alerte budget publicitaire' },
                  { key: 'push_site_down', label: 'Site hors ligne' },
                ] as const).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-glass border border-glass-border cursor-pointer"
                  >
                    <span className="text-sm text-text-primary">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications[key]}
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        notifications[key] ? 'bg-primary' : 'bg-bg-tertiary'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          notifications[key] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Digest
              </h4>
              <label className="flex items-center justify-between p-3 rounded-xl bg-glass border border-glass-border cursor-pointer">
                <span className="text-sm text-text-primary">Rapport hebdomadaire</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications.digest_weekly}
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      digest_weekly: !prev.digest_weekly,
                    }))
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    notifications.digest_weekly ? 'bg-primary' : 'bg-bg-tertiary'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      notifications.digest_weekly ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
