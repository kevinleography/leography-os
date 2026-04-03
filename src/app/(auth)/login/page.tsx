'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async (e: React.FormEvent) => {
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
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError(null);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-verify when all 6 digits entered
    if (value && index === 5) {
      const code = [...newOtp.slice(0, 5), value.slice(-1)].join('');
      if (code.length === 6) verifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const code = otp.join('');
      if (code.length === 6) verifyOtp(code);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      verifyOtp(text);
    }
  };

  const verifyOtp = async (code: string) => {
    setVerifying(true);
    setOtpError(null);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (verifyError) {
        setOtpError('Code incorrect ou expiré. Vérifiez votre email.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        router.push('/dashboard');
      }
    } catch {
      setOtpError('Une erreur est survenue.');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 6) verifyOtp(code);
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

        {!sent ? (
          /* Step 1 — Email */
          <>
            <h2 className="text-lg font-semibold text-text-primary text-center mb-6">
              Connexion
            </h2>
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
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
                  'Envoyer le code'
                )}
              </button>
            </form>
          </>
        ) : (
          /* Step 2 — OTP */
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Vérifiez votre email
              </h2>
              <p className="text-sm text-text-secondary">
                Code envoyé à{' '}
                <span className="text-text-primary font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={verifying}
                    className={cn(
                      'w-11 h-13 text-center text-xl font-bold rounded-xl',
                      'bg-glass border border-glass-border',
                      'text-text-primary',
                      'focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]',
                      'transition-all duration-200',
                      'disabled:opacity-50',
                      digit ? 'border-primary/50' : ''
                    )}
                    style={{ height: '52px' }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {otpError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {otpError}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || otp.join('').length < 6}
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
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => { setSent(false); setOtp(['', '', '', '', '', '']); setOtpError(null); }}
                className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Changer d&apos;email
              </button>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Renvoyer le code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
