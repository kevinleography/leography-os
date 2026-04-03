'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Mail, MessageSquare, Send, ArrowLeft, ArrowRight,
  Bold, Italic, List, Link, Image as ImageIcon, Paperclip, StickyNote, X, Loader2
} from 'lucide-react';

const app = {
  color: 'bg-teal-500',
  text: 'text-teal-500',
  bgLight: 'bg-teal-500/10',
  gradient: 'from-teal-400 to-teal-600',
};

interface ChatItem {
  id: string;
  name: string;
  initials: string;
  preview: string;
  time: string;
  unread: boolean;
}

interface MessageItem {
  id: string;
  content: string;
  sender_id: string | null;
  created_at: string;
  is_read: boolean;
}

function formatTimeFR(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'emails'>('chat');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatMessages, setChatMessages] = useState<MessageItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Compose email state
  const [composeFrom, setComposeFrom] = useState('gestion@leography.fr');
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingChats(true);
    fetch('/api/messages?limit=20')
      .then(res => res.json())
      .then(json => {
        const data = json?.data;
        if (!data || data.length === 0) {
          setChats([]);
          return;
        }
        const mapped: ChatItem[] = data.map((c: {
          id: string;
          contacts?: { first_name?: string; last_name?: string };
          last_message?: { content?: string };
          last_message_at?: string;
          unread_count?: number;
        }) => {
          const firstName = c.contacts?.first_name ?? '';
          const lastName = c.contacts?.last_name ?? '';
          const name = `${firstName} ${lastName}`.trim() || 'Contact';
          const lastMsg = c.last_message?.content ?? '';
          const preview = lastMsg.length > 60 ? lastMsg.slice(0, 57) + '...' : lastMsg;
          const time = c.last_message_at ? formatTimeFR(c.last_message_at) : '';
          const unread = (c.unread_count ?? 0) > 0;
          return {
            id: c.id,
            name,
            initials: getInitials(name),
            preview,
            time,
            unread,
          };
        });
        setChats(mapped);
      })
      .catch(() => {
        setChats([]);
      })
      .finally(() => setLoadingChats(false));
  }, []);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) {
      setChatMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetch(`/api/messages/${selectedChat}`)
      .then(res => res.json())
      .then(json => {
        setChatMessages(json?.data ?? []);
      })
      .catch(() => setChatMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedChat]);

  const handleSendEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) return;
    setSendingEmail(true);
    setEmailError(null);
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          message: composeBody,
          from: composeFrom,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setEmailError(err.error || 'Erreur lors de l\'envoi');
        return;
      }
      setEmailSent(true);
      setTimeout(() => {
        setIsComposeOpen(false);
        setEmailSent(false);
        setComposeTo('');
        setComposeCc('');
        setComposeSubject('');
        setComposeBody('');
      }, 1500);
    } catch {
      setEmailError('Erreur réseau');
    } finally {
      setSendingEmail(false);
    }
  };

  const selectedChatData = chats.find(c => c.id === selectedChat);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-slate-800">Messages</h2>
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 shadow-sm w-full sm:w-auto">
            <button onClick={() => { setActiveTab('chat'); setSelectedChat(null); }} className={`flex-1 sm:flex-none justify-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <MessageSquare size={16}/> Chat
            </button>
            <button onClick={() => setActiveTab('emails')} className={`flex-1 sm:flex-none justify-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'emails' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Mail size={16}/> E-mails
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'emails') {
              setIsComposeOpen(true);
            }
          }}
          className={`w-full sm:w-auto justify-center ${app.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity`}
        >
          <Plus size={18} /> Nouveau Message
        </button>
      </div>

      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden flex">
        <div className={`w-full sm:w-1/3 border-r border-slate-200/50 flex-col ${
          (selectedChat && activeTab === 'chat') ? 'hidden sm:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-slate-200/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-white/50 border border-slate-200/50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {activeTab === 'chat' ? (
              <>
                {loadingChats ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
                ) : chats.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Aucune conversation</div>
                ) : (
                  chats.map((chat, index) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`p-4 border-b border-slate-100 hover:bg-white/50 cursor-pointer flex gap-3 items-center ${selectedChat === chat.id || (index === 0 && !selectedChat) ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} flex items-center justify-center font-bold`}>{chat.initials}</div>
                        {index === 0 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{chat.name}</h4>
                          <span className={`text-xs ${chat.unread ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>{chat.time}</span>
                        </div>
                        <p className={`text-xs truncate ${chat.unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{chat.preview}</p>
                      </div>
                      {chat.unread && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                    </div>
                  ))
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail size={32} className="opacity-30 mb-3" />
                <p className="text-sm font-medium text-slate-500 mb-1">Intégration email à venir</p>
                <p className="text-xs text-slate-400">FreeScout / SnappyMail — webmail open-source intégré</p>
              </div>
            )}
          </div>
        </div>
        <div className={`flex-1 flex-col bg-white/30 ${
          (selectedChat && activeTab === 'chat') ? 'flex' : 'hidden sm:flex'
        }`}>
          {activeTab === 'chat' ? (
            selectedChat && selectedChatData ? (
              <>
                <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="sm:hidden text-slate-500 hover:text-slate-800">
                    <ArrowLeft size={20}/>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{selectedChatData.initials}</div>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedChatData.name}</h3>
                    <p className="text-xs text-slate-500">Conversation</p>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                  {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Chargement des messages...</div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Aucun message dans cette conversation</div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={`${msg.sender_id ? 'self-end bg-teal-50' : 'self-start bg-white'} p-3 rounded-2xl ${msg.sender_id ? 'rounded-tr-sm' : 'rounded-tl-sm'} shadow-sm max-w-[80%]`}>
                        <p className="text-sm text-slate-700">{msg.content}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{formatTimeFR(msg.created_at)}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-slate-200/50 bg-white/50">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Écrire un message..." className="flex-1 px-4 py-2 bg-white border border-slate-200/50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    <button className={`${app.color} text-white p-2 rounded-xl hover:opacity-90 transition-opacity`}>
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-4">
                  <MessageSquare size={48} className="opacity-20" />
                  <p>Sélectionnez une conversation</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-4">
                <Mail size={48} className="opacity-20" />
                <p className="text-sm font-medium">Intégration email à venir</p>
                <p className="text-xs">FreeScout / SnappyMail</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden h-full sm:h-[80vh]"
            >
              {/* Header */}
              <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 truncate pr-4">Nouveau Message</h3>
                <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <X size={20}/>
                </button>
              </div>

              {/* Form Fields */}
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-10">De :</span>
                  <select value={composeFrom} onChange={e => setComposeFrom(e.target.value)} className="flex-1 bg-transparent outline-none font-medium text-slate-800 truncate">
                    <option value="gestion@leography.fr">gestion@leography.fr</option>
                    <option value="contact@leography.fr">contact@leography.fr</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
                  <span className="text-slate-500 w-10">À :</span>
                  <input type="text" value={composeTo} onChange={e => setComposeTo(e.target.value)} className="flex-1 bg-transparent outline-none text-slate-800" placeholder="destinataire@email.com" />
                </div>
                <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
                  <span className="text-slate-500 w-10">Cc :</span>
                  <input type="text" value={composeCc} onChange={e => setComposeCc(e.target.value)} className="flex-1 bg-transparent outline-none text-slate-800" />
                </div>
                <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
                  <span className="text-slate-500 w-10">Sujet :</span>
                  <input type="text" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} className="flex-1 bg-transparent outline-none font-medium text-slate-800" placeholder="Sujet de l'e-mail" />
                </div>
                {emailError && <p className="text-sm text-red-600 pt-2">{emailError}</p>}
                {emailSent && <p className="text-sm text-emerald-600 pt-2">Email envoyé avec succès !</p>}
              </div>

              {/* Toolbar */}
              <div className="px-4 sm:px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-slate-500 overflow-x-auto whitespace-nowrap">
                <button className="hover:text-slate-800 shrink-0"><Bold size={16}/></button>
                <button className="hover:text-slate-800 shrink-0"><Italic size={16}/></button>
                <div className="w-px h-4 bg-slate-300 shrink-0"></div>
                <button className="hover:text-slate-800 shrink-0"><List size={16}/></button>
                <div className="w-px h-4 bg-slate-300 shrink-0"></div>
                <button className="hover:text-slate-800 shrink-0"><Link size={16}/></button>
                <button className="hover:text-slate-800 shrink-0"><ImageIcon size={16}/></button>
              </div>

              {/* Text Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} className="w-full h-full resize-none outline-none text-slate-800" placeholder="Écrivez votre message ici..."></textarea>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-2 sm:order-1">
                  <button onClick={handleSendEmail} disabled={sendingEmail || !composeTo.trim() || !composeSubject.trim()} className="flex-1 sm:flex-none justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm sm:text-base disabled:opacity-50">
                    {sendingEmail ? <><Loader2 size={16} className="animate-spin" /> Envoi...</> : <><Send size={16}/> Envoyer</>}
                  </button>
                  <button className="flex-1 sm:flex-none justify-center bg-amber-400 hover:bg-amber-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm sm:text-base">
                    <StickyNote size={16}/> <span className="hidden sm:inline">Note Interne</span><span className="sm:hidden">Note</span>
                  </button>
                </div>
                <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors order-1 sm:order-2 ml-auto sm:ml-0">
                  <Paperclip size={20}/>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
