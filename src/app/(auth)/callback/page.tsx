'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');

      if (!code) {
        setError('Code d\'authentification manquant.');
        return;
      }

      try {
        const supabase = createClient();
        const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

        if (authError) {
          setError(authError.message);
          return;
        }

        router.replace('/dashboard');
      } catch {
        setError('Erreur lors de l\'authentification. Veuillez reessayer.');
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-glow" />

      <div className="glass-card w-full max-w-sm p-8 text-center relative z-10">
        {error ? (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Erreur d&apos;authentification
            </h2>
            <p className="text-sm text-text-secondary mb-6">{error}</p>
            <a
              href="/login"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Retour a la connexion
            </a>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-text-secondary">Authentification en cours...</p>
          </>
        )}
      </div>
    </div>
  );
}
