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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES } from '../../types';
import {
  buildConsolidatedExpenses,
  calculateTreasurySummary,
  ConsolidatedExpenseItem,
  matchesTreasuryMonth,
} from '../../utils/financialUtils';
import { formatYYYYMMToFrench } from '../../utils/dateUtils';
import { downloadTreasuryExpensesPDF } from '../../utils/pdfExportUtils';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';

export const DepensesCaisseTab: React.FC = () => {
  const {
    payments,
    expenses,
    salaryPayments,
    deleteExpense,
    deleteSalaryPayment,
    setIsNewExpenseModalOpen,
    setEditingExpense,
    setIsPaySalaryModalOpen,
    setSelectedTutorForSalary,
    showToast,
    campus,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'reconciliation'>('ledger');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'salaire'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const [itemToDelete, setItemToDelete] = useState<ConsolidatedExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const safePayments = payments || [];
  const safeExpenses = expenses || [];
  const safeSalaries = salaryPayments || [];

  const summary = useMemo(
    () => calculateTreasurySummary(safePayments, safeExpenses, safeSalaries, monthFilter),
    [safePayments, safeExpenses, safeSalaries, monthFilter]
  );

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
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'ledger'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Journal des Dépenses ({allConsolidatedExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reconciliation')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
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
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            title="Exporter le journal consolidé des dépenses en CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Exporter le rapport officiel de la caisse mensuelle en PDF (avec solde net)"
          >
            <FileDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Exporter en PDF</span>
          </button>

          <button
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
              Dépenses : -{summary.totalExpenses.toLocaleString()}
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
                      Recouvrement espèces − Dépenses & salaires payés en espèces
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
                  Dépenses & Salaires en Espèces
                </span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{summary.expensesCash.toLocaleString()} FCFA
                </span>
              </div>
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
                <span className="text-slate-400">(Dépenses Manuelles + Salaires)</span>
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

      {/* Confirm Delete Modal */}
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
    </div>
  );
};
