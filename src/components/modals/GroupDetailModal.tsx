import React, { useState, useMemo } from 'react';
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
  UserPlus,
  UserMinus,
  Trash2,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, TutoringGroup } from '../../types';
import { formatSessionHours, calculateWeeklyHours } from '../../utils/dateUtils';
import { getStudentSiblings } from '../../utils/familyUtils';
import { extractTutoringGroups } from '../../utils/groupUtils';
import { CAB_APPUIS_LOGO } from '../../assets/logo';
import { AddStudentToGroupModal } from './AddStudentToGroupModal';
import { AssignTutorToGroupModal } from './AssignTutorToGroupModal';

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
  const {
    students,
    tutors,
    setSelectedReceipt,
    setIsNewPaymentModalOpen,
    setFamilyPaymentTargetParent,
    removeStudentFromGroup,
    unassignTutorFromGroup,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'stopped'>('all');

  // Sub-modals state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAssignTutorModalOpen, setIsAssignTutorModalOpen] = useState(false);

  // Dynamically compute the freshest group data from context state
  const liveGroup = useMemo(() => {
    if (!group) return null;
    const allGroups = extractTutoringGroups(students, tutors);
    return allGroups.find((g) => (g?.id ?? '').toLowerCase() === (group.id ?? '').toLowerCase()) || group;
  }, [group, students, tutors]);

  if (!isOpen || !liveGroup) return null;

  // Filter students within the group
  const filteredStudents = (liveGroup.students || []).filter((stu) => {
    if (!stu) return false;
    const searchLower = (searchTerm ?? '').trim().toLowerCase();
    const nameSafe = (stu.fullName ?? '').toLowerCase();
    const matriculeSafe = (stu.matricule ?? '').toLowerCase();
    const guardianSafe = (stu.guardianName ?? '').toLowerCase();
    const phoneSafe = stu.guardianPhone ?? '';

    const matchesSearch =
      !searchLower ||
      nameSafe.includes(searchLower) ||
      matriculeSafe.includes(searchLower) ||
      guardianSafe.includes(searchLower) ||
      phoneSafe.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && stu.tutoringStatus === 'Actif') ||
      (statusFilter === 'stopped' && stu.tutoringStatus !== 'Actif');

    return matchesSearch && matchesStatus;
  });

  const weeklyHours = calculateWeeklyHours(liveGroup.sessionsPerWeek);

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

  const handleRemoveStudent = async (stu: Student) => {
    if (window.confirm(`Confirmez-vous le retrait de l'élève "${stu.fullName}" du groupe "${liveGroup.name}" ?`)) {
      await removeStudentFromGroup(stu.id);
    }
  };

  const handleUnassignTutor = async (tutorId: string, tutorName: string) => {
    if (window.confirm(`Confirmez-vous la désaffectation de l'encadreur "${tutorName}" du groupe "${liveGroup.name}" ?`)) {
      await unassignTutorFromGroup(tutorId, liveGroup.id);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Control Bar (Hidden on print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4 gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800 px-2 py-0.5 rounded">
                    {liveGroup.id}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {liveGroup.stream} · {liveGroup.level}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  {liveGroup.name}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Action 1: Add student to group */}
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
                title="Ajouter un ou plusieurs élèves à ce groupe"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Ajouter Élève</span>
              </button>

              {/* Action 2: Assign tutor to group */}
              <button
                onClick={() => setIsAssignTutorModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
                title="Affecter un enseignant / encadreur à ce groupe"
              >
                <GraduationCap className="h-4 w-4" />
                <span>+ Affecter Enseignant</span>
              </button>

              {/* Action 3: Print */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                title="Imprimer la fiche officielle du groupe"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scoped print style for clean single-page A4 portrait */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  @page {
                    size: A4 portrait !important;
                    margin: 6mm 8mm 6mm 8mm !important;
                  }
                  .printable-document {
                    background: white !important;
                    color: #0f172a !important;
                    padding: 8px !important;
                  }
                  .printable-document * {
                    color: #0f172a !important;
                  }
                }
              `,
            }}
          />

          {/* Modal Scrollable Content */}
          <div className="overflow-y-auto p-6 space-y-6 printable-document single-page-doc print:space-y-3 print:p-2 print:max-h-[280mm] print:overflow-hidden">
            {/* Header Chapeau pour l'impression */}
            <div className="hidden print:flex items-start justify-between border-b-2 border-slate-900 pb-2 mb-2">
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
                  {liveGroup.id}
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
                    {liveGroup.students.length}
                  </span>
                  <span className="text-xs text-slate-400">élève(s) inscrits</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <UserCheck className="h-3 w-3" />
                      <span>{liveGroup.activeCount} actif(s)</span>
                    </span>
                    {liveGroup.stoppedCount > 0 && (
                      <span className="flex items-center gap-1 text-rose-400">
                        <UserX className="h-3 w-3" />
                        <span>{liveGroup.stoppedCount} arrêté(s)</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="text-[10.5px] text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer print:hidden"
                  >
                    + Ajouter
                  </button>
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
                    {liveGroup.sessionsPerWeek}
                  </span>
                  <span className="text-xs text-slate-300">séances / semaine</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 font-mono">
                  = {formatSessionHours(weeklyHours)} net cabinet (dédoublonné)
                </p>
                <div className="mt-1.5 text-[10.5px] text-indigo-300 truncate font-medium">
                  📍 {liveGroup.timeSlot}
                </div>
              </div>

              {/* Encadreurs Assignés */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Encadreur(s) Assigné(s)</span>
                  <button
                    onClick={() => setIsAssignTutorModalOpen(true)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-0.5 print:hidden cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Affecter</span>
                  </button>
                </div>
                <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {liveGroup.tutors.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-1 flex items-center justify-between">
                      <span>Aucun encadreur affecté</span>
                      <button
                        onClick={() => setIsAssignTutorModalOpen(true)}
                        className="text-[10px] text-purple-400 underline not-italic font-semibold cursor-pointer print:hidden"
                      >
                        + Affecter
                      </button>
                    </div>
                  ) : (
                    liveGroup.tutors.map((tut) => (
                      <div key={tut.id} className="flex items-center justify-between gap-2 p-1 rounded bg-slate-900/60">
                        <div className="flex items-center gap-2 truncate">
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

                        <button
                          onClick={() => handleUnassignTutor(tut.id, tut.name)}
                          className="text-[9.5px] text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/40 rounded transition-colors print:hidden cursor-pointer"
                          title="Désaffecter cet encadreur du groupe"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
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
                  {(liveGroup?.totalPaid ?? 0).toLocaleString()} / {(liveGroup?.totalMonthlyFee ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Reste global :</span>
                  <span className={`font-mono font-bold ${(liveGroup?.totalBalance ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(liveGroup?.totalBalance ?? 0) > 0 ? `-${(liveGroup?.totalBalance ?? 0).toLocaleString()} FCFA` : 'Soldé à 100%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subjects Tag Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-800 bg-slate-850">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-2">Matières du groupe :</span>
                {(liveGroup?.subjects || []).map((sub, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                  >
                    {sub}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-800/60 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Ajouter Élève</span>
                </button>
                <button
                  onClick={() => setIsAssignTutorModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/60 transition-colors cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Affecter Enseignant</span>
                </button>
              </div>
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
                  Tous ({liveGroup.students.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Actifs ({liveGroup.activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('stopped')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'stopped' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Arrêtés ({liveGroup.stoppedCount})
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
                        <Users className="h-7 w-7 mx-auto mb-2 opacity-50 text-slate-500" />
                        <p className="font-semibold text-white">Aucun élève dans ce groupe</p>
                        <button
                          onClick={() => setIsAddStudentModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Ajouter des élèves maintenant</span>
                        </button>
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
                                {stu.gender === 'Masculin (M)' ? 'Garçon' : 'Fille'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-200">{stu.guardianName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              📞 {stu.guardianPhone}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {stu.tutoringStatus === 'Actif' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <UserCheck className="h-3 w-3" />
                                <span>Actif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20" title={stu.stopReason}>
                                <UserX className="h-3 w-3" />
                                <span>{stu.tutoringStatus.includes('paiement') ? 'Impayé' : 'Arrêté'}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                            {(stu?.monthlyFee ?? 0).toLocaleString()} F
                          </td>
                          <td className="py-3 px-3 text-center">
                            {balance === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Soldé</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                <Clock className="h-3 w-3" />
                                <span>-{(balance ?? 0).toLocaleString()} F</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1.5">
                              {onSelectStudentForDetail && (
                                <button
                                  onClick={() => onSelectStudentForDetail(stu)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="Consulter le dossier 360 de l'élève"
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

                              {/* Remove student from group action */}
                              <button
                                onClick={() => handleRemoveStudent(stu)}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Retirer cet élève du groupe d'encadrement"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
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
                      {filteredStudents.reduce((sum, s) => sum + (s?.paidAmount ?? 0), 0).toLocaleString()} /{' '}
                      {filteredStudents.reduce((sum, s) => sum + (s?.monthlyFee ?? 0), 0).toLocaleString()} FCFA
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-xs font-mono text-rose-400">
                      Reste : -{filteredStudents.reduce((sum, s) => sum + Math.max(0, (s?.monthlyFee ?? 0) - (s?.paidAmount ?? 0)), 0).toLocaleString()} FCFA
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
                <p className="text-[8px] text-slate-500 italic mt-8">(Signature)</p>
              </div>
              <div>
                <p className="font-bold text-slate-800">LE CAISSIER PRINCIPAL</p>
                <p className="text-[8px] text-slate-500 italic mt-8">(Cachet & Quittance)</p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-slate-800 bg-slate-850 px-6 py-3 flex justify-between items-center text-xs text-slate-400 print:hidden">
            <span>Cabinet d'Appuis Scolaire MANI · Quartier Niamey 2000 (Niamey, Niger)</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Add Student to Group Modal */}
      <AddStudentToGroupModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        targetGroup={liveGroup}
      />

      {/* Assign Tutor to Group Modal */}
      <AssignTutorToGroupModal
        isOpen={isAssignTutorModalOpen}
        onClose={() => setIsAssignTutorModalOpen(false)}
        targetGroup={liveGroup}
      />
    </>
  );
};
