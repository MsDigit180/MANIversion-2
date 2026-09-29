import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentReceipt } from '../../types';
import { formatReceiptPaymentDate } from '../../utils/dateUtils';

export const PaiementsTab: React.FC = () => {
  const { payments, setIsNewPaymentModalOpen, setSelectedReceipt } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredPayments = payments.filter((pay) => {
    const matchesSearch =
      pay.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      pay.studentName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || pay.category === categoryFilter;
    const matchesMethod = methodFilter === 'all' || pay.paymentMethod.includes(methodFilter);
    const matchesMonth =
      monthFilter === 'all' ||
      pay.paymentDate.includes(monthFilter) ||
      (pay.notes && pay.notes.toLowerCase().includes(monthFilter.toLowerCase()));

    return matchesSearch && matchesCategory && matchesMethod && matchesMonth;
  });

  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  // Method breakdown
  const cashTotal = filteredPayments
    .filter((p) => p.paymentMethod === 'Espèces')
    .reduce((a, b) => a + b.amount, 0);
  const mobileTotal = filteredPayments
    .filter((p) => p.paymentMethod.includes('Airtel') || p.paymentMethod.includes('Flooz') || p.paymentMethod.includes('Al Izza') || p.paymentMethod.includes('Mobile') || p.paymentMethod.includes('Wave'))
    .reduce((a, b) => a + b.amount, 0);
  const bankTotal = filteredPayments
    .filter((p) => p.paymentMethod === 'Virement Bancaire')
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Financial Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Encaissé (Période)</span>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% rapproché en caisse</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Encaissements Espèces</span>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {cashTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Guichet & Caisse physique</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Airtel Money & Flooz</span>
          <div className="mt-2 font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {mobileTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-300">Paiements digitaux instantanés</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Virements / Al Izza (Niamey)</span>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-200 tabular-nums">
            {bankTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">SONIBANK / BOA / NITA</span>
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
            <option value="Al Izza">Al Izza / Nita</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les mois (Filtrer par mois)</option>
            <option value="Septembre">Septembre 2026</option>
            <option value="Août">Août 2026</option>
            <option value="Juillet">Juillet 2026</option>
            <option value="Juin">Juin 2026</option>
            <option value="Mai">Mai 2026</option>
            <option value="Avril">Avril 2026</option>
            <option value="Mars">Mars 2026</option>
            <option value="09/2026">09/2026</option>
          </select>
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
              {filteredPayments.length === 0 ? (
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
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {pay.studentName}
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
                      +{pay.amount.toLocaleString()}
                    </td>
                    {/* Explicit Agent Traceability with Profile Photo (USER REQUIREMENT) */}
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
                      <button
                        onClick={() => setSelectedReceipt(pay)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ml-auto cursor-pointer"
                        title="Aperçu / Imprimer le reçu officiel"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
