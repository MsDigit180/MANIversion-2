import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OfficialReceiptA4Document } from '../invoices/OfficialReceiptA4Document';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const ReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt, students, deletePayment } = useApp();
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReceipt(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedReceipt]);

  // Hook beforeprint / afterprint pour isoler strictement le document
  useEffect(() => {
    if (!selectedReceipt) return;

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
  }, [selectedReceipt]);

  if (!selectedReceipt || !mounted) return null;

  const isMulti =
    selectedReceipt.isMultiStudent ||
    (selectedReceipt.studentBreakdown && selectedReceipt.studentBreakdown.length > 1);

  const studentRecord = !isMulti
    ? students.find(
        (s) =>
          s.id === selectedReceipt.studentId ||
          selectedReceipt.studentName.toLowerCase().includes(s.fullName.toLowerCase())
      )
    : null;

  const handlePrint = () => {
    document.body.classList.add('is-printing-invoice');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleExportPDF = () => {
    setExporting(true);
    document.body.classList.add('is-printing-invoice');
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  };

  const modalContent = (
    <div
      id="print-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 print:p-0 print:bg-white print:static print:z-auto print:block animate-in fade-in duration-150"
    >
      <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
        {/* ============================================================== */}
        {/* TOP BAR / CONTROLS (MASQUÉ À L'IMPRESSION VIA print:hidden)     */}
        {/* ============================================================== */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-850 px-4 sm:px-6 py-3 gap-2 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Quittance Officielle de Paiement ·{' '}
                  <span className="font-mono text-emerald-300">{selectedReceipt.receiptNumber}</span>
                </span>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                  {isMulti ? 'Reçu Groupé Famille' : 'Reçu Individuel'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Format Officiel A4 Pleine Page (210mm × 297mm) · 1 Seule Page Garantie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
              title="Exporter au format PDF A4"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? 'Export...' : 'Exporter PDF A4'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              title="Lancer l'impression directe (1 page A4)"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Lancer l'impression A4</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CSS PRINT STRICT : ISOLATION VIA PORTAL, 1 SEULE PAGE GARANTIE */}
        {/* ============================================================== */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 0 !important;
                }

                /* Cacher l'arbre React principal en arrière-plan */
                #root,
                body.is-printing-invoice #root,
                body:has(#print-modal-portal) #root {
                  display: none !important;
                }

                .print\\:hidden {
                  display: none !important;
                  visibility: hidden !important;
                }

                html, body {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                  background: #ffffff !important;
                  color: #111827 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                #print-modal-portal {
                  position: static !important;
                  display: block !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  overflow: hidden !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }

                #printable-receipt-modal-content {
                  display: block !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: #ffffff !important;
                  overflow: hidden !important;
                  page-break-before: avoid !important;
                  break-before: avoid !important;
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }

                .official-receipt-sheet {
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 10mm !important;
                  margin: 0 auto !important;
                  box-sizing: border-box !important;
                  background: #ffffff !important;
                  color: #111827 !important;
                  overflow: hidden !important;
                  page-break-before: avoid !important;
                  break-before: avoid !important;
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `,
          }}
        />

        {/* ============================================================== */}
        {/* APERÇU ÉCRAN RÉALISTE DU REÇU A4 FULL HEIGHT                  */}
        {/* ============================================================== */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-950/70 flex justify-center printable-document print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div
            id="printable-receipt-modal-content"
            className="w-[210mm] max-w-full bg-white text-slate-900 rounded-sm shadow-2xl print:shadow-none border border-slate-200 print:border-none print:m-0 print:p-0"
          >
            <OfficialReceiptA4Document
              receipt={selectedReceipt}
              student={studentRecord}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL FOOTER (MASQUÉ À L'IMPRESSION VIA print:hidden)         */}
        {/* ============================================================== */}
        <div className="border-t border-slate-800 bg-slate-850 px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span>
              Total Encaissé :{' '}
              <strong className="text-emerald-400 font-mono text-sm">
                {(selectedReceipt?.amount ?? 0).toLocaleString()} FCFA
              </strong>
            </span>
            <span className="text-[11px] text-slate-400 font-medium ml-2">
              (Règlement {selectedReceipt?.paymentMethod || 'Espèces'})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-800/60 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer mr-1"
              title="Supprimer définitivement ce paiement"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Supprimer le paiement</span>
            </button>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Fermer (Échap)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer le Reçu A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation de suppression du paiement */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        title="Supprimer ce paiement ?"
        message={`Êtes-vous certain de vouloir supprimer définitivement le paiement N° ${selectedReceipt?.receiptNumber || 'N/A'} (${(selectedReceipt?.amount ?? 0).toLocaleString()} FCFA pour "${selectedReceipt?.studentName || 'Élève'}") ?\n\nCette action annulera l'enregistrement de caisse et réajustera automatiquement les soldes et statuts financiers de l'élève ou de la famille.`}
        isDeleting={isDeleting}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await deletePayment(selectedReceipt.id);
            setIsConfirmDeleteOpen(false);
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};
