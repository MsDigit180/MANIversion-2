import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  CreditCard,
  GraduationCap,
  Package,
  TrendingUp,
  ArrowUpRight,
  CalendarDays,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { parseFlexibleDate } from '../../utils/dateUtils';
import {
  isInscriptionCategory,
  isEncadrementCategory,
  calculateTreasurySummary,
} from '../../utils/financialUtils';

interface EnrollmentDayPoint {
  dateKey: string;
  shortLabel: string;
  fullLabel: string;
  inscriptions: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: EnrollmentDayPoint }>;
}

const EnrollmentChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  const count = payload[0]?.value ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-900 dark:text-white capitalize">
        {point?.fullLabel}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-indigo-500" />
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
          {count} {count <= 1 ? 'inscription' : 'inscriptions'}
        </span>
      </div>
    </div>
  );
};

type DateRangePreset = '7d' | '14d' | '30d' | 'month' | 'custom';

function toInputDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getPresetDates(preset: Exclude<DateRangePreset, 'custom'>): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = toInputDateKey(today);

  if (preset === 'month') {
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toInputDateKey(firstOfMonth), end };
  }

  const daysBack = preset === '7d' ? 6 : preset === '14d' ? 13 : 29;
  const startD = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysBack);
  return { start: toInputDateKey(startD), end };
}

const THRESHOLD_STORAGE_KEY = 'cabappuis_enrollment_critical_threshold';

