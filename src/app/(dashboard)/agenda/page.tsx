'use client';

import { useState, useEffect } from 'react';
import { Plus, Video, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const app = {
  color: 'bg-red-500',
  text: 'text-red-500',
  bgLight: 'bg-red-500/10',
  gradient: 'from-red-400 to-red-600',
};

interface MeetingInteraction {
  id: string;
  type: string;
  date: string;
  notes: string | null;
  contacts: {
    first_name: string;
    last_name: string;
    company: string | null;
  } | null;
}

export default function AgendaPage() {
  const [meetings, setMeetings] = useState<MeetingInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('interactions')
          .select('*, contacts(first_name, last_name, company)')
          .eq('type', 'meeting')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(20);
        setMeetings(data ?? []);
      } catch {
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatEndTime = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(d.getHours() + 1);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (contact: MeetingInteraction['contacts']) => {
    if (!contact) return '??';
    return `${(contact.first_name?.[0] ?? '').toUpperCase()}${(contact.last_name?.[0] ?? '').toUpperCase()}`;
  };

  const handleNewEvent = () => {
    window.open(process.env.NEXT_PUBLIC_CALCOM_URL || 'https://rdv.leography.fr', '_blank');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Agenda</h2>
        <button
          onClick={handleNewEvent}
          className={`${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
        >
          <Plus size={18} /> Nouvel &Eacute;v&eacute;nement
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-red-500" />
          </div>
        ) : meetings.length === 0 ? (
          <p className="text-slate-500 text-center py-12">Aucun rendez-vous &agrave; venir</p>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 shadow-sm flex gap-4 items-start">
              <div className="flex flex-col items-center justify-center min-w-[60px] text-slate-500">
                <span className="text-sm font-bold">{formatTime(meeting.date)}</span>
                <span className="text-xs">{formatEndTime(meeting.date)}</span>
              </div>
              <div className={`w-1 rounded-full ${app.color} self-stretch`}></div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">
                  {meeting.contacts
                    ? `Rendez-vous — ${meeting.contacts.first_name} ${meeting.contacts.last_name}${meeting.contacts.company ? ` (${meeting.contacts.company})` : ''}`
                    : 'Rendez-vous'}
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Video size={14}/> {meeting.notes || 'Visioconf\u00e9rence'}
                </p>
              </div>
              {meeting.contacts && (
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">
                    {getInitials(meeting.contacts)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden" style={{ height: '500px' }}>
        <iframe
          src={process.env.NEXT_PUBLIC_CALCOM_URL || 'https://rdv.leography.fr'}
          className="w-full h-full border-0"
          title="Calendrier Cal.com"
        />
      </div>
    </div>
  );
}
