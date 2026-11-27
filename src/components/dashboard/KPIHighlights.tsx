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
  PieChart as PieChartIcon,
  ScatterChart as ScatterChartIcon,
  TrendingDown,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { parseFlexibleDate, formatYYYYMMToFrench } from '../../utils/dateUtils';
import {
  isInscriptionCategory,
  isEncadrementCategory,
  calculateTreasurySummary,
  getCurrentYearMonth,
  getStudentMonthlyPaymentMap,
  calculateMonthlyRecoverySummary,
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

type DistributionMode = 'cycle' | 'level' | 'concours';

interface DistributionSlice {
  name: string;
  value: number;
  percentage: number;
  secondaryCount: number;
  secondaryLabel: string;
  color: string;
}

const DONUT_COLORS = [
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0284c7', // sky-600
  '#e11d48', // rose-600
  '#64748b', // slate-500 (Autres)
];

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: DistributionSlice }>;
  unitLabel: string;
}

const DistributionDonutTooltip: React.FC<DonutTooltipProps> = ({
  active,
  payload,
  unitLabel,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0]?.payload;
  if (!slice) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: slice.color }}
        />
        <p className="font-semibold text-slate-900 dark:text-white">
          {slice.name}
        </p>
      </div>
      <div className="mt-1.5 flex items-center gap-2 font-mono tabular-nums">
        <span className="font-bold text-slate-900 dark:text-slate-100">
          {slice.value} {unitLabel}
        </span>
        <span className="text-slate-400" aria-hidden="true">·</span>
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {slice.percentage}%
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
        dont {slice.secondaryCount} {slice.secondaryLabel}
      </p>
    </div>
  );
};

type ScatterGranularity = 'cycle' | 'level';
type ScatterFlowFilter = 'all' | 'encadrement' | 'inscription';
type PaymentScatterStatus = 'paid' | 'partial' | 'overdue';

interface PaymentScatterPoint {
  id: string;
  matricule: string;
  studentName: string;
  stream: string;
  level: string;
  categoryLabel: string;
  levelIndex: number;
  x: number;
  y: number; // Paiements effectués en FCFA
  z: number; // Montant dû (pour taille du point)
  dueAmount: number;
  recoveryRate: number;
  receiptCount: number;
  statusBucket: PaymentScatterStatus;
}

const STREAM_ORDER_MAP: Record<string, number> = {
  primaire: 1,
  college: 2,
  collège: 2,
  lycee: 3,
  lycée: 3,
  'prepa concours': 4,
  'prépa concours': 4,
  concours: 4,
};

function getAcademicRank(stream: string, level: string, granularity: ScatterGranularity): number {
  const sNorm = stream.trim().toLowerCase();
  const streamRank = STREAM_ORDER_MAP[sNorm] ?? 5;
  if (granularity === 'cycle') {
    return streamRank * 100;
  }

  const lNorm = level.trim().toLowerCase();
  let classRank = 50;
  if (/\bci\b/.test(lNorm)) classRank = 1;
  else if (/\bcp\b/.test(lNorm)) classRank = 2;
  else if (/\bce1\b/.test(lNorm)) classRank = 3;
  else if (/\bce2\b/.test(lNorm)) classRank = 4;
  else if (/\bcm1\b/.test(lNorm)) classRank = 5;
  else if (/\bcm2\b/.test(lNorm)) classRank = 6;
  else if (/6[eè]me|6e\b/.test(lNorm)) classRank = 7;
  else if (/5[eè]me|5e\b/.test(lNorm)) classRank = 8;
  else if (/4[eè]me|4e\b/.test(lNorm)) classRank = 9;
  else if (/3[eè]me|3e\b/.test(lNorm)) classRank = 10;
  else if (/2nde|seconde/.test(lNorm)) classRank = 11;
  else if (/1[eè]re|premi[eè]re/.test(lNorm)) classRank = 12;
  else if (/tle|terminale/.test(lNorm)) classRank = 13;
  else if (/pr[eé]pa|concours|ena|police|douanes|sant[eé]/.test(lNorm)) classRank = 14;

  return streamRank * 100 + classRank;
}

function getDeterministicJitter(seed: string, fallbackIndex: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const normalized = ((Math.abs(hash) + fallbackIndex * 17) % 100) / 100; // 0 .. 0.99
  return (normalized - 0.5) * 0.44; // [-0.22, +0.22]
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: PaymentScatterPoint }>;
}

const PaymentScatterTooltip: React.FC<ScatterTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  const statusMeta =
    pt.statusBucket === 'paid'
      ? { label: 'Soldé / À jour', color: '#059669' }
      : pt.statusBucket === 'overdue'
      ? { label: 'En retard / Impayé', color: '#e11d48' }
      : { label: 'Partiel / En cours', color: '#4f46e5' };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs max-w-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-slate-900 dark:text-white truncate">
          {pt.studentName}
        </p>
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
          {pt.matricule}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
        {pt.level} <span aria-hidden="true">·</span> {pt.stream}
      </p>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-600 dark:text-slate-400">Paiements effectués :</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {pt.y.toLocaleString()} FCFA
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-600 dark:text-slate-400">Montant attendu :</span>
          <span className="text-slate-700 dark:text-slate-300">
            {pt.dueAmount.toLocaleString()} FCFA
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-sans text-slate-600 dark:text-slate-400">Recouvrement :</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {pt.recoveryRate}% ({pt.receiptCount} reçu{pt.receiptCount > 1 ? 's' : ''})
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: statusMeta.color }}
        />
        <span style={{ color: statusMeta.color }}>{statusMeta.label}</span>
      </div>
    </div>
  );
};

type PaymentAreaMode = 'daily' | 'cumulative';

interface PaymentComparisonPoint {
  dayIndex: number; // 1..30
  axisLabel: string; // e.g. "J-29" or "02/11"
  currentDateLabel: string;
  previousDateLabel: string;
  currentDaily: number;
  previousDaily: number;
  currentCumulative: number;
  previousCumulative: number;
  currentReceipts: number;
  previousReceipts: number;
}

interface PaymentAreaTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: PaymentComparisonPoint }>;
  mode: PaymentAreaMode;
}

