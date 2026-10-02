import React from 'react';
import {
  X,
  Printer,
  FileText,
  Calendar,
  CreditCard,
  Building,
  ShieldCheck,
  Users,
  Phone,
} from 'lucide-react';
import { MonthlyInvoice } from '../../types';
import { numberToFrenchWords } from '../../utils/familyUtils';
import { formatSessionHours, calculateWeeklyHours } from '../../utils/dateUtils';
import { CAB_APPUIS_LOGO } from '../../assets/logo';

interface PrintBatchInvoicesModalProps {
  invoices: MonthlyInvoice[];
  monthLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintBatchInvoicesModal: React.FC<PrintBatchInvoicesModalProps> = ({
  invoices,
  monthLabel,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const totalAmountToCollect = invoices.reduce((sum, inv) => sum + inv.netDue, 0);
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalMonthlyFee, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top bar controls (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Impression Groupée des Factures · {monthLabel}
              </h2>
              <p className="text-xs text-slate-400">
                {invoices.length} facture(s) prêtes à l'impression · Total à recouvrer :{' '}
                <strong className="text-emerald-400 font-mono">{totalAmountToCollect.toLocaleString()} FCFA</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer Tout le Lot ({invoices.length} factures)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto p-6 space-y-8 bg-slate-100 dark:bg-slate-950 printable-document">
          {invoices.map((invoice, index) => {
            const amountInWords = numberToFrenchWords(invoice.netDue);

            return (
              <div
                key={invoice.id}
                className="bg-white text-slate-900 p-8 rounded-xl border border-slate-300 shadow-sm relative overflow-hidden print-avoid-break print:p-6 print:border-b-2 print:border-slate-800 print:mb-8"
                style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
              >
                {/* Subtle Authentic Security Watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.05] print:opacity-[0.06]">
                  <img
                    src={CAB_APPUIS_LOGO}
                    alt="Logo filigrane"
                    className="w-80 h-80 object-contain filter grayscale"
                  />
                </div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={CAB_APPUIS_LOGO}
                      alt="Logo CAS-MANI"
                      className="w-14 h-14 rounded-xl object-contain border border-slate-200 shrink-0 bg-white p-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-900 text-white font-black text-xs px-2 py-0.5 rounded">
                          CAS-MANI
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Agrément Officiel
                        </span>
                      </div>
                      <h1 className="text-sm font-black uppercase text-slate-950 mt-0.5">
                        Cabinet d'Appuis Scolaire MANI
                      </h1>
                      <p className="text-[10px] text-slate-600 font-medium">
                        📍 Quartier Niamey 2000, Niamey · NIF : <strong>153633/P</strong> · RCCM : <strong>NE-NIM-A10-05126</strong> · 📞 +227 91 58 44 59
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block bg-slate-900 text-white font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded">
                      FACTURE N° {invoice.invoiceNumber}
                    </span>
                    <div className="text-[9.5px] font-bold text-indigo-950 uppercase mt-1">
                      AVIS DE SCOLARITÉ · {invoice.monthLabel}
                    </div>
                    <div className="text-[9px] text-rose-800 font-bold mt-0.5 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-block">
                      Échéance : {invoice.dueDate}
                    </div>
                  </div>
                </div>

                {/* Client / Guardian */}
                <div className="grid grid-cols-2 gap-3 my-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-500 block">
                      Facturé à / Tuteur Légal :
                    </span>
                    <span className="text-xs font-bold text-slate-950 block mt-0.5">
                      {invoice.guardianName}
                    </span>
                    {invoice.guardianPhone && (
                      <span className="text-[10px] text-slate-700 font-mono block">
                        📞 {invoice.guardianPhone}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase text-slate-500 block">
                      Date d'émission :
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {invoice.issueDate}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      Statut : <strong className="uppercase text-slate-800">{invoice.status}</strong>
                    </span>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left my-3 border border-slate-200 rounded text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[9.5px]">
                      <th className="py-1.5 px-2 w-6 text-center">N°</th>
                      <th className="py-1.5 px-2.5">Élève & Matricule</th>
                      <th className="py-1.5 px-2.5">Classe / Cycle</th>
                      <th className="py-1.5 px-2.5">Encadrement</th>
                      <th className="py-1.5 px-2.5 text-right">Mensualité</th>
                      <th className="py-1.5 px-2.5 text-right">Déjà Versé</th>
                      <th className="py-1.5 px-2.5 text-right font-bold">Net à Payer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {invoice.studentItems.map((st, i) => {
                      const weeklyHours = calculateWeeklyHours(st.sessionsPerWeek || 3);
                      return (
                        <tr key={st.studentId || i}>
                          <td className="py-1.5 px-2 text-center font-mono text-slate-500">{i + 1}</td>
                          <td className="py-1.5 px-2.5 font-bold text-slate-950">
                            {st.studentName} <span className="font-mono font-normal text-[9px] text-slate-500">({st.studentMatricule})</span>
                          </td>
                          <td className="py-1.5 px-2.5">{st.level}</td>
                          <td className="py-1.5 px-2.5 font-mono">{st.sessionsPerWeek} séa/sem. ({formatSessionHours(weeklyHours)})</td>
                          <td className="py-1.5 px-2.5 text-right font-mono">{st.monthlyFee.toLocaleString()} F</td>
                          <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700">{st.paidAmount > 0 ? `${st.paidAmount.toLocaleString()} F` : '-'}</td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">{st.balanceRemaining.toLocaleString()} F</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                      <td colSpan={6} className="py-1.5 px-2.5 text-right uppercase text-[10px]">
                        TOTAL NET À RÉGLER :
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-black text-xs text-indigo-950">
                        {invoice.netDue.toLocaleString()} FCFA
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Amount in Words */}
                <div className="my-2 p-2 rounded bg-slate-50 border border-slate-200 text-[9.5px] text-slate-800">
                  Arrêtée la présente facture à la somme nette de : <strong className="text-indigo-950 uppercase">{amountInWords} Francs CFA</strong>.
                </div>

                {/* Payment Channels Strip */}
                <div className="my-2 rounded border border-indigo-200 bg-indigo-50/40 p-2 text-[9px] text-slate-700 flex justify-between items-center">
                  <span>📱 <strong>Dépôt MyNita :</strong> <span className="font-mono font-bold text-indigo-950">+227 92 28 57 37</span></span>
                  <span>📱 <strong>Dépôt Amana Transfert :</strong> <span className="font-mono font-bold text-indigo-950">+227 92 28 57 37</span></span>
                  <span>📍 <strong>Caisse :</strong> Niamey 2000</span>
                </div>

                {/* Signatures & Visa */}
                <div className="mt-3 flex justify-between items-end border-t border-slate-200 pt-2 text-[8.5px]">
                  <span className="text-slate-500 font-mono">
                    RÉF: CAS-MANI-{invoice.invoiceNumber} · Facture {index + 1}/{invoices.length}
                  </span>
                  <div className="text-center">
                    <span className="font-bold text-indigo-900 uppercase">Direction & Caisse CAS-MANI</span>
                    <span className="block text-[7.5px] text-slate-500 italic">(Signature & Cachet)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <span>{invoices.length} factures générées pour le mois de {monthLabel}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
