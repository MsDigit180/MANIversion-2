import { FinancialAccount, Student, PaymentReceipt, Expense, SalaryPayment, CashLoan } from '../types';
import { addDaysToDate, formatDateToFrench, formatYYYYMMToFrench, parseFlexibleDate } from './dateUtils';

/**
 * RÈGLE MÉTIER CRITIQUE : SÉPARATION DES FLUX FINANCIERS
 * 1. Frais d'inscription (admission / enregistrement uniques)
 * 2. Frais d'encadrement (scolarité / suivi périodiques)
 * 
 * Les deux comptes sont strictement cloisonnés : aucun report ni compensation mutuelle.
 */

export const SERVICE_PERIOD_DAYS = 30;
export const PAYMENT_GRACE_DAYS = 14; // 2 semaines de délai après les 30 jours de prestation
export const TOTAL_PAYMENT_DEADLINE_DAYS = SERVICE_PERIOD_DAYS + PAYMENT_GRACE_DAYS; // 44 jours

export interface StudentPaymentSchedule {
  serviceStartDate: string;
  dueDate: string; // serviceStartDate + 30 jours
  overdueDate: string; // serviceStartDate + 30 jours + 14 jours (2 semaines)
  daysElapsed: number;
  daysUntilDue: number;
  daysRemainingInGrace: number;
  daysOverdue: number;
  phase: 'paid' | 'in_service' | 'grace_period' | 'overdue';
  paymentStatus: 'A jour' | 'En attente' | 'Partiel' | 'En retard';
  isOverdue: boolean;
  remainingAmount: number;
  statusDetailLabel: string;
}

/**
 * RÈGLE DE RETARD DE PAIEMENT :
 * Un élève est considéré "En retard" SI ET SEULEMENT SI :
 * - Un solde d'encadrement reste dû (due - paid > 0), ET
 * - 30 jours se sont écoulés depuis sa date de début de prestation (`serviceStartDate`), ET
 * - Le délai de grâce de 2 semaines (14 jours) pour payer est dépassé (> 44 jours au total).
 */
export function getStudentPaymentSchedule(
  student?: Partial<Student> | null,
  referenceDate: Date = new Date()
): StudentPaymentSchedule {
  const due = Number(student?.encadrement?.due ?? student?.monthlyFee ?? 0);
  const paid = Number(student?.encadrement?.paid ?? student?.paidAmount ?? 0);
  const remainingAmount = Math.max(0, due - paid);

  const todayMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const parsedStart =
    parseFlexibleDate(student?.serviceStartDate) ||
    parseFlexibleDate(student?.enrollmentDate) ||
    todayMidnight;

  const startMidnight = new Date(
    parsedStart.getFullYear(),
    parsedStart.getMonth(),
    parsedStart.getDate()
  );

  const dueDateObj = addDaysToDate(startMidnight, SERVICE_PERIOD_DAYS);
  const overdueDateObj = addDaysToDate(startMidnight, TOTAL_PAYMENT_DEADLINE_DAYS);

  const serviceStartDate = formatDateToFrench(startMidnight);
  const dueDate = formatDateToFrench(dueDateObj);
  const overdueDate = formatDateToFrench(overdueDateObj);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.floor((todayMidnight.getTime() - startMidnight.getTime()) / msPerDay);

  if (remainingAmount <= 0 && (due > 0 || paid > 0 || due === 0)) {
    return {
      serviceStartDate,
      dueDate,
      overdueDate,
      daysElapsed,
      daysUntilDue: 0,
      daysRemainingInGrace: 0,
      daysOverdue: 0,
      phase: 'paid',
      paymentStatus: 'A jour',
      isOverdue: false,
      remainingAmount: 0,
      statusDetailLabel: 'Soldé / À jour',
    };
  }

  // En retard uniquement si 30 jours de prestation + 2 semaines (14 jours) sont dépassés
  if (daysElapsed > TOTAL_PAYMENT_DEADLINE_DAYS) {
    const daysOverdue = daysElapsed - TOTAL_PAYMENT_DEADLINE_DAYS;
    return {
      serviceStartDate,
      dueDate,
      overdueDate,
      daysElapsed,
      daysUntilDue: 0,
      daysRemainingInGrace: 0,
      daysOverdue,
      phase: 'overdue',
      paymentStatus: 'En retard',
      isOverdue: true,
      remainingAmount,
      statusDetailLabel: `Retard de ${daysOverdue}j (limite ${overdueDate})`,
    };
  }

  // Fenêtre des 2 semaines (entre J+30 et J+44 inclus)
  if (daysElapsed >= SERVICE_PERIOD_DAYS) {
    const daysRemainingInGrace = TOTAL_PAYMENT_DEADLINE_DAYS - daysElapsed;
    const status: 'Partiel' | 'En attente' = paid > 0 ? 'Partiel' : 'En attente';
    return {
      serviceStartDate,
      dueDate,
      overdueDate,
      daysElapsed,
      daysUntilDue: 0,
      daysRemainingInGrace,
      daysOverdue: 0,
      phase: 'grace_period',
      paymentStatus: status,
      isOverdue: false,
      remainingAmount,
      statusDetailLabel:
        daysRemainingInGrace === 0
          ? `Dernier jour de délai (${overdueDate})`
          : `Délai paiement : ${daysRemainingInGrace}j restant(s)`,
    };
  }

  // Période de prestation en cours (< 30 jours depuis le début de prestation)
  const daysUntilDue = SERVICE_PERIOD_DAYS - Math.max(0, daysElapsed);
  const status: 'Partiel' | 'En attente' = paid > 0 ? 'Partiel' : 'En attente';
  return {
    serviceStartDate,
    dueDate,
    overdueDate,
    daysElapsed,
    daysUntilDue,
    daysRemainingInGrace: PAYMENT_GRACE_DAYS,
    daysOverdue: 0,
    phase: 'in_service',
    paymentStatus: status,
    isOverdue: false,
    remainingAmount,
    statusDetailLabel:
      daysElapsed < 0
        ? `Débute le ${serviceStartDate}`
        : `Prestation en cours (J${daysElapsed}/30 · échéance ${dueDate})`,
  };
}

