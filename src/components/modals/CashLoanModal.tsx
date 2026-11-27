import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HandCoins,
  RotateCcw,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  User,
  Phone,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateTreasurySummary } from '../../utils/financialUtils';
import { getCurrentFrenchDateTime } from '../../utils/dateUtils';

export const CashLoanModal: React.FC = () => {
  const {
    isCashLoanModalOpen,
    setIsCashLoanModalOpen,
    selectedLoanForRepay,
    setSelectedLoanForRepay,
    takeCashLoan,
    repayCashLoan,
    payments,
    expenses,
    salaryPayments,
    cashLoans,
    tutors,
    agents,
    showToast,
  } = useApp();

  // Take-loan fields
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerRole, setBorrowerRole] = useState('');
  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Shared fields (Take or Repay)
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [operationDate, setOperationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRepayMode = Boolean(selectedLoanForRepay);

  const knownPeople = useMemo(() => {
    const list: Array<{ key: string; name: string; phone?: string; role: string }> = [];
    const seen = new Set<string>();

    (agents || []).forEach((a) => {
      if (!a?.fullName) return;
      const k = a.fullName.trim().toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      list.push({
        key: `agent-${a.id}`,
        name: a.fullName,
        phone: a.phone,
        role: a.role,
      });
    });

    (tutors || []).forEach((t) => {
      if (!t?.fullName) return;
      const k = t.fullName.trim().toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      list.push({
        key: `tutor-${t.id}`,
        name: t.fullName,
        phone: t.phone,
        role: 'Encadreur',
      });
    });

    return list;
  }, [agents, tutors]);

  useEffect(() => {
    if (!isCashLoanModalOpen) return;

    const todayISO = new Date().toISOString().split('T')[0];
    setOperationDate(todayISO);
    setNotes('');

    if (selectedLoanForRepay) {
      setAmount(String(selectedLoanForRepay.remainingAmount || 0));
      setPaymentMethod(selectedLoanForRepay.paymentMethod || 'Espèces');
    } else {
      setBorrowerName('');
      setBorrowerPhone('');
      setBorrowerRole('');
      setReason('');
      setDueDate('');
      setAmount('');
      setPaymentMethod('Espèces');
    }
  }, [isCashLoanModalOpen, selectedLoanForRepay]);

  if (!isCashLoanModalOpen) return null;

  const treasurySummary = calculateTreasurySummary(payments, expenses, salaryPayments, 'all', cashLoans);
  const currentBalance = treasurySummary.netCashBalance;
  const parsedAmount = parseFloat(amount) || 0;
  const remainingDue = selectedLoanForRepay ? Number(selectedLoanForRepay.remainingAmount || 0) : 0;

  const projectedBalance = isRepayMode
    ? currentBalance + parsedAmount
    : currentBalance - parsedAmount;

  const handleClose = () => {
    setIsCashLoanModalOpen(false);
    setSelectedLoanForRepay(null);
  };

  const handleSelectKnownPerson = (personKey: string) => {
    if (!personKey) return;
    const found = knownPeople.find((p) => p.key === personKey);
    if (!found) return;
    setBorrowerName(found.name);
    setBorrowerPhone(found.phone || '');
    setBorrowerRole(found.role || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Veuillez saisir un montant valide en FCFA.', 'warning');
      return;
    }

    const todayISO = new Date().toISOString().split('T')[0];
    const effectiveDate = operationDate === todayISO ? getCurrentFrenchDateTime() : operationDate;

    setIsSubmitting(true);
    try {
      if (isRepayMode && selectedLoanForRepay) {
        if (parsedAmount > remainingDue) {
          showToast(
            `Le montant saisi dépasse le reste à remettre (${remainingDue.toLocaleString()} FCFA).`,
            'warning'
          );
          setIsSubmitting(false);
          return;
        }
        await repayCashLoan(selectedLoanForRepay.id, {
          amount: parsedAmount,
          paymentMethod,
          repaymentDate: effectiveDate,
          notes: notes.trim() || undefined,
        });
      } else {
        if (!borrowerName.trim()) {
          showToast('Veuillez saisir le nom du bénéficiaire du prêt.', 'warning');
          setIsSubmitting(false);
          return;
        }
        if (!reason.trim()) {
          showToast('Veuillez préciser le motif du prêt.', 'warning');
          setIsSubmitting(false);
          return;
        }
        await takeCashLoan({
          borrowerName: borrowerName.trim(),
          borrowerPhone: borrowerPhone.trim() || undefined,
          borrowerRole: borrowerRole.trim() || undefined,
          principalAmount: parsedAmount,
          paymentMethod,
          loanDate: effectiveDate,
          dueDate: dueDate.trim() || undefined,
          reason: reason.trim(),
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
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isRepayMode
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isRepayMode ? <RotateCcw className="h-5 w-5" /> : <HandCoins className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRepayMode
                  ? `Remettre un Prêt · ${selectedLoanForRepay?.loanNumber}`
                  : 'Prendre un Prêt à la Caisse'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRepayMode
                  ? 'Restitution de fonds en caisse (remboursement total ou partiel)'
                  : 'Sortie temporaire de caisse avec suivi de remise'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer la fenêtre"
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
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Solde Caisse Actuel
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {currentBalance.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                {isRepayMode ? 'Solde Caisse Après Remise' : 'Solde Caisse Après Prêt'}
              </span>
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

          {!isRepayMode && parsedAmount > currentBalance && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Attention : ce prêt dépasse le solde actuel en caisse ({currentBalance.toLocaleString()} FCFA). La caisse passera en solde négatif jusqu&apos;à la remise.
              </span>
            </div>
          )}

          {isRepayMode && selectedLoanForRepay ? (
            <>
              {/* Loan Details Summary */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Emprunteur :</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedLoanForRepay.borrowerName}
                    {selectedLoanForRepay.borrowerRole ? ` (${selectedLoanForRepay.borrowerRole})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Motif initial :</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right max-w-[65%] truncate">
                    {selectedLoanForRepay.reason}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/70 font-mono tabular-nums">
                  <div>
                    <span className="font-sans text-[10px] text-slate-400 block">Prêt initial</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedLoanForRepay.principalAmount.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="font-sans text-[10px] text-slate-400 block">Déjà remis</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedLoanForRepay.repaidAmount.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-[10px] text-slate-400 block">Reste dû</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {remainingDue.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount to Return */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Montant remis en caisse (FCFA) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(remainingDue))}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Tout remettre ({remainingDue.toLocaleString()} FCFA)
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    FCFA
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={remainingDue}
                    step="any"
                    required
                    placeholder={`Max ${remainingDue.toLocaleString()}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-14 pr-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 tabular-nums"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Quick select from staff / tutors */}
              {knownPeople.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sélection rapide (Agent ou Encadreur — Optionnel)
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => handleSelectKnownPerson(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">— Choisir un membre du cabinet ou saisir librement ci-dessous —</option>
                    {knownPeople.map((person) => (
                      <option key={person.key} value={person.key}>
                        {person.name} · {person.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Borrower Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nom de l&apos;emprunteur *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Moussa Abdou"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Téléphone (Optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ex: +227 90..."
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Amount & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Montant du prêt (FCFA) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      FCFA
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      placeholder="Ex: 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-14 pr-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Échéance de remise (Optionnel)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motif / Objet du prêt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Avance sur salaire, Dépannage urgence, Avance frais déplacement..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </>
          )}

          {/* Mode & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRepayMode ? 'Mode de remise *' : 'Mode de sortie de caisse *'}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Espèces">Espèces (Caisse Physique)</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Moov Flooz">Moov Flooz</option>
                  <option value="Amana Transfert">Amana Transfert</option>
                  <option value="Nita Transfert d'argent">Nita Transfert d&apos;argent</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Chèque">Chèque Bancaire</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRepayMode ? 'Date de remise *' : 'Date du prêt *'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={operationDate}
                  onChange={(e) => setOperationDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Observations (Optionnel)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <textarea
                rows={2}
                placeholder={
                  isRepayMode
                    ? 'Ex: Remis en main propre à la caisse...'
                    : 'Ex: Engagement de remboursement fin du mois...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
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
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer ${
                isRepayMode
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : isRepayMode
                  ? 'Confirmer la Remise en Caisse'
                  : 'Valider & Prélever de la Caisse'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
