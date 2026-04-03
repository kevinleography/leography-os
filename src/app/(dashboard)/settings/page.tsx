'use client';

import { useState, useEffect } from 'react';
import {
  UserCog, Settings, Key, Server, ShieldCheck, Save, Plus, Copy,
  CheckCircle2, RefreshCw, Zap, Wifi, Database, Send, Calendar,
  FileSignature, X, CreditCard, GitBranch, Users, Trash2, Loader2, AlertCircle
} from 'lucide-react';

const app = {
  color: 'bg-slate-600',
  text: 'text-slate-600',
  bgLight: 'bg-slate-600/10',
  gradient: 'from-slate-500 to-slate-700',
};

type Tab = 'profil' | 'agence' | 'api' | 'acces' | 'portail' | 'systeme';

interface AllowedUser {
  id: string;
  email: string;
  role: 'admin' | 'collaborator';
  name: string | null;
  created_at: string;
}

interface IntegrationItem {
  key: string;
  name: string;
  icon: React.ElementType;
  description: string;
  connected: boolean;
}

const integrationDefs: { key: string; name: string; icon: React.ElementType; description: string }[] = [
  { key: 'supabase', name: 'Supabase', icon: Database, description: 'Base de données & Auth' },
  { key: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Paiements & facturation' },
  { key: 'resend', name: 'Resend', icon: Send, description: 'Emails transactionnels' },
  { key: 'n8n', name: 'n8n', icon: GitBranch, description: 'Automatisations & workflows' },
  { key: 'calcom', name: 'Cal.com', icon: Calendar, description: 'Prise de rendez-vous' },
  { key: 'docuseal', name: 'DocuSeal', icon: FileSignature, description: 'Signatures électroniques' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const [saved, setSaved] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(
    integrationDefs.map(d => ({ ...d, connected: false }))
  );
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Access management state
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [addingUser, setAddingUser] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingStatus(true);
    fetch('/api/settings/status')
      .then(res => res.json())
      .then((statuses: Record<string, boolean>) => {
        setIntegrations(
          integrationDefs.map(d => ({
            ...d,
            connected: !!statuses[d.key],
          }))
        );
      })
      .catch(() => {
        // keep all as disconnected
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  // Fetch allowed users when tab changes to 'acces'
  useEffect(() => {
    if (activeTab !== 'acces') return;
    setLoadingUsers(true);
    fetch('/api/allowed-users')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setAllowedUsers(data))
      .catch(() => setAllowedUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [activeTab]);

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    setAddingUser(true);
    setAccessError(null);
    try {
      const res = await fetch('/api/allowed-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim(), role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAccessError(err.error || 'Erreur');
        return;
      }
      const user = await res.json();
      setAllowedUsers(prev => [...prev, user]);
      setNewEmail('');
      setNewName('');
      setNewRole('collaborator');
    } catch {
      setAccessError('Erreur réseau');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (id: string) => {
    const res = await fetch(`/api/allowed-users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAllowedUsers(prev => prev.filter(u => u.id !== id));
    } else {
      const err = await res.json();
      setAccessError(err.error || 'Erreur');
    }
  };

  const handleToggleRole = async (user: AllowedUser) => {
    const newUserRole = user.role === 'admin' ? 'collaborator' : 'admin';
    const res = await fetch(`/api/allowed-users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newUserRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAllowedUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyKey = () => {
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profil', label: 'Profil', icon: UserCog },
    { id: 'agence', label: 'Agence', icon: Settings },
    { id: 'api', label: 'API & Intégrations', icon: Key },
    { id: 'acces' as Tab, label: 'Accès', icon: Users },
    { id: 'portail', label: 'Portail Client', icon: ShieldCheck },
    { id: 'systeme', label: 'Système', icon: Server },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Réglages</h2>
      </div>

      <div className="flex gap-1 bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200/50 shadow-sm mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-4">

        {/* Profil Tab */}
        {activeTab === 'profil' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Informations personnelles</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-3xl font-bold shadow-inner">K</div>
                <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Changer la photo
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Prénom</label>
                    <input type="text" defaultValue="Kevin" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom</label>
                    <input type="text" defaultValue="Fondateur" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email professionnel</label>
                  <input type="email" defaultValue="kevin@leography.fr" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rôle</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800">
                    <option>Administrateur</option>
                    <option>Manager</option>
                    <option>Membre</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={handleSave} className={`${app.color} text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm`}>
                  <Save size={16} /> Enregistrer
                </button>
                {saved && (
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Sauvegardé
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Sécurité</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nouveau mot de passe</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agence Tab */}
        {activeTab === 'agence' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Informations de l&apos;agence</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom de l&apos;agence</label>
                  <input type="text" defaultValue="LEOGRAPHY" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Site web</label>
                  <input type="url" defaultValue="https://leography.fr" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email de contact</label>
                  <input type="email" defaultValue="contact@leography.fr" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adresse</label>
                  <input type="text" defaultValue="DOM-TOM, France" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SIRET</label>
                  <input type="text" placeholder="XXX XXX XXX XXXXX" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={handleSave} className={`${app.color} text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm`}>
                  <Save size={16} /> Enregistrer
                </button>
                {saved && (
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Sauvegardé
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">Clé API Leography OS</h3>
              <p className="text-sm text-slate-500 mb-4">Utilisez cette clé pour accéder à l&apos;API depuis vos outils externes (n8n, Make, Zapier...).</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value="leog_sk_live_xxxxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-mono text-slate-800 text-sm"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {apiKeyCopied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {apiKeyCopied ? 'Copié !' : 'Copier'}
                </button>
                <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
                  <RefreshCw size={16} /> Régénérer
                </button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Intégrations connectées</h3>
                <button className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-sm hover:opacity-90 transition-opacity shadow-sm`}>
                  <Plus size={16} /> Connecter
                </button>
              </div>
              {loadingStatus ? (
                <div className="p-4 text-center text-slate-400 text-sm">Vérification des connexions...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map(integration => (
                    <div key={integration.name} className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${integration.connected ? app.bgLight : 'bg-slate-100'} ${integration.connected ? app.text : 'text-slate-400'} flex items-center justify-center shrink-0`}>
                        <integration.icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm">{integration.name}</h4>
                        <p className="text-xs text-slate-500">{integration.description}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${integration.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accès Tab */}
        {activeTab === 'acces' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">Utilisateurs autorisés</h3>
              <p className="text-sm text-slate-500 mb-6">Seuls les emails listés ci-dessous peuvent se connecter à LEOGRAPHY OS.</p>

              {accessError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  {accessError}
                  <button onClick={() => setAccessError(null)} className="ml-auto"><X size={14} /></button>
                </div>
              )}

              {/* Add user form */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl">
                <input
                  type="text"
                  placeholder="Nom"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="sm:w-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800"
                />
                <input
                  type="email"
                  placeholder="email@exemple.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800"
                />
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'admin' | 'collaborator')}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800"
                >
                  <option value="collaborator">Collaborateur</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleAddUser}
                  disabled={addingUser || !newEmail.trim()}
                  className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50`}
                >
                  {addingUser ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Ajouter
                </button>
              </div>

              {/* Users list */}
              {loadingUsers ? (
                <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Chargement...
                </div>
              ) : allowedUsers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Aucun utilisateur configuré</p>
              ) : (
                <div className="space-y-2">
                  {allowedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner shrink-0">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{user.name || '—'}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => handleToggleRole(user)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'} hover:opacity-80 transition-opacity`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Collaborateur'}
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                        title="Supprimer l'accès"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portail Tab */}
        {activeTab === 'portail' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Personnalisation du portail client</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL du portail</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm">https://</span>
                    <input type="text" defaultValue="portail.leography.fr" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message de bienvenue</label>
                  <textarea rows={3} defaultValue="Bienvenue sur votre espace client LEOGRAPHY. Retrouvez ici vos projets, documents et factures." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-800 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Couleur principale</label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#1e293b" className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer bg-transparent" />
                    <span className="text-sm text-slate-600 font-mono">#1e293b</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">Activer le portail</p>
                    <p className="text-xs text-slate-500">Les clients peuvent accéder à leur espace</p>
                  </div>
                  <button className="relative w-12 h-6 bg-emerald-500 rounded-full transition-colors">
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white transition-transform" />
                  </button>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={handleSave} className={`${app.color} text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm`}>
                  <Save size={16} /> Enregistrer
                </button>
                {saved && (
                  <span className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Sauvegardé
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Système Tab */}
        {activeTab === 'systeme' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Statut Serveur', value: 'Opérationnel', icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
                { label: 'Base de données', value: 'Supabase', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
                { label: 'Déploiement', value: 'Coolify', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
              ].map(item => (
                <div key={item.label} className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} mb-4`}>
                    <item.icon size={24} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">{item.label}</p>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">{item.value}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${item.badge}`}>Actif</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Informations système</h3>
              <div className="space-y-3">
                {[
                  { label: 'Version', value: 'LEOGRAPHY OS v1.0.0' },
                  { label: 'Environnement', value: 'Production' },
                  { label: 'Région', value: 'EU-West (Paris)' },
                  { label: 'Dernière mise à jour', value: '3 Avril 2026' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-200/30">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="text-sm font-medium text-slate-800 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><X size={18}/> Zone dangereuse</h3>
              <p className="text-sm text-red-700 mb-4">Ces actions sont irréversibles. Procédez avec précaution.</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors">
                  Vider le cache
                </button>
                <button className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors">
                  Réinitialiser les données de démo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