export function computeStudentPaymentStatus(
  student?: Partial<Student> | null,
  referenceDate?: Date
): 'A jour' | 'En attente' | 'Partiel' | 'En retard' {
  return getStudentPaymentSchedule(student, referenceDate).paymentStatus;
}

/**
 * Calcule le statut financier autonome d'un compte (PAID, PENDING, UNPAID)
 */
export function calculateAccountStatus(due?: number, paid?: number): 'PAID' | 'PENDING' | 'UNPAID' {
  const safeDue = Number(due ?? 0);
  const safePaid = Number(paid ?? 0);

  if (safeDue <= 0 && safePaid > 0) return 'PAID';
  if (safePaid >= safeDue && safeDue > 0) return 'PAID';
  if (safePaid > 0) return 'PENDING';
  return 'UNPAID';
}

/**
 * Vérifie si une catégorie de reçu correspond aux frais d'inscription
 */
export function isInscriptionCategory(category?: string | null): boolean {
  if (!category) return false;
  const cat = category.toLowerCase().trim();
  return cat.includes('inscription') || cat.includes('admission') || cat === 'frais d\'inscription';
}

/**
 * Vérifie si une catégorie de reçu correspond aux frais d'encadrement (scolarité périodique)
 */
export function isEncadrementCategory(category?: string | null): boolean {
  if (!category) return false;
  const cat = category.toLowerCase().trim();
  return (
    cat.includes('scolarité') ||
    cat.includes('scolarite') ||
    cat.includes('encadrement') ||
    cat.includes('mensuel') ||
    cat === 'frais d\'encadrement'
  );
}

/**
 * Récupère le compte "Frais d'inscription" d'un élève avec optional chaining sécurisé.
 * Isolation stricte : indépendant de l'encadrement.
 */
export function getInscriptionAccount(student?: Partial<Student> | null): FinancialAccount {
  const due = Number(student?.inscription?.due ?? 10000);
  const paid = Number(student?.inscription?.paid ?? 0);
  const status = student?.inscription?.status || calculateAccountStatus(due, paid);
  return { due, paid, status };
}

/**
 * Récupère le compte "Frais d'encadrement" d'un élève avec optional chaining sécurisé.
 * Isolation stricte : indépendant des frais d'inscription.
 */
