import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../assets/logo';
import { Student, Tutor, PaymentReceipt, MonthlyInvoice, TutoringGroup, GroupRecord } from '../types';
import { numberToFrenchWords } from './familyUtils';
import { formatReceiptPaymentDate, formatSessionHours } from './dateUtils';
import { calculateTutorWeeklySessions } from './tutorAssignmentValidation';
import { extractTutoringGroups } from './groupUtils';

/**
 * Cache pour le logo CAS-MANI en Base64 PNG pour une réutilisation instantanée
 */
let cachedLogoDataUrl: string | null = null;

/**
 * Charge de manière fiable le logo CAS-MANI et le convertit en Base64 PNG
 * compatible avec doc.addImage(...) de jsPDF sans aucun problème de CORS.
 */
export const getLogoDataUrl = async (): Promise<string | null> => {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 200;
          canvas.height = img.naturalHeight || img.height || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            cachedLogoDataUrl = dataUrl;
            resolve(dataUrl);
            return;
          }
        } catch (e) {
          console.warn('Canvas conversion error for logo:', e);
        }
        resolve(CAB_APPUIS_LOGO);
      };
      img.onerror = () => {
        console.warn('Could not load logo image');
        resolve(null);
      };
      img.src = CAB_APPUIS_LOGO;
    } catch {
      resolve(null);
    }
  });
};

/**
 * Génère un nom de fichier unique et distinct pour chaque document téléchargé.
 * Inclut : préfixe, détails contextuels nettoyés, date YYYYMMDD, heure HHMMSS et sel aléatoire.
 * Exemple: cas_mani_liste_eleves_college_20261017_163820_9a4f.pdf
 */
export const generateUniqueDocumentFileName = (
  prefix: string,
  details?: string
): string => {
  const sanitize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // suppression accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const randSalt = Math.random().toString(36).substring(2, 6);

  const cleanPrefix = sanitize(prefix) || 'document';
  const cleanDetails = details ? sanitize(details).slice(0, 30) : '';

  const parts = [
    'cas_mani',
    cleanPrefix,
    cleanDetails,
    `${year}${month}${day}`,
    `${hours}${mins}${secs}_${randSalt}`,
  ].filter(Boolean);

  return `${parts.join('_')}.pdf`;
};

/**
 * Dessine l'en-tête officiel du Cabinet MANI avec son logo sur un document jsPDF
 */
export const drawOfficialHeader = (
  doc: jsPDF,
  logoDataUrl: string | null,
  title: string,
  metaLine: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    subtitle?: string;
  }
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const isLandscape = options?.orientation === 'landscape';

  // 1. Logo du Cabinet CAS-MANI à gauche
  const logoX = 14;
  const logoY = 10;
  const logoSize = 16;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Error adding logo to PDF:', e);
    }
  }

  // 2. Coordonnées officielles du Cabinet
  const textX = logoDataUrl ? 33 : 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 27, 75); // Indigo foncé / CAS-MANI navy
  doc.text("CABINET D'APPUIS SCOLAIRE MANI (CAS-MANI)", textX, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Ministère de l'Éducation Nationale · Direction Régionale des Enseignements de Niamey (DREN)",
    textX,
    18.5
  );
  doc.text(
    "Quartier Niamey 2000 (Niger) · NIF: 153633/P · RCCM: NE-NIM-A10-05126 · Tél: +227 91 58 44 59 / 96 16 51 81",
    textX,
    22.5
  );

  // 3. Bloc titre à droite ou centré
  if (!isLandscape) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), textX, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(metaLine, textX, 32);

    if (options?.subtitle) {
      doc.text(options.subtitle, textX, 35.5);
    }

    // Ligne de séparation
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, options?.subtitle ? 38 : 35, pageWidth - 14, options?.subtitle ? 38 : 35);
  } else {
    // Mode Paysage : En-tête large
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), textX, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(metaLine, textX, 32);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, 35, pageWidth - 14, 35);
  }
};

/**
 * Applique le pied de page officiel avec la numérotation "Page X sur Y"
 */
export const applyPageFooters = (doc: jsPDF) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Cabinet d'Appuis Scolaire MANI (CAS-MANI) — Document Officiel · Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }
};

