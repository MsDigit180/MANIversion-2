/**
 * Utilities for formatting payment dates and preserving the exact day of payment
 * on receipts, quittances, and accounting records for Cabinet d'Appuis Scolaire MANI.
 */
import { Student } from '../types';

export function getCurrentFrenchDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getCurrentFrenchDateTime(): string {
  const now = new Date();
  const dateStr = getCurrentFrenchDate();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${dateStr} à ${hours}:${minutes}`;
}

export function formatISODateToFrench(isoDateStr: string): string {
  if (!isoDateStr) return getCurrentFrenchDate();
  try {
    const clean = isoDateStr.split('T')[0];
    const [year, month, day] = clean.split('-');
    if (year && month && day && year.length === 4) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  } catch {
    // fallback
  }
  return isoDateStr;
}

export function formatDateToFrench(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

const FRENCH_MONTH_NAME_TO_INDEX: Record<string, number> = {
  janv: 0, janvier: 0,
  fev: 1, févr: 1, fevrier: 1, février: 1,
  mars: 2,
  avr: 3, avril: 3,
  mai: 4,
  juin: 5,
  juil: 6, juillet: 6,
  aout: 7, août: 7,
  sept: 8, septembre: 8,
  oct: 9, octobre: 9,
  nov: 10, novembre: 10,
  dec: 11, déc: 11, decembre: 11, décembre: 11,
};

/**
 * Parse une date au format DD/MM/YYYY, YYYY-MM-DD ou texte français vers minuit local.
 */
export function parseFlexibleDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.split(' à ')[0].trim();
  if (!clean) return null;

  // Format DD/MM/YYYY
  const frMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const day = Number(frMatch[1]);
    const month = Number(frMatch[2]) - 1;
    const year = Number(frMatch[3]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }

  // Format YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }

  // Format texte français ex: "29 Sept. 2026" ou "29 Septembre 2026"
  const textMatch = clean.toLowerCase().match(/^(\d{1,2})\s+([a-zàâäéèêëîïôöùûüç]+)\.?\s+(\d{4})$/i);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const monthKey = textMatch[2].replace('.', '').toLowerCase();
    const monthIdx = FRENCH_MONTH_NAME_TO_INDEX[monthKey];
    const year = Number(textMatch[3]);
    if (monthIdx !== undefined) {
      const d = new Date(year, monthIdx, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

export function formatDateToISO(dateStr?: string | null): string {
  const parsed = parseFlexibleDate(dateStr);
  const d = parsed || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ensures any payment date string (including legacy 'Aujourd\'hui', ISO dates, etc.)
 * is converted to an immutable, exact calendar date for official receipts.
 */
export function formatReceiptPaymentDate(rawDate?: string): string {
  if (!rawDate) return getCurrentFrenchDateTime();

  const trimmed = rawDate.trim();
  const lower = trimmed.toLowerCase();

  const now = new Date();
  const todayStr = getCurrentFrenchDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yesterdayStr = `${yesterdayDay}/${yesterdayMonth}/${yesterday.getFullYear()}`;

  // If contains "aujourd'hui"
  if (lower.includes("aujourd'hui") || lower.includes("aujourdhui")) {
    const timeMatch = trimmed.match(/(\d{1,2}[:h]\d{2})/i);
    const timeStr = timeMatch ? timeMatch[1].replace('h', ':') : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `${todayStr} à ${timeStr}`;
  }

  // If contains "hier"
  if (lower.includes("hier")) {
    const timeMatch = trimmed.match(/(\d{1,2}[:h]\d{2})/i);
    const timeStr = timeMatch ? timeMatch[1].replace('h', ':') : '12:00';
    return `${yesterdayStr} à ${timeStr}`;
  }

  // If already formatted like DD/MM/YYYY or DD/MM/YYYY à HH:mm
  if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    return trimmed;
  }

  // If standard YYYY-MM-DD format (from input type="date")
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    const timePart = trimmed.includes('T') ? trimmed.split('T')[1].slice(0, 5) : '';
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return timePart ? `${formatted} à ${timePart}` : formatted;
  }

  // If parseable by Date
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  }

  return `${todayStr} à ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const FRENCH_MONTHS: Record<string, string> = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
};

export function formatYYYYMMToFrench(yyyyMm: string): string {
  if (!yyyyMm) return 'Septembre 2026';
  try {
    const [year, month] = yyyyMm.split('-');
    if (year && month && FRENCH_MONTHS[month]) {
      return `${FRENCH_MONTHS[month]} ${year}`;
    }
  } catch {
    // fallback
  }
  return yyyyMm;
}

/**
 * Règle métier Cab-Appuis : 1 séance d'encadrement = 1h 30mn (1.5 heure)
 */
export const SESSION_DURATION_HOURS = 1.5;

