'use client';

import { useState, useEffect } from 'react';
import { Search, Wifi, Battery, Zap } from 'lucide-react';

interface HeaderProps {
  onSearchOpen: () => void;
}

export function Header({ onSearchOpen }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-7 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-4 text-xs font-medium text-black/80 fixed top-0 w-full z-50">
      <div className="flex items-center gap-4">
        <Zap size={14} className="text-black fill-black" />
        <span className="font-bold tracking-tight">LEOGRAPHY OS</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onSearchOpen} className="flex items-center gap-1 hover:bg-black/5 px-2 py-0.5 rounded transition-colors">
          <Search size={12} />
          <span className="hidden sm:inline opacity-60">⌘K</span>
        </button>
        <Wifi size={14} />
        <Battery size={14} />
        <span>
          <span className="hidden sm:inline">{time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')} {' '}</span>
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