// ============================================================================
// 1. TÉLÉCHARGEMENT PDF : LISTE DE TOUS LES ÉLÈVES
// ============================================================================
export const downloadStudentListPDF = async (
  students: Student[],
  title = 'LISTE DE TOUS LES ÉLÈVES',
  subtitle?: string,
  campusName?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoDataUrl = await getLogoDataUrl();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const metaLine = `Date d'édition : ${dateStr} · Effectif total : ${students.length} élève${
    students.length > 1 ? 's' : ''
  }${campusName ? ` · Centre : ${campusName}` : ''}`;

  drawOfficialHeader(doc, logoDataUrl, title, metaLine, { subtitle });

  // Tableau avec les 4 colonnes requises
  const tableData = students.map((stu, index) => {
    const subjectsStr =
      Array.isArray(stu.subjects) && stu.subjects.length > 0
        ? stu.subjects.join(', ')
        : typeof stu.subjects === 'string' && stu.subjects
        ? stu.subjects
        : stu.stream === 'Primaire'
        ? 'Toutes les matières'
        : 'Toutes les matières';

    const guardianName = (stu.guardianName || '').trim();
    const guardianPhone = (stu.guardianPhone || '').trim();
    let guardianInfo = 'Non renseigné';
    if (guardianName && guardianPhone) {
      guardianInfo = `${guardianName} / ${guardianPhone}`;
    } else if (guardianName) {
      guardianInfo = guardianName;
    } else if (guardianPhone) {
      guardianInfo = guardianPhone;
    }

    const levelStr = stu.level || stu.stream || 'Non spécifié';

    return [
      (index + 1).toString(),
      (stu.fullName || '').toUpperCase(),
      levelStr,
      subjectsStr,
      guardianInfo,
    ];
  });

  autoTable(doc, {
    startY: subtitle ? 42 : 38,
    head: [['N°', "Nom complet de l'élève", 'Niveau', 'Matières', 'Tuteur légal / Numéro']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 27, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 54, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 42 },
      4: { cellWidth: 44 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 14, right: 14, bottom: 14, left: 14 },
  });

  applyPageFooters(doc);

  const filename = generateUniqueDocumentFileName('liste_eleves', title);
  doc.save(filename);
};

// ============================================================================
// 2. TÉLÉCHARGEMENT PDF : JOURNAL / LISTE DES PAIEMENTS
// ============================================================================
export const downloadPaymentListPDF = async (
  payments: PaymentReceipt[],
  title = 'JOURNAL DES ENCAISSEMENTS & PAIEMENTS',
  subtitle?: string,
  campusName?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const logoDataUrl = await getLogoDataUrl();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const metaLine = `Date : ${dateStr} · Nombre : ${payments.length} règlement(s) · Total encaissé : ${totalCollected.toLocaleString()} FCFA${
    campusName ? ` · Centre : ${campusName}` : ''
  }`;

  drawOfficialHeader(doc, logoDataUrl, title, metaLine, { subtitle });

  const tableData = payments.map((p, index) => {
    const formattedDate = formatReceiptPaymentDate(p.paymentDate);
    return [
      (index + 1).toString(),
      `${p.receiptNumber}\n${formattedDate}`,
      (p.studentName || '').toUpperCase(),
      `${p.category || 'Paiement'}\n(${p.monthCovered || 'En cours'})`,
      p.paymentMethod || 'Espèces',
      `${(p.amount || 0).toLocaleString()} FCFA`,
    ];
  });

  // Ligne de totalisation finale
  tableData.push([
    '',
    'TOTAL GÉNÉRAL',
    `${payments.length} règlement(s)`,
    '',
    '',
    `${totalCollected.toLocaleString()} FCFA`,
  ]);

  autoTable(doc, {
    startY: subtitle ? 42 : 38,
    head: [['N°', 'Réf / Date', "Nom de l'élève", 'Catégorie / Mois', 'Mode', 'Montant']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [5, 150, 105], // Vert émeraude finance
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 50, fontStyle: 'bold' },
      3: { cellWidth: 38 },
      4: { cellWidth: 24 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 14, right: 14, bottom: 14, left: 14 },
  });

  applyPageFooters(doc);

  const filename = generateUniqueDocumentFileName('journal_paiements', title);
  doc.save(filename);
};

