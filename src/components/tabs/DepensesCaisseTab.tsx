import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  Edit,
  Trash2,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Smartphone,
  CheckCircle2,
  Clock,
  Scale,
  FileDown,
  HandCoins,
  RotateCcw,
  AlertTriangle,
  BellRing,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES, CashLoan } from '../../types';
import {
  buildConsolidatedExpenses,
  calculateTreasurySummary,
  ConsolidatedExpenseItem,
  matchesTreasuryMonth,
} from '../../utils/financialUtils';
import {
  formatYYYYMMToFrench,
  parseFlexibleDate,
  formatDateToFrench,
} from '../../utils/dateUtils';
import { downloadTreasuryExpensesPDF } from '../../utils/pdfExportUtils';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';

type LoanDeadlineLevel = 'overdue' | 'today' | 'soon' | 'normal' | 'none';

interface LoanDeadlineAlert {
  level: LoanDeadlineLevel;
  label: string;
  formattedDueDate: string | null;
  diffDays: number | null;
}

const getLoanDeadlineAlert = (loan: CashLoan): LoanDeadlineAlert => {
  const principal = Number(loan.principalAmount || 0);
  const repaid = Number(loan.repaidAmount || 0);
  const remaining = Math.max(0, Number(loan.remainingAmount ?? principal - repaid));
  const isRepaid = remaining === 0 || loan.status === 'Remboursé';

  if (isRepaid || !loan.dueDate) {
    return { level: 'none', label: '', formattedDueDate: null, diffDays: null };
  }

  const parsedDue = parseFlexibleDate(loan.dueDate);
  if (!parsedDue) {
    return {
      level: 'normal',
      label: `Échéance : ${loan.dueDate}`,
      formattedDueDate: loan.dueDate,
      diffDays: null,
    };
  }

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(parsedDue.getFullYear(), parsedDue.getMonth(), parsedDue.getDate());
  const diffDays = Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / 86400000);
  const formattedDueDate = formatDateToFrench(dueMidnight);

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return {
      level: 'overdue',
      label: `Dépassée de ${daysLate} j`,
      formattedDueDate,
      diffDays,
    };
  }
  if (diffDays === 0) {
    return {
      level: 'today',
      label: "Échéance aujourd'hui",
      formattedDueDate,
      diffDays: 0,
    };
  }
  if (diffDays <= 3) {
    return {
      level: 'soon',
      label: `Dans ${diffDays} j`,
      formattedDueDate,
      diffDays,
    };
  }
  return {
    level: 'normal',
    label: `Échéance : ${formattedDueDate}`,
    formattedDueDate,
    diffDays,
  };
};

