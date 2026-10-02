import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleBeforePrint = () => {
      document.body.classList.add('is-printing-invoice');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-invoice');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-invoice');
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const totalAmountToCollect = invoices.reduce((sum, inv) => sum + inv.netDue, 0);

  const handlePrint = () => {
    document.body.classList.add('is-printing-invoice');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const modalContent = (
    <div
      id="print-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 print:p-0 print:bg-white print:static print:z-auto print:block animate-in fade-in duration-150"
    >
      <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
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
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Lancer l'impression du lot ({invoices.length} factures)</span>
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
                  margin: 0 !important;
                }
                #root,
                body.is-printing-invoice #root,
                body:has(#print-modal-portal) #root {
                  display: none !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  color: #111827 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .batch-invoice-page {
                  page-break-after: always !important;
                  break-after: page !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 0 !important;
                  margin: 0 auto !important;
                  border: none !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                  background: white !important;
                }
              }
            `,
          }}
        />

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto p-6 space-y-8 bg-slate-950/70 printable-document flex flex-col items-center print:p-0 print:m-0 print:space-y-0 print:bg-white">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="w-[210mm] max-w-full bg-white text-slate-900 rounded-sm border border-slate-300 print:border-none shadow-xl relative overflow-hidden batch-invoice-page"
            >
              <OfficialInvoiceA4Document
                invoice={invoice}
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

  return createPortal(modalContent, document.body);
};