export function getEncadrementAccount(student?: Partial<Student> | null): FinancialAccount {
  const due = Number(student?.encadrement?.due ?? student?.monthlyFee ?? 0);
  const paid = Number(student?.encadrement?.paid ?? student?.paidAmount ?? 0);
  const status = student?.encadrement?.status || calculateAccountStatus(due, paid);
  return { due, paid, status };
}

/**
 * Solde restant sur les frais d'inscription (due - paid, minimum 0)
 */
export function getInscriptionBalance(student?: Partial<Student> | null): number {
  const account = getInscriptionAccount(student);
  return Math.max(0, (account?.due ?? 0) - (account?.paid ?? 0));
}

/**
 * Solde restant sur les frais d'encadrement (due - paid, minimum 0)
 */
export function getEncadrementBalance(student?: Partial<Student> | null): number {
  const account = getEncadrementAccount(student);
  return Math.max(0, (account?.due ?? 0) - (account?.paid ?? 0));
}

/**
 * Badge visuel pour l'affichage de l'état d'un compte
 */
export function getFinancialStatusBadge(
  status?: string,
  student?: Partial<Student> | null,
  accountType?: 'inscription' | 'encadrement'
): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (accountType === 'encadrement' && student) {
    const schedule = getStudentPaymentSchedule(student);
    if (schedule.paymentStatus === 'A jour') {
      return {
        label: 'Soldé (Payé)',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
        dotClass: 'bg-emerald-500',
      };
    }
    if (schedule.paymentStatus === 'En retard') {
      return {
        label: `En retard (+${schedule.daysOverdue}j)`,
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
        dotClass: 'bg-rose-500',
      };
    }
    if (schedule.paymentStatus === 'Partiel') {
      return {
        label: 'Paiement Partiel',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
        dotClass: 'bg-amber-500',
      };
    }
    return {
      label: schedule.phase === 'grace_period' ? 'Délai 2 sem. en cours' : 'En attente (30j)',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
      dotClass: 'bg-sky-500',
    };
  }

  const normalized = (status || 'UNPAID').toUpperCase();

  if (normalized === 'PAID' || normalized === 'A JOUR') {
    return {
      label: 'Soldé (Payé)',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
      dotClass: 'bg-emerald-500',
    };
  }

  if (normalized === 'EN ATTENTE') {
    return {
      label: 'En attente (Dans les délais)',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
      dotClass: 'bg-sky-500',
    };
  }

  if (normalized === 'PENDING' || normalized === 'PARTIEL') {
    return {
      label: 'Paiement Partiel',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
      dotClass: 'bg-amber-500',
    };
  }

  return {
    label: 'Non Payé (Impayé)',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
    dotClass: 'bg-rose-500',
  };
}

/**
 * Informations de badge spécifiques selon le type de compte (Inscription vs Encadrement)
 */
export function getAccountStatusBadgeInfo(
  status?: string,
  accountType?: 'inscription' | 'encadrement',
  student?: Partial<Student> | null
): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (accountType === 'encadrement' && student) {
    const schedule = getStudentPaymentSchedule(student);
    if (schedule.paymentStatus === 'A jour') {
      return {
        label: 'À jour',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
        dotClass: 'bg-emerald-500',
      };
    }
    if (schedule.paymentStatus === 'En retard') {
      return {
        label: 'En retard',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
        dotClass: 'bg-rose-500',
      };
    }
    if (schedule.paymentStatus === 'Partiel') {
      return {
        label: 'Partiel',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
        dotClass: 'bg-amber-500',
      };
    }
    return {
      label: schedule.phase === 'grace_period' ? 'Délai paiement' : 'En attente',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
      dotClass: 'bg-sky-500',
    };
  }

  const normalized = (status || 'UNPAID').toUpperCase();

  if (normalized === 'PAID' || normalized === 'A JOUR') {
    return {
      label: accountType === 'inscription' ? 'Soldé' : 'À jour',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
      dotClass: 'bg-emerald-500',
    };
  }

  if (normalized === 'EN ATTENTE') {
    return {
      label: 'En attente',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-700/60',
      dotClass: 'bg-sky-500',
    };
  }

  if (normalized === 'PENDING' || normalized === 'PARTIEL') {
    return {
      label: 'Partiel',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
      dotClass: 'bg-amber-500',
    };
  }

  return {
    label: accountType === 'inscription' ? 'Non réglé' : 'En retard',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
    dotClass: 'bg-rose-500',
  };
}

