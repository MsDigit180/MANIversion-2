import {
  Student,
  PaymentReceipt,
  ExamApplication,
  InventoryItem,
  SupplySale,
  OperationItem,
  PriorityAlert,
  Agent,
  Tutor,
} from '../types';

/**
 * ARCHITECTURE BACK-END STRICTE : NO MOCK / NO SEED POLICY
 *
 * 1. INTERDICTION DE MOCKING : Aucun jeu de données de test (mock data, seed data, dummy payload)
 *    n'est généré ou injecté dans Firebase.
 * 2. ÉTAT INITIAL VIDE : Si la base ou une collection est vide, elle demeure vide ([]).
 * 3. MUTATION EXCLUSIVEMENT UTILISATEUR : Seuls des payloads réels transmis par l'utilisateur
 *    ou le back-office déclenchent des écritures.
 * 4. PAS DE LOGIQUE DE FALLBACK AUTOMATIQUE : Aucune auto-initialisation au boot/rechargement.
 */

export const SEED_AGENTS: Agent[] = [];
export const SEED_TUTORS: Tutor[] = [];
export const SEED_STUDENTS: Student[] = [];
export const SEED_PAYMENTS: PaymentReceipt[] = [];
export const SEED_EXAMS: ExamApplication[] = [];
export const SEED_INVENTORY: InventoryItem[] = [];
export const SEED_SUPPLY_SALES: SupplySale[] = [];
export const SEED_OPERATIONS: OperationItem[] = [];
export const SEED_ALERTS: PriorityAlert[] = [];

/**
 * Neutralized migration function conforming to strict NO MOCK / NO SEED policy.
 * Preserves initial empty state and never injects fictitious data into Firestore.
 */
export async function seedInitialFirestoreData(): Promise<{ success: boolean; count: number }> {
  // Conforme à la règle : Ne génère, n'injecte et n'exécute JAMAIS de jeux de données fictifs.
  return { success: true, count: 0 };
}
