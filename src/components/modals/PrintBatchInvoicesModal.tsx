import React from 'react';
import {
  X,
  Printer,
  FileText,
} from 'lucide-react';
import { MonthlyInvoice } from '../../types';
import { OfficialInvoiceA4Document } from '../invoices/OfficialInvoiceA4Document';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
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
                <strong className="text-emerald-400 font-mono text-sm">{totalAmountToCollect.toLocaleString()} FCFA</strong>
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

        {/* Scoped print style to strictly enforce 1 page per invoice */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 12mm;
                }
                body {
                  background: white !important;
                  color: #111827 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
                .batch-invoice-page {
                  page-break-after: always !important;
                  break-after: page !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  height: 273mm !important;
                  max-height: 273mm !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border: none !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  background: white !important;
                }
              }
            `,
          }}
        />

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto p-6 space-y-8 bg-slate-950/70 printable-document flex flex-col items-center">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="w-full max-w-[210mm] bg-white text-slate-900 p-8 print:p-0 rounded-xl border border-slate-300 print:border-none shadow-xl relative overflow-hidden batch-invoice-page single-page-doc"
            >
              <OfficialInvoiceA4Document
                invoice={invoice}
                layoutOption="with-coupon"
              />
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <span>{invoices.length} factures officielles formatées au standard A4 CAS-MANI</span>
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