// ============================================================================
// TRÉSORERIE : DÉPENSES & CAISSE (Recouvrement - Dépenses)
// ============================================================================

const FRENCH_MONTHS_LIST: Record<string, string> = {
  '01': 'janvier',
  '02': 'février',
  '03': 'mars',
  '04': 'avril',
  '05': 'mai',
  '06': 'juin',
  '07': 'juillet',
  '08': 'août',
  '09': 'septembre',
  '10': 'octobre',
  '11': 'novembre',
  '12': 'décembre',
};

export function isCashPaymentMethod(method?: string | null): boolean {
  if (!method) return false;
  return method.toLowerCase().includes('espèces') || method.toLowerCase().includes('especes');
}

/**
 * Vérifie si une date ou libellé correspond à un filtre mois YYYY-MM
 */
export function matchesTreasuryMonth(
  dateStr?: string | null,
  extraPeriodStr?: string | null,
  monthFilter: string = 'all'
): boolean {
  if (!monthFilter || monthFilter === 'all') return true;
  const [year, monthNum] = monthFilter.split('-');
  if (!year || !monthNum) return true;

  const frenchMonth = FRENCH_MONTHS_LIST[monthNum] || '';
  const dateSafe = (dateStr || '').toLowerCase();
  const extraSafe = (extraPeriodStr || '').toLowerCase();

  return (
    dateSafe.includes(monthFilter) ||
    dateSafe.includes(`${monthNum}/${year}`) ||
    (Boolean(frenchMonth) && dateSafe.includes(`${frenchMonth} ${year}`)) ||
    extraSafe.includes(monthFilter.toLowerCase()) ||
    extraSafe.includes(`${monthNum}/${year}`) ||
    (Boolean(frenchMonth) && extraSafe.includes(`${frenchMonth} ${year}`))
  );
}

export interface ConsolidatedExpenseItem {
  id: string;
  source: 'manual' | 'salaire';
  referenceNumber: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  date: string;
  beneficiary?: string;
  notes?: string;
  syncStatus: 'synced' | 'pending';
  agentName: string;
  agentRole: string;
  agentAvatar?: string;
  rawManualExpense?: Expense;
  rawSalaryPayment?: SalaryPayment;
}

export function buildConsolidatedExpenses(
  expenses: Expense[],
  salaryPayments: SalaryPayment[]
): ConsolidatedExpenseItem[] {
  const manualItems: ConsolidatedExpenseItem[] = (expenses || []).map((exp) => ({
    id: exp.id,
    source: 'manual',
    referenceNumber: exp.expenseNumber,
    title: exp.title,
    category: exp.category,
    amount: Number(exp.amount || 0),
    paymentMethod: exp.paymentMethod || 'Espèces',
    date: exp.expenseDate,
    beneficiary: exp.beneficiary,
    notes: exp.notes,
    syncStatus: exp.syncStatus || 'synced',
    agentName: exp.agentName,
    agentRole: exp.agentRole,
    agentAvatar: exp.agentAvatar,
    rawManualExpense: exp,
  }));

  const salaryItems: ConsolidatedExpenseItem[] = (salaryPayments || []).map((sal) => ({
    id: sal.id,
    source: 'salaire',
    referenceNumber: sal.paymentNumber,
    title: `Salaire Encadreur · ${sal.tutorName}`,
    category: `Salaires & Rémunérations (${sal.month})`,
    amount: Number(sal.amount || 0),
    paymentMethod: sal.paymentMethod || 'Espèces',
    date: sal.paymentDate,
    beneficiary: `${sal.tutorName} (${sal.tutorMatricule})`,
    notes: sal.notes,
    syncStatus: sal.syncStatus || 'synced',
    agentName: sal.agentName,
    agentRole: sal.agentRole,
    agentAvatar: sal.agentAvatar,
    rawSalaryPayment: sal,
  }));

  const extractTimestamp = (id: string): number => {
    const match = id.match(/(\d{10,})/);
    return match ? Number(match[1]) : 0;
  };

  return [...manualItems, ...salaryItems].sort((a, b) => extractTimestamp(b.id) - extractTimestamp(a.id));
}

