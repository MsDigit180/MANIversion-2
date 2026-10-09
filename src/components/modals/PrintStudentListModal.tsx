import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Student } from '../../types';
import { CAB_APPUIS_LOGO } from '../../assets/logo';
import { useApp } from '../../context/AppContext';

export interface StudentListFilterOptions {
  cycleFilter?: string;
  genderFilter?: string;
  promotionFilter?: string;
  statusFilter?: string;
  tutoringFilter?: string;
  groupFilter?: string;
  groupName?: string;
  searchQuery?: string;
}

export interface PrintStudentListModalProps extends StudentListFilterOptions {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  campusName?: string;
}

/**
 * Générateur de titre dynamique pour le document PDF / impression de la liste des élèves.
 * S'adapte avec précision aux critères de filtrage actifs (ex: "LISTE DE TOUS LES ÉLÈVES",
 * "LISTE DES ÉLÈVES EN RETARD DE PAIEMENT", "LISTE DES ÉLÈVES DU CYCLE COLLÈGE", etc.)
 */
export const getStudentListDocumentTitle = (filters: StudentListFilterOptions = {}): {
  title: string;
  subtitle?: string;
} => {
  const {
    cycleFilter = 'all',
    genderFilter = 'all',
    promotionFilter = 'all',
    statusFilter = 'all',
    tutoringFilter = 'all',
    groupFilter = 'all',
    groupName,
    searchQuery = '',
  } = filters;

  const isAllDefault =
    (cycleFilter === 'all' || !cycleFilter) &&
    (genderFilter === 'all' || !genderFilter) &&
    (promotionFilter === 'all' || !promotionFilter) &&
    (statusFilter === 'all' || !statusFilter) &&
    (tutoringFilter === 'all' || !tutoringFilter) &&
    (groupFilter === 'all' || !groupFilter) &&
    (!searchQuery || searchQuery.trim() === '');

  // Si aucun filtre spécifique n'est appliqué -> "LISTE DE TOUS LES ÉLÈVES"
  if (isAllDefault) {
    return {
      title: 'LISTE DE TOUS LES ÉLÈVES',
      subtitle: 'Tous cycles et statuts confondus',
    };
  }

  // Base du sujet
  let baseTerm = 'DES ÉLÈVES';
  if (genderFilter === 'Masculin (M)') {
    baseTerm = 'DES ÉLÈVES (GARÇONS)';
  } else if (genderFilter === 'Féminin (F)') {
    baseTerm = 'DES ÉLÈVES (FILLES)';
  }

  // Terme de cycle
  let cycleTerm = '';
  if (cycleFilter === 'Primaire') cycleTerm = 'DU CYCLE PRIMAIRE';
  else if (cycleFilter === 'Collège') cycleTerm = 'DU CYCLE COLLÈGE';
  else if (cycleFilter === 'Lycée') cycleTerm = 'DU CYCLE LYCÉE';
  else if (cycleFilter === 'Concours') cycleTerm = 'PRÉPARATION CONCOURS';

  // Terme de statut d'encadrement
  let tutoringTerm = '';
  if (tutoringFilter === 'active') tutoringTerm = 'ACTIFS';
  else if (tutoringFilter === 'stopped_all') tutoringTerm = 'EN ARRÊT';
  else if (tutoringFilter === 'stopped_demand') tutoringTerm = 'ARRÊTÉS (À LA DEMANDE)';
  else if (tutoringFilter === 'stopped_unpaid') tutoringTerm = 'ARRÊTÉS (DÉFAUT DE PAIEMENT)';

  // Terme de statut financier
  let paymentTerm = '';
  if (statusFilter === 'A jour') paymentTerm = 'À JOUR DE PAIEMENT';
  else if (statusFilter === 'Partiel') paymentTerm = 'EN PAIEMENT PARTIEL';
  else if (statusFilter === 'En retard') paymentTerm = 'EN RETARD DE PAIEMENT';

  // Terme de groupe
  let groupTerm = '';
  if (groupFilter === 'groups_only') groupTerm = 'EN COURS COLLECTIFS';
  else if (groupFilter === 'individual_only') groupTerm = 'EN COURS INDIVIDUELS';
  else if (groupFilter && groupFilter !== 'all') {
    groupTerm = groupName ? `DU GROUPE "${groupName.toUpperCase()}"` : 'PAR GROUPE';
  }

  // Terme de promotion
  const promoTerm = promotionFilter && promotionFilter !== 'all' ? promotionFilter.toUpperCase() : '';

  const hasSpecificFilter = Boolean(cycleTerm || tutoringTerm || paymentTerm || groupTerm || genderFilter !== 'all');

  let title = '';
  if (!hasSpecificFilter && promoTerm) {
    title = `LISTE DE TOUS LES ÉLÈVES · ${promoTerm}`;
  } else {
    title = `LISTE ${baseTerm}`;
    if (cycleTerm) title += ` ${cycleTerm}`;
    if (groupTerm) title += ` ${groupTerm}`;
    if (tutoringTerm && paymentTerm) {
      title += ` ${tutoringTerm} ${paymentTerm}`;
    } else if (tutoringTerm) {
      title += ` ${tutoringTerm}`;
    } else if (paymentTerm) {
      title += ` ${paymentTerm}`;
    }
    if (promoTerm) {
      title += ` · ${promoTerm}`;
    }
  }

  // Sous-titre détaillant les filtres appliqués
  const subtitleDetails: string[] = [];
  if (promotionFilter && promotionFilter !== 'all') {
    subtitleDetails.push(`Promotion : ${promotionFilter}`);
  }
  if (cycleFilter && cycleFilter !== 'all') {
    subtitleDetails.push(`Cycle : ${cycleFilter}`);
  }
  if (statusFilter && statusFilter !== 'all') {
    subtitleDetails.push(`Statut paiement : ${statusFilter}`);
  }
  if (tutoringFilter && tutoringFilter !== 'all') {
    const tutLabels: Record<string, string> = {
      active: 'Actif',
      stopped_all: 'Tous arrêts',
      stopped_demand: 'Arrêt à la demande',
      stopped_unpaid: 'Arrêt défaut de paiement',
    };
    subtitleDetails.push(`Statut encadrement : ${tutLabels[tutoringFilter] || tutoringFilter}`);
  }
  if (groupFilter === 'groups_only') {
    subtitleDetails.push('Encadrement : Cours collectifs');
  } else if (groupFilter === 'individual_only') {
    subtitleDetails.push('Encadrement : Cours individuels');
  } else if (groupName) {
    subtitleDetails.push(`Groupe : ${groupName}`);
  }
  if (genderFilter && genderFilter !== 'all') {
    subtitleDetails.push(`Sexe : ${genderFilter}`);
  }
  if (searchQuery && searchQuery.trim()) {
    subtitleDetails.push(`Recherche : "${searchQuery.trim()}"`);
  }

  return {
    title,
    subtitle: subtitleDetails.length > 0 ? subtitleDetails.join(' | ') : undefined,
  };
};

