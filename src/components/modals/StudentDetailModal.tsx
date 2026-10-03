import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  CreditCard,
  ShoppingBag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  BadgeCheck,
  Edit,
  BookOpen,
  Lock,
  Plus,
  Layers,
  Users,
  Sparkles,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { Student, PaymentReceipt } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatSessionHours, calculateWeeklyHours } from '../../utils/dateUtils';
import { getStudentsInSameGroup, getStudentGroup } from '../../utils/groupUtils';
import { getStudentSiblings } from '../../utils/familyUtils';
import {
  isPrimaryStudent,
  getPrimaryTutorForStudent,
  getStudentPedagogicalCoverage,
} from '../../utils/tutorAssignmentValidation';
import { SelectGroupForStudentModal } from './SelectGroupForStudentModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const {
    getStudentPayments,
    getStudentExams,
    getStudentSupplies,
    setSelectedReceipt,
    setIsStopTutoringModalOpen,
    setSelectedStudentForStop,
    setIsNewPaymentModalOpen,
    setEditingStudent,
    setIsNewStudentModalOpen,
    tutors,
    students,
    setIsAssignModalOpen,
    setSelectedStudentForAssignment,
    setSelectedGroupForDetail,
    setIsGroupDetailModalOpen,
    setFamilyPaymentTargetParent,
    deletePayment,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tutors' | 'payments' | 'supplies' | 'exams'>('tutors');
  const [isSelectGroupModalOpen, setIsSelectGroupModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentReceipt | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  if (!isOpen || !student) return null;

  const studentGroup = getStudentGroup(student, students, tutors);
  const groupMates = getStudentsInSameGroup(student, students);
  const siblings = getStudentSiblings(student, students);

  const studentPayments = getStudentPayments(student.id);
  const studentExams = getStudentExams(student.id);
  const studentSupplies = getStudentSupplies(student.id);

  const balanceDue = Math.max(0, student.monthlyFee - student.paidAmount);
  const isStopped = student.tutoringStatus !== 'Actif';
  const isPrimary = isPrimaryStudent(student);

  // Couverture matière par matière
  const subjectCoverage = getStudentPedagogicalCoverage(student, tutors);
  const primaryTutor = isPrimary ? getPrimaryTutorForStudent(student, tutors) : null;

  // Calcul du quota hebdomadaire
  const weeklySessions = student.sessionsPerWeek || 3;
  const weeklyHours = calculateWeeklyHours(weeklySessions);

  const handleOpenAssignModal = () => {
    setSelectedStudentForAssignment(student);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30 flex items-center justify-center shrink-0">
              <img
                src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={student.fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {student.fullName}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {student.matricule}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    student.gender === 'Féminin (F)'
                      ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {student.gender === 'Féminin (F)' ? 'F' : 'M'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {student.level} · Cycle {student.stream}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Tutoring Status */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Statut Encadrement
              </span>
              <div className="flex items-center gap-1.5">
                {isStopped ? (
                  <>
                    <UserX className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {student.tutoringStatus}
                    </span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Actif en cours
                    </span>
                  </>
                )}
              </div>
              {student.stopDate && (
                <div className="text-[10px] text-rose-500 mt-1 font-mono">
                  Arrêté le {student.stopDate}
                </div>
              )}
            </div>

            {/* Weekly Sessions Quota */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Quota Hebdomadaire
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {weeklySessions} séance{weeklySessions > 1 ? 's' : ''}/semaine
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-semibold">
                = {formatSessionHours(weeklyHours)} / sem. (1h30/séance)
              </div>
            </div>

            {/* Financial Status */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Paiement Mensuel
              </span>
              <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                {(student?.paidAmount ?? 0).toLocaleString()} / {(student?.monthlyFee ?? 0).toLocaleString()} FCFA
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {balanceDue > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    Reste dû : {(balanceDue ?? 0).toLocaleString()} FCFA
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Totalement à jour
                  </span>
                )}
              </div>
            </div>

            {/* Traceability Agent */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Agent Enregistreur
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                <span className="truncate">{student.agentName}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {student.agentRole}
              </div>
            </div>
          </div>

          {/* USER REQUIREMENT: ENCADREMENT & MATIÈRES ATTRIBUÉES AVEC NOM ET PHOTO */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-600 text-white">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                    Encadrement Pédagogique & Matières Attribuées
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isPrimary
                      ? 'Niveau Primaire : 1 seul et unique encadreur référent'
                      : 'Niveau Collège & Lycée : Matières distinctes par encadreur'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAssignModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Gérer les Affectations</span>
              </button>
            </div>

            {/* CAS 1 : PRIMAIRE -> ENCADREUR UNIQUE RÉFÉRENT */}
            {isPrimary ? (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {primaryTutor ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={primaryTutor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                        alt={primaryTutor.fullName}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/30"
                      />
                      <div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block">
                          Encadreur Référent Unique
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {primaryTutor.fullName}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {primaryTutor.matricule} · <a href={`tel:${primaryTutor.phone}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{primaryTutor.phone}</a>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Toutes matières couvertes
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-slate-400">
                    <span className="block font-medium text-amber-600 dark:text-amber-400 mb-1">
                      Aucun encadreur référent attribué pour le moment.
                    </span>
                    Cliquez sur "Gérer les Affectations" pour attribuer un encadreur unique.
                  </div>
                )}
              </div>
            ) : (
              /* CAS 2 : COLLÈGE & LYCÉE -> TABLEAU PAR MATIÈRE AVEC NOM ET PHOTO */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {subjectCoverage.map((item) => (
                  <div
                    key={item.subject}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-colors ${
                      item.isAssigned
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.isAssigned && item.tutorAvatar ? (
                        <img
                          src={item.tutorAvatar}
                          alt={item.tutorName}
                          className="h-9 w-9 rounded-full object-cover ring-1 ring-indigo-500 shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {item.subject}
                        </span>
                        {item.isAssigned ? (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                            {item.tutorName}{' '}
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.tutorMatricule})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                            Non attribué
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        item.isAssigned
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.isAssigned ? 'Attribué' : 'À planifier'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guardian & Details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tuteur Légal :</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{student.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Téléphone Tuteur :</span>
                <a href={`tel:${student.guardianPhone}`} className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  {student.guardianPhone}
                </a>
              </div>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Toutes les Matières inscrites :</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {student.subjects.map((subj, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px]">
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* GROUPE D'ENCADREMENT COLLECTIF (USER REQUIREMENT) */}
          {student.groupId && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-indigo-600 text-white">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Groupe d'Encadrement Collectif :</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded text-[11px]">
                        {student.groupId}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {student.groupName || studentGroup?.name || 'Encadrement en groupe mutualisé'} · {student.timeSlot || studentGroup?.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {studentGroup && (
                    <button
                      onClick={() => {
                        setSelectedGroupForDetail(studentGroup);
                        setIsGroupDetailModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Fiche Groupe ({groupMates.length + 1} él.)</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsSelectGroupModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                    title="Changer de groupe d'encadrement ou retirer de ce groupe"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Changer</span>
                  </button>
                </div>
              </div>

              {/* Fellow students in the same group */}
              <div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Camarades dans le même groupe ({groupMates.length}) :
                </span>
                {groupMates.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Aucun autre élève n'est encore associé à cet identifiant de groupe.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groupMates.map((mate) => (
                      <div
                        key={mate.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="h-6 w-6 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {mate.fullName[0]}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">
                              {mate.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {mate.matricule} · {mate.level}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            mate.tutoringStatus === 'Actif'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {mate.tutoringStatus === 'Actif' ? 'Actif' : 'Arrêté'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GROUPE D'ENCADREMENT : Cas où l'élève n'est pas encore en groupe */}
          {!student.groupId && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Groupe d'Encadrement Collectif
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cet élève est actuellement en encadrement individuel (aucun groupe mutualisé assigné).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSelectGroupModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Affecter à un Groupe</span>
              </button>
            </div>
          )}

          {/* FRATRIE / TUTEUR AVEC PLUSIEURS ENFANTS (USER REQUIREMENT) */}
          {siblings.length > 0 && (
            <div className="rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-600 text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Fratrie Inscrite au Cabinet ({siblings.length + 1} enfants)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tuteur : <strong>{student.guardianName}</strong> · Tél : <span className="font-mono">{student.guardianPhone}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFamilyPaymentTargetParent({
                      guardianName: student.guardianName,
                      guardianPhone: student.guardianPhone,
                      studentIds: [student.id, ...siblings.map((s) => s.id)],
                    });
                    setIsNewPaymentModalOpen(true);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Émettre un Reçu Groupé Famille</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {siblings.map((sib) => (
                  <div
                    key={sib.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {sib.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sib.matricule} · {sib.level}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                      {(sib?.monthlyFee ?? 0).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chained Relational Entities (Tabs) */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Historique Chaîné & Suivi Relationnel
              </h3>

              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setActiveSubTab('tutors')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeSubTab === 'tutors'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Encadreurs ({isPrimary ? (primaryTutor ? 1 : 0) : subjectCoverage.filter((s) => s.isAssigned).length})
                </button>
                <button
                  onClick={() => setActiveSubTab('payments')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeSubTab === 'payments'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Paiements ({studentPayments.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('supplies')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeSubTab === 'supplies'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Achats Boutique ({studentSupplies.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('exams')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeSubTab === 'exams'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Concours ({studentExams.length})
                </button>
              </div>
            </div>

            <div className="mt-3">
              {/* Tutors Planning SubTab */}
              {activeSubTab === 'tutors' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                    <span>
                      Charge d'encadrement : <strong>{weeklySessions} séances par semaine</strong> (1h 30mn par séance = {formatSessionHours(weeklyHours)}/sem.)
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAssignModal}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Nouvelle affectation
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden">
                    {subjectCoverage.map((item) => (
                      <div
                        key={item.subject}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {item.tutorAvatar ? (
                            <img
                              src={item.tutorAvatar}
                              alt={item.tutorName}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.subject}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  item.isAssigned
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {item.isAssigned ? 'Couvert' : 'Non couvert'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.isAssigned ? (
                                <>
                                  Encadreur responsable : <strong>{item.tutorName}</strong> ({item.tutorMatricule}) · Téléphone : {item.tutorPhone}
                                </>
                              ) : (
                                <span>Aucun encadreur attribué pour cette matière.</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold block">
                            Séance = 1h 30mn
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments SubTab */}
              {activeSubTab === 'payments' && (
                <div className="space-y-2">
                  {studentPayments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Aucun reçu de paiement enregistré directement pour cet élève.
                    </div>
                  ) : (
                    studentPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-emerald-500/30 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {p.receiptNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                              {p.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.paymentDate} · Caissier : {p.cashierName}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            {(p?.amount ?? 0).toLocaleString()} FCFA
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedReceipt(p)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Aperçu / Imprimer le reçu"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setPaymentToDelete(p)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Supprimer ce paiement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Supplies SubTab */}
              {activeSubTab === 'supplies' && (
                <div className="space-y-2">
                  {studentSupplies.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Aucun achat de fourniture enregistré pour cet élève.
                    </div>
                  ) : (
                    studentSupplies.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {sale.saleNumber} ({sale.saleDate})
                          </span>
                          <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                            {(sale?.totalAmount ?? 0).toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          {(sale?.items || []).map((it) => `${it.itemName || 'Article'} (x${it.quantity || 1})`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Vente validée par : {sale.agentName} ({sale.agentRole})
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Exams SubTab */}
              {activeSubTab === 'exams' && (
                <div className="space-y-2">
                  {studentExams.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Aucun dossier de concours associé pour cet élève.
                    </div>
                  ) : (
                    studentExams.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {ex.dossierNumber} · {ex.examType}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ex.examBatch} · Géré par : {ex.agentName}
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          ex.status === 'Validé'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {ex.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <button
            onClick={() => {
              onClose();
              setSelectedStudentForStop(student);
              setIsStopTutoringModalOpen(true);
            }}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            Gérer Statut Arrêt / Réactivation
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                handleOpenAssignModal();
              }}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Affecter Encadreur</span>
            </button>
            <button
              onClick={() => {
                onClose();
                setEditingStudent(student);
                setIsNewStudentModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Modifier Dossier</span>
            </button>
            <button
              onClick={() => {
                onClose();
                setIsNewPaymentModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Encaisser Scolarité
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modal Affectation à un groupe */}
      <SelectGroupForStudentModal
        isOpen={isSelectGroupModalOpen}
        onClose={() => setIsSelectGroupModalOpen(false)}
        student={student}
      />

      {/* Confirmation de suppression du paiement */}
      <ConfirmDeleteModal
        isOpen={!!paymentToDelete}
        title="Supprimer ce paiement ?"
        message={
          paymentToDelete
            ? `Êtes-vous certain de vouloir supprimer le paiement N° ${paymentToDelete.receiptNumber} (${paymentToDelete.amount.toLocaleString()} FCFA) pour ${student.fullName} ? Cette action réajustera son solde restant et son statut de paiement.`
            : ''
        }
        isDeleting={isDeletingPayment}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={async () => {
          if (!paymentToDelete) return;
          setIsDeletingPayment(true);
          try {
            await deletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
          } finally {
            setIsDeletingPayment(false);
          }
        }}
      />
    </div>
  );
};
