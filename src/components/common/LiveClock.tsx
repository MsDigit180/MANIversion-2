import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date in French: e.g. "Mardi 29 Septembre 2026"
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const dateFormatted = time.toLocaleDateString('fr-FR', options);
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  // Time formatted: "16:00:15"
  const timeFormatted = time.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Working day status check (e.g. Open Mon-Sat 07:30 - 19:00)
  const hours = time.getHours();
  const dayOfWeek = time.getDay(); // 0 is Sunday
  const isOpen = dayOfWeek !== 0 && hours >= 7 && hours < 19;

  return (
    <div className="hidden xl:flex items-center gap-3 bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
        <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="text-xs font-semibold capitalize">{capitalizedDate}</span>
      </div>
      <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-mono font-bold text-xs">
        <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
        <span>{timeFormatted}</span>
      </div>
      <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
      <div className="flex items-center gap-1">
        <span className={`inline-block h-2 w-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
          {isOpen ? 'Caisse Ouverte' : 'Hors Heures'}
        </span>
      </div>
    </div>
  );
};
