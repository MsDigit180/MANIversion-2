import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  Cloud,
  Server,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { testFirebaseConnection } from '../../firebase';

export const SyncDrawerModal: React.FC = () => {
  const {
    isSyncDrawerOpen,
    setIsSyncDrawerOpen,
    syncQueue,
    isSyncing,
    triggerSync,
    forceSeedCloudDatabase,
    networkStatus,
    toggleNetworkSimulation,
    students,
    payments,
    exams,
    inventory,
    supplySales,
    operations,
    lastCloudSync,
    cloudSyncStatus,
  } = useApp();

  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isSyncDrawerOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setPingStatus('Ping en cours vers Google Cloud Firestore...');
    const startTime = performance.now();
    try {
      const ok = await testFirebaseConnection();
      const elapsed = Math.round(performance.now() - startTime);
      setPingStatus(ok ? `✅ Firestore connecté avec succès (${elapsed} ms)` : '⚠️ Mode hors-ligne');
    } catch (e) {
      setPingStatus('❌ Erreur de connectivité Firestore');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="h-full w-full max-w-md border-l border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Firebase Cloud Firestore</h3>
                <p className="text-xs text-slate-400">Synchronisation Temps Réel & Persistance</p>
              </div>
            </div>
            <button
              onClick={() => setIsSyncDrawerOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cloud Status Card */}
          <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Base de données Firestore (Production)
                  </div>
                  <div className="text-[11px] text-indigo-200">
                    Dernière synchronisation : {lastCloudSync}
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Actif
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center justify-between">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Tester la latence Firestore</span>
              </button>
              {pingStatus && <span className="text-[10px] text-slate-300">{pingStatus}</span>}
            </div>
          </div>

          {/* Network Simulator Card */}
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-850 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {networkStatus === 'online' ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    {networkStatus === 'online' ? 'Connexion Réseau Active' : 'Connexion Réseau Coupée'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {networkStatus === 'online'
                      ? 'Réplication temps réel Firestore active'
                      : 'Les écritures s\'accumulent en cache Firestore local'}
                  </div>
                </div>
              </div>

              <button
                onClick={toggleNetworkSimulation}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  networkStatus === 'online'
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {networkStatus === 'online' ? 'Simuler coupure' : 'Rétablir réseau'}
              </button>
            </div>
          </div>

          {/* Cloud Collections Telemetry */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-850 p-3.5">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-400" />
              <span>Documents synchronisés dans Firestore</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between">
                <span className="text-slate-400">Élèves :</span>
                <span className="font-mono font-bold text-white">{students.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between">
                <span className="text-slate-400">Reçus caisse :</span>
                <span className="font-mono font-bold text-white">{payments.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between">
                <span className="text-slate-400">Dossiers concours :</span>
                <span className="font-mono font-bold text-white">{exams.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between">
                <span className="text-slate-400">Articles stock :</span>
                <span className="font-mono font-bold text-white">{inventory.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between">
                <span className="text-slate-400">Ventes fournitures :</span>
                <span className="font-mono font-bold text-white">{supplySales.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg flex justify-between">
                <span className="text-slate-400">Flux opérations :</span>
                <span className="font-mono font-bold text-white">{operations.length}</span>
              </div>
            </div>
          </div>

          {/* Pending Queue List */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                File locale en attente ({syncQueue.length})
              </span>
            </div>

            {syncQueue.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-850/50 p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1 opacity-80" />
                <p className="text-xs font-semibold text-slate-200">100% à jour avec Firestore Cloud</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toutes les écritures et mutations sont répliquées en ligne.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {syncQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-800 bg-slate-850 p-2.5 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/10 text-amber-400">
                        <Clock className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{item.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.timestamp} · Mutation : <span className="capitalize">{item.type}</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                      En attente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => forceSeedCloudDatabase()}
            disabled={isSyncing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white disabled:opacity-40 transition-all cursor-pointer shadow"
          >
            <Database className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing ? 'Enregistrement en cours...' : 'Forcer l\'écriture des données dans Firestore'}
            </span>
          </button>

          {syncQueue.length > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing || networkStatus === 'offline'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors shadow"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Synchronisation Cloud en cours...' : `Pousser ${syncQueue.length} opérations vers Firestore`}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsSyncDrawerOpen(false)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Fermer le panneau
          </button>
        </div>
      </div>
    </div>
  );
};