export interface TreasurySummary {
  totalRecovery: number;
  recoveryEncadrement: number;
  recoveryInscription: number;
  recoveryOther: number;
  recoveryCash: number;
  recoveryDigital: number;
  manualExpensesTotal: number;
  salaryExpensesTotal: number;
  totalExpenses: number;
  expensesCash: number;
  expensesDigital: number;
  loansGrantedTotal: number;
  loansRepaidTotal: number;
  outstandingLoansTotal: number;
  loansCashOut: number;
  loansDigitalOut: number;
  loansCashIn: number;
  loansDigitalIn: number;
  activeLoansCount: number;
  netCashBalance: number;
  netPhysicalCash: number;
  netDigitalBalance: number;
  manualExpensesCount: number;
  salaryExpensesCount: number;
}

export function calculateTreasurySummary(
  payments: PaymentReceipt[],
  expenses: Expense[],
  salaryPayments: SalaryPayment[],
  monthFilter: string = 'all',
  cashLoans: CashLoan[] = []
): TreasurySummary {
  const validPayments = (payments || []).filter(
    (p) => p && p.status !== 'Annulé' && matchesTreasuryMonth(p.paymentDate, p.notes, monthFilter)
  );
  const filteredExpenses = (expenses || []).filter(
    (e) => e && matchesTreasuryMonth(e.expenseDate, e.notes, monthFilter)
  );
  const filteredSalaries = (salaryPayments || []).filter(
    (s) => s && matchesTreasuryMonth(s.paymentDate, s.month, monthFilter)
  );

  let totalRecovery = 0;
  let recoveryEncadrement = 0;
  let recoveryInscription = 0;
  let recoveryOther = 0;
  let recoveryCash = 0;
  let recoveryDigital = 0;

  for (const p of validPayments) {
    const amt = Number(p.amount || 0);
    totalRecovery += amt;
    if (isEncadrementCategory(p.category)) {
      recoveryEncadrement += amt;
    } else if (isInscriptionCategory(p.category)) {
      recoveryInscription += amt;
    } else {
      recoveryOther += amt;
    }

    if (isCashPaymentMethod(p.paymentMethod)) {
      recoveryCash += amt;
    } else {
      recoveryDigital += amt;
    }
  }

  let manualExpensesTotal = 0;
  let salaryExpensesTotal = 0;
  let expensesCash = 0;
  let expensesDigital = 0;

  for (const e of filteredExpenses) {
    const amt = Number(e.amount || 0);
    manualExpensesTotal += amt;
    if (isCashPaymentMethod(e.paymentMethod)) {
      expensesCash += amt;
    } else {
      expensesDigital += amt;
    }
  }

  for (const s of filteredSalaries) {
    const amt = Number(s.amount || 0);
    salaryExpensesTotal += amt;
    if (isCashPaymentMethod(s.paymentMethod)) {
      expensesCash += amt;
    } else {
      expensesDigital += amt;
    }
  }

  let loansGrantedTotal = 0;
  let loansRepaidTotal = 0;
  let loansCashOut = 0;
  let loansDigitalOut = 0;
  let loansCashIn = 0;
  let loansDigitalIn = 0;
  let activeLoansCount = 0;

  for (const loan of cashLoans || []) {
    if (!loan) continue;
    if (loan.status !== 'Remboursé' && Number(loan.remainingAmount || 0) > 0) {
      activeLoansCount += 1;
    }

    if (matchesTreasuryMonth(loan.loanDate, loan.notes, monthFilter)) {
      const amt = Number(loan.principalAmount || 0);
      loansGrantedTotal += amt;
      if (isCashPaymentMethod(loan.paymentMethod)) {
        loansCashOut += amt;
      } else {
        loansDigitalOut += amt;
      }
    }

    for (const rep of loan.repayments || []) {
      if (!rep) continue;
      if (matchesTreasuryMonth(rep.repaymentDate, rep.notes, monthFilter)) {
        const repAmt = Number(rep.amount || 0);
        loansRepaidTotal += repAmt;
        if (isCashPaymentMethod(rep.paymentMethod)) {
          loansCashIn += repAmt;
        } else {
          loansDigitalIn += repAmt;
        }
      }
    }
  }

  const totalExpenses = manualExpensesTotal + salaryExpensesTotal;
  const outstandingLoansTotal = Math.max(0, loansGrantedTotal - loansRepaidTotal);
  const netCashBalance = totalRecovery - totalExpenses - loansGrantedTotal + loansRepaidTotal;
  const netPhysicalCash = recoveryCash - expensesCash - loansCashOut + loansCashIn;
  const netDigitalBalance = recoveryDigital - expensesDigital - loansDigitalOut + loansDigitalIn;

  return {
    totalRecovery,
    recoveryEncadrement,
    recoveryInscription,
    recoveryOther,
    recoveryCash,
    recoveryDigital,
    manualExpensesTotal,
    salaryExpensesTotal,
    totalExpenses,
    expensesCash,
    expensesDigital,
    loansGrantedTotal,
    loansRepaidTotal,
    outstandingLoansTotal,
    loansCashOut,
    loansDigitalOut,
    loansCashIn,
    loansDigitalIn,
    activeLoansCount,
    netCashBalance,
    netPhysicalCash,
    netDigitalBalance,
    manualExpensesCount: filteredExpenses.length,
    salaryExpensesCount: filteredSalaries.length,
  };
}

