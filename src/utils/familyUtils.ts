import { Student } from '../types';

/**
 * Normalise un numéro de téléphone pour la comparaison des tuteurs (supprime indicatif, espaces, tirets).
 */
export function normalizePhoneForMatching(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '').slice(-8); // Les 8 derniers chiffres (standard Niger ex: 90158844)
}

/**
 * Normalise un nom de tuteur pour la comparaison (minuscules, sans accents, sans civilité).
 */
export function normalizeGuardianName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(m\.|mme|monsieur|madame|dr\.|prof\.|dr|prof|me)\b/gi, '')
    .replace(/\((mère|pere|père|oncle|tante|tuteur|tutrice)\)/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export interface FamilyGroup {
  familyKey: string;
  guardianName: string;
  guardianPhone: string;
  students: Student[];
  totalMonthlyFee: number;
  totalPaid: number;
  totalBalance: number;
  allUpToDate: boolean;
}

/**
 * Récupère les frères et sœurs (camarades de même tuteur) inscrits pour un élève donné.
 */
export function getStudentSiblings(student: Student, allStudents: Student[]): Student[] {
  const phoneClean = normalizePhoneForMatching(student.guardianPhone);
  const nameClean = normalizeGuardianName(student.guardianName);

  return allStudents.filter((s) => {
    if (s.id === student.id) return false;

    // Match sur le numéro de téléphone (très fiable au Niger)
    if (phoneClean && phoneClean.length >= 8) {
      const otherPhoneClean = normalizePhoneForMatching(s.guardianPhone);
      if (otherPhoneClean === phoneClean) return true;
    }

    // Match sur le nom du tuteur si pas de téléphone
    if (nameClean && nameClean.length >= 4) {
      const otherNameClean = normalizeGuardianName(s.guardianName);
      if (otherNameClean === nameClean) return true;
    }

    return false;
  });
}

/**
 * Regroupe tous les élèves par tuteur / famille pour l'encaissement groupé.
 */
export function getAllFamilies(allStudents: Student[]): FamilyGroup[] {
  const familyMap = new Map<string, {
    key: string;
    guardianName: string;
    guardianPhone: string;
    students: Student[];
  }>();

  for (const s of allStudents) {
    const phoneClean = normalizePhoneForMatching(s.guardianPhone);
    const nameClean = normalizeGuardianName(s.guardianName);

    // Clé de famille prioritaire sur le téléphone
    const key = phoneClean && phoneClean.length >= 8
      ? `TEL_${phoneClean}`
      : (nameClean && nameClean.length >= 3 ? `NAME_${nameClean}` : `INDIV_${s.id}`);

    if (!familyMap.has(key)) {
      familyMap.set(key, {
        key,
        guardianName: s.guardianName || 'Tuteur Légal',
        guardianPhone: s.guardianPhone || '',
        students: [],
      });
    }

    const fam = familyMap.get(key)!;
    fam.students.push(s);
    // Prefer the cleanest guardian name
    if (s.guardianName && s.guardianName.length > fam.guardianName.length) {
      fam.guardianName = s.guardianName;
    }
    if (s.guardianPhone && !fam.guardianPhone) {
      fam.guardianPhone = s.guardianPhone;
    }
  }

  const result: FamilyGroup[] = [];
  familyMap.forEach((fam) => {
    const totalMonthlyFee = fam.students.reduce((acc, st) => acc + (st.monthlyFee || 0), 0);
    const totalPaid = fam.students.reduce((acc, st) => acc + (st.paidAmount || 0), 0);
    const totalBalance = Math.max(0, totalMonthlyFee - totalPaid);
    const allUpToDate = fam.students.every((st) => st.paymentStatus === 'A jour');

    result.push({
      familyKey: fam.key,
      guardianName: fam.guardianName,
      guardianPhone: fam.guardianPhone,
      students: fam.students,
      totalMonthlyFee,
      totalPaid,
      totalBalance,
      allUpToDate,
    });
  });

  return result.sort((a, b) => b.students.length - a.students.length);
}

/**
 * Convertit un montant en FCFA en toutes lettres (Français standard).
 */
export function numberToFrenchWords(amount: number): string {
  if (!amount || amount === 0) return 'Zéro';

  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-dix', 'Quatre-vingts', 'Quatre-vingt-dix'];

  function convertBelow100(n: number): string {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;

    if (ten === 7) {
      return `Soixante-${unit === 1 ? 'et-onze' : teens[unit]}`;
    }
    if (ten === 9) {
      return `Quatre-vingt-${teens[unit]}`;
    }
    if (unit === 0) return tens[ten];
    if (unit === 1 && ten < 8) return `${tens[ten]}-et-un`;
    return `${tens[ten]}-${units[unit]}`;
  }

  function convertBelow1000(n: number): string {
    if (n < 100) return convertBelow100(n);
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const hundredStr = hundred === 1 ? 'Cent' : `${units[hundred]} Cents`;
    if (remainder === 0) return hundredStr;
    const cleanHundred = hundred === 1 ? 'Cent' : `${units[hundred]} Cent`;
    return `${cleanHundred} ${convertBelow100(remainder)}`;
  }

  const millions = Math.floor(amount / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remainder = amount % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    parts.push(millions === 1 ? 'Un Million' : `${convertBelow1000(millions)} Millions`);
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('Mille');
    } else {
      parts.push(`${convertBelow1000(thousands)} Mille`);
    }
  }

  if (remainder > 0) {
    parts.push(convertBelow1000(remainder));
  }

  return parts.join(' ').trim();
}
