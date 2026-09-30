import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Calendar,
  Building,
  Phone,
  UserCheck,
  UserX,
  AlertTriangle,
  BadgeCheck,
  GraduationCap,
  Clock,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { Student } from '../../types';
import { formatSessionHours, calculateWeeklyHours, getCurrentFrenchDateTime } from '../../utils/dateUtils';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';
import { useApp } from '../../context/AppContext';

interface PrintStudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  cycleFilter: string;
  genderFilter?: string;
  statusFilter: string;
  tutoringFilter?: string;
  searchQuery: string;
  campusName: string;
}

export const exportStudentsToCSV = (
  students: Student[],
  filename = `registre_eleves_cas_mani_${new Date().toISOString().slice(0, 10)}.csv`
) => {
  const headers = [
    'Matricule',
    'Nom Complet',
    'Sexe',
    'Niveau',
    'Cycle',
    'Matières Suivies',
    'Tuteur Légal',
    'Téléphone Tuteur',
    'Séances/Semaine',
    'Heures Hebdo Déduites (1h30/séance)',
    'Encadreur(s)',
    'Scolarité Mensuelle (FCFA)',
    'Montant Payé (FCFA)',
    'Solde Dû (FCFA)',
    'Statut Paiement',
    'Statut Encadrement',
    'Date Arrêt',
    'Motif Arrêt',
    'Agent Enregistreur',
    'Rôle Agent',
    'Date Inscription',
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const stringified = String(str).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = students.map((s) => {
    const tutorsList = s.tutorAssignments?.map(a => `${a.tutorName} (${a.subjects.join('/')})`).join(', ') || '-';
    return [
      escapeCsv(s.matricule),
      escapeCsv(s.fullName),
      escapeCsv(s.gender || 'Masculin (M)'),
      escapeCsv(s.level),
      escapeCsv(s.stream),
      escapeCsv(s.subjects.join(', ')),
      escapeCsv(s.guardianName),
      escapeCsv(s.guardianPhone),
      escapeCsv(s.sessionsPerWeek || 3),
      escapeCsv(formatSessionHours((s.sessionsPerWeek || 3) * 1.5)),
      escapeCsv(tutorsList),
      escapeCsv(s.monthlyFee),
      escapeCsv(s.paidAmount),
      escapeCsv(Math.max(0, s.monthlyFee - s.paidAmount)),
      escapeCsv(s.paymentStatus),
      escapeCsv(s.tutoringStatus),
      escapeCsv(s.stopDate || '-'),
      escapeCsv(s.stopReason || '-'),
      escapeCsv(s.agentName || '-'),
      escapeCsv(s.agentRole || '-'),
      escapeCsv(s.enrollmentDate),
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
  cycleFilter,
  genderFilter = 'all',
  statusFilter,
  tutoringFilter,
  searchQuery,
  campusName,
}) => {
  const { currentUser } = useApp();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportStudentsToCSV(students);
  };

  const totalMonthlyFees = students.reduce((acc, s) => acc + s.monthlyFee, 0);
  const totalPaid = students.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalRemaining = totalMonthlyFees - totalPaid;
  const totalWeeklySessions = students.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);

  const activeCount = students.filter((s) => s.tutoringStatus === 'Actif').length;
  const stoppedDemandCount = students.filter((s) => s.tutoringStatus === 'Arrêté (À la demande)').length;
  const stoppedUnpaidCount = students.filter((s) => s.tutoringStatus === 'Arrêté (Défaut de paiement)').length;

  const getCycleLabel = () => {
    if (cycleFilter === 'all') return 'Tous les cycles (Primaire, Collège, Lycée)';
    if (cycleFilter === 'Primaire') return 'Primaire (CI à CM2 - CFEPD)';
    if (cycleFilter === 'Collège') return 'Collège (6ème à 3ème - BEPC)';
    if (cycleFilter === 'Lycée') return 'Lycée (2nde à Terminale)';
    return cycleFilter;
  };

  const getGenderFilterLabel = () => {
    if (!genderFilter || genderFilter === 'all') return 'Tous sexes (M & F)';
    if (genderFilter === 'Masculin (M)' || genderFilter === 'M') return 'Masculin (M)';
    if (genderFilter === 'Féminin (F)' || genderFilter === 'F') return 'Féminin (F)';
    return genderFilter;
  };

  const getStatusLabel = () => {
    if (statusFilter === 'all') return 'Tous statuts';
    return statusFilter;
  };

  const getTutoringFilterLabel = () => {
    if (!tutoringFilter || tutoringFilter === 'all') return 'Tous statuts encadrement';
    if (tutoringFilter === 'active') return 'Actifs uniquement';
    if (tutoringFilter === 'stopped_demand') return 'Arrêtés (Demande)';
    if (tutoringFilter === 'stopped_unpaid') return 'Arrêtés (Impayés)';
    if (tutoringFilter === 'stopped_all') return 'Tous Arrêtés';
    return tutoringFilter;
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Controls Bar (hidden on paper print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-3.5 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Aperçu d'Impression Multi-Pages & Export · {students.length} élève(s) filtré(s)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                En-tête de document et colonnes automatiquement répétés sur chaque page imprimée
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-sm"
              title="Exporter la liste filtrée au format CSV (compatible Excel)"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV (.csv)</span>
            </button>

            {/* Print / PDF button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              title="Lancer l'impression officielle ou enregistrer en PDF (avec répétition automatique de l'en-tête)"
            >
              <Printer className="h-4 w-4" />
              <span>Lancer l'Impression / PDF</span>
            </button>

            {/* Close / Annuler button */}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Fermer la prévisualisation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div
          id="printable-receipt"
          className="printable-document relative flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans print:p-0"
        >
          {/* Subtle Watermark for Official Auth */}
          <div className="print-watermark pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.035] print:opacity-[0.05]">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Filigrane Cabinet MANI"
              className="w-[420px] h-[420px] object-contain filter grayscale"
            />
          </div>

          {/* Master Printable Table with repeating thead on all pages */}
          <table className="w-full text-left text-[10.5px] border-collapse print-table">
            {/* THEAD: REPEATS ON EVERY PRINTED PAGE */}
            <thead>
              {/* Row 1: Document Header Chapeau (Logo, Republic of Niger, Cabinet info, Title, Issuer, Date & Time) */}
              <tr className="border-b-2 border-slate-900 print-avoid-break">
                <th colSpan={10} className="font-normal text-left pb-3 pt-0">
                  <div className="flex justify-between items-start gap-4">
                    {/* Left: Official Cabinet Branding & Republic */}
                    <div className="flex items-start gap-3">
                      <img
                        src={CAB_APPUIS_LOGO}
                        alt="Logo Cabinet d'Appuis Scolaire MANI"
                        className="w-14 h-14 rounded-xl object-contain border border-slate-300 shadow-sm shrink-0 bg-white p-0.5 print:border-slate-400"
                      />
                      <div>
                        <div className="text-[9px] uppercase font-bold tracking-widest text-slate-600">
                          RÉPUBLIQUE DU NIGER
                        </div>
                        <div className="text-[8.5px] text-slate-500">
                          Ministère de l'Éducation Nationale · DREN Niamey
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="bg-indigo-950 text-white font-black text-xs px-1.5 py-0.5 rounded">
                            CAS-MANI
                          </span>
                          <h1 className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">
                            Cabinet d'Appuis Scolaire MANI (Cab-Appuis)
                          </h1>
                        </div>
                        <p className="text-[8.5px] text-slate-600 mt-0.5">
                          📍 Niamey 2000 · NIF: <strong className="font-mono text-slate-900">153633/P</strong> · RCCM: <strong className="font-mono text-slate-900">NE-NIM-A10-05126</strong> · 📞 <strong className="font-mono text-slate-900">+227 91 58 44 59 / 96 16 51 81</strong>
                        </p>
                      </div>
                    </div>

                    {/* Right: Document Title, Origin Date/Time & Issuer Agent */}
                    <div className="text-right shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[9.5px]">
                      <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">
                        Liste Officielle des Élèves Inscrits
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Date & Heure : <strong className="font-mono text-slate-900">{currentDate} à {currentTime}</strong>
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Agent émetteur : <strong className="text-indigo-900">{currentUser.fullName}</strong> ({currentUser.role})
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                        Effectif : <strong className="text-slate-900">{students.length} élève(s)</strong> ({activeCount} actifs · {totalWeeklySessions} séa./sem.)
                      </div>
                    </div>
                  </div>

                  {/* Sub-header Filter & KPI summary strip */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-600">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span>Cycle : <strong className="text-slate-900">{getCycleLabel()}</strong></span>
                      <span>·</span>
                      <span>Sexe : <strong className="text-indigo-900">{getGenderFilterLabel()}</strong></span>
                      <span>·</span>
                      <span>Encadrement : <strong className="text-slate-900">{getTutoringFilterLabel()}</strong></span>
                      <span>·</span>
                      <span>Paiement : <strong className="text-slate-900">{getStatusLabel()}</strong></span>
                      {searchQuery && (
                        <>
                          <span>·</span>
                          <span>Recherche : <strong className="text-slate-900">"{searchQuery}"</strong></span>
                        </>
                      )}
                    </div>
                    <span className="font-mono font-bold bg-slate-100 border border-slate-300 text-slate-700 px-1.5 py-0.5 rounded text-[8px] uppercase">
                      Document Officiel Multi-Pages · Cab-Appuis
                    </span>
                  </div>
                </th>
              </tr>

              {/* Row 2: Standardized Column Headers (repeats on every page header) */}
              <tr className="bg-slate-100 border-b-2 border-slate-400 text-slate-900 font-bold uppercase text-[9px]">
                <th className="py-2 px-1.5 border-r border-slate-300 w-8 text-center">N°</th>
                <th className="py-2 px-2 border-r border-slate-300 w-24">Matricule</th>
                <th className="py-2 px-2.5 border-r border-slate-300">Nom & Prénoms Élève</th>
                <th className="py-2 px-1.5 border-r border-slate-300 text-center w-10">Sexe</th>
                <th className="py-2 px-2 border-r border-slate-300">Classe / Série</th>
                <th className="py-2 px-2 border-r border-slate-300">Tuteur & Téléphone</th>
                <th className="py-2 px-1.5 border-r border-slate-300 text-center">Séa./sem.</th>
                <th className="py-2 px-2 border-r border-slate-300">Encadreur(s) / Statut</th>
                <th className="py-2 px-2 border-r border-slate-300 text-right">Scolarité</th>
                <th className="py-2 px-2 text-right">Reste</th>
              </tr>
            </thead>

            {/* TBODY: Students Table Rows with Avoid-Break */}
            <tbody className="divide-y divide-slate-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                    Aucun élève ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                students.map((stu, index) => {
                  const remaining = Math.max(0, stu.monthlyFee - stu.paidAmount);
                  const tutorNames = stu.tutorAssignments && stu.tutorAssignments.length > 0
                    ? stu.tutorAssignments.map(t => t.tutorName).join(', ')
                    : null;

                  return (
                    <tr
                      key={stu.id}
                      className={`print-avoid-break ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                    >
                      {/* Row index */}
                      <td className="py-1.5 px-1.5 text-center font-mono text-[9px] text-slate-500 border-r border-slate-200">
                        {index + 1}
                      </td>

                      {/* Matricule */}
                      <td className="py-1.5 px-2 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {stu.matricule}
                      </td>

                      {/* Full Name & Register Agent */}
                      <td className="py-1.5 px-2.5 font-semibold text-slate-950 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{stu.fullName}</div>
                        {stu.agentName && (
                          <div className="text-[8.5px] text-slate-500 font-normal">
                            Agent: {stu.agentName}
                          </div>
                        )}
                      </td>

                      {/* Gender Badge M / F */}
                      <td className="py-1.5 px-1.5 text-center font-bold border-r border-slate-200">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                            stu.gender === 'Féminin (F)'
                              ? 'bg-pink-100 text-pink-700 border border-pink-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {stu.gender === 'Féminin (F)' ? 'F' : 'M'}
                        </span>
                      </td>

                      {/* Level & Cycle */}
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        <div className="font-medium text-slate-900">{stu.level}</div>
                        <div className="text-[8.5px] text-slate-500">{stu.stream}</div>
                      </td>

                      {/* Guardian & Phone */}
                      <td className="py-1.5 px-2 border-r border-slate-200">
                        <div className="text-slate-800">{stu.guardianName}</div>
                        <div className="text-[9px] font-mono text-slate-500">{stu.guardianPhone}</div>
                      </td>

                      {/* Sessions per week (Quota) */}
                      <td className="py-1.5 px-1.5 text-center font-mono font-bold text-indigo-950 border-r border-slate-200 whitespace-nowrap">
                        <div>{stu.sessionsPerWeek || 3} séa.</div>
                        <div className="text-[8.5px] text-emerald-700 font-normal">
                          {formatSessionHours((stu.sessionsPerWeek || 3) * 1.5)}
                        </div>
                      </td>

                      {/* Tutors & Status */}
                      <td className="py-1.5 px-2 border-r border-slate-200 text-[9.5px]">
                        {tutorNames ? (
                          <div className="font-medium text-slate-900 truncate max-w-[130px]" title={tutorNames}>
                            {tutorNames}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">Non assigné</div>
                        )}
                        <div>
                          {stu.tutoringStatus === 'Actif' && (
                            <span className="text-emerald-700 font-bold text-[9px]">● Actif</span>
                          )}
                          {stu.tutoringStatus === 'Arrêté (À la demande)' && (
                            <span className="text-purple-700 font-semibold text-[9px]">● Arrêt (Demande)</span>
                          )}
                          {stu.tutoringStatus === 'Arrêté (Défaut de paiement)' && (
                            <span className="text-rose-700 font-semibold text-[9px]">● Arrêt (Impayé)</span>
                          )}
                        </div>
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-1.5 px-2 text-right font-mono border-r border-slate-200 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{stu.monthlyFee.toLocaleString()} F</div>
                        <div className="text-[8.5px] text-emerald-700 font-semibold">
                          Payé: {stu.paidAmount.toLocaleString()} F
                        </div>
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-1.5 px-2 text-right font-mono whitespace-nowrap">
                        {remaining > 0 ? (
                          <span className="font-bold text-rose-700">
                            {remaining.toLocaleString()} F
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600">0 F (Soldé)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TFOOT: TOTALS, SIGNATURES & OFFICIAL SEALS */}
            <tfoot>
              {/* Totals Row */}
              <tr className="bg-slate-100 border-t-2 border-slate-900 font-bold text-[10.5px] print-avoid-break">
                <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-slate-900 font-bold">
                  Totaux Généraux ({students.length} élèves) :
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-indigo-950 border-r border-slate-300">
                  {totalWeeklySessions} séa./sem.
                </td>
                <td className="py-2.5 px-2 border-r border-slate-300 text-[9px] text-slate-600">
                  {activeCount} actifs / {stoppedDemandCount + stoppedUnpaidCount} arrêts
                </td>
                <td className="py-2.5 px-2 text-right font-mono border-r border-slate-300">
                  <div className="text-slate-900">{totalMonthlyFees.toLocaleString()} FCFA</div>
                  <div className="text-[9px] text-emerald-700 font-semibold">
                    Reçu: {totalPaid.toLocaleString()} FCFA
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-rose-700 font-extrabold">
                  {totalRemaining.toLocaleString()} FCFA
                </td>
              </tr>

              {/* Signatures & Official Approvals Row */}
              <tr className="print-avoid-break">
                <td colSpan={10} className="pt-6 pb-2">
                  <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50">
                    <div className="grid grid-cols-3 gap-6 text-center text-[9.5px]">
                      <div>
                        <span className="font-bold text-slate-800 block uppercase">
                          Le Responsable Pédagogique
                        </span>
                        <div className="h-14 mt-1 border-b border-dashed border-slate-400"></div>
                        <span className="text-slate-500 text-[8.5px] mt-1 block">Signature & Date</span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 block uppercase">
                          L'Agent de Caisse / Comptable
                        </span>
                        <div className="h-14 mt-1 border-b border-dashed border-slate-400"></div>
                        <span className="text-slate-500 text-[8.5px] mt-1 block">Cachet & Signature</span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 block uppercase">
                          La Direction du Cabinet
                        </span>
                        <div className="h-14 mt-1 border-b border-dashed border-slate-400"></div>
                        <span className="text-slate-500 text-[8.5px] mt-1 block">
                          Visa & Cachet Officiel CAS-MANI
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8.5px] text-slate-500 space-y-0.5">
                      <p className="font-semibold text-slate-700">
                        Cabinet d'Appuis Scolaire MANI (CAS-MANI / Cab-Appuis) · Quartier Niamey 2000, Niamey (Niger) · NIF : 153633/P · RCCM : NE-NIM-A10-05126 · Contacts : +227 91 58 44 59 / 96 16 51 81
                      </p>
                      <p className="text-slate-400">
                        Document officiel certifié conforme · Enregistrement et suivi informatisé sous Cloud Firebase.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