export interface MonthlyCollectionPoint {
  monthKey: string; // YYYY-MM
  shortLabel: string; // e.g. "Nov. 26"
  axisLabel: string; // e.g. "Nov."
  fullLabel: string; // e.g. "Novembre 2026"
  total: number;
  encadrement: number;
  inscription: number;
  other: number;
  receiptCount: number;
  changePercent: number | null;
}

const SHORT_FRENCH_MONTHS = [
  'Janv.',
  'Fév.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
];

const FULL_FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function getPaymentYearMonth(payment?: Partial<PaymentReceipt> | null): string | null {
  if (!payment?.paymentDate) return null;
  const parsed = parseFlexibleDate(payment.paymentDate);
  if (parsed) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  }

  const isoMatch = payment.paymentDate.match(/(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;

  const frMatch = payment.paymentDate.match(/(\d{2})\/(\d{4})/);
  if (frMatch) return `${frMatch[2]}-${frMatch[1]}`;

  return null;
}

export function buildMonthlyCollectionsSeries(
  payments: PaymentReceipt[],
  monthsCount: number = 6,
  referenceDate: Date = new Date()
): MonthlyCollectionPoint[] {
  const safeCount = Math.max(1, monthsCount);
  const buckets: MonthlyCollectionPoint[] = [];
  const bucketMap = new Map<string, MonthlyCollectionPoint>();

  for (let offset = safeCount - 1; offset >= 0; offset--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const point: MonthlyCollectionPoint = {
      monthKey,
      axisLabel: SHORT_FRENCH_MONTHS[monthIndex],
      shortLabel: `${SHORT_FRENCH_MONTHS[monthIndex]} ${String(year).slice(-2)}`,
      fullLabel: `${FULL_FRENCH_MONTHS[monthIndex]} ${year}`,
      total: 0,
      encadrement: 0,
      inscription: 0,
      other: 0,
      receiptCount: 0,
      changePercent: null,
    };
    buckets.push(point);
    bucketMap.set(monthKey, point);
  }

  for (const p of payments || []) {
    if (!p || p.status === 'Annulé') continue;
    const amt = Number(p.amount || 0);
    if (amt <= 0) continue;

    let key = getPaymentYearMonth(p);
    if (!key || !bucketMap.has(key)) {
      const matched = buckets.find((b) => matchesTreasuryMonth(p.paymentDate, p.notes, b.monthKey));
      key = matched?.monthKey || null;
    }

    if (!key) continue;
    const target = bucketMap.get(key);
    if (!target) continue;

    target.total += amt;
    target.receiptCount += 1;

    if (isEncadrementCategory(p.category)) {
      target.encadrement += amt;
    } else if (isInscriptionCategory(p.category)) {
      target.inscription += amt;
    } else {
      target.other += amt;
    }
  }

  for (let i = 1; i < buckets.length; i++) {
    const prev = buckets[i - 1].total;
    const curr = buckets[i].total;
    if (prev > 0) {
      buckets[i].changePercent = Math.round(((curr - prev) / prev) * 1000) / 10;
    } else if (curr > 0) {
      buckets[i].changePercent = 100;
    } else {
      buckets[i].changePercent = null;
    }
  }

  return buckets;
}

const FRENCH_MONTH_LOOKUP: Array<{ pattern: RegExp; month: string }> = [
  { pattern: /\bjanv(?:ier)?\.?\b/i, month: '01' },
  { pattern: /\bf[eé]vr?(?:ier)?\.?\b/i, month: '02' },
  { pattern: /\bmars\b/i, month: '03' },
  { pattern: /\bavr(?:il)?\.?\b/i, month: '04' },
  { pattern: /\bmai\b/i, month: '05' },
  { pattern: /\bjuin\b/i, month: '06' },
  { pattern: /\bjuil(?:let)?\.?\b/i, month: '07' },
  { pattern: /\bao[uû]t\b/i, month: '08' },
  { pattern: /\bsept(?:embre)?\.?\b/i, month: '09' },
  { pattern: /\boct(?:obre)?\.?\b/i, month: '10' },
  { pattern: /\bnov(?:embre)?\.?\b/i, month: '11' },
  { pattern: /\bd[eé]c(?:embre)?\.?\b/i, month: '12' },
];

export function normalizeYearMonthString(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Format YYYY-MM
  const isoMatch = trimmed.match(/\b(\d{4})-(0[1-9]|1[0-2])\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`;
  }

  // Format MM/YYYY
  const slashMatch = trimmed.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);
  if (slashMatch) {
    return `${slashMatch[2]}-${slashMatch[1]}`;
  }

  // Format texte français: "Mois de Novembre 2026" ou "Octobre 2026"
  const yearMatch = trimmed.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    for (const entry of FRENCH_MONTH_LOOKUP) {
      if (entry.pattern.test(trimmed)) {
        return `${yearMatch[1]}-${entry.month}`;
      }
    }
  }

  return null;
}

/**
 * Détermine le mois réglé (YYYY-MM) pour un reçu de paiement.
 * Priorité : champ explicite `coveredMonth` > legacy `monthCovered`/`month` > notes ("Mois de ...")
 * > items fratrie > repli sur la date de paiement pour les règlements mensuels d'encadrement.
 */
export function getPaymentCoveredMonthKey(
  payment?: Partial<PaymentReceipt> | null
): string | null {
  if (!payment) return null;

  const explicit =
    normalizeYearMonthString(payment.coveredMonth) ||
    normalizeYearMonthString((payment as any).monthCovered) ||
    normalizeYearMonthString((payment as any).month);
  if (explicit) return explicit;

  const fromNotes = normalizeYearMonthString(payment.notes);
  if (fromNotes) return fromNotes;

  if (Array.isArray(payment.studentBreakdown)) {
    for (const item of payment.studentBreakdown) {
      const fromItem =
        normalizeYearMonthString(item?.coveredMonth) ||
        normalizeYearMonthString(item?.notes);
      if (fromItem) return fromItem;
    }
  }

  const catLower = (payment.category || '').toLowerCase();
  const isMonthly =
    isEncadrementCategory(payment.category) ||
    catLower.includes('mensuel') ||
    catLower.includes('scolarit');

  if (isMonthly) {
    return getPaymentYearMonth(payment);
  }

  return null;
}

export function getPaymentCoveredMonthSortKey(
  payment?: Partial<PaymentReceipt> | null
): string {
  return getPaymentCoveredMonthKey(payment) || getPaymentYearMonth(payment) || '';
}

export function formatPaymentCoveredMonthLabel(
  payment?: Partial<PaymentReceipt> | null
): string {
  const key = getPaymentCoveredMonthKey(payment);
  if (key) return formatYYYYMMToFrench(key);
  if (isInscriptionCategory(payment?.category)) return 'Admission unique';
  return 'Ponctuel';
}