export function formatSessionHours(hours: number): string {
  if (!hours || hours <= 0) return '0h';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${String(minutes).padStart(2, '0')}mn`;
}

export function calculateWeeklyHours(sessionsCount: number): number {
  return (sessionsCount || 0) * SESSION_DURATION_HOURS;
}

export function calculateMonthlyHours(sessionsCount: number): number {
  return (sessionsCount || 0) * SESSION_DURATION_HOURS * 4;
}

/**
 * Génère la clé de mutualisation d'un élève selon la règle métier :
 * Clé = [ID_ENCADREUR] + [DISCIPLINE/MATIÈRE] + [CRÉNEAU_HORAIRE/JOUR] (ou groupe_id).
 * Si aucun groupe ni encadreur partagé n'est défini, l'élève conserve une clé individuelle unique.
 */
export function getStudentMutualizationKey(student: Student): string {
  // 1. Si un groupId explicite est défini (ex: "GRP-TERM-D-SCI", "GRP-CM2-A")
  if (student.groupId && student.groupId.trim()) {
    return `GRP_${student.groupId.trim().toUpperCase()}`;
  }

  // 2. Si encadreurs assignés par matière (Collège / Lycée)
  if (student.tutorAssignments && student.tutorAssignments.length > 0) {
    const mainAssignment = student.tutorAssignments[0];
    const tutorId = mainAssignment.tutorId || 'NOTUTOR';
    const subject = mainAssignment.subjects?.length
      ? mainAssignment.subjects.slice().sort().join('-')
      : (student.subjects?.length ? student.subjects.slice().sort().join('-') : 'GENERAL');
    const slot = student.timeSlot || student.level || 'SLOT_COMMUN';
    return `TUT_${tutorId}_SUB_${subject}_SLOT_${slot}`.toUpperCase();
  }

  // 3. Si encadreur unique référent (Primaire)
  if (student.tutorId) {
    const tutorId = student.tutorId;
    const subject = student.subjects?.length
      ? student.subjects.slice().sort().join('-')
      : 'POLYVALENT';
    const slot = student.timeSlot || student.level || 'SLOT_COMMUN';
    return `TUT_${tutorId}_SUB_${subject}_SLOT_${slot}`.toUpperCase();
  }

  // 4. Élève individuel sans encadreur ni groupe mutualisé -> Clé unique pour compter son encadrement
  return `INDIV_${student.id || student.matricule || Math.random()}`;
}

export interface AdjustedSessionVolumeResult {
  /** Total net dédoublonné des séances par semaine (ex: 12 séa) */
  adjustedSessions: number;
  /** Volume net dédoublonné en heures par semaine (ex: 18h) */
  adjustedHours: number;
  /** Total brut cumulé de tous les élèves (ex: 36 séa) */
  rawSessions: number;
  /** Volume brut cumulé en heures par semaine (ex: 54h) */
  rawHours: number;
  /** Nombre de groupes / créneaux collectifs mutualisés (> 1 élève) */
  mutualizedGroupsCount: number;
  /** Nombre total de créneaux d'encadrement uniques */
  uniqueSlotsCount: number;
}

/**
 * FONCTION DE CALCUL DÉDOUBLONNÉE (MUTUALISATION DE CRÉNEAU) :
 * Calcule le volume total net des séances et heures par semaine en dédoublonnant
 * les élèves d'un même groupe d'encadrement ou partageant le même encadreur + créneau.
 * 
 * Règle métier :
 * - 1 élève individuel -> Sa durée est comptée normalement (ex: 3 séa = 4h30).
 * - 5 élèves dans le MÊME groupe -> La séance du cours collectif n'est comptée QU'UNE SEULE FOIS (ex: 3 séa = 4h30 et non 15 séa = 22h30).
 */
export function calculateTotalVolume(students: Student[]): AdjustedSessionVolumeResult {
  let rawSessions = 0;
  const groupsMap = new Map<string, { sessions: number; count: number }>();

  for (const s of students) {
    const sSessions = s.sessionsPerWeek || 3;
    rawSessions += sSessions;

    const key = getStudentMutualizationKey(s);

    if (!groupsMap.has(key)) {
      groupsMap.set(key, { sessions: sSessions, count: 1 });
    } else {
      const existing = groupsMap.get(key)!;
      existing.count += 1;
      // Retient le volume de séance du créneau (généralement identique pour tous les membres du groupe)
      existing.sessions = Math.max(existing.sessions, sSessions);
    }
  }

  let adjustedSessions = 0;
  let mutualizedGroupsCount = 0;

  groupsMap.forEach((g) => {
    adjustedSessions += g.sessions;
    if (g.count > 1) {
      mutualizedGroupsCount += 1;
    }
  });

  const rawHours = calculateWeeklyHours(rawSessions);
  const adjustedHours = calculateWeeklyHours(adjustedSessions);

  return {
    adjustedSessions,
    adjustedHours,
    rawSessions,
    rawHours,
    mutualizedGroupsCount,
    uniqueSlotsCount: groupsMap.size,
  };
}

/** Alias requis pour conformité */
export const getAdjustedTotalSessions = calculateTotalVolume;

