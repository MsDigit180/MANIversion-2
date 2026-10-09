import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      // If succeed, let browser trigger online event
    } catch {
      // Still offline
    } finally {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-emerald-950/20 animate-in slide-in-from-bottom-2 duration-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Connexion internet rétablie · Back-office synchronisé</span>
      </div>
    );
  }

  if (isOnline) {
    return null;
  }

  return (
    <aside
      aria-label="Avertissement mode hors-ligne"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-600/95 dark:bg-amber-900/95 text-white p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/30 border border-white/20">
          <WifiOff className="h-4 w-4 animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
            <span>Connexion Réseau Interrompue</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400/30 text-amber-100">
              Offline-First
            </span>
          </p>
          <p className="text-[11px] text-amber-100/90 leading-tight mt-0.5">
            L'application continue de fonctionner. Vos actions sont sécurisées localement.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleManualCheck}
        disabled={isChecking}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors cursor-pointer disabled:opacity-50"
        title="Vérifier l'état de la connexion"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Tester</span>
      </button>
    </aside>
  );
};
