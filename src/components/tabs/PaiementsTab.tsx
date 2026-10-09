import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  Download,
  DollarSign,
  TrendingUp,
  BadgeCheck,
  Calendar,
  FileText,
  Users,
  MessageCircle,
  Copy,
  AlertTriangle,
  ArrowRight,
  Send,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentReceipt, MonthlyInvoice, Student } from '../../types';
import { formatReceiptPaymentDate, formatYYYYMMToFrench } from '../../utils/dateUtils';
import {
  generateMonthlyInvoices,
  generateWhatsAppInvoiceMessage,
  generateSMSInvoiceMessage,
  getWhatsAppDirectLink,
  exportInvoicesToCSV,
} from '../../utils/invoiceUtils';
import { InvoiceModal } from '../modals/InvoiceModal';
import { PrintBatchInvoicesModal } from '../modals/PrintBatchInvoicesModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';

export const PaiementsTab: React.FC = () => {
  const {
    payments,
    students,
    setIsNewPaymentModalOpen,
    setSelectedReceipt,
    setFamilyPaymentTargetParent,
    deletePayment,
    showToast,
  } = useApp();

  const [paymentToDelete, setPaymentToDelete] = useState<PaymentReceipt | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);

  // Mode switcher: Receipts log vs. Monthly Invoices
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'invoices'>('receipts');

  // Receipts view state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Invoices view state
  const [invoiceMonth, setInvoiceMonth] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [groupByFamily, setGroupByFamily] = useState<boolean>(true);

  // Selected invoice for detail/print modal
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<MonthlyInvoice | null>(null);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState<boolean>(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  const safePayments = payments || [];
  const safeStudents = students || [];

  // Filtered Payments (Journal de Caisse)
  const filteredPayments = useMemo(() => {
    return safePayments.filter((pay) => {
      const searchLower = (search || '').toLowerCase();
      const receiptSafe = (pay.receiptNumber || '').toLowerCase();
      const studentSafe = (pay.studentName || '').toLowerCase();
      const methodSafe = pay.paymentMethod || '';
      const dateSafe = pay.paymentDate || '';

      const matchesSearch = receiptSafe.includes(searchLower) || studentSafe.includes(searchLower);
      const matchesCategory = categoryFilter === 'all' || pay.category === categoryFilter;
      const matchesMethod = methodFilter === 'all' || methodSafe.includes(methodFilter);
      const matchesMonth =
        monthFilter === 'all' || (() => {
          const frenchMonth = formatYYYYMMToFrench(monthFilter);
          const [year, monthNum] = monthFilter.split('-');
          return (
            dateSafe.includes(monthFilter) ||
            dateSafe.includes(`${monthNum}/${year}`) ||
            (pay.notes && (
              pay.notes.toLowerCase().includes(frenchMonth.toLowerCase()) ||
              pay.notes.toLowerCase().includes(monthFilter.toLowerCase()) ||
              pay.notes.toLowerCase().includes(`${monthNum}/${year}`)
            ))
          );
        })();

      return matchesSearch && matchesCategory && matchesMethod && matchesMonth;
    });
  }, [safePayments, search, categoryFilter, methodFilter, monthFilter]);

  const totalCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Method breakdown
  const cashTotal = filteredPayments
    .filter((p) => p.paymentMethod === 'Espèces')
    .reduce((a, b) => a + (b.amount || 0), 0);
  const mobileTotal = filteredPayments
    .filter(
      (p) =>
        p.paymentMethod &&
        (p.paymentMethod.includes('Airtel') ||
          p.paymentMethod.includes('Flooz') ||
          p.paymentMethod.includes('Amana') ||
          p.paymentMethod.includes('Nita') ||
          p.paymentMethod.includes('Al Izza') ||
          p.paymentMethod.includes('Mobile') ||
          p.paymentMethod.includes('Wave'))
    )
    .reduce((a, b) => a + (b.amount || 0), 0);
  const bankTotal = filteredPayments
    .filter((p) => p.paymentMethod === 'Virement Bancaire')
    .reduce((a, b) => a + (b.amount || 0), 0);

  // Generated Monthly Invoices
  const allMonthlyInvoices = useMemo(() => {
    return generateMonthlyInvoices(safeStudents, invoiceMonth, { groupByFamily, dueDateDay: 10 });
  }, [safeStudents, invoiceMonth, groupByFamily]);

  const filteredInvoices = useMemo(() => {
    return allMonthlyInvoices.filter((inv) => {
      if (!inv) return false;
      const searchLower = (invoiceSearch ?? '').trim().toLowerCase();
      const invNumSafe = (inv.invoiceNumber ?? '').toLowerCase();
      const guardianSafe = (inv.guardianName ?? '').toLowerCase();
      const phoneSafe = inv.guardianPhone ?? '';
      const studentItemsSafe = Array.isArray(inv.studentItems) ? inv.studentItems : [];

      const matchesSearch =
        !searchLower ||
        invNumSafe.includes(searchLower) ||
        guardianSafe.includes(searchLower) ||
        phoneSafe.includes(invoiceSearch) ||
        studentItemsSafe.some((s) => (s?.studentName ?? '').toLowerCase().includes(searchLower));

      const matchesStatus =
        invoiceStatusFilter === 'all' ||
        (invoiceStatusFilter === 'pending' && inv.status === 'En attente') ||
        (invoiceStatusFilter === 'partial' && inv.status === 'Partielle') ||
        (invoiceStatusFilter === 'paid' && inv.status === 'Payée') ||
        (invoiceStatusFilter === 'late' && inv.status === 'En retard');

      return matchesSearch && matchesStatus;
    });
  }, [allMonthlyInvoices, invoiceSearch, invoiceStatusFilter]);

  // Invoice Statistics for Current Selected Month
  const invoiceStats = useMemo(() => {
    const totalBilled = allMonthlyInvoices.reduce((sum, inv) => sum + inv.totalMonthlyFee, 0);
    const totalPaid = allMonthlyInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0);
    const totalDue = allMonthlyInvoices.reduce((sum, inv) => sum + inv.netDue, 0);
    const paidCount = allMonthlyInvoices.filter((i) => i.status === 'Payée').length;
    const partialCount = allMonthlyInvoices.filter((i) => i.status === 'Partielle').length;
    const pendingCount = allMonthlyInvoices.filter((i) => i.status === 'En attente' || i.status === 'En retard').length;
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

    return {
      totalBilled,
      totalPaid,
      totalDue,
      paidCount,
      partialCount,
      pendingCount,
      collectionRate,
      count: allMonthlyInvoices.length,
    };
  }, [allMonthlyInvoices]);

  const handleCopySMS = (inv: MonthlyInvoice) => {
    const text = generateSMSInvoiceMessage(inv);
    navigator.clipboard.writeText(text);
    setCopiedInvoiceId(inv.id);
    showToast(`SMS copié pour ${inv.guardianName}`, 'success');
    setTimeout(() => setCopiedInvoiceId(null), 2500);
  };

  const handleSendWhatsApp = (inv: MonthlyInvoice) => {
    const message = generateWhatsAppInvoiceMessage(inv);
    const link = getWhatsAppDirectLink(inv.guardianPhone, message);
    window.open(link, '_blank');
    showToast(`WhatsApp ouvert pour ${inv.guardianName}`, 'info');
  };

  const handlePayForInvoice = (inv: MonthlyInvoice) => {
    if (inv.isFamilyInvoice) {
      setFamilyPaymentTargetParent({
        guardianName: inv.guardianName,
        guardianPhone: inv.guardianPhone,
        studentIds: (inv.studentItems || []).map((s) => s.studentId),
      });
    }
    setIsNewPaymentModalOpen(true);
  };

  const handleExportInvoicesCSV = () => {
    const label = formatYYYYMMToFrench(invoiceMonth);
    exportInvoicesToCSV(filteredInvoices, label);
    showToast(`Export CSV des factures de ${label} téléchargé avec succès.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Primary Sub-Tab Switcher: Receipts vs Monthly Invoices */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setActiveSubTab('receipts')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition-all cursor-pointer ${
              activeSubTab === 'receipts'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Journal de Caisse & Reçus ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-bold transition-all cursor-pointer ${
              activeSubTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            <div className="flex items-center gap-1.5">
              <span>Factures Mensuelles aux Parents</span>
              <span className="rounded bg-indigo-500/30 dark:bg-indigo-400/20 px-1.5 py-0.2 text-[10px] font-mono text-white">
                {allMonthlyInvoices.length}
              </span>
            </div>
          </button>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'invoices' ? (
            <>
              <button
                onClick={handleExportInvoicesCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors cursor-pointer"
                title="Exporter les factures du mois sélectionné en CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={() => setIsBatchPrintModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
                title="Imprimer toutes les factures du mois en continu (Avis d'échéance physique)"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer Tout le Mois ({filteredInvoices.length})</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsNewPaymentModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Encaisser un Règlement</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: JOURNAL DE CAISSE & REÇUS */}
      {/* ========================================================================= */}
      {activeSubTab === 'receipts' && (
        <>
          {/* Top Financial Breakdown Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Encaissé (Période)</span>
              <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {(totalCollected ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% rapproché en caisse</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Encaissements Espèces</span>
              <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {(cashTotal ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Guichet & Caisse physique</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Airtel Money & Flooz</span>
              <div className="mt-2 font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {(mobileTotal ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-300">Paiements digitaux instantanés</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Virements / Amana Transfert</span>
              <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                {(bankTotal ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">SONIBANK / BOA / AMANA</span>
            </div>
          </div>

          {/* Action and Filter Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par n° de reçu ou élève..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes Catégories</option>
                <option value="Scolarité Mensuelle">Scolarité Mensuelle</option>
                <option value="Inscription">Inscription</option>
                <option value="Frais Concours">Frais Concours</option>
                <option value="Fournitures">Fournitures</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Tous Modes de Paiement</option>
                <option value="Espèces">Espèces</option>
                <option value="Airtel">Airtel Money</option>
                <option value="Flooz">Moov Flooz</option>
                <option value="Amana">Amana Transfert</option>
                <option value="Nita">Nita Transfert d'argent</option>
              </select>

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mois :</span>
                <input
                  type="month"
                  value={monthFilter === 'all' ? '' : monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value ? e.target.value : 'all')}
                  className="bg-transparent text-xs text-indigo-700 dark:text-indigo-300 font-bold focus:outline-none cursor-pointer"
                  title="Filtrer par mois (Calendrier)"
                />
                {monthFilter !== 'all' && (
                  <button
                    onClick={() => setMonthFilter('all')}
                    className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1 underline cursor-pointer"
                  >
                    Tous
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsNewPaymentModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Encaisser un Règlement</span>
            </button>
          </div>

          {/* Receipts Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">N° Reçu & Date</th>
                    <th className="py-3 px-4">Élève / Payeur</th>
                    <th className="py-3 px-4">Prestation</th>
                    <th className="py-3 px-4">Mode de Règlement</th>
                    <th className="py-3 px-4 text-right">Montant (FCFA)</th>
                    <th className="py-3 px-4">Agent Encaissseur</th>
                    <th className="py-3 px-4 text-center">Sync</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {safePayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun encaissement dans la base de données</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Le journal de caisse est actuellement vide. Cliquez sur le bouton ci-dessous pour émettre votre premier reçu.
                            </p>
                          </div>
                          <button
                            onClick={() => setIsNewPaymentModalOpen(true)}
                            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Nouveau Paiement / Reçu</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">Aucun encaissement ne correspond à ces critères.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {pay.receiptNumber}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {formatReceiptPaymentDate(pay.paymentDate)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {pay.studentName}
                          </div>
                          {(pay.isMultiStudent || (pay.studentBreakdown && pay.studentBreakdown.length > 1)) && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Reçu Groupé Famille ({pay.studentBreakdown?.length || 2} él.)
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {pay.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          +{(pay?.amount ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={pay.agentAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                              alt={pay.agentName}
                              className="h-6 w-6 rounded-lg object-cover ring-1 ring-emerald-500/30"
                            />
                            <div>
                              <div className="font-bold text-[11px] text-slate-900 dark:text-white">
                                {pay.agentName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {pay.agentRole}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {pay.syncStatus === 'synced' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>OK</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                              <Clock className="h-3 w-3" />
                              <span>Cache</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedReceipt(pay)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                              title="Aperçu / Imprimer le reçu officiel"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setPaymentToDelete(pay)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
                              title="Supprimer définitivement ce paiement"
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
        </>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: FACTURES MENSUELLES AUX PARENTS D'ÉLÈVES */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-6">
          {/* Monthly Invoicing KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Facturé */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Facturé · {formatYYYYMMToFrench(invoiceMonth)}
                </span>
                <FileText className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {(invoiceStats?.totalBilled ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {invoiceStats?.count ?? 0} factures éditées ({students.length} élèves)
              </span>
            </div>

            {/* Card 2: Recouvré */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Total Déjà Recouvré
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {(invoiceStats?.totalPaid ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                <span>Taux de recouvrement : {invoiceStats?.collectionRate ?? 0}%</span>
              </div>
            </div>

            {/* Card 3: Reste à Recouvrer / Dû */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Solde à Recouvrer (Impayés)
                </span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {(invoiceStats?.totalDue ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">FCFA</span>
              </div>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {(invoiceStats?.pendingCount ?? 0) + (invoiceStats?.partialCount ?? 0)} factures en attente / partielles
              </span>
            </div>

            {/* Card 4: Actions Globales & Envoi */}
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 dark:from-indigo-950/40 dark:to-slate-800 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Distribution & Envoi</span>
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Imprimez les avis d'échéance ou transmettez-les par WhatsApp direct aux parents.
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setIsBatchPrintModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-1.5 px-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimer Lot</span>
                </button>
              </div>
            </div>
          </div>

          {/* Month Controller & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Month Picker */}
              <div className="flex items-center gap-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-1.5">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Mois de facturation :
                </span>
                <input
                  type="month"
                  value={invoiceMonth}
                  onChange={(e) => {
                    if (e.target.value) setInvoiceMonth(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Search parent or student */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher parent, téléphone ou élève..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Status Filter */}
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Tous les Statuts</option>
                <option value="pending">En attente (Non payé)</option>
                <option value="partial">Partiellement réglé</option>
                <option value="paid">Intégralement Payé</option>
                <option value="late">En retard d'échéance</option>
              </select>

              {/* Group By Family Toggle */}
              <button
                onClick={() => setGroupByFamily(!groupByFamily)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  groupByFamily
                    ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300'
                }`}
                title="Regrouper les factures par famille / tuteur légal"
              >
                <Users className="h-3.5 w-3.5" />
                <span>{groupByFamily ? 'Groupé par Famille' : '1 Facture / Élève'}</span>
              </button>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Réf Facture & Échéance</th>
                    <th className="py-3.5 px-4">Tuteur Légal / Parent</th>
                    <th className="py-3.5 px-4">Enfants Bénéficiaires</th>
                    <th className="py-3.5 px-4 text-right">Total Facturé</th>
                    <th className="py-3.5 px-4 text-right">Déjà Versé</th>
                    <th className="py-3.5 px-4 text-right">Net à Payer</th>
                    <th className="py-3.5 px-4 text-center">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions Facture & Envoi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Aucune facture ne correspond aux filtres actuels.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                      >
                        {/* 1. Ref & Dates */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>{inv.invoiceNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Échéance : <strong className="text-slate-700 dark:text-slate-300">{inv.dueDate}</strong>
                          </div>
                        </td>

                        {/* 2. Guardian / Parent */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {inv.guardianName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            📞 {inv.guardianPhone || 'Non renseigné'}
                          </div>
                        </td>

                        {/* 3. Children */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {(inv.studentItems || []).map((st) => (
                              <div key={st.studentId} className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {st.studentName}
                                </span>
                                <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                                  {st.level}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({(st?.monthlyFee ?? 0).toLocaleString()} F)
                                </span>
                              </div>
                            ))}
                            {inv.isFamilyInvoice && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded w-fit border border-purple-200 dark:border-purple-800/50 mt-0.5">
                                <Users className="h-3 w-3" />
                                <span>Facture Groupée Fratrie ({inv.studentItems.length} enfants)</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Total Billed */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {(inv?.totalMonthlyFee ?? 0).toLocaleString()} F
                        </td>

                        {/* 5. Paid Amount */}
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {(inv?.totalPaid ?? 0) > 0 ? `+${(inv?.totalPaid ?? 0).toLocaleString()} F` : '0 F'}
                        </td>

                        {/* 6. Net Due */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {(inv?.netDue ?? 0) > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/50">
                              {(inv?.netDue ?? 0).toLocaleString()} FCFA
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0 FCFA</span>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td className="py-3.5 px-4 text-center">
                          {inv.status === 'Payée' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Soldée</span>
                            </span>
                          )}
                          {inv.status === 'Partielle' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                              <Clock className="h-3 w-3" />
                              <span>Partielle</span>
                            </span>
                          )}
                          {inv.status === 'En attente' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                              <Clock className="h-3 w-3" />
                              <span>À recouvrer</span>
                            </span>
                          )}
                          {inv.status === 'En retard' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                              <AlertTriangle className="h-3 w-3" />
                              <span>En retard</span>
                            </span>
                          )}
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View / Print Invoice */}
                            <button
                              onClick={() => setSelectedInvoiceForModal(inv)}
                              className="flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-xs"
                              title="Voir et imprimer la facture individuelle officielle"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Facture</span>
                            </button>

                            {/* WhatsApp Direct Send */}
                            <button
                              onClick={() => handleSendWhatsApp(inv)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                              title="Envoyer la facture via WhatsApp au parent"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>

                            {/* Copy SMS */}
                            <button
                              onClick={() => handleCopySMS(inv)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Copier le texte SMS de relance"
                            >
                              {copiedInvoiceId === inv.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* Encaisser button if balance remains */}
                            {inv.netDue > 0 && (
                              <button
                                onClick={() => handlePayForInvoice(inv)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white shadow-xs transition-colors cursor-pointer ml-1"
                                title="Encaisser le règlement pour cette facture"
                              >
                                <CreditCard className="h-3 w-3" />
                                <span className="hidden lg:inline">Encaisser</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-750">
              <div className="flex items-center gap-2">
                <span>
                  {filteredInvoices.length} factures affichées ({formatYYYYMMToFrench(invoiceMonth)})
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  Reste total à recouvrer : {(invoiceStats?.totalDue ?? 0).toLocaleString()} FCFA
                </span>
              </div>
              <span>Cabinet Cab-Appuis · Niamey (Niger)</span>
            </div>
          </div>
        </div>
      )}

      {/* Individual Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoiceForModal}
        isOpen={!!selectedInvoiceForModal}
        onClose={() => setSelectedInvoiceForModal(null)}
        onPayInvoice={(inv) => handlePayForInvoice(inv)}
      />

      {/* Print Batch Monthly Invoices Modal */}
      <PrintBatchInvoicesModal
        invoices={filteredInvoices}
        monthLabel={formatYYYYMMToFrench(invoiceMonth)}
        isOpen={isBatchPrintModalOpen}
        onClose={() => setIsBatchPrintModalOpen(false)}
      />

      {/* Confirmation de suppression du paiement */}
      <ConfirmDeleteModal
        isOpen={!!paymentToDelete}
        title="Supprimer ce paiement ?"
        message={
          paymentToDelete
            ? `Êtes-vous certain de vouloir supprimer définitivement le paiement N° ${paymentToDelete.receiptNumber || 'N/A'} d'un montant de ${(paymentToDelete?.amount ?? 0).toLocaleString()} FCFA pour "${paymentToDelete.studentName || 'Élève'}" ?\n\nCette action annulera l'enregistrement de caisse et déduira automatiquement ce montant des paiements effectués par l'élève / la famille, réajustant en temps réel son solde restant et son statut financier.`
            : ''
        }
        isDeleting={isDeletingPayment}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={async () => {
          if (!paymentToDelete) return;
          setIsDeletingPayment(true);
          try {
            await deletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
          } finally {
            setIsDeletingPayment(false);
          }
        }}
      />
    </div>
  );
};
