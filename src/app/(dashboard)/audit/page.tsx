'use client';

import { useState } from 'react';
import { Bot, Zap, RefreshCw, AlertCircle, CheckCircle2, Download, ArrowLeft, ArrowUpRight, Share2 } from 'lucide-react';

const app = {
  color: 'bg-purple-500',
  gradient: 'from-purple-400 to-purple-600',
  text: 'text-purple-500',
  bgLight: 'bg-purple-500/10',
};

interface AuditResult {
  id: string;
  url: string;
  overall_score: number;
  seo_score: number;
  performance_score: number;
  mobile_score: number;
  security_score: number;
  ai_recommendations: string[];
  audit_data: Record<string, any>;
  share_token?: string;
  status: string;
}

export default function AuditPage() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const pollForResult = async (auditId: string, attempt = 0) => {
    if (attempt > 30) {
      setError('L\'analyse prend trop de temps. Réessayez.');
      setIsAnalyzing(false);
      setPolling(false);
      return;
    }

    const res = await fetch(`/api/audits/${auditId}`);
    if (!res.ok) {
      setError('Erreur lors de la récupération du résultat.');
      setIsAnalyzing(false);
      setPolling(false);
      return;
    }

    const data: AuditResult = await res.json();

    if (data.status === 'completed') {
      setResult(data);
      setIsAnalyzing(false);
      setPolling(false);
      setShowResult(true);
    } else if (data.status === 'failed') {
      setError('L\'analyse a échoué. Vérifiez l\'URL et réessayez.');
      setIsAnalyzing(false);
      setPolling(false);
    } else {
      setTimeout(() => pollForResult(auditId, attempt + 1), 3000);
    }
  };

  const handleAnalyze = async () => {
    if (!url) return;
    setError('');
    setIsAnalyzing(true);
    setPolling(true);

    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Erreur lors du lancement de l\'audit');
        setIsAnalyzing(false);
        setPolling(false);
        return;
      }

      const audit: AuditResult = await res.json();

      // If already completed (unlikely but possible)
      if (audit.status === 'completed') {
        setResult(audit);
        setIsAnalyzing(false);
        setPolling(false);
        setShowResult(true);
      } else {
        // Poll for completion
        setTimeout(() => pollForResult(audit.id), 3000);
      }
    } catch {
      setError('Impossible de lancer l\'audit. Vérifiez votre connexion.');
      setIsAnalyzing(false);
      setPolling(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const shareUrl = result?.share_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/audit/${result.share_token}`
    : null;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white shadow-lg mb-4`}>
          <Bot size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Générateur d'Audit IA</h2>
        <p className="text-slate-500">Analysez n'importe quel site web en quelques secondes pour vos prospects.</p>
      </div>

      {!showResult ? (
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://site-du-prospect.com"
              className="w-full sm:flex-1 px-4 py-3 bg-white/50 border border-slate-200/50 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url}
              className={`${app.color} w-full sm:w-auto justify-center text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50`}
            >
              {isAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} className="fill-white" />}
              {isAnalyzing ? 'Analyse...' : 'Analyser'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {isAnalyzing && (
            <div className="border-2 border-dashed border-purple-200 rounded-2xl p-12 flex flex-col items-center justify-center text-purple-400 animate-pulse">
              <Bot size={48} className="mb-4" />
              <p className="font-medium text-center max-w-sm">Analyse en cours… L'IA explore le site et génère le rapport.</p>
            </div>
          )}

          {!isAnalyzing && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400">
              <Bot size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-center max-w-sm">Entrez une URL ci-dessus pour générer un rapport complet (SEO, UX, Copywriting, Tech).</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-lg flex-1 overflow-y-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <button onClick={() => setShowResult(false)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4">
                <ArrowLeft size={14} /> Retour
              </button>
              <h3 className="text-2xl font-bold text-slate-800">Rapport d'Audit</h3>
              <a href={result?.url} target="_blank" rel="noreferrer" className="text-purple-500 hover:underline flex items-center gap-1 mt-1">
                {result?.url} <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="flex gap-2">
              {shareUrl && (
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Share2 size={16} /> Partager
                </button>
              )}
              <button className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-md">
                <Download size={16} /> Exporter PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Score Global', score: result?.overall_score ?? 0 },
              { label: 'SEO', score: result?.seo_score ?? 0 },
              { label: 'Performance', score: result?.performance_score ?? 0 },
              { label: 'Mobile', score: result?.mobile_score ?? 0 },
            ].map((s, i) => (
              <div key={i} className="bg-white/50 p-4 rounded-2xl border border-slate-200/50 text-center">
                <p className="text-sm text-slate-500 font-medium mb-2">{s.label}</p>
                <div className={`text-3xl font-bold ${scoreColor(s.score)}`}>{s.score}/100</div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {result?.audit_data?.issues && result.audit_data.issues.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" /> Problèmes Critiques (SEO)
                </h4>
                <ul className="space-y-2">
                  {result.audit_data.issues.map((issue: string, i: number) => (
                    <li key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800 flex items-start gap-2">
                      <span className="mt-0.5">•</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result?.ai_recommendations && result.ai_recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" /> Recommandations IA
                </h4>
                <ul className="space-y-2">
                  {result.ai_recommendations.map((rec, i) => (
                    <li key={i} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 flex items-start gap-2">
                      <span className="mt-0.5">•</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!result?.ai_recommendations || result.ai_recommendations.length === 0) &&
              (!result?.audit_data?.issues || result.audit_data.issues.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">L'analyse est terminée. Les recommandations seront disponibles prochainement.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
