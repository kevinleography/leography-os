'use client';

import { useState, useEffect } from 'react';
import {
  Plus, ArrowLeft, Briefcase, History, ListTodo, CheckSquare,
  PlayCircle, StopCircle, Loader2
} from 'lucide-react';

const app = {
  color: 'bg-indigo-500',
  text: 'text-indigo-500',
  bgLight: 'bg-indigo-500/10',
  gradient: 'from-indigo-400 to-indigo-600',
};

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  deadline: string;
  contact_id: string;
  contact: Contact | null;
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: string;
  position: number;
  description: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-red-100 text-red-700',
};

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklists' | 'tracking'>('overview');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedTime, setTrackedTime] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking) {
      interval = setInterval(() => {
        setTrackedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/projects')
      .then(res => res.json())
      .then(json => {
        if (json?.data) setProjects(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }
    setTasksLoading(true);
    fetch(`/api/tasks?project_id=${selectedProject}`)
      .then(res => res.json())
      .then(json => {
        const data = Array.isArray(json) ? json : json?.data ?? [];
        setTasks(data);
      })
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [selectedProject]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatBudget = (budget: number | null) => {
    if (budget == null) return '—';
    return `${budget.toLocaleString('fr-FR')} €`;
  };

  const activeProject = projects.find(p => p.id === selectedProject);

  const computeProgress = (projectTasks: Task[]) => {
    if (projectTasks.length === 0) return 0;
    return Math.round((projectTasks.filter(t => t.status === 'done').length / projectTasks.length) * 100);
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  };

  const currentProgress = selectedProject ? computeProgress(tasks) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          {selectedProject && (
            <button onClick={() => { setSelectedProject(null); setActiveTab('overview'); }} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-800">
            {selectedProject ? activeProject?.name : 'Projets'}
          </h2>
        </div>
        {!selectedProject ? (
          <button className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}>
            <Plus size={18} /> Nouveau Projet
          </button>
        ) : (
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 shadow-sm">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{"Vue d'ensemble"}</button>
            <button onClick={() => setActiveTab('checklists')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'checklists' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Checklists (SOPs)</button>
            <button onClick={() => setActiveTab('tracking')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'tracking' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Temps pass&eacute;</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : !selectedProject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-4">
          {projects.length === 0 ? (
            <p className="text-slate-500 col-span-full text-center py-12">Aucun projet pour le moment.</p>
          ) : projects.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-4 group"
            >
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${app.bgLight} ${app.text} group-hover:scale-110 transition-transform`}><Briefcase size={20}/></div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[project.status] || 'bg-slate-100 text-slate-700'}`}>{STATUS_LABELS[project.status] || project.status}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{project.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{project.type}</p>
              </div>
              <div className="mt-auto">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                  <span>Progression</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`${project.progress === 100 ? 'bg-emerald-500' : app.color} h-2 rounded-full`} style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[activeProject?.status ?? ''] || 'bg-slate-100 text-slate-700'} mb-2 inline-block`}>{STATUS_LABELS[activeProject?.status ?? ''] || activeProject?.status}</span>
                <p className="text-slate-500">{activeProject?.type}</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium border border-slate-200">{activeProject?.type}</span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                <span>Progression globale</span>
                <span>{currentProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className={`${currentProgress === 100 ? 'bg-emerald-500' : app.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${currentProgress}%` }}></div>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={20} className={app.text}/> D&eacute;tails du projet</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Client</p>
                    <p className="font-medium text-slate-800">
                      {activeProject?.contact
                        ? `${activeProject.contact.first_name} ${activeProject.contact.last_name}${activeProject.contact.company ? ` — ${activeProject.contact.company}` : ''}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Date de livraison pr&eacute;vue</p>
                    <p className="font-medium text-slate-800">{formatDate(activeProject?.deadline ?? null)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Budget allou&eacute;</p>
                    <p className="font-medium text-slate-800">{formatBudget(activeProject?.budget ?? null)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={20} className={app.text}/> Activit&eacute; r&eacute;cente</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  <p className="text-sm text-slate-500 pl-8">Aucune activit&eacute; r&eacute;cente</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklists' && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ListTodo size={20} className={app.text}/> Checklist ({activeProject?.type})</h3>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-slate-500 text-center py-12">Aucune t&acirc;che pour ce projet.</p>
              ) : (
                <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                  {tasks.map(task => (
                    <div key={task.id} onClick={() => toggleTask(task.id)} className="flex items-center gap-4 p-4 border-b border-slate-200/50 hover:bg-white/40 transition-colors last:border-0 cursor-pointer group">
                      <button className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? `${app.color} border-transparent text-white` : 'border-slate-300 text-transparent group-hover:border-slate-400'}`}>
                        <CheckSquare size={16} className={task.status === 'done' ? 'opacity-100' : 'opacity-0'} />
                      </button>
                      <span className={`font-medium transition-colors ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-slate-900'}`}>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Timer Actif</h3>
                <div className="text-4xl font-mono font-bold text-slate-800 mb-6 tracking-tight">
                  {formatTime(trackedTime)}
                </div>
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${isTracking ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                >
                  {isTracking ? <><StopCircle size={20} /> Arr&ecirc;ter le timer</> : <><PlayCircle size={20} /> D&eacute;marrer le timer</>}
                </button>
              </div>
              <div className="md:col-span-2 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><History size={20} className={app.text}/> Historique des sessions</h3>
                <p className="text-sm text-slate-500">Aucune session enregistr&eacute;e</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
