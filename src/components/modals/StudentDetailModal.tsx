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
} from 'lucide-react';
import { Student } from '../../types';
import { useApp } from '../../context/AppContext';

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
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'supplies' | 'exams'>('payments');

  if (!isOpen || !student) return null;

  const studentPayments = getStudentPayments(student.id);
  const studentExams = getStudentExams(student.id);
  const studentSupplies = getStudentSupplies(student.id);

  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, student.monthlyFee - student.paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
              {student.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {student.fullName}
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300">
                  {student.matricule}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {student.level} · Cycle {student.stream}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Highlights Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tutoring Status */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Statut Encadrement
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {student.tutoringStatus === 'Actif' && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                    <span>Actif aux cours</span>
                  </span>
                )}
                {student.tutoringStatus === 'Arrêté (À la demande)' && (
                  <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <UserX className="h-4 w-4" />
                    <span>Arrêté (À la demande)</span>
                  </span>
                )}
                {student.tutoringStatus === 'Arrêté (Défaut de paiement)' && (
                  <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Suspendu (Impayé)</span>
                  </span>
                )}
              </div>
              {student.stopReason && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1">
                  "{student.stopReason}"
                </p>
              )}
            </div>

            {/* Quota Séances Hebdo */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 p-3.5">
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 uppercase tracking-wider font-semibold block mb-1">
                Quota Séances Hebdo
              </span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-indigo-900 dark:text-indigo-200">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>{student.sessionsPerWeek || 3} séances/sem.</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                ~{(student.sessionsPerWeek || 3) * 2} heures/semaine
              </div>
            </div>

            {/* Financial Status */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                Situation Financière
              </span>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {student.paidAmount.toLocaleString()} / {student.monthlyFee.toLocaleString()} FCFA
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {balanceDue > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    Reste dû : {balanceDue.toLocaleString()} FCFA
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
                <span>{student.agentName}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {student.agentRole} · {student.enrollmentDate}
              </div>
            </div>
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
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Matières suivies :</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {student.subjects.map((subj, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px]">
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chained Relational Entities (Tabs) */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Historique Chaîné de l'Élève (Liaisons Relationnelles)
              </h3>

              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
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
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-white">
                              {p.receiptNumber} · {p.category}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {p.paymentDate} · Encaissé par : <strong className="text-slate-700 dark:text-slate-300">{p.agentName} ({p.agentRole})</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            +{p.amount.toLocaleString()} FCFA
                          </span>
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            Reçu
                          </button>
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
                      Aucun achat de fourniture lié à cet élève pour le moment.
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
                            {sale.totalAmount.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          {sale.items.map((it) => `${it.itemName} (x${it.quantity})`).join(', ')}
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
                setEditingStudent(student);
                setIsNewStudentModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
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
    </div>
  );
};
