import React, { useState } from 'react';
import {
  X,
  UserX,
  AlertTriangle,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StopTutoringModal: React.FC = () => {
  const {
    isStopTutoringModalOpen,
    setIsStopTutoringModalOpen,
    selectedStudentForStop,
    setSelectedStudentForStop,
    stopStudentTutoring,
    resumeStudentTutoring,
  } = useApp();

  const [stopType, setStopType] = useState<'demand' | 'unpaid'>('demand');
  const [reasonCategory, setReasonCategory] = useState<string>('Déménagement ou changement d\'établissement');
  const [customReason, setCustomReason] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (selectedStudentForStop) {
      const isUnpaid =
        selectedStudentForStop.tutoringStatus === 'Arrêté (Défaut de paiement)' ||
        selectedStudentForStop.paymentStatus === 'En retard' ||
        selectedStudentForStop.paidAmount < selectedStudentForStop.monthlyFee;

      setStopType(isUnpaid ? 'unpaid' : 'demand');
      setReasonCategory(
        isUnpaid
          ? 'Défaut de paiement de scolarité prolongé'
          : 'Déménagement ou changement d\'établissement'
      );
      setCustomReason(selectedStudentForStop.stopReason || '');
      setEffectiveDate(
        selectedStudentForStop.stopDate ||
          new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      );
    }
  }, [selectedStudentForStop]);

  if (!isStopTutoringModalOpen || !selectedStudentForStop) return null;

  const stu = selectedStudentForStop;
  const isAlreadyStopped = stu.tutoringStatus !== 'Actif';
  const remainingDebt = stu.monthlyFee - stu.paidAmount;

  const handleConfirmStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalReason = customReason.trim()
      ? `${reasonCategory} : ${customReason.trim()}`
      : reasonCategory;

    const targetStatus: 'Arrêté (À la demande)' | 'Arrêté (Défaut de paiement)' =
      stopType === 'demand' ? 'Arrêté (À la demande)' : 'Arrêté (Défaut de paiement)';

    setIsSubmitting(true);
    try {
      await stopStudentTutoring(stu.id, targetStatus, finalReason, effectiveDate);
      setIsStopTutoringModalOpen(false);
      setSelectedStudentForStop(null);
    } catch (error) {
      console.error('Error updating tutoring status in Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await resumeStudentTutoring(stu.id);
      setIsStopTutoringModalOpen(false);
      setSelectedStudentForStop(null);
    } catch (error) {
      console.error('Error resuming tutoring in Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsStopTutoringModalOpen(false);
    setSelectedStudentForStop(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                stopType === 'unpaid'
                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400'
              }`}
            >
              {isAlreadyStopped ? <AlertTriangle className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isAlreadyStopped ? 'Gestion de l\'Arrêt d\'Encadrement' : 'Arrêter l\'Encadrement d\'un Élève'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stu.fullName} · {stu.matricule} ({stu.level})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status alert */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isAlreadyStopped && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Statut actuel : {stu.tutoringStatus}
                </span>
                {stu.stopDate && <span className="text-[11px]">Depuis le : {stu.stopDate}</span>}
              </div>
              {stu.stopReason && (
                <p className="mt-1 text-[11px] text-amber-900 dark:text-amber-200/90 italic">
                  Motif enregistré : "{stu.stopReason}"
                </p>
              )}
            </div>
          )}

          {/* Selector: À la demande vs Défaut de paiement */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Type / Motif d'Interruption :
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setStopType('demand');
                  setReasonCategory('Déménagement ou changement d\'établissement');
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  stopType === 'demand'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/15 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <UserX className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>À la Demande</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Déménagement, convenance des parents, objectifs atteints
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStopType('unpaid');
                  setReasonCategory('Défaut de paiement de scolarité prolongé');
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  stopType === 'unpaid'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Manque de Paiement</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Échéances impayées, suspension administrative
                </span>
              </button>
            </div>
          </div>

          {/* Details based on choice */}
          {stopType === 'unpaid' ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span>Solde impayé à recouvrer :</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 text-sm">
                  {remainingDebt > 0 ? `${remainingDebt.toLocaleString()} FCFA` : 'Échéance en cours'}
                </span>
              </div>
              <p className="text-[11px] text-rose-900 dark:text-rose-200/80">
                L'élève sera suspendu des listes d'émargement des cours d'appui jusqu'à régularisation financière en caisse.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 p-3 text-xs text-purple-800 dark:text-purple-300">
              <p className="text-[11px]">
                Arrêt à la convenance du tuteur ou de l'élève. L'historique des paiements antérieurs reste intact.
              </p>
            </div>
          )}

          <form onSubmit={handleConfirmStop} className="space-y-3">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catégorie du motif :
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                {stopType === 'demand' ? (
                  <>
                    <option value="Déménagement ou changement d'établissement">Déménagement ou changement d'établissement</option>
                    <option value="Incompatibilité d'emploi du temps scolaire">Incompatibilité d'emploi du temps scolaire</option>
                    <option value="Demande écrite expresse des parents">Demande écrite expresse des parents</option>
                    <option value="Objectifs pédagogiques atteints">Objectifs pédagogiques atteints</option>
                    <option value="Autre motif personnel">Autre motif personnel</option>
                  </>
                ) : (
                  <>
                    <option value="Défaut de paiement de scolarité prolongé">Défaut de paiement de scolarité prolongé</option>
                    <option value="Absence de réponse suite aux relances SMS/WhatsApp">Absence de réponse suite aux relances</option>
                    <option value="Suspension administrative pour impayés">Suspension administrative pour impayés</option>
                  </>
                )}
              </select>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date d'effet de l'arrêt :
              </label>
              <input
                type="text"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                placeholder="ex: 29 Septembre 2026"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarques & Précisions Administratives :
              </label>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Détails complémentaires (notification remise au parent, etc.)..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              {isAlreadyStopped && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResume}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  <span>Réactiver l'élève en cours actifs</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleClose}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer disabled:opacity-50 ${
                    stopType === 'unpaid'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                  <span>{isSubmitting ? 'Enregistrement Firestore...' : "Enregistrer l'Arrêt"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
