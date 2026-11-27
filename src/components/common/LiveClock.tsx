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

  const dateShort = time.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

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
    <div
      className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 py-1.5 text-xs whitespace-nowrap shrink-0"
      title={time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    >
      <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <span className="hidden 2xl:inline font-medium text-slate-700 dark:text-slate-300">
        {dateShort}
      </span>
      <span className="hidden 2xl:inline text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
      <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 2xl:hidden" />
      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
        {timeFormatted}
      </span>
      <span className="hidden 2xl:inline text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
      <span
        className={`hidden 2xl:inline text-[11px] font-medium ${
          isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        {isOpen ? 'Caisse Ouverte' : 'Hors Heures'}
      </span>
    </div>
  );
};
