import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  GraduationCap,
  ShoppingBag,
  ArrowRight,
  Printer,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OperationItem } from '../../types';
import { getSafeAvatarUrl } from '../../utils/imageOptimizer';

export const OperationsFeed: React.FC = () => {
  const { operations, payments, setSelectedReceipt, setCurrentTab } = useApp();
  const [filterType, setFilterType] = useState<string>('all');

  const safeOperations = operations || [];
  const safePayments = payments || [];

  const filteredOperations = safeOperations.filter((op) => {
    if (filterType === 'all') return true;
    return op.type === filterType;
  });

  const getPillarIcon = (type: OperationItem['type']) => {
    switch (type) {
      case 'inscription':
        return <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />;
      case 'paiement':
        return <CreditCard className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'vente':
        return <ShoppingBag className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'concours':
        return <GraduationCap className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    }
  };

  const handlePrintReceipt = (referenceId: string) => {
    const payment = safePayments.find((p) => p.receiptNumber === referenceId || p.id === referenceId);
    if (payment) {
      setSelectedReceipt(payment);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      {/* Header with Title and Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Activités Récentes & Flux d'Opérations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Flux unifié multi-pôles avec photo et signature de l'agent synchronisé dans Firestore.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700 p-0.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilterType('inscription')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              filterType === 'inscription'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Élèves
          </button>
          <button
            onClick={() => setFilterType('paiement')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              filterType === 'paiement'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Caisse
          </button>
          <button
            onClick={() => setFilterType('concours')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              filterType === 'concours'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Concours
          </button>
          <button
            onClick={() => setFilterType('vente')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              filterType === 'vente'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Boutique
          </button>
        </div>
      </div>

      {/* Feed list */}
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700/60">
        {filteredOperations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucune opération enregistrée pour ce filtre.
          </div>
        ) : (
          filteredOperations.map((op) => (
            <div
              key={op.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-750/50 rounded-xl px-2.5 transition-colors"
            >
              {/* Left Zone: Icon & Titles & Agent Traceability */}
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    op.type === 'inscription'
                      ? 'bg-indigo-50 dark:bg-indigo-500/10'
                      : op.type === 'paiement'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : op.type === 'vente'
                      ? 'bg-amber-50 dark:bg-amber-500/10'
                      : 'bg-purple-50 dark:bg-purple-500/10'
                  }`}
                >
                  {getPillarIcon(op.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {op.title}
                    </span>
                    <span className="text-[11px] text-slate-400">· {op.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {op.subtitle}
                  </p>

                  {/* Explicit Agent Traceability with Profile Photo */}
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <img
                      src={getSafeAvatarUrl(op.agentAvatar, op.agentName)}
                      alt={op.agentName}
                      className="h-4 w-4 rounded-full object-cover ring-1 ring-indigo-500/40"
                    />
                    <span>
                      Enregistré par : <strong className="text-slate-800 dark:text-slate-200 font-semibold">{op.agentName}</strong> ({op.agentRole})
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Zone: Amount, Sync State & Quick Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                {typeof op.amount === 'number' && !isNaN(op.amount) && (
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    +{(op.amount ?? 0).toLocaleString()} FCFA
                  </span>
                )}

                {op.metaBadge && (
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      op.metaBadge === 'Impayé'
                        ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                        : op.metaBadge === 'Demande'
                        ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                        : op.metaBadge === 'Réactivé'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {op.metaBadge}
                  </span>
                )}

                {/* Explicit Sync Status Badge */}
                {op.syncStatus === 'synced' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Synchronisé</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                    <Clock className="h-3 w-3" />
                    <span>Cache local</span>
                  </span>
                )}

                {/* Print button if payment */}
                {op.type === 'paiement' && (
                  <button
                    onClick={() => handlePrintReceipt(op.referenceId)}
                    title="Aperçu / Imprimer reçu officiel"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer link to full view */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Traçabilité horodatée avec identité et photo d'agent</span>
        <button
          onClick={() => setCurrentTab('paiements')}
          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
        >
          <span>Consulter le journal de caisse</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
