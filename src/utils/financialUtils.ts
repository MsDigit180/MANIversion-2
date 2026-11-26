import { FinancialAccount, Student, PaymentReceipt, Expense, SalaryPayment } from '../types';

/**
 * RÈGLE MÉTIER CRITIQUE : SÉPARATION DES FLUX FINANCIERS
 * 1. Frais d'inscription (admission / enregistrement uniques)
 * 2. Frais d'encadrement (scolarité / suivi périodiques)
 * 
 * Les deux comptes sont strictement cloisonnés : aucun report ni compensation mutuelle.
 */

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
export function getFinancialStatusBadge(status?: string): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  const normalized = (status || 'UNPAID').toUpperCase();

  if (normalized === 'PAID' || normalized === 'A JOUR') {
    return {
      label: 'Soldé (Payé)',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
      dotClass: 'bg-emerald-500',
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
  accountType?: 'inscription' | 'encadrement'
): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  const normalized = (status || 'UNPAID').toUpperCase();

  if (normalized === 'PAID' || normalized === 'A JOUR') {
    return {
      label: accountType === 'inscription' ? 'Soldé' : 'À jour',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
      dotClass: 'bg-emerald-500',
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
  monthFilter: string = 'all'
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

  const totalExpenses = manualExpensesTotal + salaryExpensesTotal;
  const netCashBalance = totalRecovery - totalExpenses;
  const netPhysicalCash = recoveryCash - expensesCash;
  const netDigitalBalance = recoveryDigital - expensesDigital;

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
    netCashBalance,
    netPhysicalCash,
    netDigitalBalance,
    manualExpensesCount: filteredExpenses.length,
    salaryExpensesCount: filteredSalaries.length,
  };
}

