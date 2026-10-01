import React, { useState } from 'react';
import {
  X,
  Layers,
  Users,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  CreditCard,
  Phone,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  GraduationCap,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, TutoringGroup } from '../../types';
import { formatSessionHours, calculateWeeklyHours } from '../../utils/dateUtils';
import { getStudentSiblings } from '../../utils/familyUtils';
import { CAB_APPUIS_LOGO } from '../../assets/logo';

interface GroupDetailModalProps {
  group: TutoringGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectStudentForDetail?: (student: Student) => void;
  onSelectStudentForPayment?: (student: Student) => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  group,
  isOpen,
  onClose,
  onSelectStudentForDetail,
  onSelectStudentForPayment,
}) => {
  const { students, setSelectedReceipt, setIsNewPaymentModalOpen, setFamilyPaymentTargetParent } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'stopped'>('all');

  if (!isOpen || !group) return null;

  // Filter students within the group
  const filteredStudents = group.students.filter((stu) => {
    const matchesSearch =
      stu.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stu.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stu.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stu.guardianPhone.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && stu.tutoringStatus === 'Actif') ||
      (statusFilter === 'stopped' && stu.tutoringStatus !== 'Actif');

    return matchesSearch && matchesStatus;
  });

  const weeklyHours = calculateWeeklyHours(group.sessionsPerWeek);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenFamilyPayment = (stu: Student) => {
    const siblings = getStudentSiblings(stu, students);
    setFamilyPaymentTargetParent({
      guardianName: stu.guardianName,
      guardianPhone: stu.guardianPhone,
      studentIds: [stu.id, ...siblings.map((s) => s.id)],
    });
    setIsNewPaymentModalOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800 px-2 py-0.5 rounded">
                  {group.id}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {group.stream} · {group.level}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {group.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
              title="Imprimer la fiche officielle du groupe"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer le Groupe</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 printable-document">
          {/* Header Chapeau pour l'impression */}
          <div className="hidden print:flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <img src={CAB_APPUIS_LOGO} alt="Logo" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="text-sm font-black uppercase text-slate-950">Cabinet d'Appuis Scolaire MANI</h1>
                <p className="text-[10px] font-bold text-indigo-900">FICHE TECHNIQUE DU GROUPE D'ENCADREMENT COLLECTIF</p>
                <p className="text-[8.5px] text-slate-600 font-mono">Niamey 2000 · NIF: 153633/P · RCCM: NE-NIM-A10-05126</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded border border-slate-300">
                {group.id}
              </span>
              <p className="text-[9px] text-slate-600 mt-1">Édité le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Group Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Effectif Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Effectif du Groupe</span>
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-white">
                  {group.students.length}
                </span>
                <span className="text-xs text-slate-400">élève(s) inscrits</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <UserCheck className="h-3 w-3" />
                  <span>{group.activeCount} actif(s)</span>
                </span>
                {group.stoppedCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400">
                    <UserX className="h-3 w-3" />
                    <span>{group.stoppedCount} arrêté(s)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Volume Séances Mutualisées */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Créneau & Volume Mutualisé</span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-emerald-400">
                  {group.sessionsPerWeek}
                </span>
                <span className="text-xs text-slate-300">séances / semaine</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-mono">
                = {formatSessionHours(weeklyHours)} net cabinet (dédoublonné)
              </p>
              <div className="mt-1.5 text-[10.5px] text-indigo-300 truncate font-medium">
                📍 {group.timeSlot}
              </div>
            </div>

            {/* Encadreurs Assignés */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Encadreur(s) Assigné(s)</span>
                <GraduationCap className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 space-y-1">
                {group.tutors.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Aucun encadreur affecté</span>
                ) : (
                  group.tutors.map((tut) => (
                    <div key={tut.id} className="flex items-center gap-2">
                      {tut.avatar ? (
                        <img src={tut.avatar} alt={tut.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">
                          {tut.name[0]}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">{tut.name}</div>
                        {tut.phone && <div className="text-[10px] text-slate-400 font-mono">{tut.phone}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Synthèse Financière */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Scolarité Collective</span>
                <CreditCard className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 font-mono text-lg font-bold text-white">
                {group.totalPaid.toLocaleString()} / {group.totalMonthlyFee.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Reste global :</span>
                <span className={`font-mono font-bold ${group.totalBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {group.totalBalance > 0 ? `-${group.totalBalance.toLocaleString()} FCFA` : 'Soldé à 100%'}
                </span>
              </div>
            </div>
          </div>

          {/* Subjects Tag Strip */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-850">
            <span className="text-xs font-semibold text-slate-400 mr-2">Matières du groupe :</span>
            {group.subjects.map((sub, idx) => (
              <span
                key={idx}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Filter & Search Bar within the Modal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer les élèves du groupe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-800 p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({group.students.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Actifs ({group.activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('stopped')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'stopped' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Arrêtés ({group.stoppedCount})
              </button>
            </div>
          </div>

          {/* Detailed Students Table for this Group */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-850">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-8 text-center">N°</th>
                  <th className="py-3 px-3">Matricule & Élève</th>
                  <th className="py-3 px-3">Niveau & Sexe</th>
                  <th className="py-3 px-3">Tuteur Légal (Niamey)</th>
                  <th className="py-3 px-3 text-center">Statut Encadrement</th>
                  <th className="py-3 px-3 text-right">Scolarité (FCFA)</th>
                  <th className="py-3 px-3 text-center">Paiement</th>
                  <th className="py-3 px-3 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucun élève ne correspond aux critères dans ce groupe.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu, idx) => {
                    const balance = Math.max(0, stu.monthlyFee - stu.paidAmount);
                    const siblings = getStudentSiblings(stu, students);
                    const hasSiblings = siblings.length > 0;

                    return (
                      <tr
                        key={stu.id}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          stu.tutoringStatus !== 'Actif' ? 'bg-slate-900/40 opacity-80' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                              {stu.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-white">{stu.fullName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{stu.matricule}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200">{stu.level}</div>
                          {stu.gender && (
                            <span
                              className={`inline-block px-1 rounded text-[9.5px] font-bold mt-0.5 ${
                                stu.gender === 'Masculin (M)'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-pink-500/20 text-pink-300'
                              }`}
                            >
                              {stu.gender === 'Masculin (M)' ? 'Garçon (M)' : 'Fille (F)'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-300">{stu.guardianName}</div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                            <Phone className="h-2.5 w-2.5" />
                            <span>{stu.guardianPhone}</span>
                          </div>
                          {hasSiblings && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Fratrie ({siblings.length + 1} enfants)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {stu.tutoringStatus === 'Actif' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>Actif</span>
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span>{stu.tutoringStatus}</span>
                              </span>
                              {stu.stopReason && (
                                <div className="text-[9px] text-slate-400 italic mt-0.5 truncate max-w-[130px] mx-auto">
                                  {stu.stopReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-bold text-white">
                            {stu.paidAmount.toLocaleString()} / {stu.monthlyFee.toLocaleString()}
                          </div>
                          {balance > 0 && (
                            <div className="font-mono text-[10px] font-semibold text-rose-400">
                              Reste: -{balance.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              stu.paymentStatus === 'A jour'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : stu.paymentStatus === 'Partiel'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {stu.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right print:hidden">
                          <div className="flex items-center justify-end gap-1.5">
                            {onSelectStudentForDetail && (
                              <button
                                onClick={() => {
                                  onSelectStudentForDetail(stu);
                                  onClose();
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Voir le profil 360° de l'élève"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {hasSiblings ? (
                              <button
                                onClick={() => handleOpenFamilyPayment(stu)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-purple-600/80 hover:bg-purple-600 text-[10.5px] font-semibold text-white transition-colors cursor-pointer shadow-sm"
                                title="Règlement groupé pour la fratrie de ce tuteur"
                              >
                                <CreditCard className="h-3 w-3" />
                                <span>Reçu Famille</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (onSelectStudentForPayment) {
                                    onSelectStudentForPayment(stu);
                                  } else {
                                    setIsNewPaymentModalOpen(true);
                                  }
                                  onClose();
                                }}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                                title="Encaisser scolarité"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-900 border-t-2 border-slate-700 text-slate-300 font-bold">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase text-[11px]">
                    Total Groupe ({filteredStudents.length} élèves) :
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white text-xs">
                    {filteredStudents.reduce((sum, s) => sum + s.paidAmount, 0).toLocaleString()} /{' '}
                    {filteredStudents.reduce((sum, s) => sum + s.monthlyFee, 0).toLocaleString()} FCFA
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-xs font-mono text-rose-400">
                    Reste : -{filteredStudents.reduce((sum, s) => sum + Math.max(0, s.monthlyFee - s.paidAmount), 0).toLocaleString()} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Certification Block (Shown on print) */}
          <div className="hidden print:grid grid-cols-3 gap-4 pt-6 border-t border-slate-900 mt-6 text-center text-[10px]">
            <div>
              <p className="font-bold text-slate-800">LE RESPONSABLE PÉDAGOGIQUE</p>
              <p className="text-[8px] text-slate-500 italic mt-8">(Visa & Émargement)</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">L'ENCADREUR DU GROUPE</p>
              <p className="text-[8px] text-slate-500 italic mt-8">(Signature & Date)</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">DIRECTION CAS MANI</p>
              <p className="text-[8px] text-slate-500 italic mt-8">Cachet Officiel Niamey 2000</p>
            </div>
          </div>
        </div>

        {/* Footer (Hidden on print) */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <span>
            Groupe certifié Cabinet MANI · {group.students.length} élève(s) · {group.sessionsPerWeek} séances/semaine
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer la Fiche</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