export const KPIHighlights: React.FC = () => {
  const {
    students,
    payments,
    expenses,
    salaryPayments,
    exams,
    inventory,
    setCurrentTab,
    setIsNewStudentModalOpen,
    theme,
    showToast,
  } = useApp();

  const safeStudents = students || [];
  const safePayments = payments || [];
  const safeExpenses = expenses || [];
  const safeSalaries = salaryPayments || [];
  const safeExams = exams || [];
  const safeInventory = inventory || [];
  const isDark = theme === 'dark';

  const initialDates = useMemo(() => getPresetDates('7d'), []);
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('7d');
  const [startDate, setStartDate] = useState<string>(initialDates.start);
  const [endDate, setEndDate] = useState<string>(initialDates.end);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLD_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 5;
    } catch {
      return 5;
    }
  });
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);

  const handleThresholdChange = (rawVal: string) => {
    const parsed = parseInt(rawVal, 10);
    const next = Number.isFinite(parsed) ? Math.max(1, Math.min(999, parsed)) : 1;
    setCriticalThreshold(next);
    try {
      localStorage.setItem(THRESHOLD_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectPreset = (preset: Exclude<DateRangePreset, 'custom'>) => {
    const { start, end } = getPresetDates(preset);
    setRangePreset(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const handleStartDateChange = (val: string) => {
    if (!val) return;
    setRangePreset('custom');
    setStartDate(val);
    if (val > endDate) {
      setEndDate(val);
    }
  };

  const handleEndDateChange = (val: string) => {
    if (!val) return;
    setRangePreset('custom');
    setEndDate(val);
    if (val < startDate) {
      setStartDate(val);
    }
  };

  const treasury = calculateTreasurySummary(safePayments, safeExpenses, safeSalaries, 'all');

  // 1. Inscriptions metrics
  const activeCount = safeStudents.filter((s) => s.tutoringStatus === 'Actif').length;
  const stoppedDemandCount = safeStudents.filter((s) => s.tutoringStatus === 'Arrêté (À la demande)').length;
  const stoppedUnpaidCount = safeStudents.filter((s) => s.tutoringStatus === 'Arrêté (Défaut de paiement)').length;
  const totalStudents = safeStudents.length;

  // Évolution des inscriptions sur la plage de dates sélectionnée
  const enrollmentSeries = useMemo<EnrollmentDayPoint[]>(() => {
    const now = new Date();
    const todayKey = toInputDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

    const countsByDay = new Map<string, number>();
    for (const student of safeStudents) {
      const parsed = parseFlexibleDate(student.enrollmentDate);
      if (!parsed) continue;
      const key = toInputDateKey(parsed);
      countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
    }

    const parsedStart = parseFlexibleDate(startDate) || new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const parsedEnd = parseFlexibleDate(endDate) || new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
    const end = parsedEnd >= parsedStart ? parsedEnd : parsedStart;

    const points: EnrollmentDayPoint[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    let safetyCounter = 0;

    while (cursor.getTime() <= endTime && safetyCounter < 366) {
      const key = toInputDateKey(cursor);
      const shortDate = `${String(cursor.getDate()).padStart(2, '0')}/${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const fullLabel = cursor.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      points.push({
        dateKey: key,
        shortLabel: key === todayKey ? `${shortDate} (Auj.)` : shortDate,
        fullLabel,
        inscriptions: countsByDay.get(key) || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
      safetyCounter += 1;
    }

    return points;
  }, [safeStudents, startDate, endDate]);

  const totalInRange = useMemo(
    () => enrollmentSeries.reduce((sum, pt) => sum + pt.inscriptions, 0),
    [enrollmentSeries]
  );

  const isBelowCriticalThreshold = totalInRange < criticalThreshold;
  const thresholdDeficit = Math.max(0, criticalThreshold - totalInRange);

  useEffect(() => {
    setIsAlertDismissed(false);
  }, [totalInRange, criticalThreshold, startDate, endDate]);

  const avgPerDay = useMemo(() => {
    if (enrollmentSeries.length === 0) return '0';
    const avg = totalInRange / enrollmentSeries.length;
    return Number.isInteger(avg) ? String(avg) : avg.toFixed(1).replace('.', ',');
  }, [totalInRange, enrollmentSeries.length]);

  const peakDay = useMemo(
    () =>
      enrollmentSeries.reduce(
        (best, curr) => (curr.inscriptions > best.inscriptions ? curr : best),
        enrollmentSeries[0]
      ),
    [enrollmentSeries]
  );

  const rangeBadgeLabel = useMemo(() => {
    switch (rangePreset) {
      case '7d':
        return '7 derniers jours';
      case '14d':
        return '14 derniers jours';
      case '30d':
        return '30 derniers jours';
      case 'month':
        return 'Ce mois-ci';
      case 'custom': {
        const s = parseFlexibleDate(startDate);
        const e = parseFlexibleDate(endDate);
        if (s && e) {
          return `Du ${s.toLocaleDateString('fr-FR')} au ${e.toLocaleDateString('fr-FR')}`;
        }
        return 'Plage personnalisée';
      }
    }
  }, [rangePreset, startDate, endDate]);

  // 2. RÈGLE MÉTIER : SÉPARATION STRICTE DES FLUX FINANCIERS
  // Flux A : Frais d'encadrement (scolarité périodique)
  const encadrementCollected = safePayments
    .filter((p) => isEncadrementCategory(p.category))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const encadrementDue = safeStudents.reduce(
    (sum, s) => sum + (s?.encadrement?.due ?? s?.monthlyFee ?? 0),
    0
  );
  const encadrementRemaining = Math.max(0, encadrementDue - encadrementCollected);
  const encadrementRate = encadrementDue > 0 ? Math.round((encadrementCollected / encadrementDue) * 100) : 100;

  // Flux B : Frais d'inscription (admission unique)
  const inscriptionCollected = safePayments
    .filter((p) => isInscriptionCategory(p.category))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const inscriptionDue = safeStudents.reduce(
    (sum, s) => sum + (s?.inscription?.due ?? 10000),
    0
  );
  const inscriptionRemaining = Math.max(0, inscriptionDue - inscriptionCollected);
  const inscriptionRate = inscriptionDue > 0 ? Math.round((inscriptionCollected / inscriptionDue) * 100) : 100;

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Inscriptions & Élèves */}
        <div
          onClick={() => setCurrentTab('inscriptions')}
          className={`group relative cursor-pointer rounded-2xl border bg-white dark:bg-slate-900/80 p-5 transition-all duration-200 shadow-sm ${
            isBelowCriticalThreshold
              ? 'border-rose-300 dark:border-rose-500/40 hover:border-rose-500/70 hover:bg-rose-50/30 dark:hover:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pôle 1 · Élèves & Encadrement</span>
            <div className="flex items-center gap-1.5">
              {isBelowCriticalThreshold && (
                <span
                  title={`Inscriptions sur la période (${totalInRange}) inférieures au seuil critique (${criticalThreshold})`}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300"
                >
                  <AlertTriangle className="h-3 w-3 animate-pulse" />
                  <span>Seuil ({totalInRange}/{criticalThreshold})</span>
                </span>
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                <Users className="h-4 w-4" />
              </div>
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

        {/* KPI 2: Recouvrement & Caisse - SÉPARATION STRICTE DES COMPTES */}
        <div
          onClick={() => setCurrentTab('paiements')}
          className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pôle 2 · Caisse (Flux Cloisonnés)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>

          {/* Ligne 1 : Frais d'Encadrement */}
          <div className="mt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                Frais d'Encadrement :
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {encadrementRate}% recouvré
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {(encadrementCollected ?? 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-500">FCFA</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Reste: {(encadrementRemaining ?? 0).toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Ligne 2 : Frais d'Inscription */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                Frais d'Inscription :
              </span>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {inscriptionRate}% recouvré
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {(inscriptionCollected ?? 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-500">FCFA</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Reste: {(inscriptionRemaining ?? 0).toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Ligne 3 : Solde Net en Caisse (Recouvrement - Dépenses) */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Caisse Nette (après {treasury.totalExpenses.toLocaleString()} dépenses) :
            </span>
            <span
              className={`font-mono font-bold tabular-nums ${
                treasury.netCashBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {treasury.netCashBalance.toLocaleString()} FCFA
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
            <span>Journal de caisse & quittances</span>
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

      {/* Graphique Recharts : Évolution des inscriptions avec sélecteur de période */}
      <section
        aria-label="Évolution des inscriptions par plage de dates"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Évolution des Inscriptions ({rangeBadgeLabel})
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  Total ({enrollmentSeries.length}j) :{' '}
                  <strong className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {totalInRange}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Moyenne/jour :{' '}
                  <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {avgPerDay}
                  </strong>
                </span>
                {peakDay && peakDay.inscriptions > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Pic :{' '}
                      <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {peakDay.shortLabel}
                      </strong>{' '}
                      <span className="font-mono tabular-nums">({peakDay.inscriptions})</span>
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                {isBelowCriticalThreshold ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      Sous le seuil critique ({totalInRange}/{criticalThreshold})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      Seuil respecté ({totalInRange}/{criticalThreshold})
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                const escapeCsv = (val: string | number) => {
                  const s = String(val);
                  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                };
                const headers = ['Date (ISO)', 'Libellé', "Nombre d'inscriptions"];
                const rows = enrollmentSeries.map((pt) => [
                  escapeCsv(pt.dateKey),
                  escapeCsv(pt.fullLabel),
                  escapeCsv(pt.inscriptions),
                ]);
                const csvContent =
                  '\uFEFF' +
                  [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `inscriptions_${startDate}_au_${endDate}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showToast(
                  `Export CSV téléchargé (${enrollmentSeries.length} jours, ${totalInRange} inscription${totalInRange > 1 ? 's' : ''}).`,
                  'success'
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exporter en CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('inscriptions')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>Registre des élèves</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Notification visuelle d'alerte lorsque les inscriptions passent sous le seuil critique */}
        {isBelowCriticalThreshold && !isAlertDismissed && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50/90 dark:bg-rose-950/40 px-4 py-3 text-xs shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-rose-900 dark:text-rose-200">
                  Alerte Seuil Critique : Niveau d&apos;inscriptions insuffisant
                </p>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300/90 leading-relaxed">
                  Seules{' '}
                  <strong className="font-mono font-bold tabular-nums">{totalInRange}</strong>{' '}
                  inscription{totalInRange > 1 ? 's ont été enregistrées' : ' a été enregistrée'} sur la période sélectionnée ({rangeBadgeLabel}), en dessous du seuil critique de{' '}
                  <strong className="font-mono font-bold tabular-nums">{criticalThreshold}</strong>{' '}
                  (déficit de{' '}
                  <strong className="font-mono font-bold tabular-nums">{thresholdDeficit}</strong>{' '}
                  inscription{thresholdDeficit > 1 ? 's' : ''}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsNewStudentModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Nouvelle inscription</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAlertDismissed(true)}
                title="Masquer cette alerte pour la session"
                aria-label="Masquer cette alerte"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Sélecteur de période & filtre par plage de dates au-dessus du graphique */}
        <div className="mt-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-2.5">
          {/* Raccourcis de période */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Raccourcis de période">
            {(
              [
                { id: '7d', label: '7 derniers jours' },
                { id: '14d', label: '14 jours' },
                { id: '30d', label: '30 jours' },
                { id: 'month', label: 'Ce mois' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  rangePreset === preset.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Plage de dates personnalisée & Seuil critique */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span>Du</span>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                aria-label="Date de début"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span>au</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                aria-label="Date de fin"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
              />
            </label>
            <label
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium pl-1 border-l border-slate-200 dark:border-slate-700"
              title="Seuil minimal d'inscriptions attendu sur la période sélectionnée"
            >
              <span>Seuil :</span>
              <input
                type="number"
                min={1}
                max={999}
                value={criticalThreshold}
                onChange={(e) => handleThresholdChange(e.target.value)}
                aria-label="Seuil critique d'inscriptions"
                className={`w-16 rounded-lg border px-2 py-1 text-xs font-mono font-semibold focus:outline-none ${
                  isBelowCriticalThreshold
                    ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500'
                }`}
              />
            </label>
            {rangePreset !== '7d' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('7d')}
                title="Réinitialiser sur les 7 derniers jours"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Réinit.</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height={224}>
            <LineChart
              data={enrollmentSeries}
              margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#1e293b' : '#e2e8f0'}
              />
              <XAxis
                dataKey="shortLabel"
                minTickGap={24}
                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<EnrollmentChartTooltip />}
                cursor={{
                  stroke: isDark ? '#475569' : '#cbd5e1',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                }}
              />
              <Line
                type="monotone"
                dataKey="inscriptions"
                name="Inscriptions"
                stroke={isBelowCriticalThreshold ? '#e11d48' : '#6366f1'}
                strokeWidth={2.5}
                dot={
                  enrollmentSeries.length <= 21
                    ? {
                        r: 4,
                        fill: isBelowCriticalThreshold ? '#e11d48' : '#6366f1',
                        strokeWidth: 2,
                        stroke: isDark ? '#0f172a' : '#ffffff',
                      }
                    : false
                }
                activeDot={{
                  r: 6,
                  fill: isBelowCriticalThreshold ? '#be123c' : '#4f46e5',
                  strokeWidth: 2,
                  stroke: isDark ? '#0f172a' : '#ffffff',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