export const DepensesCaisseTab: React.FC = () => {
  const {
    payments,
    expenses,
    salaryPayments,
    cashLoans,
    deleteExpense,
    deleteSalaryPayment,
    deleteCashLoan,
    setIsNewExpenseModalOpen,
    setEditingExpense,
    setIsCashLoanModalOpen,
    setSelectedLoanForRepay,
    setIsPaySalaryModalOpen,
    setSelectedTutorForSalary,
    showToast,
    campus,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'loans' | 'reconciliation'>('ledger');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'salaire'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'all' | 'active' | 'alert' | 'repaid'>('all');
  const [ledgerLoanFilter, setLedgerLoanFilter] = useState<'all' | 'active' | 'alert' | 'repaid'>('all');

  const [itemToDelete, setItemToDelete] = useState<ConsolidatedExpenseItem | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<CashLoan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const safePayments = payments || [];
  const safeExpenses = expenses || [];
  const safeSalaries = salaryPayments || [];
  const safeCashLoans = cashLoans || [];

  const summary = useMemo(
    () => calculateTreasurySummary(safePayments, safeExpenses, safeSalaries, monthFilter, safeCashLoans),
    [safePayments, safeExpenses, safeSalaries, monthFilter, safeCashLoans]
  );

  const sortedLoans = useMemo(() => {
    const extractTs = (id: string) => {
      const m = id.match(/(\d{10,})/);
      return m ? Number(m[1]) : 0;
    };
    return [...safeCashLoans].sort((a, b) => extractTs(b.id) - extractTs(a.id));
  }, [safeCashLoans]);

  const filteredLoans = useMemo(() => {
    const q = loanSearch.trim().toLowerCase();
    return sortedLoans.filter((loan) => {
      const matchesMonth =
        monthFilter === 'all' ||
        matchesTreasuryMonth(loan.loanDate, loan.notes, monthFilter) ||
        (loan.repayments || []).some((r) => matchesTreasuryMonth(r.repaymentDate, r.notes, monthFilter));
      const matchesSearch =
        !q ||
        loan.loanNumber.toLowerCase().includes(q) ||
        loan.borrowerName.toLowerCase().includes(q) ||
        loan.reason.toLowerCase().includes(q) ||
        (loan.borrowerPhone || '').toLowerCase().includes(q);
      const isRepaid = loan.status === 'Remboursé' || Number(loan.remainingAmount || 0) <= 0;
      const alert = getLoanDeadlineAlert(loan);
      const isUrgent = alert.level === 'overdue' || alert.level === 'today' || alert.level === 'soon';
      const matchesStatus =
        loanStatusFilter === 'all' ||
        (loanStatusFilter === 'active'
          ? !isRepaid
          : loanStatusFilter === 'alert'
          ? isUrgent
          : isRepaid);
      return matchesMonth && matchesSearch && matchesStatus;
    });
  }, [sortedLoans, monthFilter, loanSearch, loanStatusFilter]);

  const ledgerSummaryLoans = useMemo(() => {
    return sortedLoans.filter((loan) => {
      const isRepaid = loan.status === 'Remboursé' || Number(loan.remainingAmount || 0) <= 0;
      if (ledgerLoanFilter === 'active') return !isRepaid;
      if (ledgerLoanFilter === 'repaid') return isRepaid;
      if (ledgerLoanFilter === 'alert') {
        const alert = getLoanDeadlineAlert(loan);
        return alert.level === 'overdue' || alert.level === 'today' || alert.level === 'soon';
      }
      return true;
    });
  }, [sortedLoans, ledgerLoanFilter]);

  const loanStats = useMemo(() => {
    let totalPrincipal = 0;
    let totalRepaid = 0;
    let totalRemaining = 0;
    let activeCount = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;
    for (const loan of safeCashLoans) {
      const p = Number(loan.principalAmount || 0);
      const r = Number(loan.repaidAmount || 0);
      const rem = Math.max(0, Number(loan.remainingAmount ?? p - r));
      totalPrincipal += p;
      totalRepaid += r;
      totalRemaining += rem;
      if (rem > 0) activeCount += 1;
      const alert = getLoanDeadlineAlert(loan);
      if (alert.level === 'overdue') overdueCount += 1;
      if (alert.level === 'today' || alert.level === 'soon') dueSoonCount += 1;
    }
    return {
      totalPrincipal,
      totalRepaid,
      totalRemaining,
      activeCount,
      overdueCount,
      dueSoonCount,
      urgentCount: overdueCount + dueSoonCount,
    };
  }, [safeCashLoans]);

  const allConsolidatedExpenses = useMemo(
    () => buildConsolidatedExpenses(safeExpenses, safeSalaries),
    [safeExpenses, safeSalaries]
  );

  const periodExpenses = useMemo(() => {
    return allConsolidatedExpenses.filter((item) => {
      const extraPeriod = item.rawSalaryPayment?.month || item.notes || '';
      return matchesTreasuryMonth(item.date, extraPeriod, monthFilter);
    });
  }, [allConsolidatedExpenses, monthFilter]);

  const filteredExpenses = useMemo(() => {
    return periodExpenses.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.referenceNumber.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.beneficiary || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q);

      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'salaire' ? item.source === 'salaire' : item.category === categoryFilter);
      const matchesMethod =
        methodFilter === 'all' || item.paymentMethod.toLowerCase().includes(methodFilter.toLowerCase());

      return matchesSearch && matchesSource && matchesCategory && matchesMethod;
    });
  }, [periodExpenses, search, sourceFilter, categoryFilter, methodFilter]);

  const filteredTotalAmount = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + item.amount, 0),
    [filteredExpenses]
  );

  const manualBreakdownByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of safeExpenses) {
      if (!matchesTreasuryMonth(exp.expenseDate, exp.notes, monthFilter)) continue;
      const cat = exp.category || 'Autres Dépenses';
      map.set(cat, (map.get(cat) || 0) + Number(exp.amount || 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [safeExpenses, monthFilter]);

  const periodLabel = monthFilter === 'all' ? 'Cumul Global' : formatYYYYMMToFrench(monthFilter);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.source === 'manual') {
        await deleteExpense(itemToDelete.id);
      } else {
        await deleteSalaryPayment(itemToDelete.id);
      }
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Reference',
      'Date',
      'Origine',
      'Libelle',
      'Categorie',
      'Beneficiaire',
      'Mode de reglement',
      'Montant (FCFA)',
      'Agent',
      'Notes',
    ];
    const rows = filteredExpenses.map((item) => [
      item.referenceNumber,
      item.date,
      item.source === 'salaire' ? 'Salaire Encadreur' : 'Saisie Manuelle',
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.beneficiary || '').replace(/"/g, '""')}"`,
      `"${(item.paymentMethod || '').replace(/"/g, '""')}"`,
      item.amount,
      `"${(item.agentName || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const summaryLines = [
      '',
      `SYNTHESE CAISSE (${periodLabel})`,
      `Total Recouvrement (Entrees);${summary.totalRecovery}`,
      `Depenses Manuelles;${summary.manualExpensesTotal}`,
      `Salaires & Remunerations;${summary.salaryExpensesTotal}`,
      `Total Depenses (Sorties);${summary.totalExpenses}`,
      `Solde Net en Caisse (Recouvrement - Depenses);${summary.netCashBalance}`,
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';')), ...summaryLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `depenses_caisse_${monthFilter === 'all' ? 'global' : monthFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Export CSV généré (${filteredExpenses.length} dépense(s)).`, 'success');
  };

  const handleExportPDF = async () => {
    try {
      showToast(`Génération du rapport officiel de caisse (${periodLabel})...`, 'info');
      await downloadTreasuryExpensesPDF(periodExpenses, summary, periodLabel, campus);
      showToast(`Rapport officiel de caisse (${periodLabel}) exporté en PDF.`, 'success');
    } catch {
      showToast('Erreur lors de la génération du PDF.', 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Tab Switcher & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'ledger'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Journal des Dépenses ({allConsolidatedExpenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('loans')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'loans'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HandCoins className="h-4 w-4" />
            <span>
              Prêts Caisse ({loanStats.activeCount} en cours)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('reconciliation')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'reconciliation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Bilan Recouvrement & Caisse</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            title="Exporter le journal consolidé des dépenses en CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Exporter le rapport officiel de la caisse mensuelle en PDF (avec solde net)"
          >
            <FileDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Exporter en PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedLoanForRepay(null);
              setIsCashLoanModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <HandCoins className="h-3.5 w-3.5" />
            <span>Prendre un Prêt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTutorForSalary(null);
              setIsPaySalaryModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Verser un Salaire</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsNewExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards: Recouvrement -> Dépenses Manuelles -> Salaires -> Solde Net Caisse */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Recouvrement */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Recouvrement (Entrées)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{summary.totalRecovery.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Encadrement : {summary.recoveryEncadrement.toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span>Inscr. : {summary.recoveryInscription.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Dépenses Manuelles */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Dépenses Manuelles ({summary.manualExpensesCount})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            -{summary.manualExpensesTotal.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-slate-500 dark:text-slate-400">
            Charges saisies manuellement (loyer, factures, achats)
          </span>
        </div>

        {/* Card 3: Salaires & Rémunérations */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Salaires & Rémunérations ({summary.salaryExpensesCount})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            -{summary.salaryExpensesTotal.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-slate-500 dark:text-slate-400">
            Récupérés automatiquement depuis Salaires Encadreurs
          </span>
        </div>

        {/* Card 4: Solde Net en Caisse (Recouvrement - Total Dépenses) */}
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            summary.netCashBalance >= 0
              ? 'border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/60 dark:bg-emerald-950/30'
              : 'border-rose-300 dark:border-rose-700/70 bg-rose-50/60 dark:bg-rose-950/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                summary.netCashBalance >= 0
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : 'text-rose-800 dark:text-rose-300'
              }`}
            >
              Solde Net en Caisse
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                summary.netCashBalance >= 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div
            className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
              summary.netCashBalance >= 0
                ? 'text-emerald-950 dark:text-white'
                : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {summary.netCashBalance.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">FCFA</span>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-300 font-mono">
              Dép. : -{summary.totalExpenses.toLocaleString()}
              {summary.outstandingLoansTotal > 0
                ? ` · Prêts : -${summary.outstandingLoansTotal.toLocaleString()}`
                : ''}
            </span>
            <span
              className={`font-bold ${
                summary.netCashBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.netCashBalance > 0
                ? 'Excédent'
                : summary.netCashBalance === 0
                ? 'Équilibrée'
                : 'Déficitaire'}
            </span>
          </div>
        </div>
      </div>

      {/* Period & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {activeSubTab === 'ledger' && (
            <>
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher réf (DEP / SAL), libellé, encadreur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Source Segmented Control */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-750 p-1 text-xs border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    sourceFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setSourceFilter('manual')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    sourceFilter === 'manual'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Manuelles
                </button>
                <button
                  onClick={() => setSourceFilter('salaire')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    sourceFilter === 'salaire'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Salaires
                </button>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes Catégories</option>
                <option value="salaire">Salaires & Rémunérations</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Tous Modes</option>
                <option value="Espèces">Espèces</option>
                <option value="Airtel">Airtel Money</option>
                <option value="Flooz">Moov Flooz</option>
                <option value="Virement">Virement Bancaire</option>
                <option value="Chèque">Chèque</option>
              </select>
            </>
          )}

          {activeSubTab === 'loans' && (
            <>
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher réf (PRET), emprunteur, motif..."
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-750 p-1 text-xs border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLoanStatusFilter('all')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    loanStatusFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tous ({safeCashLoans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLoanStatusFilter('active')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    loanStatusFilter === 'active'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  À remettre ({loanStats.activeCount})
                </button>
                {loanStats.urgentCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setLoanStatusFilter('alert')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                      loanStatusFilter === 'alert'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>Échéances ({loanStats.urgentCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLoanStatusFilter('repaid')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    loanStatusFilter === 'repaid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Remis ({safeCashLoans.length - loanStats.activeCount})
                </button>
              </div>
            </>
          )}

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Période :</span>
            <input
              type="month"
              value={monthFilter === 'all' ? '' : monthFilter}
              onChange={(e) => setMonthFilter(e.target.value ? e.target.value : 'all')}
              className="bg-transparent text-xs text-indigo-700 dark:text-indigo-300 font-bold focus:outline-none cursor-pointer"
              title="Filtrer les entrées, dépenses et la caisse par mois"
            />
            {monthFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setMonthFilter('all')}
                className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-1 underline cursor-pointer"
              >
                Global
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMonthFilter(new Date().toISOString().slice(0, 7))}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline ml-1 font-semibold cursor-pointer"
                title="Filtrer sur le mois en cours pour le rapport mensuel"
              >
                Mois en cours
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
          <span>
            {activeSubTab === 'ledger'
              ? `${filteredExpenses.length} sortie(s) · Total : -${filteredTotalAmount.toLocaleString()} FCFA`
              : activeSubTab === 'loans'
              ? `${filteredLoans.length} prêt(s) · Encours dû : ${loanStats.totalRemaining.toLocaleString()} FCFA`
              : `Caisse ${periodLabel} : ${summary.netCashBalance.toLocaleString()} FCFA`}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUB-VIEW 1: JOURNAL CONSOLIDÉ DES DÉPENSES (MANUELLES + SALAIRES) */}
      {/* =================================================================== */}
      {activeSubTab === 'ledger' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Réf & Date</th>
                  <th className="py-3 px-4">Origine</th>
                  <th className="py-3 px-4">Libellé & Bénéficiaire</th>
                  <th className="py-3 px-4">Catégorie / Période</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Montant Déduit</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4 text-center">Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {allConsolidatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <Receipt className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Aucune dépense enregistrée pour le moment
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Saisissez une dépense manuelle ou versez un salaire d'encadreur : chaque sortie sera automatiquement déduite de la caisse.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              setEditingExpense(null);
                              setIsNewExpenseModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Saisir une Dépense</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Aucune dépense ne correspond à ces critères.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((item) => (
                    <tr
                      key={`${item.source}-${item.id}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.referenceNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.date}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.source === 'salaire' ? (
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            Salaire & Rémun.
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Saisie Manuelle
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          {item.beneficiary && <span>{item.beneficiary}</span>}
                          {item.beneficiary && item.notes && <span aria-hidden="true">·</span>}
                          {item.notes && <span className="truncate max-w-xs italic">{item.notes}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        -{item.amount.toLocaleString()} FCFA
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                          {item.agentName}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.agentRole}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.syncStatus === 'synced' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Cache</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.source === 'manual' && item.rawManualExpense && (
                            <button
                              onClick={() => {
                                setEditingExpense(item.rawManualExpense!);
                                setIsNewExpenseModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                              title="Modifier cette dépense"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setItemToDelete(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                            title={
                              item.source === 'salaire'
                                ? 'Annuler / supprimer ce versement de salaire'
                                : 'Supprimer cette dépense'
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau Récapitulatif : Historique Complet des Prêts à la Caisse (visible directement dans Dépenses) */}
      {activeSubTab === 'ledger' && (
        <section
          aria-labelledby="loans-history-heading"
          className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3
                  id="loans-history-heading"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Tableau Récapitulatif — Historique des Prêts Octroyés à la Caisse
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {sortedLoans.length} prêt(s) au total · {loanStats.activeCount} en cours ·{' '}
                {sortedLoans.length - loanStats.activeCount} remboursé(s) · Encours dû :{' '}
                {loanStats.totalRemaining.toLocaleString()} FCFA
              </p>
              {loanStats.urgentCount > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold">
                  {loanStats.overdueCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {loanStats.overdueCount} prêt{loanStats.overdueCount > 1 ? 's' : ''} en retard de remboursement
                      </span>
                    </span>
                  )}
                  {loanStats.dueSoonCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <BellRing className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {loanStats.dueSoonCount} échéance{loanStats.dueSoonCount > 1 ? 's' : ''} proche{loanStats.dueSoonCount > 1 ? 's' : ''} (≤ 3 j)
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-750 p-1 text-xs border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLedgerLoanFilter('all')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ledgerLoanFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tous ({sortedLoans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerLoanFilter('active')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ledgerLoanFilter === 'active'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  En cours ({loanStats.activeCount})
                </button>
                {loanStats.urgentCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setLedgerLoanFilter('alert')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      ledgerLoanFilter === 'alert'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>Alertes ({loanStats.urgentCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLedgerLoanFilter('repaid')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ledgerLoanFilter === 'repaid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Remboursés ({sortedLoans.length - loanStats.activeCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedLoanForRepay(null);
                  setIsCashLoanModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Prendre un Prêt</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Réf. Prêt</th>
                  <th className="py-3 px-4">Bénéficiaire &amp; Motif</th>
                  <th className="py-3 px-4">Date d&apos;Octroi</th>
                  <th className="py-3 px-4">Échéance / Date Remise</th>
                  <th className="py-3 px-4 text-right">Montant Prêté</th>
                  <th className="py-3 px-4 text-right">Remis / Reste</th>
                  <th className="py-3 px-4">État &amp; Alerte</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {sortedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-2.5">
                        <HandCoins className="h-7 w-7 text-amber-500/70" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Aucun prêt octroyé à la caisse pour le moment
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Tout prêt prélevé à la caisse apparaîtra ici avec sa date d&apos;octroi, son état et l&apos;historique des remises.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : ledgerSummaryLoans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucun prêt ne correspond à ce statut.
                    </td>
                  </tr>
                ) : (
                  ledgerSummaryLoans.map((loan) => {
                    const principal = Number(loan.principalAmount || 0);
                    const repaid = Number(loan.repaidAmount || 0);
                    const remaining = Math.max(0, Number(loan.remainingAmount ?? principal - repaid));
                    const isRepaid = remaining === 0 || loan.status === 'Remboursé';
                    const repaymentsList = loan.repayments || [];
                    const lastRepayment = repaymentsList[repaymentsList.length - 1];
                    const deadlineAlert = getLoanDeadlineAlert(loan);
                    const isOverdue = deadlineAlert.level === 'overdue';
                    const isDueSoon = deadlineAlert.level === 'today' || deadlineAlert.level === 'soon';

                    return (
                      <tr
                        key={`summary-${loan.id}`}
                        className={`transition-colors ${
                          isOverdue
                            ? 'bg-rose-50/45 dark:bg-rose-950/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/35'
                            : isDueSoon
                            ? 'bg-amber-50/45 dark:bg-amber-950/15 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-750/50'
                        }`}
                      >
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                            {isOverdue && (
                              <AlertTriangle
                                className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0"
                                aria-label="Échéance de remboursement dépassée"
                              />
                            )}
                            {isDueSoon && (
                              <BellRing
                                className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0"
                                aria-label="Échéance de remboursement proche"
                              />
                            )}
                            <span>{loan.loanNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {loan.paymentMethod} · {loan.agentName}
                          </div>
                        </td>

                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {loan.borrowerName}
                            {loan.borrowerPhone && (
                              <span className="ml-1.5 font-mono text-[10px] font-normal text-slate-400">
                                ({loan.borrowerPhone})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            {loan.reason}
                          </div>
                        </td>

                        <td className="py-3 px-4 align-top font-mono text-[11px] text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                          {loan.loanDate}
                        </td>

                        <td className="py-3 px-4 align-top text-[11px]">
                          {lastRepayment ? (
                            <div className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {isRepaid ? 'Remis le' : 'Dern. remise'} : {lastRepayment.repaymentDate}
                            </div>
                          ) : (
                            <div className="text-slate-400 dark:text-slate-500">
                              Aucune remise
                            </div>
                          )}
                          {loan.dueDate && !isRepaid && (
                            <div
                              className={`mt-0.5 flex items-center gap-1 font-mono tabular-nums ${
                                isOverdue
                                  ? 'font-bold text-rose-600 dark:text-rose-400'
                                  : isDueSoon
                                  ? 'font-bold text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                              {isDueSoon && <BellRing className="h-3 w-3 shrink-0" />}
                              <span>Échéance : {deadlineAlert.formattedDueDate || loan.dueDate}</span>
                            </div>
                          )}
                          {repaymentsList.length > 1 && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {repaymentsList.length} versement(s) de remise
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right align-top font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                          -{principal.toLocaleString()} FCFA
                        </td>

                        <td className="py-3 px-4 text-right align-top font-mono tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{repaid.toLocaleString()} FCFA
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isRepaid
                                ? 'text-slate-400 dark:text-slate-500'
                                : 'font-semibold text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            Reste : {remaining.toLocaleString()} FCFA
                          </div>
                        </td>

                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              isRepaid
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : repaid > 0
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isRepaid ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span>
                              {isRepaid
                                ? 'Remboursé'
                                : repaid > 0
                                ? 'Partiellement remboursé'
                                : 'En cours'}
                            </span>
                          </div>
                          {(isOverdue || isDueSoon) && (
                            <div
                              className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {isOverdue ? (
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                              ) : (
                                <BellRing className="h-3 w-3 shrink-0" />
                              )}
                              <span>{deadlineAlert.label}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isRepaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLoanForRepay(loan);
                                  setIsCashLoanModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                title="Enregistrer la remise totale ou partielle de ce prêt"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Remettre</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setLoanToDelete(loan)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                              title="Supprimer ce dossier de prêt"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {ledgerSummaryLoans.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-750/70 border-t border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-slate-700 dark:text-slate-200">
                      Total ({ledgerSummaryLoans.length} prêt{ledgerSummaryLoans.length > 1 ? 's' : ''})
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                      -
                      {ledgerSummaryLoans
                        .reduce((acc, l) => acc + Number(l.principalAmount || 0), 0)
                        .toLocaleString()}{' '}
                      FCFA
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      <div className="text-emerald-600 dark:text-emerald-400">
                        +
                        {ledgerSummaryLoans
                          .reduce((acc, l) => acc + Number(l.repaidAmount || 0), 0)
                          .toLocaleString()}{' '}
                        FCFA
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                        Reste :{' '}
                        {ledgerSummaryLoans
                          .reduce(
                            (acc, l) =>
                              acc +
                              Math.max(
                                0,
                                Number(l.remainingAmount ?? Number(l.principalAmount || 0) - Number(l.repaidAmount || 0))
                              ),
                            0
                          )
                          .toLocaleString()}{' '}
                        FCFA
                      </div>
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Déduit / réintégré automatiquement dans la caisse
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 1B: PRÊTS & REMISES EN CAISSE                              */}
      {/* =================================================================== */}
      {activeSubTab === 'loans' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Total Prêts Accordés
              </span>
              <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {loanStats.totalPrincipal.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Total Remis en Caisse
              </span>
              <div className="mt-1 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{loanStats.totalRepaid.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 p-3.5">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Reste à Remettre (Encours)
              </span>
              <div className="mt-1 font-mono text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                {loanStats.totalRemaining.toLocaleString()} <span className="text-xs font-normal text-amber-600/80">FCFA</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Dossiers en cours
                </span>
                <span className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {loanStats.activeCount} / {safeCashLoans.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLoanForRepay(null);
                  setIsCashLoanModalOpen(true);
                }}
                className="rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                + Prendre Prêt
              </button>
            </div>
          </div>

          {/* Loans Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Réf &amp; Date</th>
                    <th className="py-3 px-4">Emprunteur &amp; Motif</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Montant Prêté</th>
                    <th className="py-3 px-4 text-right">Déjà Remis</th>
                    <th className="py-3 px-4 text-right">Reste à Remettre</th>
                    <th className="py-3 px-4">Statut &amp; Remises</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {safeCashLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <HandCoins className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              Aucun prêt de caisse enregistré
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Enregistrez un prêt pris à la caisse puis suivez sa remise totale ou partielle jusqu&apos;à restitution complète.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLoanForRepay(null);
                              setIsCashLoanModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors cursor-pointer"
                          >
                            <HandCoins className="h-4 w-4" />
                            <span>Prendre un Prêt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <HandCoins className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Aucun prêt ne correspond à ces critères.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      const remaining = Math.max(
                        0,
                        Number(loan.remainingAmount ?? loan.principalAmount - (loan.repaidAmount || 0))
                      );
                      const isRepaid = remaining === 0 || loan.status === 'Remboursé';
                      const repaymentsList = loan.repayments || [];
                      const deadlineAlert = getLoanDeadlineAlert(loan);
                      const isOverdue = deadlineAlert.level === 'overdue';
                      const isDueSoon = deadlineAlert.level === 'today' || deadlineAlert.level === 'soon';

                      return (
                        <tr
                          key={loan.id}
                          className={`transition-colors ${
                            isOverdue
                              ? 'bg-rose-50/45 dark:bg-rose-950/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/35'
                              : isDueSoon
                              ? 'bg-amber-50/45 dark:bg-amber-950/15 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-750/50'
                          }`}
                        >
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                              {isOverdue && (
                                <AlertTriangle
                                  className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0"
                                  aria-label="Échéance de remboursement dépassée"
                                />
                              )}
                              {isDueSoon && (
                                <BellRing
                                  className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0"
                                  aria-label="Échéance de remboursement proche"
                                />
                              )}
                              <span>{loan.loanNumber}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {loan.loanDate}
                            </div>
                            {loan.dueDate && (
                              <div
                                className={`mt-0.5 flex items-center gap-1 text-[10px] font-mono tabular-nums ${
                                  isOverdue
                                    ? 'font-bold text-rose-600 dark:text-rose-400'
                                    : isDueSoon
                                    ? 'font-bold text-amber-600 dark:text-amber-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                                {isDueSoon && <BellRing className="h-3 w-3 shrink-0" />}
                                <span>
                                  Échéance : {deadlineAlert.formattedDueDate || loan.dueDate}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {loan.borrowerName}
                              {loan.borrowerPhone && (
                                <span className="ml-1.5 font-mono text-[10px] font-normal text-slate-400">
                                  ({loan.borrowerPhone})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              {loan.reason}
                            </div>
                            {loan.notes && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                                {loan.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {loan.paymentMethod}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Par {loan.agentName}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right align-top font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            -{Number(loan.principalAmount || 0).toLocaleString()} FCFA
                          </td>

                          <td className="py-3.5 px-4 text-right align-top font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            +{Number(loan.repaidAmount || 0).toLocaleString()} FCFA
                          </td>

                          <td className="py-3.5 px-4 text-right align-top font-mono font-bold tabular-nums">
                            <span
                              className={
                                isRepaid
                                  ? 'text-slate-400 dark:text-slate-500'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {remaining.toLocaleString()} FCFA
                            </span>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                isRepaid
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : loan.repaidAmount > 0
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {isRepaid ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span>{isRepaid ? 'Remboursé' : loan.status}</span>
                            </div>

                            {(isOverdue || isDueSoon) && (
                              <div
                                className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${
                                  isOverdue
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {isOverdue ? (
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                ) : (
                                  <BellRing className="h-3 w-3 shrink-0" />
                                )}
                                <span>{deadlineAlert.label}</span>
                              </div>
                            )}

                            {repaymentsList.length > 0 && (
                              <div className="mt-1 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                {repaymentsList.map((rep) => (
                                  <div key={rep.id} className="font-mono tabular-nums">
                                    {rep.repaymentNumber} : +{rep.amount.toLocaleString()} FCFA ({rep.repaymentDate.split(' ')[0]})
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right align-top">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isRepaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLoanForRepay(loan);
                                    setIsCashLoanModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                                  title="Enregistrer la remise totale ou partielle de ce prêt"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  <span>Remettre</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setLoanToDelete(loan)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                                title="Supprimer ce dossier de prêt"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 2: BILAN RECOUVREMENT & ÉTAT DE CAISSE                     */}
      {/* =================================================================== */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Channel Breakdown: Espèces vs Digital & Banque */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Caisse Physique (Espèces)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Recouvrement espèces − Dépenses &amp; prêts espèces + Remises
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-lg font-bold tabular-nums ${
                    summary.netPhysicalCash >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {summary.netPhysicalCash.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  Recouvrement Espèces
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{summary.recoveryCash.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  Dépenses &amp; Salaires en Espèces
                </span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{summary.expensesCash.toLocaleString()} FCFA
                </span>
              </div>
              {(summary.loansCashOut > 0 || summary.loansCashIn > 0) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <HandCoins className="h-3.5 w-3.5 text-amber-500" />
                    Prêts Espèces (Pris − Remis)
                  </span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                    {(summary.loansCashIn - summary.loansCashOut).toLocaleString()} FCFA
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Trésorerie Mobile Money & Banque
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Airtel, Moov, Amana, Nita, Virements & Chèques
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-lg font-bold tabular-nums ${
                    summary.netDigitalBalance >= 0
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {summary.netDigitalBalance.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  Encaissements Digitaux & Banques
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{summary.recoveryDigital.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                  Sorties Digitales & Bancaires
                </span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{summary.expensesDigital.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-side Ledger: Entrées (Recouvrement) vs Sorties (Dépenses) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entrées */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <span>1. Détail du Recouvrement (Entrées)</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{summary.totalRecovery.toLocaleString()} FCFA
                </span>
              </h3>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600 dark:text-slate-300">
                    Frais d'Encadrement (Scolarité)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {summary.recoveryEncadrement.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600 dark:text-slate-300">
                    Frais d'Inscription (Admissions)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {summary.recoveryInscription.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-600 dark:text-slate-300">
                    Frais Concours & Boutique Fournitures
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {summary.recoveryOther.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Sorties */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <span>2. Détail des Dépenses (Sorties)</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                  -{summary.totalExpenses.toLocaleString()} FCFA
                </span>
              </h3>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                <div className="flex items-center justify-between py-2.5">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Salaires & Rémunérations Encadreurs ({summary.salaryExpensesCount})
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {summary.salaryExpensesTotal.toLocaleString()} FCFA
                  </span>
                </div>
                {manualBreakdownByCategory.length === 0 ? (
                  <div className="py-3 text-slate-400 italic">
                    Aucune dépense manuelle sur cette période.
                  </div>
                ) : (
                  manualBreakdownByCategory.map(([cat, total]) => (
                    <div key={cat} className="flex items-center justify-between py-2.5">
                      <span className="text-slate-600 dark:text-slate-300">{cat}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {total.toLocaleString()} FCFA
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Final Formula Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">
                Formule de Trésorerie · {periodLabel}
              </span>
              <div className="text-sm md:text-base font-semibold flex flex-wrap items-center gap-2">
                <span className="text-emerald-400 font-mono tabular-nums">
                  {summary.totalRecovery.toLocaleString()} FCFA
                </span>
                <span className="text-slate-400">(Recouvrement)</span>
                <span className="text-slate-300">−</span>
                <span className="text-rose-400 font-mono tabular-nums">
                  {summary.totalExpenses.toLocaleString()} FCFA
                </span>
                <span className="text-slate-400">(Dépenses + Salaires)</span>
                {(summary.loansGrantedTotal > 0 || summary.loansRepaidTotal > 0) && (
                  <>
                    <span className="text-slate-300">−</span>
                    <span className="text-amber-400 font-mono tabular-nums">
                      {summary.outstandingLoansTotal.toLocaleString()} FCFA
                    </span>
                    <span className="text-slate-400">(Prêts non remis)</span>
                  </>
                )}
                <span className="text-slate-300">=</span>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                Solde Net Disponible en Caisse
              </span>
              <span
                className={`font-mono text-2xl md:text-3xl font-bold tabular-nums ${
                  summary.netCashBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.netCashBalance.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal for Expense / Salary */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        title={
          itemToDelete?.source === 'salaire'
            ? 'Supprimer le versement de salaire'
            : 'Supprimer la dépense'
        }
        message={
          itemToDelete
            ? `Voulez-vous vraiment supprimer "${itemToDelete.title}" (${itemToDelete.referenceNumber}) d'un montant de ${itemToDelete.amount.toLocaleString()} FCFA ? Le solde de la caisse sera automatiquement réajusté.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
        isDeleting={isDeleting}
      />

      {/* Confirm Delete Modal for Cash Loan */}
      <ConfirmDeleteModal
        isOpen={Boolean(loanToDelete)}
        title="Supprimer le prêt de caisse"
        message={
          loanToDelete
            ? `Voulez-vous vraiment supprimer le prêt "${loanToDelete.loanNumber}" accordé à ${loanToDelete.borrowerName} (${loanToDelete.principalAmount.toLocaleString()} FCFA) ainsi que ses remises associées ? Le solde de la caisse sera réajusté.`
            : ''
        }
        onConfirm={async () => {
          if (!loanToDelete) return;
          setIsDeleting(true);
          try {
            await deleteCashLoan(loanToDelete.id);
            setLoanToDelete(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => setLoanToDelete(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
