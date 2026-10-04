import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Search,
  Filter,
  MessageCircle,
  Copy,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Sparkles,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MonthlyInvoice, Student } from '../../types';
import { formatYYYYMMToFrench } from '../../utils/dateUtils';
import {
  generateMonthlyInvoices,
  generateWhatsAppInvoiceMessage,
  generateSMSInvoiceMessage,
  getWhatsAppDirectLink,
  exportInvoicesToCSV,
} from '../../utils/invoiceUtils';
import { InvoiceModal } from '../modals/InvoiceModal';
import { PrintBatchInvoicesModal } from '../modals/PrintBatchInvoicesModal';

export const MonthlyInvoicesView: React.FC = () => {
  const {
    students,
    setIsNewPaymentModalOpen,
    setFamilyPaymentTargetParent,
    showToast,
  } = useApp();

  // Current selected billing month (Default: Current month e.g. "2026-10")
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [groupByFamily, setGroupByFamily] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Active students to bill
  const activeAndEnrolledStudents = students.filter(
    (s) => s.tutoringStatus === 'Actif' || s.tutoringStatus === 'Arrêté (Défaut de paiement)'
  );

  // Generated invoices for this month
  const allInvoices = generateMonthlyInvoices(activeAndEnrolledStudents, selectedMonth, {
    dueDateDay: 10,
    groupByFamily,
  });

  // Filter invoices
  const filteredInvoices = allInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      inv.guardianPhone.includes(search) ||
      inv.studentItems.some((s) => s.studentName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      inv.status === statusFilter ||
      (statusFilter === 'due_only' && inv.netDue > 0) ||
      (statusFilter === 'families_only' && inv.isFamilyInvoice);

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalBilled = allInvoices.reduce((sum, inv) => sum + inv.totalMonthlyFee, 0);
  const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.totalPaid, 0);
  const totalNetDue = allInvoices.reduce((sum, inv) => sum + inv.netDue, 0);
  const paidCount = allInvoices.filter((inv) => inv.status === 'Payée').length;
  const pendingCount = allInvoices.filter((inv) => inv.netDue > 0).length;
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const monthLabel = formatYYYYMMToFrench(selectedMonth);

  const handleOpenInvoice = (inv: MonthlyInvoice) => {
    setSelectedInvoice(inv);
    setIsInvoiceModalOpen(true);
  };

  const handleCopySMS = (inv: MonthlyInvoice) => {
    const text = generateSMSInvoiceMessage(inv);
    navigator.clipboard.writeText(text);
    setCopiedInvoiceId(inv.id);
    showToast(`SMS de la facture ${inv.invoiceNumber} copié !`, 'success');
    setTimeout(() => setCopiedInvoiceId(null), 3000);
  };

  const handleSendWhatsApp = (inv: MonthlyInvoice) => {
    const msg = generateWhatsAppInvoiceMessage(inv);
    const link = getWhatsAppDirectLink(inv.guardianPhone, msg);
    window.open(link, '_blank');
    showToast(`Ouverture WhatsApp pour ${inv.guardianName}...`, 'info');
  };

  const handleQuickPay = (inv: MonthlyInvoice) => {
    if (inv.isFamilyInvoice) {
      setFamilyPaymentTargetParent({
        guardianName: inv.guardianName,
        guardianPhone: inv.guardianPhone,
        studentIds: inv.studentItems.map((s) => s.studentId),
      });
    }
    setIsNewPaymentModalOpen(true);
  };

  const handleExportCSV = () => {
    exportInvoicesToCSV(filteredInvoices, monthLabel);
    showToast(`Export CSV des factures de ${monthLabel} téléchargé.`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Facturé */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Total Facturé ({monthLabel})</span>
            <FileText className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {(totalBilled ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            {allInvoices.length} factures émises
          </span>
        </div>

        {/* Total Recouvré */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Déjà Recouvré</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {(totalPaid ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Taux de recouvrement : {collectionRate}%
          </span>
        </div>

        {/* Reste à Recouvrer */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Reste à Recouvrer</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {(totalNetDue ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-rose-500 font-medium">
            {pendingCount} facture(s) en attente / solde
          </span>
        </div>

        {/* Factures Soldées */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Factures Réglées (100%)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {paidCount} <span className="text-xs font-normal text-slate-500">/ {allInvoices.length}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Parents totalement à jour
          </span>
        </div>

        {/* Factures à Relancer */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Factures à Relancer</span>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
            {pendingCount}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-300 font-semibold">
            Envois WhatsApp & SMS
          </span>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par tuteur, élève, téléphone ou N° facture..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
            title="Exporter la liste des factures au format CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Print All Batch */}
          <button
            onClick={() => setIsBatchPrintOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            title="Imprimer toutes les factures du mois en une seule opération pour distribution"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer Tout le Lot ({filteredInvoices.length})</span>
          </button>
        </div>
      </div>

      {/* Secondary Controls Bar: Month Picker, Grouping & Status filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-1.5 font-semibold">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">Mois facturé :</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Grouping Toggle: Family vs Individual */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700 p-0.5 text-xs">
            <button
              onClick={() => setGroupByFamily(true)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                groupByFamily
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Regrouper les élèves d'un même parent sur 1 seule facture"
            >
              <Users className="h-3 w-3" />
              <span>Factures Groupées Famille</span>
            </button>
            <button
              onClick={() => setGroupByFamily(false)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                !groupByFamily
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="1 facture distincte par élève"
            >
              <span>Individuelles</span>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">Tous statuts ({allInvoices.length})</option>
            <option value="due_only">Impayées & Soldes Dûs ({pendingCount})</option>
            <option value="En attente">En attente (Non payées)</option>
            <option value="Partielle">Partiellement payées</option>
            <option value="Payée">Entièrement payées ({paidCount})</option>
            <option value="En retard">En retard (Après échéance)</option>
            <option value="families_only">Fratries uniquement</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">{filteredInvoices.length}</span> facture(s) sélectionnée(s)
          <span className="mx-1.5">·</span>
          Échéance : <strong className="text-rose-600 dark:text-rose-400">10 du mois</strong>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">N° Facture & Échéance</th>
                <th className="py-3 px-4">Tuteur Légal / Parent</th>
                <th className="py-3 px-4">Élève(s) Couvert(s)</th>
                <th className="py-3 px-4 text-right">Total Facturé</th>
                <th className="py-3 px-4 text-right">Déjà Versé</th>
                <th className="py-3 px-4 text-right">Net à Payer (FCFA)</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Aucune facture ne correspond à ces critères pour {monthLabel}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Modifiez les filtres ou sélectionnez un autre mois de facturation.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                  >
                    {/* N° Facture & Échéance */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenInvoice(inv)}
                        className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left block cursor-pointer"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        <Clock className="h-2.5 w-2.5 text-rose-500" />
                        <span>Échéance : {inv.dueDate}</span>
                      </div>
                    </td>

                    {/* Tuteur / Parent */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.guardianName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="h-2.5 w-2.5 text-slate-400" />
                        <span>{inv.guardianPhone || 'Non renseigné'}</span>
                      </div>
                      {inv.isFamilyInvoice && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Fratrie ({inv.studentItems.length} enfants)
                        </span>
                      )}
                    </td>

                    {/* Élève(s) Couvert(s) */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {inv.studentItems.map((st) => (
                          <div key={st.studentId} className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {st.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({st.level})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Facturé */}
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {(inv?.totalMonthlyFee ?? 0).toLocaleString()} F
                    </td>

                    {/* Déjà Versé */}
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {(inv?.totalPaid ?? 0) > 0 ? `${(inv?.totalPaid ?? 0).toLocaleString()} F` : '-'}
                    </td>

                    {/* Net à Payer */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {(inv?.netDue ?? 0).toLocaleString()} FCFA
                      </div>
                      {(inv?.netDue ?? 0) === 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Solde à zéro ✓
                        </span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'Payée'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : inv.status === 'Partielle'
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                            : inv.status === 'En retard'
                            ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview / Print Modal */}
                        <button
                          onClick={() => handleOpenInvoice(inv)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-750 px-2 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Aperçu & Impression de la facture"
                        >
                          <Eye className="h-3 w-3 text-indigo-500" />
                          <span className="hidden xl:inline">Voir</span>
                        </button>

                        {/* Send via WhatsApp */}
                        <button
                          onClick={() => handleSendWhatsApp(inv)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-600/60 bg-emerald-50 dark:bg-emerald-500/10 px-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          title="Envoyer la facture sur le WhatsApp du tuteur"
                        >
                          <MessageCircle className="h-3 w-3 text-emerald-600" />
                          <span className="hidden xl:inline">WhatsApp</span>
                        </button>

                        {/* Copy SMS */}
                        <button
                          onClick={() => handleCopySMS(inv)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-1.5 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Copier le texte SMS"
                        >
                          {copiedInvoiceId === inv.id ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>

                        {/* Quick Pay */}
                        {(inv?.netDue ?? 0) > 0 && (
                          <button
                            onClick={() => handleQuickPay(inv)}
                            className="flex h-7 items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 text-[11px] font-semibold transition-colors cursor-pointer shadow-sm"
                            title="Encaisser cette facture"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span className="hidden xl:inline">Encaisser</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs">
                    Totaux ({filteredInvoices.length} factures) :
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                    {filteredInvoices.reduce((sum, inv) => sum + (inv?.totalMonthlyFee ?? 0), 0).toLocaleString()} F
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {filteredInvoices.reduce((sum, inv) => sum + (inv?.totalPaid ?? 0), 0).toLocaleString()} F
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                    {filteredInvoices.reduce((sum, inv) => sum + (inv?.netDue ?? 0), 0).toLocaleString()} FCFA
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {/* Print All Invoices Batch Modal */}
      <PrintBatchInvoicesModal
        invoices={filteredInvoices}
        monthLabel={monthLabel}
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
      />
    </div>
  );
};
