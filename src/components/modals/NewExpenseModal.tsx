import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  Tag,
  User,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES } from '../../types';
import { calculateTreasurySummary } from '../../utils/financialUtils';
import { getCurrentFrenchDateTime } from '../../utils/dateUtils';

export const NewExpenseModal: React.FC = () => {
  const {
    isNewExpenseModalOpen,
    setIsNewExpenseModalOpen,
    editingExpense,
    setEditingExpense,
    addExpense,
    updateExpense,
    payments,
    expenses,
    salaryPayments,
    showToast,
  } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Fournitures de Bureau');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Espèces');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [beneficiary, setBeneficiary] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title || '');
      setCategory(editingExpense.category || 'Autres Dépenses');
      setAmount(String(editingExpense.amount || ''));
      setPaymentMethod(editingExpense.paymentMethod || 'Espèces');
      // Convert DD/MM/YYYY to YYYY-MM-DD for date input if possible
      const dateMatch = (editingExpense.expenseDate || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch) {
        setExpenseDate(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
      } else {
        setExpenseDate(new Date().toISOString().split('T')[0]);
      }
      setBeneficiary(editingExpense.beneficiary || '');
      setNotes(editingExpense.notes || '');
    } else {
      setTitle('');
      setCategory('Fournitures de Bureau');
      setAmount('');
      setPaymentMethod('Espèces');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setBeneficiary('');
      setNotes('');
    }
  }, [editingExpense, isNewExpenseModalOpen]);

  if (!isNewExpenseModalOpen) return null;

  const treasurySummary = calculateTreasurySummary(payments, expenses, salaryPayments, 'all');
  const parsedAmount = parseFloat(amount) || 0;
  const currentBalanceBeforeEdit = editingExpense
    ? treasurySummary.netCashBalance + Number(editingExpense.amount || 0)
    : treasurySummary.netCashBalance;
  const projectedBalance = currentBalanceBeforeEdit - parsedAmount;

  const handleClose = () => {
    setIsNewExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Veuillez saisir le libellé de la dépense.', 'warning');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Veuillez saisir un montant valide en FCFA.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const effectiveDate = expenseDate === todayISO ? getCurrentFrenchDateTime() : expenseDate;

      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          title: title.trim(),
          category,
          amount: parsedAmount,
          paymentMethod,
          expenseDate: effectiveDate,
          beneficiary: beneficiary.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addExpense({
          title: title.trim(),
          category,
          amount: parsedAmount,
          paymentMethod,
          expenseDate: effectiveDate,
          beneficiary: beneficiary.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      handleClose();
    } catch {
      // toast handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? `Modifier la Dépense · ${editingExpense.expenseNumber}` : 'Saisir une Dépense Manuelle'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Déduction automatique du solde en caisse (Recouvrement − Dépenses)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {/* Live Caisse Impact Strip */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Solde Caisse Actuel</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {currentBalanceBeforeEdit.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Solde Caisse Après Déduction</span>
              <span
                className={`font-mono font-bold tabular-nums text-sm ${
                  projectedBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {projectedBalance.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Libellé / Objet de la dépense *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Loyer mensuel siège Niamey 2000, Facture électricité..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Montant & Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Montant (FCFA) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-600 dark:text-rose-400">
                  FCFA
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="Ex: 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-14 pr-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Catégorie *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mode de règlement & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Mode de règlement *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="Espèces">Espèces (Caisse Physique)</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Moov Flooz">Moov Flooz</option>
                  <option value="Amana Transfert">Amana Transfert</option>
                  <option value="Nita Transfert d'argent">Nita Transfert d'argent</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Chèque">Chèque Bancaire</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Date de la dépense *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bénéficiaire / Fournisseur */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Bénéficiaire / Fournisseur (Optionnel)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ex: NIGELEC, Librairie du Sahel, Propriétaire..."
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Observations / Pièce justificative (Optionnel)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="Ex: Facture N° 405 réglée au comptant..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : editingExpense
                  ? 'Mettre à jour la Dépense'
                  : 'Enregistrer & Déduire de la Caisse'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
