import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Clock,
  Printer,
  AlertTriangle,
  UserCheck,
  UserX,
  Loader2,
  Calendar,
  Users,
  User,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentReceipt, MultiStudentReceiptItem, Student } from '../../types';
import { formatISODateToFrench, formatYYYYMMToFrench } from '../../utils/dateUtils';
import {
  getAllFamilies,
  getStudentSiblings,
  numberToFrenchWords,
  FamilyGroup,
} from '../../utils/familyUtils';

export const NewPaymentModal: React.FC = () => {
  const {
    isNewPaymentModalOpen,
    setIsNewPaymentModalOpen,
    students,
    addPayment,
    addFamilyPayment,
    setSelectedReceipt,
    resumeStudentTutoring,
    networkStatus,
    familyPaymentTargetParent,
    setFamilyPaymentTargetParent,
  } = useApp();

  // Mode: 'single' (1 élève) or 'family' (plusieurs enfants d'un même parent sur 1 seul reçu)
  const [paymentMode, setPaymentMode] = useState<'single' | 'family'>('single');

  // Single mode state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [category, setCategory] = useState<PaymentReceipt['category']>('Scolarité Mensuelle');
  const [targetMonth, setTargetMonth] = useState<string>('2026-09');
  const [amount, setAmount] = useState<number>(35000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentReceipt['paymentMethod']>('Airtel Money');
  const [cashierName, setCashierName] = useState<string>('');
  const [paymentDateInput, setPaymentDateInput] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('Règlement scolarité du mois');
  const [autoReactivate, setAutoReactivate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Family / Multi-student state
  const [selectedFamilyKey, setSelectedFamilyKey] = useState<string>('');
  const [familyGuardianName, setFamilyGuardianName] = useState<string>('');
  const [familyGuardianPhone, setFamilyGuardianPhone] = useState<string>('');
  const [familyItems, setFamilyItems] = useState<
    Array<{
      studentId: string;
      studentMatricule: string;
      studentName: string;
      level: string;
      monthlyFee: number;
      paidAmount: number;
      balanceRemaining: number;
      tutoringStatus: Student['tutoringStatus'];
      amountToPay: number;
      itemCategory: string;
      itemNotes: string;
      included: boolean;
    }>
  >([]);

  const families = getAllFamilies(students);

  // If opened via family quick action from another view
  useEffect(() => {
    if (familyPaymentTargetParent && isNewPaymentModalOpen) {
      setPaymentMode('family');
      setFamilyGuardianName(familyPaymentTargetParent.guardianName);
      setFamilyGuardianPhone(familyPaymentTargetParent.guardianPhone || '');

      // Load matching students
      const matching = students.filter(
        (s) =>
          (familyPaymentTargetParent.studentIds && familyPaymentTargetParent.studentIds.includes(s.id)) ||
          s.guardianPhone === familyPaymentTargetParent.guardianPhone ||
          s.guardianName.toLowerCase().includes(familyPaymentTargetParent.guardianName.toLowerCase())
      );

      loadFamilyItems(matching);
      setFamilyPaymentTargetParent(null);
    }
  }, [familyPaymentTargetParent, isNewPaymentModalOpen, students]);

  if (!isNewPaymentModalOpen) return null;

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const isStoppedTutoring = selectedStudent && selectedStudent.tutoringStatus !== 'Actif';
  const detectedSiblings = selectedStudent ? getStudentSiblings(selectedStudent, students) : [];

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      setCustomName(stu.fullName);
      const remaining = Math.max(0, stu.monthlyFee - stu.paidAmount);
      setAmount(remaining > 0 ? remaining : stu.monthlyFee);
      setNotes(`Règlement scolarité pour ${stu.fullName} (${stu.level})`);
      setAutoReactivate(true);
    }
  };

  const handleSwitchToFamilyModeForStudent = (stu: Student) => {
    const siblings = getStudentSiblings(stu, students);
    const allFamStudents = [stu, ...siblings];
    setPaymentMode('family');
    setFamilyGuardianName(stu.guardianName);
    setFamilyGuardianPhone(stu.guardianPhone || '');
    loadFamilyItems(allFamStudents);
  };

  const loadFamilyItems = (stuList: Student[]) => {
    const items = stuList.map((st) => {
      const remaining = Math.max(0, st.monthlyFee - st.paidAmount);
      const defaultPay = remaining > 0 ? remaining : st.monthlyFee;
      return {
        studentId: st.id,
        studentMatricule: st.matricule,
        studentName: st.fullName,
        level: st.level,
        monthlyFee: st.monthlyFee,
        paidAmount: st.paidAmount,
        balanceRemaining: remaining,
        tutoringStatus: st.tutoringStatus,
        amountToPay: defaultPay,
        itemCategory: 'Scolarité Mensuelle',
        itemNotes: `Scolarité ${st.fullName} (${st.level})`,
        included: true,
      };
    });
    setFamilyItems(items);
  };

  const handleSelectFamily = (familyKey: string) => {
    setSelectedFamilyKey(familyKey);
    const foundFam = families.find((f) => f.familyKey === familyKey);
    if (foundFam) {
      setFamilyGuardianName(foundFam.guardianName);
      setFamilyGuardianPhone(foundFam.guardianPhone);
      loadFamilyItems(foundFam.students);
    }
  };

  const handleAddStudentToFamily = (studentId: string) => {
    if (!studentId) return;
    const stu = students.find((s) => s.id === studentId);
    if (!stu) return;

    if (familyItems.some((item) => item.studentId === stu.id)) return;

    const remaining = Math.max(0, stu.monthlyFee - stu.paidAmount);
    setFamilyItems((prev) => [
      ...prev,
      {
        studentId: stu.id,
        studentMatricule: stu.matricule,
        studentName: stu.fullName,
        level: stu.level,
        monthlyFee: stu.monthlyFee,
        paidAmount: stu.paidAmount,
        balanceRemaining: remaining,
        tutoringStatus: stu.tutoringStatus,
        amountToPay: remaining > 0 ? remaining : stu.monthlyFee,
        itemCategory: 'Scolarité Mensuelle',
        itemNotes: `Scolarité ${stu.fullName} (${stu.level})`,
        included: true,
      },
    ]);
  };

  const handleUpdateFamilyItemAmount = (studentId: string, newAmount: number) => {
    setFamilyItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, amountToPay: Math.max(0, newAmount) } : item))
    );
  };

  const handleToggleFamilyItem = (studentId: string) => {
    setFamilyItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, included: !item.included } : item))
    );
  };

  const handleRemoveFamilyItem = (studentId: string) => {
    setFamilyItems((prev) => prev.filter((item) => item.studentId !== studentId));
  };

  // Total for family receipt
  const includedFamilyItems = familyItems.filter((item) => item.included && item.amountToPay > 0);
  const totalFamilyAmount = includedFamilyItems.reduce((sum, item) => sum + item.amountToPay, 0);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const formattedPaymentDay = formatISODateToFrench(paymentDateInput);
    const fullPaymentDate = `${formattedPaymentDay} à ${timeStr}`;

    try {
      if (paymentMode === 'family') {
        // Validation family
        if (includedFamilyItems.length === 0) {
          alert('Veuillez inclure au moins un élève avec un montant supérieur à 0 FCFA.');
          setIsSubmitting(false);
          return;
        }

        const breakdown: MultiStudentReceiptItem[] = includedFamilyItems.map((item) => {
          const prevPaid = item.paidAmount;
          const newPaid = prevPaid + item.amountToPay;
          const newBal = Math.max(0, item.monthlyFee - newPaid);
          return {
            studentId: item.studentId,
            studentMatricule: item.studentMatricule,
            studentName: item.studentName,
            level: item.level,
            category: item.itemCategory,
            monthlyFee: item.monthlyFee,
            amount: item.amountToPay,
            previousPaid: prevPaid,
            newPaid: newPaid,
            balanceRemaining: newBal,
            notes: item.itemNotes,
          };
        });

        const createdPayment = await addFamilyPayment({
          guardianName: familyGuardianName.trim() || 'Tuteur Légal',
          guardianPhone: familyGuardianPhone.trim() || undefined,
          paymentMethod,
          paymentDate: fullPaymentDate,
          cashierName: cashierName.trim() || 'Guichet Caisse CAS MANI',
          notes: notes.trim() || `Règlement global fratrie (${includedFamilyItems.length} enfants)`,
          studentBreakdown: breakdown,
          autoReactivate,
        });

        setIsNewPaymentModalOpen(false);
        if (createdPayment) {
          setSelectedReceipt(createdPayment);
        }
      } else {
        // Single payment
        const finalName = customName.trim() || 'Client Comptoir';
        const monthHuman = formatYYYYMMToFrench(targetMonth);
        const finalNotes =
          category === 'Scolarité Mensuelle' ? `Mois de ${monthHuman} - ${notes}` : notes;

        const createdPayment = await addPayment({
          studentId: selectedStudentId || undefined,
          studentName: finalName,
          category,
          amount,
          paymentMethod,
          paymentDate: fullPaymentDate,
          cashierName: cashierName.trim() || 'Guichet Caisse CAS MANI',
          status: 'Validé',
          notes: finalNotes,
        });

        if (selectedStudentId && isStoppedTutoring && autoReactivate) {
          await resumeStudentTutoring(selectedStudentId);
        }

        setIsNewPaymentModalOpen(false);
        if (createdPayment) {
          setSelectedReceipt(createdPayment);
        }
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {paymentMode === 'family' ? 'Encaisser un Reçu Groupé (Famille / Multi-Élèves)' : 'Encaisser un Règlement'}
              </h3>
              <p className="text-xs text-slate-400">
                {paymentMode === 'family'
                  ? 'Émission d\'une quittance unique certifiée pour plusieurs enfants d\'un même parent'
                  : 'Enregistrement sécurisé Cloud Firestore · Cabinet MANI'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNewPaymentModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex rounded-xl bg-slate-800 p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setPaymentMode('single')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              paymentMode === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Règlement Individuel (1 Élève)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentMode('family');
              if (familyItems.length === 0 && selectedStudent) {
                handleSwitchToFamilyModeForStudent(selectedStudent);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              paymentMode === 'family'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Reçu Groupé Famille (Multi-Élèves)</span>
          </button>
        </div>

        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-lg bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Mode Hors-ligne :</strong> Le reçu sera certifié et synchronisé avec Firestore dès le retour du réseau.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* ================= MODE INDIVIDUEL ================= */}
          {paymentMode === 'single' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Associer à un élève existant (Optionnel)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Sélectionner un élève inscrit --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.matricule} · {s.level}) {s.tutoringStatus !== 'Actif' ? `[${s.tutoringStatus}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* SIBLING AUTO-DETECTION BANNER */}
              {selectedStudent && detectedSiblings.length > 0 && (
                <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-3.5 text-xs text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <Users className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">
                        Fratrie détectée ({detectedSiblings.length + 1} enfants pour ce tuteur)
                      </p>
                      <p className="text-[11px] text-purple-300 mt-0.5">
                        Tuteur : <strong>{selectedStudent.guardianName}</strong> · Autres enfants :{' '}
                        {detectedSiblings.map((sib) => `${sib.fullName} (${sib.level})`).join(', ')}.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchToFamilyModeForStudent(selectedStudent)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer shadow"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Émettre 1 seul reçu groupé</span>
                  </button>
                </div>
              )}

              {/* Stopped Tutoring Alert & Auto-Reactivate Toggle */}
              {selectedStudent && isStoppedTutoring && (
                <div
                  className={`rounded-xl border p-3 text-xs transition-all ${
                    selectedStudent.tutoringStatus === 'Arrêté (Défaut de paiement)'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                      : 'border-purple-500/30 bg-purple-500/10 text-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {selectedStudent.tutoringStatus === 'Arrêté (Défaut de paiement)' ? (
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : (
                      <UserX className="h-4 w-4 text-purple-400 shrink-0" />
                    )}
                    <span>
                      Attention : Encadrement actuellement{' '}
                      <span className="underline">{selectedStudent.tutoringStatus}</span>
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    {selectedStudent.stopReason ? `Motif consigné : ${selectedStudent.stopReason}` : 'Interruption enregistrée.'}
                    {selectedStudent.stopDate ? ` (Depuis le ${selectedStudent.stopDate})` : ''}
                  </p>

                  <label className="mt-2.5 flex items-center gap-2 cursor-pointer font-semibold text-white pt-2 border-t border-slate-700/50">
                    <input
                      type="checkbox"
                      checked={autoReactivate}
                      onChange={(e) => setAutoReactivate(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Réactiver automatiquement l'élève en encadrement actif</span>
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom du payeur / Bénéficiaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abdoulaye Garba Souley..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Catégorie de Recette *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Scolarité Mensuelle">Scolarité Mensuelle</option>
                    <option value="Inscription">Frais d'Inscription</option>
                    <option value="Frais Concours">Frais Prépa Concours</option>
                    <option value="Fournitures">Vente Fournitures</option>
                  </select>
                </div>

                {category === 'Scolarité Mensuelle' ? (
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      <span>Mois de scolarité concerné *</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(e.target.value)}
                      className="w-full rounded-lg border border-emerald-500/50 bg-slate-800 px-3 py-2 text-xs text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Montant Encaissé (FCFA) *
                    </label>
                    <input
                      type="number"
                      step="500"
                      required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {category === 'Scolarité Mensuelle' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Montant Encaissé (FCFA) *
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          {/* ================= MODE REÇU GROUPÉ FAMILLE ================= */}
          {paymentMode === 'family' && (
            <div className="space-y-4">
              {/* Family Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/60">
                <div>
                  <label className="block text-xs font-bold text-purple-300 mb-1">
                    Sélectionner une Fratrie Inscrite ({families.length} familles) :
                  </label>
                  <select
                    value={selectedFamilyKey}
                    onChange={(e) => handleSelectFamily(e.target.value)}
                    className="w-full rounded-lg border border-purple-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-purple-400 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choisir une famille répertoriée --</option>
                    {families.map((fam) => (
                      <option key={fam.familyKey} value={fam.familyKey}>
                        {fam.guardianName} ({fam.students.length} enfants · {fam.students.map((s) => s.fullName.split(' ')[0]).join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ajouter un autre élève à ce reçu :
                  </label>
                  <select
                    onChange={(e) => {
                      handleAddStudentToFamily(e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">+ Ajouter un élève spécifique...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.level} · Tuteur: {s.guardianName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guardian Names & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du Tuteur / Parent Payeur *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mme Fatima Amadou ou Dr. Garba Souley"
                    value={familyGuardianName}
                    onChange={(e) => setFamilyGuardianName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Téléphone du Tuteur (Niamey)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +227 90 15 88 44"
                    value={familyGuardianPhone}
                    onChange={(e) => setFamilyGuardianPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Children Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span>Détail des Enfants Inclus sur le Reçu ({includedFamilyItems.length}/{familyItems.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Ajustez les montants à régler pour chaque enfant
                  </span>
                </div>

                {familyItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-850 p-6 text-center text-slate-400 text-xs">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40 text-purple-400" />
                    <p className="font-semibold text-white">Aucun élève sélectionné</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Choisissez une famille ci-dessus ou ajoutez des élèves individuellement.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-850">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">Inclure</th>
                          <th className="py-2.5 px-3">Élève & Classe</th>
                          <th className="py-2.5 px-3 text-right">Mensualité / Reste</th>
                          <th className="py-2.5 px-3 text-right w-44">Montant Réglé (FCFA) *</th>
                          <th className="py-2.5 px-2 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {familyItems.map((item) => (
                          <tr
                            key={item.studentId}
                            className={`transition-colors ${
                              item.included ? 'bg-slate-850 hover:bg-slate-800/70' : 'bg-slate-900/50 opacity-40'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.included}
                                onChange={() => handleToggleFamilyItem(item.studentId)}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-white text-xs">{item.studentName}</div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{item.studentMatricule}</span>
                                <span>·</span>
                                <span className="text-indigo-300 font-sans">{item.level}</span>
                                {item.tutoringStatus !== 'Actif' && (
                                  <span className="text-rose-400 font-sans font-bold">[{item.tutoringStatus}]</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <div className="text-white text-xs">{item.monthlyFee.toLocaleString()} FCFA</div>
                              <div className={`text-[10px] ${item.balanceRemaining > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {item.balanceRemaining > 0 ? `Reste: -${item.balanceRemaining.toLocaleString()}` : 'Soldé'}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  step="500"
                                  min="0"
                                  disabled={!item.included}
                                  value={item.amountToPay}
                                  onChange={(e) => handleUpdateFamilyItemAmount(item.studentId, Number(e.target.value))}
                                  className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-right font-mono font-bold text-emerald-400 focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={!item.included}
                                  onClick={() => handleUpdateFamilyItemAmount(item.studentId, item.balanceRemaining > 0 ? item.balanceRemaining : item.monthlyFee)}
                                  className="text-[9.5px] px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold cursor-pointer border border-slate-700"
                                  title="Appliquer le reste à payer"
                                >
                                  Solder
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFamilyItem(item.studentId)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Retirer cet élève"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900 border-t-2 border-slate-700">
                        <tr>
                          <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs font-bold text-white">
                            Total Général Encaissé pour la Famille :
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-400">
                            {totalFamilyAmount.toLocaleString()} FCFA
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Amount in French Words preview */}
                {totalFamilyAmount > 0 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      Montant en toutes lettres :{' '}
                      <strong>{numberToFrenchWords(totalFamilyAmount)} Francs CFA</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Auto-Reactivate checkbox for stopped children */}
              {familyItems.some((it) => it.included && it.tutoringStatus !== 'Actif') && (
                <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={autoReactivate}
                      onChange={(e) => setAutoReactivate(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-purple-200">
                      <UserCheck className="h-3.5 w-3.5 text-purple-400" />
                      <span>Réactiver automatiquement tous les enfants de la fratrie en encadrement actif</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ================= COMMON FIELDS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mode de Règlement *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Airtel Money">Airtel Money (Niger)</option>
                <option value="Moov Flooz">Moov Flooz (Niger)</option>
                <option value="Amana Transfert">Amana Transfert (Niger)</option>
                <option value="Nita Transfert d'argent">Nita Transfert d'argent (Niger)</option>
                <option value="Espèces">Espèces (Caisse / Guichet)</option>
                <option value="Virement Bancaire">Virement Bancaire / Chèque</option>
                <option value="Wave / Mobile Money">Wave / Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Date de Paiement (Jour de Règlement) *</span>
              </label>
              <input
                type="date"
                required
                value={paymentDateInput}
                onChange={(e) => setPaymentDateInput(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Caissier de Service
              </label>
              <input
                type="text"
                placeholder="Agent de caisse connecté"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Libellé / Note sur le reçu
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Scolarité Septembre 2026..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {paymentMode === 'family' ? (
                <>
                  Total : <strong className="text-emerald-400 font-mono">{totalFamilyAmount.toLocaleString()} FCFA</strong> ({includedFamilyItems.length} élève{includedFamilyItems.length > 1 ? 's' : ''})
                </>
              ) : (
                <>
                  Total : <strong className="text-emerald-400 font-mono">{amount.toLocaleString()} FCFA</strong>
                </>
              )}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (paymentMode === 'family' && includedFamilyItems.length === 0)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors shadow disabled:opacity-50 cursor-pointer ${
                  paymentMode === 'family' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? 'Émission en cours...'
                    : paymentMode === 'family'
                    ? 'Valider & Émettre le Reçu Groupé'
                    : 'Valider & Générer le Reçu'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
