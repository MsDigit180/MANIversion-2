/**
 * Utilitaires pour la gestion et le tri des promotions d'élèves à encadrer
 * Ex: "Promotion 2026-2027", "Promotion 2025-2026"
 */

import { Student } from '../types';

export const DEFAULT_PROMOTION = 'Promotion 2026-2027';

export const PRESET_PROMOTIONS = [
  'Promotion 2027-2028',
  'Promotion 2026-2027',
  'Promotion 2025-2026',
  'Promotion 2024-2025',
  'Promotion 2023-2024',
];

/**
 * Extrait toutes les promotions uniques existantes parmi les élèves,
 * fusionnées avec les promotions prédéfinies standards.
 */
export const getAllAvailablePromotions = (students: Student[] = []): string[] => {
  const promoSet = new Set<string>(PRESET_PROMOTIONS);
  students.forEach((s) => {
    if (s.promotion && s.promotion.trim()) {
      promoSet.add(s.promotion.trim());
    }
  });
  return Array.from(promoSet).sort((a, b) => comparePromotions(b, a)); // Tri décroissant par défaut (les plus récentes en premier)
};

/**
 * Compare deux libellés de promotion pour le tri.
 * Tente d'extraire la première année numérique trouvée (ex: 2026 dans "Promotion 2026-2027").
 */
export const comparePromotions = (promoA?: string, promoB?: string): number => {
  const strA = (promoA || '').trim();
  const strB = (promoB || '').trim();

  const matchA = strA.match(/\d{4}/);
  const matchB = strB.match(/\d{4}/);

  if (matchA && matchB) {
    const yearA = parseInt(matchA[0], 10);
    const yearB = parseInt(matchB[0], 10);
    if (yearA !== yearB) {
      return yearA - yearB;
    }
  }

  return strA.localeCompare(strB, 'fr', { numeric: true });
};
