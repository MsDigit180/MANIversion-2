import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  FileSpreadsheet,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { PaymentReceipt } from '../../types';
import { CAB_APPUIS_LOGO } from '../../assets/logo';
import { formatReceiptPaymentDate, formatYYYYMMToFrench } from '../../utils/dateUtils';

export interface PaymentListFilterOptions {
  categoryFilter?: string;
  methodFilter?: string;
  monthFilter?: string;
  searchQuery?: string;
}

export interface PrintPaymentListModalProps extends PaymentListFilterOptions {
  isOpen: boolean;
  onClose: () => void;
  payments: PaymentReceipt[];
}

/**
 * Générateur de titre dynamique pour le document PDF / impression de la liste des paiements.
 * S'adapte avec précision aux critères de filtrage actifs (Catégorie, Mode de règlement, Mois, Recherche).
 */
export const getPaymentListDocumentTitle = (filters: PaymentListFilterOptions = {}): {
  title: string;
  subtitle?: string;
} => {
  const {
    categoryFilter = 'all',
    methodFilter = 'all',
    monthFilter = 'all',
    searchQuery = '',
  } = filters;

  const isAllDefault =
    (categoryFilter === 'all' || !categoryFilter) &&
    (methodFilter === 'all' || !methodFilter) &&
    (monthFilter === 'all' || !monthFilter) &&
    (!searchQuery || searchQuery.trim() === '');

  // Aucun filtre spécifique -> "JOURNAL DES ENCAISSEMENTS & PAIEMENTS"
  if (isAllDefault) {
    return {
      title: 'JOURNAL DES ENCAISSEMENTS & PAIEMENTS',
      subtitle: 'Toutes catégories et tous modes de règlement confondus',
    };
  }

  // Prestation / Catégorie
  let catTerm = '';
  if (categoryFilter === 'Scolarité Mensuelle') catTerm = 'SCOLARITÉS MENSUELLES';
  else if (categoryFilter === 'Inscription') catTerm = 'DROITS D\'INSCRIPTION';
  else if (categoryFilter === 'Frais Concours') catTerm = 'FRAIS DE CONCOURS';
  else if (categoryFilter === 'Fournitures') catTerm = 'VENTES DE FOURNITURES';
  else if (categoryFilter && categoryFilter !== 'all') catTerm = categoryFilter.toUpperCase();

  // Mode de règlement
  let methodTerm = '';
  if (methodFilter === 'Espèces') methodTerm = 'EN ESPÈCES';
  else if (methodFilter === 'Airtel') methodTerm = 'PAR AIRTEL MONEY';
  else if (methodFilter === 'Flooz') methodTerm = 'PAR MOOV FLOOZ';
  else if (methodFilter === 'Amana') methodTerm = 'PAR AMANA TRANSFERT';
  else if (methodFilter === 'Nita') methodTerm = 'PAR NITA TRANSFERT';
  else if (methodFilter && methodFilter !== 'all') methodTerm = `PAR ${methodFilter.toUpperCase()}`;

  // Mois
  let monthTerm = '';
  if (monthFilter && monthFilter !== 'all') {
    monthTerm = formatYYYYMMToFrench(monthFilter).toUpperCase();
  }

  let title = 'JOURNAL DES ENCAISSEMENTS';
  if (catTerm && methodTerm) {
    title = `JOURNAL DES PAIEMENTS · ${catTerm} (${methodTerm})`;
  } else if (catTerm) {
    title = `JOURNAL DES ENCAISSEMENTS · ${catTerm}`;
  } else if (methodTerm) {
    title = `JOURNAL DES ENCAISSEMENTS ${methodTerm}`;
  }

  if (monthTerm) {
    title += ` · ${monthTerm}`;
  }

  // Sous-titre récapitulatif des filtres actifs
  const subtitleDetails: string[] = [];
  if (categoryFilter && categoryFilter !== 'all') {
    subtitleDetails.push(`Catégorie : ${categoryFilter}`);
  }
  if (methodFilter && methodFilter !== 'all') {
    subtitleDetails.push(`Mode de règlement : ${methodFilter}`);
  }
  if (monthFilter && monthFilter !== 'all') {
    subtitleDetails.push(`Période : ${formatYYYYMMToFrench(monthFilter)}`);
  }
  if (searchQuery && searchQuery.trim()) {
    subtitleDetails.push(`Recherche : "${searchQuery.trim()}"`);
  }

  return {
    title,
    subtitle: subtitleDetails.length > 0 ? subtitleDetails.join(' | ') : undefined,
  };
};

/**
 * Exporte la liste des paiements en fichier CSV avec encodage UTF-8 (BOM) et séparateur point-virgule.
 */
