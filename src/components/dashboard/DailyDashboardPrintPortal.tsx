import React from 'react';
import { createPortal } from 'react-dom';
import { Student, PaymentReceipt, Expense, SalaryPayment, CashLoan } from '../../types';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';
import { parseFlexibleDate } from '../../utils/dateUtils';
import {
  isEncadrementCategory,
  isInscriptionCategory,
  calculateTreasurySummary,
  calculateMonthlyRecoverySummary,
  getCurrentYearMonth,
  formatPaymentCoveredMonthLabel,
} from '../../utils/financialUtils';

interface DailyDashboardPrintPortalProps {
  isOpen: boolean;
  students: Student[];
  payments: PaymentReceipt[];
  expenses: Expense[];
  salaryPayments: SalaryPayment[];
  cashLoans?: CashLoan[];
  campusName?: string;
  agentName?: string;
}

export const DailyDashboardPrintPortal: React.FC<DailyDashboardPrintPortalProps> = ({
  isOpen,
  students,
  payments,
  expenses,
  salaryPayments,
  cashLoans,
  campusName,
  agentName,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const todayStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const isToday = (rawDate?: string) => {
    const parsed = parseFlexibleDate(rawDate);
    if (!parsed) return false;
    return (
      parsed.getFullYear() === todayMidnight.getFullYear() &&
      parsed.getMonth() === todayMidnight.getMonth() &&
      parsed.getDate() === todayMidnight.getDate()
    );
  };

  const safeStudents = students || [];
  const safePayments = (payments || []).filter((p) => p.status !== 'Annulé');
  const safeExpenses = expenses || [];
  const safeSalaries = salaryPayments || [];

  // 1. Statistiques Inscriptions
  const todayStudents = safeStudents.filter((s) => isToday(s.enrollmentDate));
  const last7DaysStudents = safeStudents.filter((s) => {
    const d = parseFlexibleDate(s.enrollmentDate);
    return d !== null && d >= sevenDaysAgo && d <= todayMidnight;
  });
  const activeCount = safeStudents.filter((s) => s.tutoringStatus === 'Actif').length;
  const stoppedDemandCount = safeStudents.filter(
    (s) => s.tutoringStatus === 'Arrêté (À la demande)'
  ).length;
  const stoppedUnpaidCount = safeStudents.filter(
    (s) => s.tutoringStatus === 'Arrêté (Défaut de paiement)'
  ).length;

  // 2. Statistiques Paiements & Trésorerie
  const todayPayments = safePayments.filter((p) => isToday(p.paymentDate));
  const todayPaymentsTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayEncadrementTotal = todayPayments
    .filter((p) => isEncadrementCategory(p.category))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayInscriptionTotal = todayPayments
    .filter((p) => isInscriptionCategory(p.category))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayOtherPaymentsTotal = Math.max(
    0,
    todayPaymentsTotal - todayEncadrementTotal - todayInscriptionTotal
  );
  const todayCashPayments = todayPayments
    .filter((p) => (p.paymentMethod || '').toLowerCase().includes('esp'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayDigitalPayments = Math.max(0, todayPaymentsTotal - todayCashPayments);

  const todayExpensesTotal =
    safeExpenses.filter((e) => isToday(e.expenseDate)).reduce((sum, e) => sum + (e.amount || 0), 0) +
    safeSalaries
      .filter((s) => isToday(s.paymentDate))
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  const todayNetFlow = todayPaymentsTotal - todayExpensesTotal;

  const globalTreasury = calculateTreasurySummary(
    safePayments,
    safeExpenses,
    safeSalaries,
    'all',
    cashLoans || []
  );
  const currentMonthYYYYMM = getCurrentYearMonth(now);
  const monthlyRecovery = calculateMonthlyRecoverySummary(
    safeStudents,
    safePayments,
    currentMonthYYYYMM
  );
  const encadrementCollected = monthlyRecovery.totalCollected;
  const encadrementRate = monthlyRecovery.collectionRate;

  const inscriptionCollected = safePayments
    .filter((p) => isInscriptionCategory(p.category))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const inscriptionDue = safeStudents.reduce(
    (sum, s) => sum + (s?.inscription?.due ?? 10000),
    0
  );
  const inscriptionRate =
    inscriptionDue > 0 ? Math.round((inscriptionCollected / inscriptionDue) * 100) : 100;

  const formatFCFA = (val: number) => `${Math.round(val || 0).toLocaleString('fr-FR')} FCFA`;

  const content = (
    <div id="print-modal-portal" className="hidden print:block bg-white text-slate-900">
      <div className="printable-document w-[210mm] max-w-full mx-auto px-[12mm] py-[10mm] bg-white text-slate-900 text-xs font-sans">
        {/* En-tête officiel */}
        <header className="flex items-start justify-between gap-4 pb-3 border-b-2 border-indigo-950">
          <div className="flex items-center gap-3">
            <img
              src={CAB_APPUIS_LOGO}
              alt={CAB_APPUIS_INFO.name}
              className="h-14 w-14 object-contain shrink-0"
            />
            <div>
              <h1 className="text-sm font-bold text-indigo-950 uppercase tracking-tight">
                {CAB_APPUIS_INFO.name} ({CAB_APPUIS_INFO.acronym})
              </h1>
              <p className="text-[11px] text-slate-600">{CAB_APPUIS_INFO.subtitle}</p>
              <p className="text-[10px] text-slate-500">
                {CAB_APPUIS_INFO.address} · Tél : {CAB_APPUIS_INFO.phones.join(' / ')}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                NIF : {CAB_APPUIS_INFO.nif} · RCCM : {CAB_APPUIS_INFO.rccm}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-indigo-950 uppercase">
              Rapport Récapitulatif Journalier
            </p>
            <p className="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
              Journée du {todayStr} · {timeStr}
            </p>
            {campusName && <p className="text-[10px] text-slate-600 mt-0.5">{campusName}</p>}
            {agentName && <p className="text-[10px] text-slate-500">Édité par : {agentName}</p>}
          </div>
        </header>

        {/* Cartouche Synthèse Journée */}
        <section className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-3.5 print-avoid-break">
          <h2 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide">
            Synthèse de la journée du {todayStr}
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-slate-600">Inscriptions du jour :</span>
              <strong className="font-mono font-bold text-indigo-700 tabular-nums">
                {todayStudents.length} élève(s)
              </strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-600">Encaissements du jour :</span>
              <strong className="font-mono font-bold text-emerald-700 tabular-nums">
                {formatFCFA(todayPaymentsTotal)} ({todayPayments.length} reçu(s))
              </strong>
            </div>
            <div className="flex justify-between gap-2 text-[10px] text-slate-600">
              <span>7 derniers jours : {last7DaysStudents.length}</span>
              <span className="font-mono tabular-nums">
                Actifs : {activeCount} / {safeStudents.length} inscrits
              </span>
            </div>
            <div className="flex justify-between gap-2 text-[10px] text-slate-600">
              <span>Espèces : {formatFCFA(todayCashPayments)}</span>
              <span>Mobile/Banque : {formatFCFA(todayDigitalPayments)}</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 gap-x-6 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-slate-600">Dépenses &amp; Salaires du jour :</span>
              <strong className="font-mono font-bold text-rose-700 tabular-nums">
                -{formatFCFA(todayExpensesTotal)}
              </strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-600">Solde Net du jour :</span>
              <strong
                className={`font-mono font-bold tabular-nums ${
                  todayNetFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatFCFA(todayNetFlow)}
              </strong>
            </div>
          </div>
        </section>

        {/* Section 1 : Indicateurs Clés */}
        <section className="mt-4">
          <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wide mb-1.5">
            1. Indicateurs clés des inscriptions et des paiements
          </h2>
          <table className="print-table w-full border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-indigo-950 text-white">
                <th className="text-left px-2.5 py-1.5 font-semibold border border-slate-300">
                  Pôle / Indicateur
                </th>
                <th className="text-left px-2.5 py-1.5 font-semibold border border-slate-300">
                  Journée du {todayStr}
                </th>
                <th className="text-left px-2.5 py-1.5 font-semibold border border-slate-300">
                  Cumul Global / Situation
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-2.5 py-1.5 font-semibold border border-slate-300">
                  Nouvelles inscriptions
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {todayStudents.length} élève(s)
                </td>
                <td className="px-2.5 py-1.5 border border-slate-300">
                  {safeStudents.length} inscrits au total ({last7DaysStudents.length} sur 7 jours)
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-2.5 py-1.5 font-semibold border border-slate-300">
                  Statut pédagogique des élèves
                </td>
                <td className="px-2.5 py-1.5 border border-slate-300">
                  {activeCount} actifs aux cours
                </td>
                <td className="px-2.5 py-1.5 border border-slate-300">
                  {stoppedDemandCount} arrêt(s) demande · {stoppedUnpaidCount} arrêt(s) impayés
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-2.5 py-1.5 font-semibold border border-slate-300">
                  Recouvrement Mensuel ({monthlyRecovery.monthLabel})
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {formatFCFA(todayEncadrementTotal)} (du jour)
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {formatFCFA(encadrementCollected)} recouvrés ({encadrementRate}% · {monthlyRecovery.activeCount} actifs)
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-2.5 py-1.5 font-semibold border border-slate-300">
                  Frais d&apos;Inscription (Admission)
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {formatFCFA(todayInscriptionTotal)}
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {formatFCFA(inscriptionCollected)} recouvrés ({inscriptionRate}%)
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-2.5 py-1.5 font-semibold border border-slate-300">
                  Autres encaissements (Concours / Boutique)
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {formatFCFA(todayOtherPaymentsTotal)}
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  Total journée : {formatFCFA(todayPaymentsTotal)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-2.5 py-1.5 font-semibold border border-slate-300">
                  Trésorerie &amp; Solde Net en Caisse
                </td>
                <td className="px-2.5 py-1.5 font-mono border border-slate-300">
                  {formatFCFA(todayNetFlow)} (flux du jour)
                </td>
                <td className="px-2.5 py-1.5 font-mono font-bold border border-slate-300">
                  {formatFCFA(globalTreasury.netCashBalance)} (net global)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 2 : Inscriptions du jour */}
        <section className="mt-4">
          <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wide mb-1.5">
            2. Inscriptions enregistrées ce jour ({todayStudents.length})
          </h2>
          <table className="print-table w-full border border-slate-300 text-[10.5px]">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="w-8 text-center px-1.5 py-1.5 font-semibold border border-slate-300">
                  N°
                </th>
                <th className="w-24 text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Matricule
                </th>
                <th className="text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Élève
                </th>
                <th className="w-28 text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Niveau
                </th>
                <th className="text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Tuteur / Tél
                </th>
                <th className="w-24 text-right px-2 py-1.5 font-semibold border border-slate-300">
                  Mensualité
                </th>
              </tr>
            </thead>
            <tbody>
              {todayStudents.length > 0 ? (
                todayStudents.map((stu, idx) => (
                  <tr key={stu.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="text-center px-1.5 py-1.5 border border-slate-300 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1.5 border border-slate-300 font-mono">
                      {stu.matricule || '-'}
                    </td>
                    <td className="px-2 py-1.5 border border-slate-300 font-bold">
                      {(stu.fullName || '').toUpperCase()}
                    </td>
                    <td className="px-2 py-1.5 border border-slate-300">
                      {stu.level || stu.stream || '-'}
                    </td>
                    <td className="px-2 py-1.5 border border-slate-300">
                      {[stu.guardianName, stu.guardianPhone].filter(Boolean).join(' / ') || '-'}
                    </td>
                    <td className="text-right px-2 py-1.5 border border-slate-300 font-mono">
                      {formatFCFA(stu.monthlyFee || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-2.5 text-center text-slate-500 border border-slate-300"
                  >
                    Aucune nouvelle inscription enregistrée ce jour
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Section 3 : Paiements encaissés du jour */}
        <section className="mt-4">
          <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wide mb-1.5">
            3. Paiements encaissés ce jour ({todayPayments.length})
          </h2>
          <table className="print-table w-full border border-slate-300 text-[10.5px]">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="w-8 text-center px-1.5 py-1.5 font-semibold border border-slate-300">
                  N°
                </th>
                <th className="w-28 text-left px-2 py-1.5 font-semibold border border-slate-300">
                  N° Reçu
                </th>
                <th className="text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Élève
                </th>
                <th className="text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Catégorie / Mois
                </th>
                <th className="w-24 text-left px-2 py-1.5 font-semibold border border-slate-300">
                  Mode
                </th>
                <th className="w-28 text-right px-2 py-1.5 font-semibold border border-slate-300">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {todayPayments.length > 0 ? (
                <>
                  {todayPayments.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="text-center px-1.5 py-1.5 border border-slate-300 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 font-mono font-bold">
                        {p.receiptNumber || '-'}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 font-bold">
                        {(p.studentName || '').toUpperCase()}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300">
                        {p.category || 'Paiement'} ({formatPaymentCoveredMonthLabel(p)})
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300">
                        {p.paymentMethod || 'Espèces'}
                      </td>
                      <td className="text-right px-2 py-1.5 border border-slate-300 font-mono font-bold">
                        {formatFCFA(p.amount || 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td className="px-2 py-1.5 border border-slate-300" />
                    <td className="px-2 py-1.5 border border-slate-300 font-mono">TOTAL JOUR</td>
                    <td colSpan={3} className="px-2 py-1.5 border border-slate-300">
                      {todayPayments.length} règlement(s)
                    </td>
                    <td className="text-right px-2 py-1.5 border border-slate-300 font-mono">
                      {formatFCFA(todayPaymentsTotal)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-2.5 text-center text-slate-500 border border-slate-300"
                  >
                    Aucun règlement encaissé ce jour (0 FCFA)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Signatures officielles */}
        <footer className="mt-8 pt-4 flex items-start justify-between gap-8 text-[11px] print-avoid-break">
          <div>
            <p className="font-bold text-slate-700">Le Secrétariat / Agent de Caisse :</p>
            <p className="mt-6 text-slate-500">Nom &amp; Signature : ________________________</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-700">La Direction CAS-MANI (Visa &amp; Cachet) :</p>
            <p className="mt-6 text-slate-500">Signature &amp; Cachet : ________________________</p>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
