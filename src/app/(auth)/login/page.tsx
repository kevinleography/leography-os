'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-glow" />

      <div className="glass-card w-full max-w-sm p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">LEO</span>
            <span className="text-text-primary">GRAPHY</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-[0.2em]">
            Operating System
          </p>
        </div>

        {sent ? (
          /* Success state */
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Verifiez votre boite mail
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Un lien de connexion a ete envoye a{' '}
              <span className="text-text-primary font-medium">{email}</span>
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className={cn(
                'text-sm text-primary hover:text-primary-hover',
                'transition-colors duration-200'
              )}
            >
              Utiliser une autre adresse
            </button>
          </div>
        ) : (
          /* Login form */
          <>
            <h2 className="text-lg font-semibold text-text-primary text-center mb-6">
              Connexion
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="glass-input w-full h-11 pl-10 pr-4 text-sm"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive-light text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className={cn(
                  'w-full h-11 rounded-xl text-sm font-medium',
                  'bg-primary text-white',
                  'shadow-lg shadow-primary/25',
                  'hover:bg-primary-hover active:scale-[0.98]',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'flex items-center justify-center gap-2'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien magique'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
