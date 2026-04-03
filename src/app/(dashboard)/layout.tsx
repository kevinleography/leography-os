'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Dock } from '@/components/layout/dock';
import { Spotlight } from '@/components/layout/spotlight';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      setAuthenticated(true);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return (
    <div className="min-h-screen macos-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!authenticated) return null;

  return (
    <>
      <Header onSearchOpen={() => setSpotlightOpen(true)} />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <AnimatePresence mode="wait">
        <motion.div
          key={typeof window !== 'undefined' ? window.location.pathname : ''}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="absolute inset-0 pb-28 overflow-y-auto hide-scrollbar bg-white/60 backdrop-blur-3xl"
          style={{ top: '28px' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-12 py-6 h-full">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
      <Dock />
    </>
  );
}