export const exportStudentsToCSV = (
  students: Student[],
  titlePrefix = 'liste_eleves_cas_mani'
) => {
  const cleanPrefix = titlePrefix.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
  const filename = `${cleanPrefix}_${new Date().toISOString().slice(0, 10)}.csv`;

  const headers = [
    'N°',
    'Nom Complet',
    'Niveau',
    'Matières d\'Encadrement',
    'Numéro du Parent',
    'Nom du Parent',
    'Promotion',
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = students.map((s, idx) => {
    const subjectsList = Array.isArray(s.subjects) && s.subjects.length > 0
      ? s.subjects.join(', ')
      : 'Toutes matières';

    return [
      escapeCsv(idx + 1),
      escapeCsv(s.fullName),
      escapeCsv(s.level),
      escapeCsv(subjectsList),
      escapeCsv(s.guardianPhone || '-'),
      escapeCsv(s.guardianName || '-'),
      escapeCsv(s.promotion || 'Promotion 2026-2027'),
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

export const PrintStudentListModal: React.FC<PrintStudentListModalProps> = ({
  isOpen,
  onClose,
  students,
  cycleFilter = 'all',
  genderFilter = 'all',
  promotionFilter = 'all',
  statusFilter = 'all',
  tutoringFilter = 'all',
  groupFilter = 'all',
  groupName,
  searchQuery = '',
  campusName,
}) => {
  const { currentUser } = useApp();

  if (!isOpen) return null;

  // Calcul du titre dynamique selon les filtres actifs
  const titleInfo = getStudentListDocumentTitle({
    cycleFilter,
    genderFilter,
    promotionFilter,
    statusFilter,
    tutoringFilter,
    groupFilter,
    groupName,
    searchQuery,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportStudentsToCSV(students, titleInfo.title);
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Barre de contrôles du modal (masquée à l'impression papier / PDF) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-3.5 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {titleInfo.title} · Document PDF ({students.length} élève{students.length > 1 ? 's' : ''})
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                En-tête officiel & tableau : Nom complet, Niveau, Matières d'encadrement, Numéro du parent
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Exporter CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-sm"
              title="Exporter la liste filtrée au format CSV"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV (.csv)</span>
            </button>

            {/* Bouton Imprimer / Enregistrer en PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
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

        {/* Styles d'impression A4 Portrait épuré */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait !important;
                  margin: 10mm 10mm 10mm 10mm !important;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `,
          }}
        />

        {/* Conteneur de la feuille imprimable */}
        <div
          id="printable-receipt"
          className="printable-document relative flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans print:p-0"
        >
          {/* Filigrane discret officiel */}
          <div className="print-watermark pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.03] print:opacity-[0.04]">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Filigrane Cabinet MANI"
              className="w-[420px] h-[420px] object-contain filter grayscale"
            />
          </div>

          {/* =================================================================
              1. EN-TÊTE OFFICIEL DU DOCUMENT
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

              {/* Titre du document, Promotion, Date & Effectif */}
              <div className="text-right shrink-0 bg-slate-50 border border-slate-300 rounded-xl p-3 text-[10px] min-w-[260px] max-w-[340px]">
                <div className="font-black text-slate-950 uppercase tracking-wide text-[11px] text-indigo-950 leading-tight">
                  {titleInfo.title}
                </div>
                {promotionFilter && promotionFilter !== 'all' ? (
                  <div className="text-[9.5px] text-purple-900 font-bold uppercase mt-0.5">
                    {promotionFilter}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5">
                    Encadrement & Soutien Scolaire
                  </div>
                )}
                <div className="text-slate-700 mt-1">
                  Date : <strong className="font-mono text-slate-900">{currentDate}</strong>
                </div>
                <div className="text-[9.5px] text-slate-700 font-mono mt-0.5">
                  Effectif : <strong className="text-slate-950 font-bold">{students.length} élève{students.length > 1 ? 's' : ''}</strong>
                </div>
                {campusName && (
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Centre : <strong className="text-slate-700">{campusName}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =================================================================
              2. BANDEAU DE TITRE DU DOCUMENT DYNAMIQUE SELON LES FILTRES
             ================================================================= */}
          <div className="mb-4 text-center print-avoid-break">
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
              3. TABLEAU : NOM COMPLET, NIVEAU, MATIÈRES D'ENCADREMENT, NUMÉRO DU PARENT
             ================================================================= */}
          <table className="w-full border-collapse border border-slate-300 text-[10.5px] leading-normal print-table">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-400 text-slate-900 font-bold uppercase text-[9.5px] tracking-wider print-avoid-break">
                <th style={{ width: '6%' }} className="py-2.5 px-2 text-center border-r border-slate-300">
                  N°
                </th>
                <th style={{ width: '34%' }} className="py-2.5 px-3 text-left border-r border-slate-300">
                  Nom Complet
                </th>
                <th style={{ width: '18%' }} className="py-2.5 px-2.5 text-left border-r border-slate-300">
                  Niveau
                </th>
                <th style={{ width: '24%' }} className="py-2.5 px-2.5 text-left border-r border-slate-300">
                  Matières d'Encadrement
                </th>
                <th style={{ width: '18%' }} className="py-2.5 px-3 text-left">
                  Numéro du Parent
                </th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic border-t border-slate-200">
                    Aucun élève enregistré dans cette sélection.
                  </td>
                </tr>
              ) : (
                students.map((stu, index) => {
                  const subjectsList = Array.isArray(stu.subjects) && stu.subjects.length > 0
                    ? stu.subjects.join(', ')
                    : 'Toutes matières';

                  return (
                    <tr
                      key={stu.id}
                      className={`border-t border-slate-200 print-avoid-break ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      {/* N° */}
                      <td className="py-2 px-2 text-center font-mono text-[9.5px] text-slate-600 border-r border-slate-200">
                        {index + 1}
                      </td>

                      {/* NOM COMPLET */}
                      <td className="py-2 px-3 font-semibold text-slate-950 border-r border-slate-200">
                        <span className="font-bold uppercase tracking-tight text-slate-900">
                          {stu.fullName}
                        </span>
                      </td>

                      {/* NIVEAU */}
                      <td className="py-2 px-2.5 font-medium text-slate-800 border-r border-slate-200">
                        {stu.level || 'Non spécifié'}
                      </td>

                      {/* MATIÈRES D'ENCADREMENT */}
                      <td className="py-2 px-2.5 text-slate-800 border-r border-slate-200">
                        {subjectsList}
                      </td>

                      {/* NUMÉRO DU PARENT */}
                      <td className="py-2 px-3 text-slate-900">
                        <div className="font-mono font-bold text-slate-900">
                          {stu.guardianPhone || '-'}
                        </div>
                        {stu.guardianName && (
                          <div className="text-[9px] text-slate-500 font-normal">
                            ({stu.guardianName})
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pied de tableau épuré avec total des élèves */}
          <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[9.5px] text-slate-500 print-avoid-break">
            <span>
              Cabinet d'Appuis Scolaire MANI (CAS-MANI) · Niamey 2000
            </span>
            <span className="font-semibold text-slate-700">
              Total : {students.length} élève{students.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
