/**
 * Utilities for formatting payment dates and preserving the exact day of payment
 * on receipts, quittances, and accounting records for Cabinet d'Appuis Scolaire MANI.
 */

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
    const [year, month, day] = isoDateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  } catch {
    // fallback
  }
  return isoDateStr;
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
