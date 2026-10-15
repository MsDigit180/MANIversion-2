import React, { useState, useEffect } from 'react';
import { X, Wallet, DollarSign, Calendar, CreditCard, FileText, CheckCircle2, GraduationCap } from 'lucide-react';
import { Tutor } from '../../types';
import { useApp } from '../../context/AppContext';

interface PayTutorSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor | null;
}

export const PayTutorSalaryModal: React.FC<PayTutorSalaryModalProps> = ({
  isOpen,
  onClose,
  tutor,
}) => {
  const { payTutorSalary, tutors } = useApp();

  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<string>('Octobre 2026');
  const [paymentMethod, setPaymentMethod] = useState<string>('Espèces');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tutor) {
      setSelectedTutorId(tutor.id);
    } else if (tutors && tutors.length > 0) {
      setSelectedTutorId(tutors[0].id);
    }
  }, [tutor, tutors, isOpen]);

  if (!isOpen) return null;

  const activeTutor = tutor || (tutors || []).find((t) => t.id === selectedTutorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTutor = tutor || activeTutor;
    if (!targetTutor) {
      alert('Veuillez sélectionner un encadreur.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Veuillez saisir un montant de salaire valide en FCFA.');
      return;
    }

    setIsSubmitting(true);
    try {
      await payTutorSalary({
        tutorId: targetTutor.id,
        amount: parsedAmount,
        month,
        paymentMethod,
        notes,
      });
      setIsSubmitting(false);
      onClose();
      // Reset form
      setAmount('');
      setNotes('');
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Versement de Salaire Encadreur</h3>
              <p className="text-xs text-emerald-100">Cabinet d'Appuis Scolaire MANI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* If no tutor was pre-passed, show dropdown selector */}
          {!tutor && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                Sélectionner l'Encadreur *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <select
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {(tutors || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.matricule} - {t.subjects?.join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Tutor Mini Card */}
          {activeTutor && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center space-x-4">
              <img
                src={activeTutor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeTutor.fullName)}&background=0D9488&color=fff`}
                alt={activeTutor.fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{activeTutor.fullName}</h4>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-md">
                    {activeTutor.matricule}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeTutor.phone || 'Pas de téléphone'} • {activeTutor.email || 'Pas d\'email'}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(activeTutor.subjects || []).slice(0, 3).map((sub, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montant saisi manuellement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                Montant du Salaire (FCFA) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 font-bold">
                  FCFA
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ex: 75000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-16 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Le montant du salaire est saisi manuellement selon les prestations ou le contrat.
              </p>
            </div>

            {/* Mois concerné */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                  Mois / Période Rémunérée *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Octobre 2026"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                  Mode de Versement *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Espèces">Espèces (Caisse)</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Moov Flooz">Moov Flooz</option>
                    <option value="Virement Bancaire">Virement Bancaire</option>
                    <option value="Chèque">Chèque Bancaire</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes / Observations */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                Observations ou Motif (Optionnel)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  placeholder="Ex: Prime de performance incluse, avance sur salaire..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Versement...' : 'Verser le Salaire'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
