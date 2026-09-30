import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Calendar,
  Building,
  Phone,
  UserCheck,
  UserX,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { Student } from '../../types';

interface PrintStudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  cycleFilter: string;
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
    'Niveau',
    'Cycle',
    'Matières Suivies',
    'Tuteur Légal',
    'Téléphone Tuteur',
    'Séances/Semaine',
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

  const rows = students.map((s) => [
    escapeCsv(s.matricule),
    escapeCsv(s.fullName),
    escapeCsv(s.level),
    escapeCsv(s.stream),
    escapeCsv(s.subjects.join(', ')),
    escapeCsv(s.guardianName),
    escapeCsv(s.guardianPhone),
    escapeCsv(s.sessionsPerWeek || 3),
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
  ]);

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
  statusFilter,
  tutoringFilter,
  searchQuery,
  campusName,
}) => {
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
    if (cycleFilter === 'Primaire') return 'Cycle Primaire (CI à CM2 - CFEPD)';
    if (cycleFilter === 'Collège') return 'Cycle Collège (6ème à 3ème - BEPC)';
    if (cycleFilter === 'Lycée') return 'Cycle Secondaire Lycée (2nde à Terminale)';
    return cycleFilter;
  };

  const getStatusLabel = () => {
    if (statusFilter === 'all') return 'Tous statuts';
    return statusFilter;
  };

  const getTutoringFilterLabel = () => {
    if (!tutoringFilter || tutoringFilter === 'all') return 'Tous statuts d\'encadrement';
    if (tutoringFilter === 'active') return 'Encadrements Actifs uniquement';
    if (tutoringFilter === 'stopped_demand') return 'Arrêtés : À la Demande';
    if (tutoringFilter === 'stopped_unpaid') return 'Arrêtés : Défaut de Paiement';
    if (tutoringFilter === 'stopped_all') return 'Tous les Encadrements Arrêtés';
    return tutoringFilter;
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar (hidden on paper print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Aperçu d'Impression & Export · Registre Élèves ({students.length} inscrits filtrés)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-sm"
              title="Exporter la liste filtrée au format CSV (compatible Excel)"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV (.csv)</span>
            </button>

            {/* Print / PDF button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
              title="Lancer l'impression officielle ou enregistrer en PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div id="printable-receipt" className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 text-xs font-sans">
          {/* Header Niger & Cabinet */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                  RÉPUBLIQUE DU NIGER
                </div>
                <div className="text-[9px] text-slate-500">
                  Ministère de l'Éducation Nationale · Direction Régionale des Enseignements de Niamey
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="bg-indigo-950 text-white font-extrabold text-sm px-2.5 py-1 rounded">
                    CAS-MANI
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-950 uppercase">
                      Cabinet d'Appuis Scolaire MANI
                    </h1>
                    <p className="text-[10px] font-semibold text-indigo-900">
                      Encadrement Pédagogique, Cours d'Appuis & Prépa Concours
                    </p>
                    <p className="text-[9.5px] text-slate-600 mt-0.5">
                      📍 Quartier Niamey 2000, Niamey (Niger) · NIF : <span className="font-mono font-bold text-slate-900">153633/P</span> · RCCM : <span className="font-mono font-bold text-slate-900">NE-NIM-A10-05126</span> · 📞 <span className="font-mono font-bold text-slate-900">+227 91 58 44 59 / 96 16 51 81</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block rounded border border-slate-300 bg-slate-50 px-3 py-1 text-right shadow-sm">
                  <span className="text-[10px] font-semibold text-slate-500 block">Date d'édition du registre :</span>
                  <span className="font-mono font-bold text-xs text-slate-900">{currentDate}</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  Système de Gestion · Cabinet MANI
                </div>
              </div>
            </div>
          </div>

          {/* Document Title & Active Filters Summary */}
          <div className="my-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5 mb-2.5">
              <div>
                <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide">
                  Registre Officiel des Inscriptions & Suivi Pédagogique
                </h2>
                <p className="text-[11px] text-slate-600">
                  État nominatif, financier et administratif des élèves
                </p>
              </div>
              <div className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded">
                Total : {students.length} élève(s) filtré(s)
              </div>
            </div>

            {/* Active Filters Tag Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Cycle sélectionné :</span>
                <span className="font-semibold text-slate-800">{getCycleLabel()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Statut encadrement :</span>
                <span className="font-semibold text-slate-800">{getTutoringFilterLabel()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Filtre paiement :</span>
                <span className="font-semibold text-slate-800">{getStatusLabel()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Recherche active :</span>
                <span className="font-semibold text-slate-800">{searchQuery ? `"${searchQuery}"` : 'Toutes'}</span>
              </div>
            </div>
          </div>

          {/* KPI Summary Strip on Paper */}
          <div className="grid grid-cols-5 gap-2 my-3 text-center">
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Effectif Actif</span>
              <span className="font-mono text-sm font-bold text-emerald-700">{activeCount}</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Quota Séances</span>
              <span className="font-mono text-sm font-bold text-indigo-700">{totalWeeklySessions} /sem.</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Arrêts (Demande)</span>
              <span className="font-mono text-sm font-bold text-purple-700">{stoppedDemandCount}</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Arrêts (Impayés)</span>
              <span className="font-mono text-sm font-bold text-rose-700">{stoppedUnpaidCount}</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Scolarité Cumulée</span>
              <span className="font-mono text-sm font-bold text-slate-900">{totalMonthlyFees.toLocaleString()} F</span>
            </div>
          </div>

          {/* Students Table */}
          <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[9px]">
                  <th className="py-2 px-2.5 border-r border-slate-300 w-24">Matricule</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Nom & Prénom Élève</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Niveau / Classe</th>
                  <th className="py-2 px-2.5 border-r border-slate-300">Tuteur & Téléphone</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">Séances/Sem.</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-center">Encadrement</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-right">Scolarité</th>
                  <th className="py-2 px-2.5 border-r border-slate-300 text-right">Payé</th>
                  <th className="py-2 px-2.5 text-right">Reste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 italic">
                      Aucun élève ne correspond aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  students.map((stu, index) => {
                    const remaining = Math.max(0, stu.monthlyFee - stu.paidAmount);
                    return (
                      <tr
                        key={stu.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      >
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 border-r border-slate-200">
                          {stu.matricule}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-950 border-r border-slate-200">
                          {stu.fullName}
                          {stu.agentName && (
                            <span className="block text-[9px] text-slate-500 font-normal">
                              Inscrit par : {stu.agentName}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-200">
                          <span className="font-medium text-slate-800">{stu.level}</span>
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-200">
                          <div className="text-slate-800">{stu.guardianName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{stu.guardianPhone}</div>
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono font-bold text-indigo-900 border-r border-slate-200">
                          {stu.sessionsPerWeek || 3} séa./sem.
                        </td>
                        <td className="py-1.5 px-2.5 text-center border-r border-slate-200">
                          {stu.tutoringStatus === 'Actif' && (
                            <span className="text-emerald-700 font-bold">Actif</span>
                          )}
                          {stu.tutoringStatus === 'Arrêté (À la demande)' && (
                            <span className="text-purple-700 font-semibold" title={stu.stopReason}>
                              Arrêt (Demande)
                            </span>
                          )}
                          {stu.tutoringStatus === 'Arrêté (Défaut de paiement)' && (
                            <span className="text-rose-700 font-semibold" title={stu.stopReason}>
                              Arrêt (Impayé)
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono border-r border-slate-200">
                          {stu.monthlyFee.toLocaleString()} F
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700 border-r border-slate-200 font-semibold">
                          {stu.paidAmount.toLocaleString()} F
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono">
                          {remaining > 0 ? (
                            <span className="text-rose-700 font-bold">
                              {remaining.toLocaleString()} F
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">0 F</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-[11px]">
                  <td colSpan={6} className="py-2 px-2.5 text-right uppercase text-slate-800">
                    Totaux Financiers :
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-slate-900 border-r border-slate-300">
                    {totalMonthlyFees.toLocaleString()} FCFA
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-emerald-700 border-r border-slate-300">
                    {totalPaid.toLocaleString()} FCFA
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-rose-700">
                    {totalRemaining.toLocaleString()} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Approvals Zone */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px]">
            <div>
              <span className="font-bold text-slate-700 block uppercase">Le Responsable Pédagogique</span>
              <div className="h-14 mt-1 border-b border-dashed border-slate-300"></div>
              <span className="text-slate-400 text-[9px] mt-1 block">Signature & Date</span>
            </div>

            <div>
              <span className="font-bold text-slate-700 block uppercase">L'Agent de Caisse / Comptable</span>
              <div className="h-14 mt-1 border-b border-dashed border-slate-300"></div>
              <span className="text-slate-400 text-[9px] mt-1 block">Cachet & Signature</span>
            </div>

            <div>
              <span className="font-bold text-slate-700 block uppercase">La Direction du Cabinet</span>
              <div className="h-14 mt-1 border-b border-dashed border-slate-300"></div>
              <span className="text-slate-400 text-[9px] mt-1 block">Visa & Cachet Officiel CAS-MANI</span>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-6 text-center text-[9px] text-slate-500 border-t border-slate-200 pt-2 space-y-0.5">
            <p className="font-semibold text-slate-700">
              Cabinet d'Appuis Scolaire MANI · Quartier Niamey 2000, Niamey (Niger) · NIF : 153633/P · RCCM : NE-NIM-A10-05126 · Tél : +227 91 58 44 59 / 96 16 51 81
            </p>
            <p className="text-slate-400">
              Document officiel certifié conforme · Enregistrement et suivi informatisé sous Cloud Firebase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