// ============================================================================
// 3. TÉLÉCHARGEMENT PDF : QUITTANCE DE PAIEMENT (REÇU OFFICIEL A4)
// ============================================================================
export const downloadReceiptPDF = async (
  receipt: PaymentReceipt,
  student?: Student | null,
  campusName?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await getLogoDataUrl();
  const formattedPaymentDate = formatReceiptPaymentDate(receipt.paymentDate);
  const amountInWords = numberToFrenchWords(receipt.amount).toUpperCase();

  // 1. Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 12, 18, 18);
    } catch (e) {
      console.warn('Error adding logo to receipt PDF:', e);
    }
  }

  // 2. En-tête Cabinet MANI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 27, 75);
  doc.text("CABINET D'APPUIS SCOLAIRE MANI (CAS-MANI)", 36, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Direction Régionale des Enseignements de Niamey (DREN) · Niamey 2000 (Niger)", 36, 20.5);
  doc.text("NIF: 153633/P · RCCM: NE-NIM-A10-05126 · Tél: +227 91 58 44 59 / 96 16 51 81", 36, 24.5);

  // 3. Cartouche Reçu à droite
  doc.setDrawColor(5, 150, 105);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(pageWidth - 75, 10, 61, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('QUITTANCE OFFICIELLE', pageWidth - 71, 15);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`N° ${receipt.receiptNumber}`, pageWidth - 71, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date : ${formattedPaymentDate}`, pageWidth - 71, 25.5);

  // Ligne de séparation
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 34, pageWidth - 14, 34);

  // 4. Cartouche Bénéficiaire & Élève
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 27, 75);
  doc.text('INFORMATIONS DU BÉNÉFICIAIRE', 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Élève : ${(receipt.studentName || 'Élève').toUpperCase()}`, 18, 50);
  doc.text(`Matricule : ${student?.matricule || 'CAS-2026-0042'}`, 18, 55);
  doc.text(`Niveau : ${student?.level || 'Secondaire'} (${student?.stream || 'Général'})`, 18, 60);

  doc.text(`Tuteur Légal : ${student?.guardianName || 'Parent / Tuteur'}`, 110, 50);
  doc.text(`Téléphone : ${student?.guardianPhone || '-'}`, 110, 55);
  doc.text(`Centre : ${campusName || 'Quartier Niamey 2000'}`, 110, 60);

  // 5. Tableau des montants
  const receiptRows = [
    [
      receipt.category || "Frais d'encadrement",
      receipt.monthCovered || formattedPaymentDate,
      receipt.paymentMethod || 'Espèces',
      `${(receipt.amount || 0).toLocaleString()} FCFA`,
    ],
  ];

  autoTable(doc, {
    startY: 73,
    head: [['Désignation du Règlement', 'Période / Mois', 'Mode de Paiement', 'Montant Encaissé']],
    body: receiptRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 37, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // 6. Montant en toutes lettres
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 100;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, finalY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('MONTANT TOTAL REÇU EN TOUTES LETTRES :', 18, finalY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${amountInWords} FRANCS CFA`, 18, finalY + 10);

  // 7. Blocs Signatures & Cachet
  const sigY = finalY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('Le Tuteur / Déposant', 25, sigY);
  doc.text('(Signature pour acquit)', 25, sigY + 4);

  doc.text('Le Service Caisse & Recouvrement', pageWidth - 75, sigY);
  doc.text('Cabinet d’Appuis Scolaire MANI (Cachet & Signature)', pageWidth - 75, sigY + 4);

  // Cadre cachet
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - 75, sigY + 7, 55, 22);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Cachet officiel CAS-MANI', pageWidth - 65, sigY + 18);

  applyPageFooters(doc);

  const filename = generateUniqueDocumentFileName('quittance', `${receipt.receiptNumber}_${student?.fullName || receipt.studentName}`);
  doc.save(filename);
};

// ============================================================================
// 4. TÉLÉCHARGEMENT PDF : FACTURE MENSUELLE & AVIS D'ÉCHÉANCE
// ============================================================================
export const downloadInvoicePDF = async (
  invoice?: MonthlyInvoice | null,
  customData?: any,
  campusName?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await getLogoDataUrl();

  const invoiceNumber = customData?.invoiceNumber || invoice?.invoiceNumber || 'FAC-2026-10-0001';
  const issueDate = customData?.issueDate || invoice?.issueDate || '01/10/2026';
  const dueDate = customData?.dueDate || invoice?.dueDate || '10/10/2026';
  const monthLabel = customData?.monthLabel || invoice?.monthLabel || 'Octobre 2026';
  const guardianName = customData?.guardianName || invoice?.guardianName || 'Tuteur Légal';
  const guardianPhone = customData?.guardianPhone || invoice?.guardianPhone || '-';
  const netDue = customData?.netDue ?? (invoice?.netDue ?? 40000);
  const studentName = customData?.studentName || invoice?.studentItems?.[0]?.studentName || 'Élève';

  // 1. Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 12, 18, 18);
    } catch (e) {
      console.warn('Error adding logo to invoice PDF:', e);
    }
  }

  // 2. En-tête
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 27, 75);
  doc.text("CABINET D'APPUIS SCOLAIRE MANI (CAS-MANI)", 36, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Direction Régionale des Enseignements de Niamey (DREN) · Niamey 2000 (Niger)", 36, 20.5);
  doc.text("NIF: 153633/P · RCCM: NE-NIM-A10-05126 · Tél: +227 91 58 44 59 / 96 16 51 81", 36, 24.5);

  // 3. Cartouche Facture à droite
  doc.setDrawColor(67, 56, 202);
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(pageWidth - 75, 10, 61, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(67, 56, 202);
  doc.text('FACTURE OFFICIELLE', pageWidth - 71, 15);

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`N° ${invoiceNumber}`, pageWidth - 71, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Émise le : ${issueDate} · Échéance : ${dueDate}`, pageWidth - 71, 25.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 34, pageWidth - 14, 34);

  // 4. Cartouche Tuteur / Facturé à
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 27, 75);
  doc.text('DESTINATAIRE / TUTEUR LÉGAL', 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nom : ${guardianName.toUpperCase()}`, 18, 50);
  doc.text(`Téléphone : ${guardianPhone}`, 18, 55);

  doc.text(`Période : ${monthLabel}`, 110, 50);
  doc.text(`Centre : ${campusName || 'Niamey 2000'}`, 110, 55);

  // 5. Tableau des élèves facturés
  const items = (customData?.studentItems || invoice?.studentItems || [
    {
      studentName: studentName,
      level: customData?.level || 'Secondaire',
      subjects: customData?.subjects || ['Général'],
      sessionsPerWeek: customData?.sessionsPerWeek || 3,
      monthlyFee: netDue,
      paidAmount: 0,
      balanceRemaining: netDue,
    },
  ]);

  const invoiceRows = items.map((it: any) => [
    (it.studentName || studentName).toUpperCase(),
    `${it.level || 'Général'} · ${it.sessionsPerWeek || 3} séanc./sem.`,
    Array.isArray(it.subjects) ? it.subjects.join(', ') : 'Toutes matières',
    `${(it.monthlyFee || netDue).toLocaleString()} FCFA`,
    `${(it.paidAmount || 0).toLocaleString()} FCFA`,
    `${(it.balanceRemaining ?? it.monthlyFee ?? netDue).toLocaleString()} FCFA`,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['Élève', 'Niveau & Séances', 'Matières', 'Frais Mensuels', 'Déjà Payé', 'Net à Payer']],
    body: invoiceRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 40 },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 100;
  const amountWords = numberToFrenchWords(netDue).toUpperCase();

  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, finalY, pageWidth - 28, 13, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(67, 56, 202);
  doc.text('TOTAL NET À PAYER :', 18, finalY + 5);

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${(netDue ?? 0).toLocaleString()} FCFA (${amountWords} FRANCS CFA)`, 18, finalY + 9.5);

  // Instructions locales Niger
  const notesY = finalY + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 27, 75);
  doc.text('MODALITÉS DE RÈGLEMENT (NIGER) :', 14, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Caisse CAS-MANI : Paiement physique au bureau de Niamey 2000.', 14, notesY + 5);
  doc.text('2. Mobile Money / Transfert : Airtel Money au +227 91 58 44 59 · Nita ou Amana au +227 96 16 51 81.', 14, notesY + 9);

  applyPageFooters(doc);

  const filename = generateUniqueDocumentFileName('facture', `${invoiceNumber}_${studentName}`);
  doc.save(filename);
};

// ============================================================================
// 5. TÉLÉCHARGEMENT PDF : TABLEAU D'AFFECTATION DES ENCADREURS (PAYSAGE A4)
// ============================================================================
export const downloadTutorAssignmentPDF = async (
  tutors: Tutor[],
  students: Student[],
  customGroups?: GroupRecord[],
  campusName?: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const logoDataUrl = await getLogoDataUrl();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const totalSessionsAll = (tutors || []).reduce(
    (acc, t) => acc + calculateTutorWeeklySessions(t, students, customGroups),
    0
  );

  const metaLine = `Date : ${dateStr} · Effectif total : ${tutors.length} encadreur(s) · Total séances hebdo : ${totalSessionsAll} séanc./sem.${
    campusName ? ` · Centre : ${campusName}` : ''
  }`;

  drawOfficialHeader(
    doc,
    logoDataUrl,
    "TABLEAU OFFICIEL D'AFFECTATION PÉDAGOGIQUE DES ENCADREURS",
    metaLine,
    { orientation: 'landscape' }
  );

  const tableData = tutors.map((t, index) => {
    const weeklySessions = calculateTutorWeeklySessions(t, students, customGroups);
    const weeklyHours = formatSessionHours(weeklySessions * 2);

    // Élèves assignés
    const assignedStus = (students || []).filter((s) => {
      const direct = (t.assignedStudentIds || []).includes(s.id);
      const sub = (t.assignedStudentSubjects || []).some((as) => as.studentId === s.id);
      return direct || sub;
    });

    const studentsStr =
      assignedStus.length > 0
        ? assignedStus.map((s) => `${s.fullName} (${s.level || ''})`).join(', ')
        : 'Aucun élève direct';

    // Groupes
    const allGroups = extractTutoringGroups(students, tutors, customGroups);
    const tutorGroups = allGroups.filter((g) => (g.tutors || []).some((tu) => tu.id === t.id));
    const groupsStr =
      tutorGroups.length > 0
        ? tutorGroups.map((g) => `${g.name} (${g.sessionsPerWeek || 2} s/sem)`).join(', ')
        : '-';

    return [
      (index + 1).toString(),
      (t.fullName || '').toUpperCase(),
      `${t.subject || 'Enseignant'}\n${t.phone || '-'}`,
      studentsStr,
      groupsStr,
      `${weeklySessions} séanc./sem.`,
      weeklyHours,
    ];
  });

  autoTable(doc, {
    startY: 38,
    head: [
      [
        'N°',
        "Nom de l'Encadreur",
        'Spécialité & Téléphone',
        'Élèves Assignés',
        'Groupes Encadrés',
        'Séances / Sem.',
        'Volume Hebdo',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 27, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 75 },
      4: { cellWidth: 50 },
      5: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 28, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 14, right: 14, bottom: 14, left: 14 },
  });

  applyPageFooters(doc);

  const filename = generateUniqueDocumentFileName('tableau_affectation_encadreurs');
  doc.save(filename);
};

// ============================================================================
// 6. TÉLÉCHARGEMENT PDF : FICHE DE GROUPE D'ÉTUDE
// ============================================================================
export const downloadGroupCardPDF = async (
  group: TutoringGroup,
  students: Student[],
  tutors: Tutor[],
  campusName?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await getLogoDataUrl();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const metaLine = `Date : ${dateStr} · Effectif : ${group.studentIds?.length || 0} élève(s) · Quota : ${group.sessionsPerWeek || 2} séanc./sem.${
    campusName ? ` · Centre : ${campusName}` : ''
  }`;

  drawOfficialHeader(
    doc,
    logoDataUrl,
    `FICHE OFFICIELLE DU GROUPE : ${group.name.toUpperCase()}`,
    metaLine
  );

  // Cartouche Détails du Groupe
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 27, 75);
  doc.text(`Niveau : ${group.level || 'Non spécifié'} (${group.stream || 'Général'})`, 18, 44);
  doc.text(
    `Matières : ${Array.isArray(group.subjects) ? group.subjects.join(', ') : 'Toutes matières'}`,
    18,
    50
  );

  const tutorNames = (group.tutors || []).map((t) => t.fullName).join(', ') || 'Non assigné';
  doc.text(`Encadreur(s) : ${tutorNames}`, 110, 44);
  doc.text(`Séances : ${group.sessionsPerWeek || 2} par semaine (2h / séance)`, 110, 50);

  // Tableau des élèves membres
  const memberStudents = (students || []).filter((s) => (group.studentIds || []).includes(s.id));
  const tableData = memberStudents.map((stu, index) => {
    const guardianInfo = [stu.guardianName, stu.guardianPhone].filter(Boolean).join(' / ') || '-';
    return [
      (index + 1).toString(),
      (stu.fullName || '').toUpperCase(),
      stu.level || group.level || '-',
      guardianInfo,
      'Actif',
    ];
  });

  autoTable(doc, {
    startY: 62,
    head: [['N°', "Nom complet de l'élève", 'Niveau', 'Tuteur légal / Numéro', 'Statut']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  applyPageFooters(doc);

  const filename = generateUniqueDocumentFileName('fiche_groupe', group.name);
  doc.save(filename);
};
