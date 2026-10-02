import { Student, MonthlyInvoice, InvoiceStudentItem } from '../types';
import { formatYYYYMMToFrench } from './dateUtils';
import { getAllFamilies, normalizePhoneForMatching, normalizeGuardianName } from './familyUtils';

/**
 * Génère l'ensemble des factures / avis d'échéance mensuels pour un mois donné (ex: "2026-10").
 * Regroupe automatiquement par famille pour les tuteurs ayant plusieurs enfants inscrits.
 */
export function generateMonthlyInvoices(
  students: Student[],
  monthYYYYMM: string,
  options?: {
    dueDateDay?: number;
    groupByFamily?: boolean;
  }
): MonthlyInvoice[] {
  const { dueDateDay = 10, groupByFamily = true } = options || {};
  const [yearStr, monthStr] = (monthYYYYMM || '2026-10').split('-');
  const monthLabel = formatYYYYMMToFrench(monthYYYYMM || '2026-10');

  const issueDate = `01/${monthStr}/${yearStr}`;
  const dueDate = `${String(dueDateDay).padStart(2, '0')}/${monthStr}/${yearStr}`;

  // Date actuelle pour détecter les retards
  const today = new Date();
  const dueDateTime = new Date(`${yearStr}-${monthStr}-${String(dueDateDay).padStart(2, '0')}T23:59:59`);
  const isPastDue = today > dueDateTime;

  const invoices: MonthlyInvoice[] = [];

  if (groupByFamily) {
    const families = getAllFamilies(students);
    let invoiceCounter = 1;

    for (const fam of families) {
      // Élèves de cette famille
      const studentItems: InvoiceStudentItem[] = fam.students.map((st) => {
        const remaining = Math.max(0, st.monthlyFee - st.paidAmount);
        return {
          studentId: st.id,
          studentMatricule: st.matricule,
          studentName: st.fullName,
          level: st.level,
          stream: st.stream,
          subjects: st.subjects || [],
          sessionsPerWeek: st.sessionsPerWeek || 3,
          monthlyFee: st.monthlyFee,
          paidAmount: st.paidAmount,
          balanceRemaining: remaining,
          tutoringStatus: st.tutoringStatus,
        };
      });

      const totalMonthlyFee = studentItems.reduce((acc, it) => acc + it.monthlyFee, 0);
      const totalPaid = studentItems.reduce((acc, it) => acc + it.paidAmount, 0);
      const netDue = Math.max(0, totalMonthlyFee - totalPaid);

      let status: MonthlyInvoice['status'] = 'En attente';
      if (totalPaid >= totalMonthlyFee && totalMonthlyFee > 0) {
        status = 'Payée';
      } else if (totalPaid > 0) {
        status = 'Partielle';
      } else if (isPastDue) {
        status = 'En retard';
      }

      const invoiceNum = `FAC-${yearStr}-${monthStr}-${String(invoiceCounter).padStart(4, '0')}`;
      invoiceCounter++;

      invoices.push({
        id: `inv-${monthYYYYMM}-${fam.familyKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        invoiceNumber: invoiceNum,
        month: monthYYYYMM,
        monthLabel,
        issueDate,
        dueDate,
        guardianName: fam.guardianName,
        guardianPhone: fam.guardianPhone,
        isFamilyInvoice: fam.students.length > 1,
        studentItems,
        totalMonthlyFee,
        totalPaid,
        netDue,
        status,
        notes:
          fam.students.length > 1
            ? `Facture groupée fratrie couvrant ${fam.students.length} enfants inscrits.`
            : `Scolarité mensuelle pour ${fam.students[0]?.fullName || 'élève'}.`,
        createdAt: issueDate,
      });
    }
  } else {
    // Mode individuel strict (1 facture par élève)
    students.forEach((st, idx) => {
      const remaining = Math.max(0, st.monthlyFee - st.paidAmount);
      const studentItems: InvoiceStudentItem[] = [
        {
          studentId: st.id,
          studentMatricule: st.matricule,
          studentName: st.fullName,
          level: st.level,
          stream: st.stream,
          subjects: st.subjects || [],
          sessionsPerWeek: st.sessionsPerWeek || 3,
          monthlyFee: st.monthlyFee,
          paidAmount: st.paidAmount,
          balanceRemaining: remaining,
          tutoringStatus: st.tutoringStatus,
        },
      ];

      const totalMonthlyFee = st.monthlyFee;
      const totalPaid = st.paidAmount;
      const netDue = remaining;

      let status: MonthlyInvoice['status'] = 'En attente';
      if (totalPaid >= totalMonthlyFee) {
        status = 'Payée';
      } else if (totalPaid > 0) {
        status = 'Partielle';
      } else if (isPastDue) {
        status = 'En retard';
      }

      const invoiceNum = `FAC-${yearStr}-${monthStr}-${String(idx + 1).padStart(4, '0')}`;

      invoices.push({
        id: `inv-${monthYYYYMM}-${st.id}`,
        invoiceNumber: invoiceNum,
        month: monthYYYYMM,
        monthLabel,
        issueDate,
        dueDate,
        guardianName: st.guardianName,
        guardianPhone: st.guardianPhone,
        isFamilyInvoice: false,
        studentItems,
        totalMonthlyFee,
        totalPaid,
        netDue,
        status,
        notes: `Scolarité mensuelle pour ${st.fullName} (${st.level}).`,
        createdAt: issueDate,
      });
    });
  }

  // Sort by netDue descending (impayés en premier) puis par nom
  return invoices.sort((a, b) => b.netDue - a.netDue || a.guardianName.localeCompare(b.guardianName));
}

/**
 * Génère la facture mensuelle pour un élève spécifique.
 */
export function generateSingleStudentInvoice(
  student: Student,
  monthYYYYMM: string,
  options?: { dueDateDay?: number }
): MonthlyInvoice {
  const { dueDateDay = 10 } = options || {};
  const [yearStr, monthStr] = (monthYYYYMM || '2026-10').split('-');
  const monthLabel = formatYYYYMMToFrench(monthYYYYMM || '2026-10');
  const issueDate = `01/${monthStr}/${yearStr}`;
  const dueDate = `${String(dueDateDay).padStart(2, '0')}/${monthStr}/${yearStr}`;

  const remaining = Math.max(0, student.monthlyFee - student.paidAmount);
  const studentItems: InvoiceStudentItem[] = [
    {
      studentId: student.id,
      studentMatricule: student.matricule,
      studentName: student.fullName,
      level: student.level,
      stream: student.stream,
      subjects: student.subjects || [],
      sessionsPerWeek: student.sessionsPerWeek || 3,
      monthlyFee: student.monthlyFee,
      paidAmount: student.paidAmount,
      balanceRemaining: remaining,
      tutoringStatus: student.tutoringStatus,
    },
  ];

  let status: MonthlyInvoice['status'] = 'En attente';
  if (student.paidAmount >= student.monthlyFee) {
    status = 'Payée';
  } else if (student.paidAmount > 0) {
    status = 'Partielle';
  }

  return {
    id: `inv-${monthYYYYMM}-${student.id}`,
    invoiceNumber: `FAC-${yearStr}-${monthStr}-${student.matricule.replace(/[^a-zA-Z0-9]/g, '')}`,
    month: monthYYYYMM,
    monthLabel,
    issueDate,
    dueDate,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    isFamilyInvoice: false,
    studentItems,
    totalMonthlyFee: student.monthlyFee,
    totalPaid: student.paidAmount,
    netDue: remaining,
    status,
    notes: `Facture de scolarité pour ${student.fullName} (${student.level}).`,
    createdAt: issueDate,
  };
}

/**
 * Génère le message WhatsApp officiel formaté pour le parent d'élève.
 */
export function generateWhatsAppInvoiceMessage(invoice: MonthlyInvoice): string {
  const studentsList = invoice.studentItems
    .map(
      (st) =>
        `• *${st.studentName}* (${st.level}) : Mensualité ${st.monthlyFee.toLocaleString()} FCFA${
          st.paidAmount > 0 ? ` (Déjà réglé : ${st.paidAmount.toLocaleString()} FCFA)` : ''
        }`
    )
    .join('\n');

  const paymentChannels = `📱 *Modes de règlement agréés :*
- *Dépôt MyNita :* +227 92 28 57 37
- *Dépôt Amana Transfert :* +227 92 28 57 37
- *Caisse physique :* Siège Cab-Appuis (Quartier Niamey 2000)`;

  return `*CABINET D'APPUIS SCOLAIRE MANI (CAB-APPUIS)*
Niamey 2000 · NIF: 153633/P · RCCM: NE-NIM-A10-05126

Cher(e) *${invoice.guardianName}*,

Veuillez trouver ci-dessous l'avis d'échéance / facture de scolarité pour le mois de *${invoice.monthLabel}* :

📄 *Réf Facture :* ${invoice.invoiceNumber}
📅 *Date limite de paiement :* ${invoice.dueDate}

👤 *Détail des enfants inscrits :*
${studentsList}

💰 *Montant Total Facturé :* ${invoice.totalMonthlyFee.toLocaleString()} FCFA
${invoice.totalPaid > 0 ? `💵 *Total Déjà Versé :* ${invoice.totalPaid.toLocaleString()} FCFA\n` : ''}👉 *NET À PAYER :* *${invoice.netDue.toLocaleString()} FCFA*

${paymentChannels}

_Merci d'indiquer le nom de l'élève ou le N° de facture lors de votre dépôt MyNita / Amana (+227 92285737) pour validation instantanée de votre reçu officiel._

📞 Info & Support Caisse : +227 92 28 57 37 / 91 58 44 59
Cabinet MANI — L'excellence de l'encadrement à vos côtés.`;
}

/**
 * Génère le texte SMS officiel court et percutant.
 */
export function generateSMSInvoiceMessage(invoice: MonthlyInvoice): string {
  const childrenNames = invoice.studentItems.map((s) => s.studentName.split(' ')[0]).join(' & ');
  return `CAB-APPUIS: Facture ${invoice.monthLabel} (Réf ${invoice.invoiceNumber}) pour ${childrenNames}. Net a payer: ${invoice.netDue.toLocaleString()} FCFA avant le ${invoice.dueDate}. Depot MyNita ou Amana au: +227 92285737. Merci.`;
}

/**
 * Crée le lien direct d'ouverture WhatsApp Web/App avec le numéro du parent au Niger.
 */
export function getWhatsAppDirectLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  let fullInternationalPhone = cleanPhone;

  // Si commence sans indicatif Niger (ex: 90158844 -> 22790158844)
  if (cleanPhone.length === 8) {
    fullInternationalPhone = `227${cleanPhone}`;
  } else if (cleanPhone.startsWith('00227')) {
    fullInternationalPhone = cleanPhone.slice(2);
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullInternationalPhone}?text=${encodedMessage}`;
}

/**
 * Exporte la liste des factures mensuelles en fichier CSV téléchargeable.
 */
export function exportInvoicesToCSV(invoices: MonthlyInvoice[], monthLabel: string): void {
  const headers = [
    'N° Facture',
    'Mois',
    'Tuteur / Parent Payeur',
    'Téléphone Tuteur',
    'Type Facture',
    'Nombre Enfants',
    'Noms des Enfants',
    'Total Facturé (FCFA)',
    'Total Déjà Payé (FCFA)',
    'Net Dû (FCFA)',
    'Date Échéance',
    'Statut Facture',
  ];

  const rows = invoices.map((inv) => {
    const childrenNames = inv.studentItems.map((s) => `${s.studentName} (${s.level})`).join(' ; ');
    return [
      `"${inv.invoiceNumber}"`,
      `"${inv.monthLabel}"`,
      `"${inv.guardianName.replace(/"/g, '""')}"`,
      `"${inv.guardianPhone}"`,
      `"${inv.isFamilyInvoice ? 'Facture Groupée Famille' : 'Facture Individuelle'}"`,
      inv.studentItems.length,
      `"${childrenNames.replace(/"/g, '""')}"`,
      inv.totalMonthlyFee,
      inv.totalPaid,
      inv.netDue,
      `"${inv.dueDate}"`,
      `"${inv.status}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Factures_Scolarite_Cab_Appuis_${monthLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
