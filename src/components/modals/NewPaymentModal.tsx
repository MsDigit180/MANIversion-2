import React, { useState } from 'react';
import { X, CreditCard, Clock, Printer, AlertTriangle, UserCheck, UserX, Loader2, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentReceipt } from '../../types';
import { formatISODateToFrench } from '../../utils/dateUtils';

export const NewPaymentModal: React.FC = () => {
  const {
    isNewPaymentModalOpen,
    setIsNewPaymentModalOpen,
    students,
    addPayment,
    setSelectedReceipt,
    resumeStudentTutoring,
    networkStatus,
  } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [category, setCategory] = useState<PaymentReceipt['category']>('Scolarité Mensuelle');
  const [amount, setAmount] = useState<number>(35000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentReceipt['paymentMethod']>('Airtel Money');
  const [cashierName, setCashierName] = useState<string>('');
  const [paymentDateInput, setPaymentDateInput] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('Règlement scolarité du mois en cours');
  const [autoReactivate, setAutoReactivate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isNewPaymentModalOpen) return null;

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const isStoppedTutoring = selectedStudent && selectedStudent.tutoringStatus !== 'Actif';

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      setCustomName(stu.fullName);
      const remaining = stu.monthlyFee - stu.paidAmount;
      setAmount(remaining > 0 ? remaining : stu.monthlyFee);
      setNotes(`Règlement scolarité pour ${stu.fullName} (${stu.level})`);
      setAutoReactivate(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalName = customName.trim() || 'Client Comptoir';
    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const formattedPaymentDay = formatISODateToFrench(paymentDateInput);
    const fullPaymentDate = `${formattedPaymentDay} à ${timeStr}`;

    try {
      const createdPayment = await addPayment({
        studentId: selectedStudentId || undefined,
        studentName: finalName,
        category,
        amount,
        paymentMethod,
        paymentDate: fullPaymentDate,
        cashierName: cashierName.trim() || 'Guichet Caisse',
        status: 'Validé',
        notes,
      });

      // If student tutoring was stopped and user checked reactivation
      if (selectedStudentId && isStoppedTutoring && autoReactivate) {
        await resumeStudentTutoring(selectedStudentId);
      }

      setIsNewPaymentModalOpen(false);
      // Offer receipt preview immediately
      if (createdPayment) {
        setSelectedReceipt(createdPayment);
      }
    } catch (error) {
      console.error('Error recording payment in Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Encaisser un Règlement</h3>
              <p className="text-xs text-slate-400">Enregistrement sécurisé Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewPaymentModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-lg bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Mode Hors-ligne :</strong> Le reçu sera émis avec la mention certifiée hors-ligne et synchronisé avec Firestore dès le retour en ligne.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              placeholder="Ex: Kouamé Emmanuel ou Entreprise..."
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="Al Izza / Nita Transfert">Al Izza / Nita Transfert</option>
                <option value="Espèces">Espèces (Caisse / Guichet)</option>
                <option value="Virement Bancaire">Virement Bancaire / Chèque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                📅 Date du Règlement (Jour de Paiement) *
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
                placeholder="Ex: Mensualité de Mars 2026..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsNewPaymentModalOpen(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              <span>{isSubmitting ? 'Enregistrement Firestore...' : 'Valider & Générer le Reçu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
