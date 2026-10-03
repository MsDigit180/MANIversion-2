import React from 'react';
import {
  AlertTriangle,
  Send,
  FileCheck,
  ShoppingCart,
  CheckCircle2,
  X,
  Clock,
  ArrowRight,
  UserX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PriorityAlert } from '../../types';

export const PriorityAlerts: React.FC = () => {
  const { alerts, dismissAlert, showToast, setCurrentTab } = useApp();
  const safeAlerts = alerts || [];

  const handleAction = (alert: PriorityAlert) => {
    switch (alert.actionKey) {
      case 'relances':
        showToast('Campagne de relances SMS & WhatsApp envoyée avec succès aux 14 tuteurs légaux !', 'success');
        break;
      case 'pieces':
        setCurrentTab('concours');
        showToast('Redirection vers les candidatures en attente de pièces.', 'info');
        break;
      case 'reassort':
        setCurrentTab('boutique');
        showToast('Ouverture de la gestion des stocks et réassort.', 'info');
        break;
      case 'suspensions':
        setCurrentTab('inscriptions');
        showToast('Redirection vers le registre des élèves et arrêts d\'encadrement.', 'info');
        break;
      default:
        showToast('Action prise en compte.', 'success');
    }
  };

  const getUrgencyBadge = (urgency: PriorityAlert['urgency']) => {
    switch (urgency) {
      case 'critique':
        return (
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded">
            Urgent
          </span>
        );
      case 'attention':
        return (
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded">
            À traiter
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded">
            Info
          </span>
        );
    }
  };

  const getIcon = (actionKey: string) => {
    switch (actionKey) {
      case 'relances':
        return <Send className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
      case 'pieces':
        return <FileCheck className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'reassort':
        return <ShoppingCart className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />;
      case 'suspensions':
        return <UserX className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Alertes & Actions Prioritaires
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dossiers administratifs nécessitant une intervention.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-700 dark:text-slate-300">
          {safeAlerts.length} actives
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {safeAlerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-700 dark:text-slate-300">Aucune alerte prioritaire en suspens</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tous les dossiers sont à jour.</p>
          </div>
        ) : (
          safeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Top row: Icon, title, badge, dismiss */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {getIcon(alert.actionKey)}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {alert.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {getUrgencyBadge(alert.urgency)}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                    title="Masquer l'alerte"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {alert.description}
              </p>

              {/* Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleAction(alert)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <span className="text-[10px] text-slate-400">
                  Pôle {alert.pillar}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
