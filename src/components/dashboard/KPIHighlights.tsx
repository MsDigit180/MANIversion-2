import React from 'react';
import {
  Users,
  CreditCard,
  GraduationCap,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KPIHighlights: React.FC = () => {
  const { students, payments, exams, inventory, setCurrentTab, timePeriod } = useApp();

  const safeStudents = students || [];
  const safePayments = payments || [];
  const safeExams = exams || [];
  const safeInventory = inventory || [];

  // 1. Inscriptions metrics
  const activeCount = safeStudents.filter((s) => s.tutoringStatus === 'Actif').length;
  const stoppedDemandCount = safeStudents.filter((s) => s.tutoringStatus === 'Arrêté (À la demande)').length;
  const stoppedUnpaidCount = safeStudents.filter((s) => s.tutoringStatus === 'Arrêté (Défaut de paiement)').length;
  const totalStudents = safeStudents.length;

  // 2. Recouvrement & Paiements réels
  const totalCollected = safePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpected = safeStudents.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
  const totalUnpaid = Math.max(0, totalExpected - totalCollected);
  const recoveryRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : (totalCollected > 0 ? 100 : 0);

  // 3. Candidatures Concours réelles
  const totalExams = safeExams.length;
  const validatedExams = safeExams.filter((e) => e.status === 'Validé').length;
  const pendingPiecesExams = safeExams.filter((e) => e.status === 'Pièces manquantes').length;

  // 4. Stocks & Fournitures réels
  const supplySales = safePayments
    .filter((p) => p.category === 'Fournitures')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const lowStockCount = safeInventory.filter((item) => item.stockQuantity <= item.minThreshold).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: Inscriptions & Élèves */}
      <div
        onClick={() => setCurrentTab('inscriptions')}
        className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pôle 1 · Élèves & Encadrement</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {activeCount}
          </span>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            actifs aux cours
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-500/20 text-[10px]">
            {stoppedDemandCount} arrêt demande
          </span>
          <span className="text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 text-[10px]">
            {stoppedUnpaidCount} arrêt impayés
          </span>
          <span className="text-[11px] text-slate-400">
            ({totalStudents} inscrits)
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
          <span>Gérer le registre élèves (Niamey)</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* KPI 2: Recouvrement & Caisse */}
      <div
        onClick={() => setCurrentTab('paiements')}
        className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pôle 2 · Caisse & Recouvrement</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {(totalCollected ?? 0).toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">FCFA</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{recoveryRate}% recouvré</span>
          <span aria-hidden="true">·</span>
          <span>Reste: {(totalUnpaid ?? 0).toLocaleString()} FCFA</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
          <span>Journal caisse & reçus</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* KPI 3: Concours Professionnels */}
      <div
        onClick={() => setCurrentTab('concours')}
        className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 hover:border-purple-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pôle 3 · Prépa Concours Directs</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors">
            <GraduationCap className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {totalExams}
          </span>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            candidatures
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{validatedExams} complets</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-600 dark:text-amber-400">{pendingPiecesExams} pièces manquantes</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300">
          <span>Gestion des dossiers ENA / Police</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* KPI 4: Boutique & Fournitures */}
      <div
        onClick={() => setCurrentTab('boutique')}
        className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pôle 4 · Boutique & Annales</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
            <Package className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {(supplySales ?? 0).toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">FCFA</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>{safeInventory.length} références catalogue</span>
          <span aria-hidden="true">·</span>
          {lowStockCount > 0 ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{lowStockCount} alerte stock</span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">Stock optimal</span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300">
          <span>Magasin & vente comptoir</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};