export const exportPaymentsToCSV = (
  payments: PaymentReceipt[],
  titlePrefix = 'journal_paiements_cas_mani'
) => {
  const cleanPrefix = titlePrefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 45);
  const filename = `${cleanPrefix}_${new Date().toISOString().slice(0, 10)}.csv`;

  const headers = [
    'N°',
    'N° de Reçu',
    'Date de Paiement',
    'Élève / Payeur',
    'Type d\'Encaissement',
    'Prestation / Catégorie',
    'Mode de Règlement',
    'Montant Encaissé (FCFA)',
    'Nom du Parent',
    'Téléphone Parent',
    'Agent Encaissseur',
    'Statut Rapprochement',
    'Observations & Notes',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = payments.map((pay, idx) => {
    const isMulti = pay.isMultiStudent || (pay.studentBreakdown && pay.studentBreakdown.length > 1);
    const typeLabel = isMulti
      ? `Reçu Groupé Famille (${pay.studentBreakdown?.length || 2} élèves)`
      : 'Paiement Individuel';

    return [
      escapeCsv(idx + 1),
      escapeCsv(pay.receiptNumber),
      escapeCsv(formatReceiptPaymentDate(pay.paymentDate)),
      escapeCsv(pay.studentName),
      escapeCsv(typeLabel),
      escapeCsv(pay.category),
      escapeCsv(pay.paymentMethod),
      escapeCsv(pay.amount || 0),
      escapeCsv(pay.guardianName || '-'),
      escapeCsv(pay.guardianPhone || '-'),
      escapeCsv(pay.agentName || pay.cashierName || 'Caisse'),
      escapeCsv(pay.syncStatus === 'synced' ? 'Synchronisé' : 'En attente'),
      escapeCsv(pay.notes || '-'),
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const PrintPaymentListModal: React.FC<PrintPaymentListModalProps> = ({
  isOpen,
  onClose,
  payments,
  categoryFilter = 'all',
  methodFilter = 'all',
  monthFilter = 'all',
  searchQuery = '',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleBeforePrint = () => {
      document.body.classList.add('is-printing-invoice');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-invoice');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-invoice');
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const titleInfo = getPaymentListDocumentTitle({
    categoryFilter,
    methodFilter,
    monthFilter,
    searchQuery,
  });

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const cashTotal = payments
    .filter((p) => p.paymentMethod === 'Espèces')
    .reduce((a, b) => a + (b.amount || 0), 0);
  const mobileTotal = payments
    .filter(
      (p) =>
        p.paymentMethod &&
        (p.paymentMethod.includes('Airtel') ||
          p.paymentMethod.includes('Flooz') ||
          p.paymentMethod.includes('Amana') ||
          p.paymentMethod.includes('Nita') ||
          p.paymentMethod.includes('Mobile') ||
          p.paymentMethod.includes('Wave'))
    )
    .reduce((a, b) => a + (b.amount || 0), 0);
  const bankTotal = payments
    .filter((p) => p.paymentMethod === 'Virement Bancaire')
    .reduce((a, b) => a + (b.amount || 0), 0);

  const handlePrint = () => {
    document.body.classList.add('is-printing-invoice');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleExportCSV = () => {
    exportPaymentsToCSV(payments, titleInfo.title);
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const modalContent = (
    <div
      id="print-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 print:p-0 print:bg-white print:static print:z-auto print:block animate-in fade-in duration-150"
    >
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
        {/* Barre de contrôles du modal (masquée à l'impression papier / PDF) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-3.5 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {titleInfo.title} · Document PDF ({payments.length} règlement{payments.length > 1 ? 's' : ''})
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Total Encaissé :{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {(totalCollected ?? 0).toLocaleString()} FCFA
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Exporter CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-sm"
              title="Exporter la liste des paiements au format CSV"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV (.csv)</span>
            </button>

            {/* Bouton Imprimer / Enregistrer en PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              title="Lancer l'impression ou enregistrer en PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer / PDF</span>
            </button>

            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Fermer la prévisualisation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Styles d'impression A4 Portrait */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait !important;
                  margin: 10mm 10mm 10mm 10mm !important;
                }
                #root,
                body.is-printing-invoice #root,
                body:has(#print-modal-portal) #root {
                  display: none !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .print-avoid-break {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `,
          }}
        />

        {/* Conteneur de la feuille imprimable */}
        <div
          id="printable-receipt"
          className="printable-document relative flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans print:p-0 print:overflow-visible"
        >
          {/* Filigrane discret officiel CAS-MANI */}
          <div className="print-watermark pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.03] print:opacity-[0.04]">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Filigrane Cabinet MANI"
              className="w-[420px] h-[420px] object-contain filter grayscale"
            />
          </div>

          {/* =================================================================
              1. EN-TÊTE OFFICIEL DU DOCUMENT (SANS TEXTE INTERDIT)
             ================================================================= */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 relative z-10 print-avoid-break">
            <div className="flex justify-between items-start gap-4">
              {/* Logo & Coordonnées du Cabinet */}
              <div className="flex items-start gap-3.5">
                <img
                  src={CAB_APPUIS_LOGO}
                  alt="Logo Cabinet d'Appuis Scolaire MANI"
                  className="w-16 h-16 rounded-xl object-contain border border-slate-300 shadow-sm shrink-0 bg-white p-0.5 print:border-slate-400"
                />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                    RÉPUBLIQUE DU NIGER
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Ministère de l'Éducation Nationale · Direction Régionale des Enseignements de Niamey (DREN)
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="bg-indigo-950 text-white font-black text-xs px-2 py-0.5 rounded">
                      CAS-MANI
                    </span>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-950 uppercase">
                      Cabinet d'Appuis Scolaire MANI (Cab-Appuis)
                    </h1>
                  </div>
                  <p className="text-[9.5px] text-slate-600 mt-1">
                    📍 Quartier Niamey 2000, Niamey (Niger) · NIF : <strong className="font-mono text-slate-900">153633/P</strong> · RCCM : <strong className="font-mono text-slate-900">NE-NIM-A10-05126</strong> · 📞 <strong className="font-mono text-slate-900">+227 91 58 44 59 / 96 16 51 81</strong>
                  </p>
                </div>
              </div>

              {/* Titre du document, Date, Nombre d'opérations & Total */}
              <div className="text-right shrink-0 bg-slate-50 border border-slate-300 rounded-xl p-3 text-[10px] min-w-[260px] max-w-[340px]">
                <div className="font-black text-slate-950 uppercase tracking-wide text-[11px] text-emerald-950 leading-tight">
                  {titleInfo.title}
                </div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                  Journal de Caisse & Enregistrement des Règlements
                </div>
                <div className="text-slate-700 mt-1">
                  Édité le : <strong className="font-mono text-slate-900">{currentDate}</strong>
                </div>
                <div className="text-[9.5px] text-slate-700 font-mono mt-0.5">
                  Opérations : <strong className="text-slate-950 font-bold">{payments.length} règlement{payments.length > 1 ? 's' : ''}</strong>
                </div>
                <div className="text-[10px] text-emerald-800 font-bold font-mono mt-1 pt-1 border-t border-slate-200">
                  Total : <span className="text-[12px]">{(totalCollected ?? 0).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              2. BANDEAU DE TITRE DU DOCUMENT DYNAMIQUE SELON LES FILTRES
             ================================================================= */}
          <div className="mb-3 text-center print-avoid-break">
            <div className="inline-block border-b-2 border-slate-900 pb-1 px-4">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
                {titleInfo.title}
              </h2>
            </div>
            {titleInfo.subtitle && (
              <p className="mt-1 text-[9.5px] font-semibold text-slate-600">
                {titleInfo.subtitle}
              </p>
            )}
          </div>

          {/* =================================================================
              3. RÉCAPITULATIF FINANCIER PAR MODE DE PAIEMENT
             ================================================================= */}
          <div className="mb-4 grid grid-cols-4 gap-2 text-center print-avoid-break">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className="block text-[8.5px] font-semibold uppercase text-slate-500">Total Encaissé</span>
              <span className="font-mono text-[12px] font-bold text-slate-950">
                {(totalCollected ?? 0).toLocaleString()} <span className="text-[9px] font-normal">FCFA</span>
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className="block text-[8.5px] font-semibold uppercase text-slate-500">Espèces (Guichet)</span>
              <span className="font-mono text-[12px] font-bold text-slate-800">
                {(cashTotal ?? 0).toLocaleString()} <span className="text-[9px] font-normal">FCFA</span>
              </span>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-2">
              <span className="block text-[8.5px] font-semibold uppercase text-indigo-700">Mobile Money / Transfert</span>
              <span className="font-mono text-[12px] font-bold text-indigo-900">
                {(mobileTotal ?? 0).toLocaleString()} <span className="text-[9px] font-normal">FCFA</span>
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <span className="block text-[8.5px] font-semibold uppercase text-slate-500">Virements / Banque</span>
              <span className="font-mono text-[12px] font-bold text-slate-800">
                {(bankTotal ?? 0).toLocaleString()} <span className="text-[9px] font-normal">FCFA</span>
              </span>
            </div>
          </div>

          {/* =================================================================
              4. TABLEAU DE LA LISTE DES PAIEMENTS
             ================================================================= */}
          <table className="w-full border-collapse border border-slate-300 text-[10px] leading-normal print-table">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-400 text-slate-900 font-bold uppercase text-[9px] tracking-wider print-avoid-break">
                <th style={{ width: '4%' }} className="py-2 px-1 text-center border-r border-slate-300">
                  N°
                </th>
                <th style={{ width: '13%' }} className="py-2 px-2 text-left border-r border-slate-300">
                  N° Reçu
                </th>
                <th style={{ width: '12%' }} className="py-2 px-2 text-left border-r border-slate-300">
                  Date
                </th>
                <th style={{ width: '27%' }} className="py-2 px-2 text-left border-r border-slate-300">
                  Élève / Bénéficiaire
                </th>
                <th style={{ width: '16%' }} className="py-2 px-2 text-left border-r border-slate-300">
                  Prestation
                </th>
                <th style={{ width: '13%' }} className="py-2 px-2 text-left border-r border-slate-300">
                  Mode
                </th>
                <th style={{ width: '15%' }} className="py-2 px-2 text-right">
                  Montant (FCFA)
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic border-t border-slate-200">
                    Aucun paiement enregistré dans cette sélection.
                  </td>
                </tr>
              ) : (
                payments.map((pay, index) => {
                  const isMulti = pay.isMultiStudent || (pay.studentBreakdown && pay.studentBreakdown.length > 1);

                  return (
                    <tr
                      key={pay.id}
                      className={`border-t border-slate-200 print-avoid-break ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      {/* N° */}
                      <td className="py-1.5 px-1 text-center font-mono text-[9px] text-slate-600 border-r border-slate-200">
                        {index + 1}
                      </td>

                      {/* N° REÇU */}
                      <td className="py-1.5 px-2 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {pay.receiptNumber}
                      </td>

                      {/* DATE */}
                      <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {formatReceiptPaymentDate(pay.paymentDate)}
                      </td>

                      {/* ÉLÈVE / BÉNÉFICIAIRE */}
                      <td className="py-1.5 px-2 font-semibold text-slate-950 border-r border-slate-200">
                        <span className="font-bold uppercase tracking-tight text-slate-900">
                          {pay.studentName}
                        </span>
                        {isMulti && (
                          <span className="ml-1.5 inline-block text-[8px] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-900">
                            Famille ({pay.studentBreakdown?.length || 2} él.)
                          </span>
                        )}
                        {pay.guardianPhone && (
                          <div className="text-[8.5px] text-slate-500 font-normal">
                            Contact : {pay.guardianPhone}
                          </div>
                        )}
                      </td>

                      {/* PRESTATION */}
                      <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200">
                        <span className="font-medium">{pay.category}</span>
                      </td>

                      {/* MODE DE RÈGLEMENT */}
                      <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        {pay.paymentMethod}
                      </td>

                      {/* MONTANT (FCFA) */}
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                        {(pay.amount ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TOTAL GÉNÉRAL AU PIED DU TABLEAU */}
            {payments.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-950 print-avoid-break">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[9.5px] tracking-wider border-r border-slate-300">
                    Total Général des Règlements Encaissés :
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-[12px] font-black text-emerald-900">
                    {(totalCollected ?? 0).toLocaleString()} FCFA
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Signatures & Validation Officielle */}
          <div className="mt-6 pt-3 border-t border-slate-300 grid grid-cols-2 gap-8 text-[9.5px] print-avoid-break">
            <div className="text-left">
              <span className="block font-bold uppercase text-slate-700">L'Agent de Caisse / Régisseur :</span>
              <p className="text-[8.5px] text-slate-500 mt-0.5">Enregistrement et rapprochement comptable</p>
              <div className="mt-8 text-slate-700 font-semibold italic">Nom & Signature : ____________________</div>
            </div>
            <div className="text-right">
              <span className="block font-bold uppercase text-slate-700">La Direction CAS-MANI :</span>
              <p className="text-[8.5px] text-slate-500 mt-0.5">Visa et cachet officiel de certification</p>
              <div className="mt-8 text-slate-700 font-semibold italic">Cachet & Signature : ____________________</div>
            </div>
          </div>

          {/* Pied de tableau épuré */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-500 print-avoid-break">
            <span>
              Cabinet d'Appuis Scolaire MANI (CAS-MANI) · Niamey 2000 · Document officiel
            </span>
            <span className="font-semibold text-slate-700">
              Total : {payments.length} règlement{payments.length > 1 ? 's' : ''} | {(totalCollected ?? 0).toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
