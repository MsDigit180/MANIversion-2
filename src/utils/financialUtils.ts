import { FinancialAccount, Student, PaymentReceipt } from '../types';

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