const PaymentComparisonTooltip: React.FC<PaymentAreaTooltipProps> = ({
  active,
  payload,
  mode,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  const currVal = mode === 'cumulative' ? pt.currentCumulative : pt.currentDaily;
  const prevVal = mode === 'cumulative' ? pt.previousCumulative : pt.previousDaily;
  const delta = currVal - prevVal;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs min-w-[230px]">
      <p className="font-bold text-slate-900 dark:text-white">
        Jour {pt.dayIndex}/30 {mode === 'cumulative' ? '(Cumul)' : '(Journalier)'}
      </p>

      <div className="mt-2 space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>30j actuels ({pt.currentDateLabel}) :</span>
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {currVal.toLocaleString()} FCFA
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
            <span>30j précéd. ({pt.previousDateLabel}) :</span>
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {prevVal.toLocaleString()} FCFA
          </span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px] font-mono tabular-nums">
        <span className="font-sans text-slate-500 dark:text-slate-400">
          Écart ({pt.currentReceipts} vs {pt.previousReceipts} reçu{pt.previousReceipts > 1 ? 's' : ''}) :
        </span>
        <span
          className={`font-bold ${
            delta >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {delta >= 0 ? '+' : ''}
          {delta.toLocaleString()} FCFA
        </span>
      </div>
    </div>
  );
};

type ComposedHorizon = 6 | 12;

interface MonthlyTargetPoint {
  monthKey: string;
  shortLabel: string;
  fullLabel: string;
  actual: number;
  activeActual: number;
  target: number;
  variance: number;
  achievementRate: number;
}

interface EnrollmentTargetTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyTargetPoint }>;
}

const EnrollmentTargetTooltip: React.FC<EnrollmentTargetTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  const isMet = pt.actual >= pt.target;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs min-w-[225px]">
      <p className="font-bold text-slate-900 dark:text-white capitalize">{pt.fullLabel}</p>

      <div className="mt-2 space-y-1.5 font-mono tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-slate-600 dark:text-slate-300">
            <span
              className={`h-2 w-2 rounded-sm shrink-0 ${
                isMet ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
            <span>Inscriptions réelles :</span>
          </span>
          <span
            className={`font-bold ${
              isMet
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {pt.actual}
            {pt.activeActual !== pt.actual && (
              <span className="font-normal text-slate-400"> ({pt.activeActual} act.)</span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-sans text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span>Objectif mensuel :</span>
          </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">{pt.target}</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px] font-mono tabular-nums">
        <span className="font-sans text-slate-500 dark:text-slate-400">
          Atteinte ({pt.achievementRate}%) :
        </span>
        <span
          className={`font-bold ${
            pt.variance >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {pt.variance >= 0 ? `+${pt.variance} au-dessus` : `${pt.variance} sous l'objectif`}
        </span>
      </div>
    </div>
  );
};

interface SeasonalityPoint {
  monthKey: string;
  shortLabel: string;
  fullLabel: string;
  inscriptions: number;
}

interface SeasonalityTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: SeasonalityPoint }>;
}

const SeasonalityTooltip: React.FC<SeasonalityTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  const count = payload[0]?.value ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs min-w-[180px]">
      <p className="font-bold text-slate-900 dark:text-white capitalize">{pt?.fullLabel}</p>
      <div className="mt-1.5 flex items-center gap-2 font-mono tabular-nums">
        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
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
const MONTHLY_TARGET_STORAGE_KEY = 'cabappuis_monthly_enrollment_target';

export const KPIHighlights: React.FC = () => {
  const {
    students,
    payments,
    expenses,
    salaryPayments,
    cashLoans,
    exams,
    inventory,
    setCurrentTab,
    setIsNewStudentModalOpen,
    setIsNewPaymentModalOpen,
    theme,
    showToast,
  } = useApp();

  const safeStudents = students || [];
  const safePayments = payments || [];
  const safeExpenses = expenses || [];
  const safeSalaries = salaryPayments || [];
  const safeCashLoans = cashLoans || [];
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
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('cycle');
  const [hoveredSliceName, setHoveredSliceName] = useState<string | null>(null);
  const [scatterGranularity, setScatterGranularity] = useState<ScatterGranularity>('cycle');
  const [scatterFlow, setScatterFlow] = useState<ScatterFlowFilter>('all');
  const [recoveryMonth, setRecoveryMonth] = useState<string>(() => getCurrentYearMonth());
  const [paymentAreaMode, setPaymentAreaMode] = useState<PaymentAreaMode>('daily');
  const [composedHorizon, setComposedHorizon] = useState<ComposedHorizon>(6);
  const [seasonalityAcademicYear, setSeasonalityAcademicYear] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const startY = m >= 9 ? y : y - 1;
    return `${startY}-${startY + 1}`;
  });
  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(MONTHLY_TARGET_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 15;
    } catch {
      return 15;
    }
  });

  const handleMonthlyTargetChange = (rawVal: string) => {
    const parsed = parseInt(rawVal, 10);
    const next = Number.isFinite(parsed) ? Math.max(1, Math.min(999, parsed)) : 1;
    setMonthlyTarget(next);
    try {
      localStorage.setItem(MONTHLY_TARGET_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors
    }
  };

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

  const treasury = calculateTreasurySummary(safePayments, safeExpenses, safeSalaries, 'all', safeCashLoans);

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
  // Flux A : Frais d'encadrement (recouvrement MENSUEL, élèves actifs uniquement)
  const monthlyRecovery = useMemo(
    () => calculateMonthlyRecoverySummary(safeStudents, safePayments, recoveryMonth),
    [safeStudents, safePayments, recoveryMonth]
  );
  const encadrementCollected = monthlyRecovery.totalCollected;
  const encadrementDue = monthlyRecovery.totalDue;
  const encadrementRemaining = monthlyRecovery.totalRemaining;
  const encadrementRate = monthlyRecovery.collectionRate;

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

  // 5. Données du graphique en anneau (répartition par cycle scolaire, niveau/classe ou type de concours)
  const distributionData = useMemo(() => {
    const groups = new Map<string, { value: number; secondaryCount: number }>();

    if (distributionMode === 'concours') {
      for (const exam of safeExams) {
        const key = (exam.examType || '').trim() || 'Autre concours';
        const prev = groups.get(key) || { value: 0, secondaryCount: 0 };
        prev.value += 1;
        if (exam.status === 'Validé' || exam.status === 'Admis') {
          prev.secondaryCount += 1;
        }
        groups.set(key, prev);
      }
    } else {
      for (const student of safeStudents) {
        const rawKey =
          distributionMode === 'cycle'
            ? (student.stream || '').trim() || 'Non classé'
            : (student.level || '').trim() || 'Niveau non défini';
        const prev = groups.get(rawKey) || { value: 0, secondaryCount: 0 };
        prev.value += 1;
        if (student.tutoringStatus === 'Actif') {
          prev.secondaryCount += 1;
        }
        groups.set(rawKey, prev);
      }
    }

    const total = Array.from(groups.values()).reduce((sum, item) => sum + item.value, 0);
    const secondaryLabel = distributionMode === 'concours' ? 'validé(s)' : 'actif(s)';

    const sorted = Array.from(groups.entries()).sort((a, b) => b[1].value - a[1].value);

    // Regrouper au-delà de 6 catégories pour conserver un anneau lisible
    const maxVisible = 6;
    const head = sorted.slice(0, maxVisible);
    const tail = sorted.slice(maxVisible);
    if (tail.length > 0) {
      const otherAgg = tail.reduce(
        (acc, [, stats]) => ({
          value: acc.value + stats.value,
          secondaryCount: acc.secondaryCount + stats.secondaryCount,
        }),
        { value: 0, secondaryCount: 0 }
      );
      head.push([
        distributionMode === 'concours' ? 'Autres concours' : 'Autres niveaux',
        otherAgg,
      ]);
    }

    const slices: DistributionSlice[] = head.map(([name, stats], idx) => ({
      name,
      value: stats.value,
      percentage: total > 0 ? Math.round((stats.value / total) * 100) : 0,
      secondaryCount: stats.secondaryCount,
      secondaryLabel,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
    }));

    return {
      slices,
      total,
      distinctCategories: sorted.length,
      dominantSlice: slices[0] || null,
    };
  }, [distributionMode, safeStudents, safeExams]);

  const activeDonutSlice = useMemo(() => {
    if (!hoveredSliceName) return null;
    return distributionData.slices.find((s) => s.name === hoveredSliceName) || null;
  }, [hoveredSliceName, distributionData.slices]);

  // 6. Nuage de points : Corrélation entre paiements effectués et niveaux scolaires
  const scatterAnalytics = useMemo(() => {
    // Pré-calculer les montants encaissés par élève à partir des reçus validés
    const receiptTotalsByStudent = new Map<
      string,
      { all: number; encadrement: number; inscription: number; count: number }
    >();

    const addReceiptAmount = (studentKey: string, amount: number, category?: string) => {
      if (!studentKey || amount <= 0) return;
      const entry = receiptTotalsByStudent.get(studentKey) || {
        all: 0,
        encadrement: 0,
        inscription: 0,
        count: 0,
      };
      entry.all += amount;
      if (isEncadrementCategory(category)) {
        entry.encadrement += amount;
      } else if (isInscriptionCategory(category)) {
        entry.inscription += amount;
      }
      entry.count += 1;
      receiptTotalsByStudent.set(studentKey, entry);
    };

    for (const p of safePayments) {
      if (!p || p.status === 'Annulé') continue;
      if (Array.isArray(p.studentBreakdown) && p.studentBreakdown.length > 0) {
        for (const item of p.studentBreakdown) {
          if (item?.studentId) {
            addReceiptAmount(
              item.studentId,
              Number(item.amount || 0),
              item.category || p.category
            );
          }
        }
      } else if (p.studentId) {
        addReceiptAmount(p.studentId, Number(p.amount || 0), p.category);
      }
    }

    const monthlyEncadrementMap = getStudentMonthlyPaymentMap(safeStudents, safePayments, recoveryMonth);
    const scatterStudents =
      scatterFlow === 'encadrement'
        ? safeStudents.filter((st) => st.tutoringStatus === 'Actif')
        : safeStudents;

    // Construire la liste ordonnée académiquement des niveaux présents
    const categoryMetaMap = new Map<string, { label: string; rank: number }>();
    for (const st of scatterStudents) {
      const stream = (st.stream || '').trim() || 'Non classé';
      const level = (st.level || '').trim() || 'Niveau non défini';
      const categoryLabel = scatterGranularity === 'cycle' ? stream : level;
      if (!categoryMetaMap.has(categoryLabel)) {
        categoryMetaMap.set(categoryLabel, {
          label: categoryLabel,
          rank: getAcademicRank(stream, level, scatterGranularity),
        });
      }
    }

    const sortedCategories = Array.from(categoryMetaMap.values()).sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.label.localeCompare(b.label, 'fr');
    });

    const categoryIndexMap = new Map<string, number>();
    const categoryLabelByIndex = new Map<number, string>();
    sortedCategories.forEach((cat, idx) => {
      const axisIdx = idx + 1;
      categoryIndexMap.set(cat.label, axisIdx);
      categoryLabelByIndex.set(axisIdx, cat.label);
    });

    const allPoints: PaymentScatterPoint[] = [];
    const paidPoints: PaymentScatterPoint[] = [];
    const partialPoints: PaymentScatterPoint[] = [];
    const overduePoints: PaymentScatterPoint[] = [];

    const levelStatsMap = new Map<
      string,
      { label: string; index: number; count: number; totalPaid: number }
    >();

    scatterStudents.forEach((st, idx) => {
      const stream = (st.stream || '').trim() || 'Non classé';
      const level = (st.level || '').trim() || 'Niveau non défini';
      const categoryLabel = scatterGranularity === 'cycle' ? stream : level;
      const levelIndex = categoryIndexMap.get(categoryLabel) || 1;

      const receiptAgg = receiptTotalsByStudent.get(st.id);
      const isStopped = st.tutoringStatus !== 'Actif';
      const encPaidMonth = monthlyEncadrementMap.get(st.id) || 0;
      const insPaidFallback = Number(st.inscription?.paid ?? 0);
      const encDue = isStopped ? 0 : Number(st.encadrement?.due ?? st.monthlyFee ?? 0);
      const insDue = Number(st.inscription?.due ?? 10000);

      let paidAmount = 0;
      let dueAmount = 0;

      if (scatterFlow === 'encadrement') {
        paidAmount = encPaidMonth;
        dueAmount = encDue;
      } else if (scatterFlow === 'inscription') {
        paidAmount = Math.max(receiptAgg?.inscription ?? 0, insPaidFallback);
        dueAmount = insDue;
      } else {
        paidAmount = Math.max(receiptAgg?.all ?? 0, encPaidMonth + insPaidFallback);
        dueAmount = encDue + insDue;
      }

      const recoveryRate =
        dueAmount > 0
          ? Math.min(100, Math.round((paidAmount / dueAmount) * 100))
          : paidAmount > 0
          ? 100
          : 0;

      let statusBucket: PaymentScatterStatus = 'partial';
      if (
        (dueAmount > 0 && paidAmount >= dueAmount) ||
        (dueAmount === 0 && isStopped) ||
        (scatterFlow === 'all' && !isStopped && st.paymentStatus === 'A jour' && paidAmount > 0)
      ) {
        statusBucket = 'paid';
      } else if (
        !isStopped &&
        (st.paymentStatus === 'En retard' || (dueAmount > 0 && paidAmount === 0))
      ) {
        statusBucket = 'overdue';
      }

      const point: PaymentScatterPoint = {
        id: st.id,
        matricule: st.matricule,
        studentName: st.fullName,
        stream,
        level,
        categoryLabel,
        levelIndex,
        x: Number((levelIndex + getDeterministicJitter(st.id || st.matricule, idx)).toFixed(3)),
        y: paidAmount,
        z: Math.max(dueAmount, 5000),
        dueAmount,
        recoveryRate,
        receiptCount: receiptAgg?.count ?? (paidAmount > 0 ? 1 : 0),
        statusBucket,
      };

      allPoints.push(point);
      if (statusBucket === 'paid') paidPoints.push(point);
      else if (statusBucket === 'overdue') overduePoints.push(point);
      else partialPoints.push(point);

      const lvlStat = levelStatsMap.get(categoryLabel) || {
        label: categoryLabel,
        index: levelIndex,
        count: 0,
        totalPaid: 0,
      };
      lvlStat.count += 1;
      lvlStat.totalPaid += paidAmount;
      levelStatsMap.set(categoryLabel, lvlStat);
    });

    const totalPaidSum = allPoints.reduce((sum, pt) => sum + pt.y, 0);
    const overallAveragePaid =
      allPoints.length > 0 ? Math.round(totalPaidSum / allPoints.length) : 0;

    // Corrélation de Pearson r entre rang académique (levelIndex) et paiements effectués (y)
    let correlationR: number | null = null;
    if (allPoints.length >= 2 && sortedCategories.length >= 2) {
      const meanX = allPoints.reduce((s, p) => s + p.levelIndex, 0) / allPoints.length;
      const meanY = totalPaidSum / allPoints.length;
      let cov = 0;
      let varX = 0;
      let varY = 0;
      for (const p of allPoints) {
        const dx = p.levelIndex - meanX;
        const dy = p.y - meanY;
        cov += dx * dy;
        varX += dx * dx;
        varY += dy * dy;
      }
      if (varX > 0 && varY > 0) {
        correlationR = cov / Math.sqrt(varX * varY);
      }
    }

    const levelSummaries = Array.from(levelStatsMap.values())
      .sort((a, b) => a.index - b.index)
      .map((item) => ({
        ...item,
        averagePaid: item.count > 0 ? Math.round(item.totalPaid / item.count) : 0,
      }));

    const topAverageLevel =
      levelSummaries.length > 0
        ? levelSummaries.reduce((best, cur) =>
            cur.averagePaid > best.averagePaid ? cur : best
          )
        : null;

    return {
      allPoints,
      paidPoints,
      partialPoints,
      overduePoints,
      categories: sortedCategories.map((c, idx) => ({
        label: c.label,
        index: idx + 1,
      })),
      categoryLabelByIndex,
      overallAveragePaid,
      correlationR,
      levelSummaries,
      topAverageLevel,
    };
  }, [safeStudents, safePayments, scatterGranularity, scatterFlow, recoveryMonth]);

  // 7. Comparaison AreaChart : Volume des paiements des 30 derniers jours vs 30 jours précédents
  const paymentComparison = useMemo(() => {
    const byDateKey = new Map<string, { amount: number; count: number }>();

    for (const p of safePayments) {
      if (!p || p.status === 'Annulé') continue;
      const parsed = parseFlexibleDate(p.paymentDate);
      if (!parsed) continue;
      const key = toInputDateKey(parsed);
      const prev = byDateKey.get(key) || { amount: 0, count: 0 };
      prev.amount += Number(p.amount || 0);
      prev.count += 1;
      byDateKey.set(key, prev);
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const series: PaymentComparisonPoint[] = [];
    let currentTotal = 0;
    let previousTotal = 0;
    let currentReceiptsTotal = 0;
    let previousReceiptsTotal = 0;
    let currentActiveDays = 0;

    for (let i = 0; i < 30; i++) {
      // i = 0 -> J-29 (actuel) vs J-59 (précédent) ; i = 29 -> Aujourd'hui vs J-30
      const currDate = new Date(
        todayMidnight.getFullYear(),
        todayMidnight.getMonth(),
        todayMidnight.getDate() - (29 - i)
      );
      const prevDate = new Date(
        todayMidnight.getFullYear(),
        todayMidnight.getMonth(),
        todayMidnight.getDate() - (59 - i)
      );

      const currKey = toInputDateKey(currDate);
      const prevKey = toInputDateKey(prevDate);

      const currEntry = byDateKey.get(currKey) || { amount: 0, count: 0 };
      const prevEntry = byDateKey.get(prevKey) || { amount: 0, count: 0 };

      currentTotal += currEntry.amount;
      previousTotal += prevEntry.amount;
      currentReceiptsTotal += currEntry.count;
      previousReceiptsTotal += prevEntry.count;
      if (currEntry.amount > 0) currentActiveDays += 1;

      const formatShort = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      series.push({
        dayIndex: i + 1,
        axisLabel: i === 29 ? `${formatShort(currDate)} (Auj.)` : formatShort(currDate),
        currentDateLabel: currDate.toLocaleDateString('fr-FR'),
        previousDateLabel: prevDate.toLocaleDateString('fr-FR'),
        currentDaily: currEntry.amount,
        previousDaily: prevEntry.amount,
        currentCumulative: currentTotal,
        previousCumulative: previousTotal,
        currentReceipts: currEntry.count,
        previousReceipts: prevEntry.count,
      });
    }

    const deltaAmount = currentTotal - previousTotal;
    const variationPercent =
      previousTotal > 0
        ? Math.round(((currentTotal - previousTotal) / previousTotal) * 1000) / 10
        : currentTotal > 0
        ? 100
        : 0;

    return {
      series,
      currentTotal,
      previousTotal,
      currentReceiptsTotal,
      previousReceiptsTotal,
      currentActiveDays,
      deltaAmount,
      variationPercent,
    };
  }, [safePayments]);

  const monthlyPerformance = useMemo(() => {
    const now = new Date();
    const countsByMonth = new Map<string, { actual: number; activeActual: number }>();

    safeStudents.forEach((student) => {
      const parsed = parseFlexibleDate(student.enrollmentDate);
      if (!parsed) return;
      const monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      const prev = countsByMonth.get(monthKey) || { actual: 0, activeActual: 0 };
      prev.actual += 1;
      if (student.tutoringStatus === 'Actif') prev.activeActual += 1;
      countsByMonth.set(monthKey, prev);
    });

    const series: MonthlyTargetPoint[] = [];
    let totalActual = 0;
    let monthsMet = 0;

    for (let offset = composedHorizon - 1; offset >= 0; offset--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const shortMonth = monthDate
        .toLocaleDateString('fr-FR', { month: 'short' })
        .replace('.', '');
      const shortYear = String(monthDate.getFullYear()).slice(-2);
      const shortLabel = `${shortMonth} ${shortYear}`;
      const fullLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      const entry = countsByMonth.get(monthKey) || { actual: 0, activeActual: 0 };
      const target = monthlyTarget;
      const variance = entry.actual - target;
      const achievementRate = target > 0 ? Math.round((entry.actual / target) * 100) : 0;

      totalActual += entry.actual;
      if (entry.actual >= target) monthsMet += 1;

      series.push({
        monthKey,
        shortLabel,
        fullLabel,
        actual: entry.actual,
        activeActual: entry.activeActual,
        target,
        variance,
        achievementRate,
      });
    }

    const totalTarget = monthlyTarget * composedHorizon;
    const overallRate = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

    return {
      series,
      totalActual,
      totalTarget,
      overallRate,
      monthsMet,
    };
  }, [safeStudents, composedHorizon, monthlyTarget]);

  const availableAcademicYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth() + 1;
    const defaultStartY = currentM >= 9 ? currentY : currentY - 1;
    yearsSet.add(`${defaultStartY}-${defaultStartY + 1}`);
    yearsSet.add(`${defaultStartY - 1}-${defaultStartY}`);

    for (const student of safeStudents) {
      const parsed = parseFlexibleDate(student.enrollmentDate);
      if (!parsed) continue;
      const y = parsed.getFullYear();
      const m = parsed.getMonth() + 1;
      const startY = m >= 9 ? y : y - 1;
      yearsSet.add(`${startY}-${startY + 1}`);
    }

    return Array.from(yearsSet).sort().reverse();
  }, [safeStudents]);

  const seasonalityData = useMemo(() => {
    const [startYStr, endYStr] = seasonalityAcademicYear.split('-');
    const startY = parseInt(startYStr, 10) || new Date().getFullYear();
    const endY = parseInt(endYStr, 10) || startY + 1;

    const monthsDef = [
      { monthNum: 9, year: startY, short: 'Sept', full: `Septembre ${startY}` },
      { monthNum: 10, year: startY, short: 'Oct', full: `Octobre ${startY}` },
      { monthNum: 11, year: startY, short: 'Nov', full: `Novembre ${startY}` },
      { monthNum: 12, year: startY, short: 'Déc', full: `Décembre ${startY}` },
      { monthNum: 1, year: endY, short: 'Jan', full: `Janvier ${endY}` },
      { monthNum: 2, year: endY, short: 'Fév', full: `Février ${endY}` },
      { monthNum: 3, year: endY, short: 'Mars', full: `Mars ${endY}` },
      { monthNum: 4, year: endY, short: 'Avr', full: `Avril ${endY}` },
      { monthNum: 5, year: endY, short: 'Mai', full: `Mai ${endY}` },
      { monthNum: 6, year: endY, short: 'Juin', full: `Juin ${endY}` },
      { monthNum: 7, year: endY, short: 'Juil', full: `Juillet ${endY}` },
      { monthNum: 8, year: endY, short: 'Août', full: `Août ${endY}` },
    ];

    const countsMap = new Map<string, number>();
    for (const student of safeStudents) {
      const parsed = parseFlexibleDate(student.enrollmentDate);
      if (!parsed) continue;
      const mKey = `${parsed.getFullYear()}-${parsed.getMonth() + 1}`;
      countsMap.set(mKey, (countsMap.get(mKey) || 0) + 1);
    }

    let totalYearInscriptions = 0;
    const series = monthsDef.map((m) => {
      const mKey = `${m.year}-${m.monthNum}`;
      const count = countsMap.get(mKey) || 0;
      totalYearInscriptions += count;
      return {
        monthKey: mKey,
        shortLabel: m.short,
        fullLabel: m.full,
        inscriptions: count,
      };
    });

    const peakMonth = series.reduce(
      (max, curr) => (curr.inscriptions > max.inscriptions ? curr : max),
      series[0]
    );

    const activeMonthsCount = series.filter((s) => s.inscriptions > 0).length;
    const averagePerActiveMonth =
      activeMonthsCount > 0 ? (totalYearInscriptions / activeMonthsCount).toFixed(1).replace('.', ',') : '0';

    return {
      series,
      totalYearInscriptions,
      peakMonth,
      averagePerActiveMonth,
    };
  }, [safeStudents, seasonalityAcademicYear]);

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

          {/* Ligne 1 : Recouvrement Mensuel des Frais d'Encadrement (élèves actifs uniquement) */}
          <div className="mt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide truncate">
                  Recouvrement :
                </span>
                <input
                  type="month"
                  value={recoveryMonth}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.value) setRecoveryMonth(e.target.value);
                  }}
                  aria-label="Mois de recouvrement"
                  title={`Mois du recouvrement (${formatYYYYMMToFrench(recoveryMonth)})`}
                  className="rounded border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                {encadrementRate}% recouvré
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {(encadrementCollected ?? 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-500">FCFA</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Reste: {(encadrementRemaining ?? 0).toLocaleString()} FCFA
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {monthlyRecovery.activeCount} actif(s) facturé(s)
              {monthlyRecovery.excludedStoppedCount > 0
                ? ` · ${monthlyRecovery.excludedStoppedCount} en arrêt exclu(s)`
                : ''}
            </p>
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

      {/* Graphique en anneau (Donut Chart) : Répartition par niveau scolaire ou type de concours */}
      <section
        aria-label="Répartition des inscriptions par niveau scolaire ou type de concours"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {distributionMode === 'concours'
                  ? 'Répartition des Candidatures par Type de Concours'
                  : distributionMode === 'level'
                  ? 'Répartition des Inscriptions par Classe / Niveau'
                  : 'Répartition des Inscriptions par Cycle Scolaire'}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Total :{' '}
                  <strong className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {distributionData.total}
                  </strong>{' '}
                  {distributionMode === 'concours' ? 'dossiers' : 'inscrits'}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {distributionData.distinctCategories}
                  </strong>{' '}
                  {distributionMode === 'concours'
                    ? 'concours représentés'
                    : distributionMode === 'level'
                    ? 'niveaux distincts'
                    : 'cycles actifs'}
                </span>
                {distributionData.dominantSlice && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Dominant :{' '}
                      <strong className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {distributionData.dominantSlice.name}
                      </strong>{' '}
                      <span className="font-mono tabular-nums">
                        ({distributionData.dominantSlice.percentage}%)
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div
              role="group"
              aria-label="Critère de répartition du graphique"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setDistributionMode('cycle');
                  setHoveredSliceName(null);
                }}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  distributionMode === 'cycle'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cycles scolaires
              </button>
              <button
                type="button"
                onClick={() => {
                  setDistributionMode('level');
                  setHoveredSliceName(null);
                }}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  distributionMode === 'level'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Classes détaillées
              </button>
              <button
                type="button"
                onClick={() => {
                  setDistributionMode('concours');
                  setHoveredSliceName(null);
                }}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  distributionMode === 'concours'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Types de concours
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentTab(distributionMode === 'concours' ? 'concours' : 'inscriptions')
              }
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>
                {distributionMode === 'concours' ? 'Pôle concours' : 'Voir les élèves'}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {distributionData.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <PieChartIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              {distributionMode === 'concours'
                ? 'Aucune candidature aux concours enregistrée pour le moment.'
                : 'Aucune inscription scolaire enregistrée pour le moment.'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {distributionMode === 'concours'
                ? 'Ajoutez un dossier dans le Pôle Concours pour visualiser la répartition.'
                : 'Enregistrez un premier élève pour afficher sa répartition par niveau.'}
            </p>
            <button
              type="button"
              onClick={() =>
                distributionMode === 'concours'
                  ? setCurrentTab('concours')
                  : setIsNewStudentModalOpen(true)
              }
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>
                {distributionMode === 'concours'
                  ? 'Ouvrir Pôle Concours'
                  : 'Nouvelle inscription'}
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Anneau Recharts avec total centré */}
            <div className="lg:col-span-5 relative h-60 w-full min-w-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={distributionData.slices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={96}
                    paddingAngle={distributionData.slices.length > 1 ? 3 : 0}
                    cornerRadius={4}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={2}
                    onMouseEnter={(_, index) => {
                      const item = distributionData.slices[index];
                      if (item) setHoveredSliceName(item.name);
                    }}
                    onMouseLeave={() => setHoveredSliceName(null)}
                  >
                    {distributionData.slices.map((entry) => {
                      const isDimmed =
                        hoveredSliceName !== null && hoveredSliceName !== entry.name;
                      return (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          fillOpacity={isDimmed ? 0.35 : 1}
                          className="transition-opacity duration-150 cursor-pointer outline-none"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    content={
                      <DistributionDonutTooltip
                        unitLabel={
                          distributionMode === 'concours' ? 'dossier(s)' : 'élève(s)'
                        }
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Indicateur central dans l'anneau */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {activeDonutSlice ? activeDonutSlice.value : distributionData.total}
                </span>
                <span className="max-w-[110px] truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {activeDonutSlice
                    ? activeDonutSlice.name
                    : distributionMode === 'concours'
                    ? 'candidatures'
                    : 'inscriptions'}
                </span>
                {activeDonutSlice && (
                  <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {activeDonutSlice.percentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Tableau / Légende détaillée alignée à droite */}
            <div className="lg:col-span-7 divide-y divide-slate-100 dark:divide-slate-800/80">
              {distributionData.slices.map((slice) => {
                const isActive = hoveredSliceName === slice.name;
                return (
                  <div
                    key={slice.name}
                    onMouseEnter={() => setHoveredSliceName(slice.name)}
                    onMouseLeave={() => setHoveredSliceName(null)}
                    className={`flex items-center justify-between gap-4 py-2.5 px-2.5 rounded-lg transition-colors ${
                      isActive ? 'bg-slate-50 dark:bg-slate-800/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {slice.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0 hidden sm:inline">
                            {slice.secondaryCount} {slice.secondaryLabel}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(slice.percentage, 3)}%`,
                              backgroundColor: slice.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2.5 shrink-0 font-mono tabular-nums text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white w-8">
                        {slice.value}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-10">
                        {slice.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Graphique en nuage de points : Corrélation entre paiements effectués et niveaux scolaires */}
      <section
        aria-label="Corrélation entre les paiements effectués et les niveaux scolaires"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ScatterChartIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Corrélation Paiements Effectués &amp; Niveaux Scolaires
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Échantillon :{' '}
                  <strong className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {scatterAnalytics.allPoints.length}
                  </strong>{' '}
                  élève{scatterAnalytics.allPoints.length > 1 ? 's' : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Moyenne versée :{' '}
                  <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {scatterAnalytics.overallAveragePaid.toLocaleString()} FCFA
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Corrélation (r) :{' '}
                  <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {scatterAnalytics.correlationR !== null
                      ? `${scatterAnalytics.correlationR >= 0 ? '+' : ''}${scatterAnalytics.correlationR.toFixed(2).replace('.', ',')}`
                      : 'N/A'}
                  </strong>
                  {scatterAnalytics.correlationR !== null && (
                    <span className="ml-1 text-slate-500 dark:text-slate-400">
                      (
                      {Math.abs(scatterAnalytics.correlationR) >= 0.5
                        ? scatterAnalytics.correlationR > 0
                          ? 'tendance haussière marquée'
                          : 'tendance baissière marquée'
                        : Math.abs(scatterAnalytics.correlationR) >= 0.2
                        ? scatterAnalytics.correlationR > 0
                          ? 'corrélation positive modérée'
                          : 'corrélation négative modérée'
                        : 'dispersion homogène'}
                      )
                    </span>
                  )}
                </span>
                {scatterAnalytics.topAverageLevel && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Plus forte moyenne :{' '}
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        {scatterAnalytics.topAverageLevel.label}
                      </strong>{' '}
                      <span className="font-mono tabular-nums">
                        ({scatterAnalytics.topAverageLevel.averagePaid.toLocaleString()} FCFA)
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div
              role="group"
              aria-label="Granularité des niveaux scolaires"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs"
            >
              <button
                type="button"
                onClick={() => setScatterGranularity('cycle')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  scatterGranularity === 'cycle'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Par cycle
              </button>
              <button
                type="button"
                onClick={() => setScatterGranularity('level')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  scatterGranularity === 'level'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Par classe
              </button>
            </div>

            <div
              role="group"
              aria-label="Flux financier affiché"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs"
            >
              <button
                type="button"
                onClick={() => setScatterFlow('all')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  scatterFlow === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tous flux
              </button>
              <button
                type="button"
                onClick={() => setScatterFlow('encadrement')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  scatterFlow === 'encadrement'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Encadrement
              </button>
              <button
                type="button"
                onClick={() => setScatterFlow('inscription')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  scatterFlow === 'inscription'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Inscription
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('paiements')}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <span>Journal de caisse</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {scatterAnalytics.allPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ScatterChartIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Aucune donnée élève disponible pour tracer le nuage de points.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Inscrivez des élèves et enregistrez leurs règlements pour analyser la corrélation par niveau.
            </p>
            <button
              type="button"
              onClick={() => setIsNewStudentModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Nouvelle inscription</span>
            </button>
          </div>
        ) : (
          <>
            {/* Légende de lecture */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  <span>
                    Soldé / À jour (
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {scatterAnalytics.paidPoints.length}
                    </strong>
                    )
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                  <span>
                    Partiel / En cours (
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {scatterAnalytics.partialPoints.length}
                    </strong>
                    )
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                  <span>
                    En retard / Impayé (
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {scatterAnalytics.overduePoints.length}
                    </strong>
                    )
                  </span>
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-block w-4 border-t-2 border-dashed border-amber-500" />
                <span>Moyenne globale ({scatterAnalytics.overallAveragePaid.toLocaleString()} FCFA)</span>
              </span>
            </div>

            <div className="mt-3 h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height={288}>
                <ScatterChart margin={{ top: 14, right: 20, left: 4, bottom: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Niveau scolaire"
                    domain={[0.4, Math.max(1, scatterAnalytics.categories.length) + 0.6]}
                    ticks={scatterAnalytics.categories.map((c) => c.index)}
                    tickFormatter={(val: number) => {
                      const label = scatterAnalytics.categoryLabelByIndex.get(Math.round(val)) || '';
                      return label.length > 14 ? `${label.slice(0, 13)}…` : label;
                    }}
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Paiements effectués"
                    tickFormatter={(val: number) =>
                      val >= 1000 ? `${Math.round(val / 1000)}k` : String(val)
                    }
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <ZAxis type="number" dataKey="z" range={[64, 180]} name="Montant dû" />
                  <Tooltip
                    content={<PaymentScatterTooltip />}
                    cursor={{
                      strokeDasharray: '3 3',
                      stroke: isDark ? '#475569' : '#cbd5e1',
                    }}
                  />
                  <ReferenceLine
                    y={scatterAnalytics.overallAveragePaid}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                  <Scatter
                    name="Soldé / À jour"
                    data={scatterAnalytics.paidPoints}
                    fill="#059669"
                    fillOpacity={0.82}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={1.5}
                  />
                  <Scatter
                    name="Partiel / En cours"
                    data={scatterAnalytics.partialPoints}
                    fill="#4f46e5"
                    fillOpacity={0.82}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={1.5}
                  />
                  <Scatter
                    name="En retard / Impayé"
                    data={scatterAnalytics.overduePoints}
                    fill="#e11d48"
                    fillOpacity={0.85}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={1.5}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Synthèse des moyennes par niveau scolaire */}
            {scatterAnalytics.levelSummaries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Moyenne par niveau :
                </span>
                {scatterAnalytics.levelSummaries.map((lvl) => (
                  <span
                    key={lvl.label}
                    className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-medium">{lvl.label}</span>
                    <span className="text-slate-400" aria-hidden="true">·</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {lvl.averagePaid.toLocaleString()} FCFA
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      ({lvl.count})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Graphique en aires (AreaChart) : Comparaison des paiements 30j actuels vs 30j précédents */}
      <section
        aria-label="Comparaison du volume des paiements des 30 derniers jours par rapport aux 30 jours précédents"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                paymentComparison.deltaAmount >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {paymentComparison.deltaAmount >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Comparatif Revenus : 30 Derniers Jours vs 30 Jours Précédents
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  30j actuels :{' '}
                  <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {paymentComparison.currentTotal.toLocaleString()} FCFA
                  </strong>{' '}
                  <span className="font-mono text-[11px] tabular-nums">
                    ({paymentComparison.currentReceiptsTotal} reçu{paymentComparison.currentReceiptsTotal > 1 ? 's' : ''})
                  </span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  30j précédents :{' '}
                  <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {paymentComparison.previousTotal.toLocaleString()} FCFA
                  </strong>{' '}
                  <span className="font-mono text-[11px] tabular-nums">
                    ({paymentComparison.previousReceiptsTotal} reçu{paymentComparison.previousReceiptsTotal > 1 ? 's' : ''})
                  </span>
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    paymentComparison.deltaAmount >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {paymentComparison.deltaAmount >= 0 ? '+' : ''}
                  {paymentComparison.deltaAmount.toLocaleString()} FCFA (
                  {paymentComparison.variationPercent >= 0 ? '+' : ''}
                  {String(paymentComparison.variationPercent).replace('.', ',')}%{' '}
                  <span className="font-sans font-medium">
                    {paymentComparison.deltaAmount > 0
                      ? 'en hausse'
                      : paymentComparison.deltaAmount < 0
                      ? 'en baisse'
                      : 'stable'}
                  </span>
                  )
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div
              role="group"
              aria-label="Mode d'affichage du graphique en aires"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs"
            >
              <button
                type="button"
                onClick={() => setPaymentAreaMode('daily')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  paymentAreaMode === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Volume journalier
              </button>
              <button
                type="button"
                onClick={() => setPaymentAreaMode('cumulative')}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  paymentAreaMode === 'cumulative'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cumul 30 jours
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('paiements')}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <span>Journal de caisse</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {paymentComparison.currentTotal === 0 && paymentComparison.previousTotal === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CreditCard className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Aucun paiement enregistré sur les 60 derniers jours.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Encaissez un premier règlement pour comparer la dynamique mensuelle des revenus.
            </p>
            <button
              type="button"
              onClick={() => setIsNewPaymentModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Enregistrer un paiement</span>
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>30 derniers jours (période en cours)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-4 border-t-2 border-dashed border-indigo-500" />
                  <span>30 jours précédents (référence)</span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {paymentComparison.currentActiveDays} jour{paymentComparison.currentActiveDays > 1 ? 's' : ''} actif{paymentComparison.currentActiveDays > 1 ? 's' : ''} sur 30
              </span>
            </div>

            <div className="mt-3 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart
                  data={paymentComparison.series}
                  margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="currPaymentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="prevPaymentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  />
                  <XAxis
                    dataKey="axisLabel"
                    minTickGap={28}
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    tickFormatter={(val: number) =>
                      val >= 1000 ? `${Math.round(val / 1000)}k` : String(val)
                    }
                    tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    content={<PaymentComparisonTooltip mode={paymentAreaMode} />}
                    cursor={{
                      stroke: isDark ? '#475569' : '#cbd5e1',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={paymentAreaMode === 'cumulative' ? 'previousCumulative' : 'previousDaily'}
                    name="30 jours précédents"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="url(#prevPaymentsGradient)"
                    activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#ffffff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey={paymentAreaMode === 'cumulative' ? 'currentCumulative' : 'currentDaily'}
                    name="30 derniers jours"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#currPaymentsGradient)"
                    activeDot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      {/* Graphique BarChart : Saisonnalité des inscriptions sur l'année académique */}
      <section
        aria-label="Saisonnalité des inscriptions par mois sur l'année académique"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Saisonnalité des Inscriptions — Année Académique {seasonalityAcademicYear}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Total année :{' '}
                  <strong className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {seasonalityData.totalYearInscriptions}
                  </strong>{' '}
                  élève{seasonalityData.totalYearInscriptions > 1 ? 's' : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Mois pic :{' '}
                  <strong className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {seasonalityData.peakMonth.fullLabel}
                  </strong>{' '}
                  <span className="font-mono tabular-nums">({seasonalityData.peakMonth.inscriptions})</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Moyenne mensuelle :{' '}
                  <strong className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {seasonalityData.averagePerActiveMonth} / mois actif
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>Année académique :</span>
              <select
                value={seasonalityAcademicYear}
                onChange={(e) => setSeasonalityAcademicYear(e.target.value)}
                aria-label="Sélectionner l'année académique"
                className="bg-transparent font-mono font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {availableAcademicYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-900">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('inscriptions')}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>Registre des élèves</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {seasonalityData.totalYearInscriptions === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Aucune inscription enregistrée pour l'année académique {seasonalityAcademicYear}.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enregistrez des inscriptions pour visualiser la courbe de saisonnalité mensuelle.
            </p>
            <button
              type="button"
              onClick={() => setIsNewStudentModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Nouvelle inscription</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart
                data={seasonalityData.series}
                margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                />
                <XAxis
                  dataKey="shortLabel"
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
                  width={36}
                />
                <Tooltip
                  content={<SeasonalityTooltip />}
                  cursor={{
                    fill: isDark ? 'rgba(51, 65, 85, 0.28)' : 'rgba(226, 232, 240, 0.48)',
                  }}
                />
                <Bar
                  dataKey="inscriptions"
                  name="Inscriptions mensuelles"
                  fill="#4f46e5"
                  barSize={32}
                  radius={[6, 6, 0, 0]}
                >
                  {seasonalityData.series.map((entry) => (
                    <Cell
                      key={entry.monthKey}
                      fill={entry.inscriptions === seasonalityData.peakMonth.inscriptions && entry.inscriptions > 0 ? '#6366f1' : '#4f46e5'}
                      fillOpacity={entry.inscriptions > 0 ? 0.9 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Graphique composé : Objectifs d'inscriptions mensuels vs inscriptions réelles */}
      <section
        aria-label="Comparaison des objectifs d'inscriptions mensuels et des inscriptions réelles"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Performance Inscriptions : Objectifs Mensuels vs Réalisations
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Réalisées :{' '}
                  <strong className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {monthlyPerformance.totalActual}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Objectif ({composedHorizon} mois) :{' '}
                  <strong className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {monthlyPerformance.totalTarget}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Atteinte :{' '}
                  <strong
                    className={`font-mono font-bold tabular-nums ${
                      monthlyPerformance.overallRate >= 100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {monthlyPerformance.overallRate}%
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {monthlyPerformance.monthsMet}/{composedHorizon} mois atteint
                  {monthlyPerformance.monthsMet > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <div
              role="group"
              aria-label="Horizon d'analyse mensuelle"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs"
            >
              <button
                type="button"
                onClick={() => setComposedHorizon(6)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  composedHorizon === 6
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                6 mois
              </button>
              <button
                type="button"
                onClick={() => setComposedHorizon(12)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                  composedHorizon === 12
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                12 mois
              </button>
            </div>

            <label
              htmlFor="monthly-enrollment-target-input"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0"
            >
              <Target className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Objectif/mois</span>
              <input
                id="monthly-enrollment-target-input"
                type="number"
                min={1}
                max={999}
                value={monthlyTarget}
                onChange={(e) => handleMonthlyTargetChange(e.target.value)}
                aria-label="Objectif mensuel d'inscriptions"
                className="w-12 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none tabular-nums"
              />
            </label>

            <button
              type="button"
              onClick={() => setCurrentTab('inscriptions')}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>Registre des élèves</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {safeStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Aucune inscription enregistrée pour le moment.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ajoutez un premier élève pour suivre la progression mensuelle face à votre objectif.
            </p>
            <button
              type="button"
              onClick={() => setIsNewStudentModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Nouvelle inscription</span>
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span>Objectif atteint (≥ {monthlyTarget})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  <span>Sous l&apos;objectif (&lt; {monthlyTarget})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-4 border-t-2 border-dashed border-amber-500" />
                  <span>Objectif mensuel ({monthlyTarget} / mois)</span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                Moyenne : {(monthlyPerformance.totalActual / composedHorizon).toFixed(1).replace('.', ',')} / mois
              </span>
            </div>

            <div className="mt-3 h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height={256}>
                <ComposedChart
                  data={monthlyPerformance.series}
                  margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  />
                  <XAxis
                    dataKey="shortLabel"
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
                    width={36}
                  />
                  <Tooltip
                    content={<EnrollmentTargetTooltip />}
                    cursor={{
                      fill: isDark ? 'rgba(51, 65, 85, 0.28)' : 'rgba(226, 232, 240, 0.48)',
                    }}
                  />
                  <Bar
                    dataKey="actual"
                    name="Inscriptions réelles"
                    barSize={composedHorizon === 6 ? 38 : 22}
                    radius={[6, 6, 0, 0]}
                  >
                    {monthlyPerformance.series.map((entry) => (
                      <Cell
                        key={entry.monthKey}
                        fill={entry.actual >= entry.target ? '#10b981' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Objectif mensuel"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{
                      r: 3.5,
                      fill: '#f59e0b',
                      strokeWidth: 1.5,
                      stroke: isDark ? '#0f172a' : '#ffffff',
                    }}
                    activeDot={{
                      r: 5.5,
                      fill: '#d97706',
                      strokeWidth: 2,
                      stroke: isDark ? '#0f172a' : '#ffffff',
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
