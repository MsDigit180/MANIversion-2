import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  FileText,
  MessageCircle,
  Copy,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MonthlyInvoice } from '../../types';
import {
  generateWhatsAppInvoiceMessage,
  generateSMSInvoiceMessage,
  getWhatsAppDirectLink,
} from '../../utils/invoiceUtils';
import {
  OfficialInvoiceA4Document,
  OfficialInvoiceData,
} from '../invoices/OfficialInvoiceA4Document';

export interface InvoiceModalProps {
  invoice?: MonthlyInvoice | null;
  customData?: Partial<OfficialInvoiceData>;
  isOpen: boolean;
  onClose: () => void;
  onPayInvoice?: (invoice: MonthlyInvoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  customData,
  isOpen,
  onClose,
  onPayInvoice,
}) => {
  const { showToast, setIsNewPaymentModalOpen, setFamilyPaymentTargetParent, currentUser } = useApp();
  const [exporting, setExporting] = useState(false);
  const [copiedSMS, setCopiedSMS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Hook beforeprint / afterprint pour isoler strictement le document sans masquer ses parents
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

  if (!isOpen || (!invoice && !customData) || !mounted) return null;

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

  const handleCopySMS = () => {
    if (invoice) {
      const text = generateSMSInvoiceMessage(invoice);
      navigator.clipboard.writeText(text);
      setCopiedSMS(true);
      showToast('Texte SMS de la facture copié dans le presse-papiers !', 'success');
      setTimeout(() => setCopiedSMS(false), 3000);
    } else {
      const text = `CABINET MANI: Facture N° ${customData?.invoiceNumber || 'CAS'} de ${(customData?.netDue ?? 0).toLocaleString()} FCFA pour ${customData?.studentName || 'Élève'}. Dépôt Nita/Amana au +227 92 28 57 37.`;
      navigator.clipboard.writeText(text);
      setCopiedSMS(true);
      showToast('Texte SMS copié !', 'success');
      setTimeout(() => setCopiedSMS(false), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    const guardianPhone = customData?.guardianPhone || invoice?.guardianPhone || '';
    const guardianName = customData?.guardianName || invoice?.guardianName || 'Parent';

    if (invoice) {
      const message = generateWhatsAppInvoiceMessage(invoice);
      const link = getWhatsAppDirectLink(guardianPhone, message);
      window.open(link, '_blank');
      showToast(`Ouverture de WhatsApp pour ${guardianName}...`, 'info');
    } else {
      const message = `Bonjour M./Mme ${guardianName},\nVoici votre avis d'échéance de cours d'appuis CAS-MANI N° ${customData?.invoiceNumber || 'CAS'} d'un montant de ${(customData?.netDue ?? 0).toLocaleString()} FCFA.\nDépôt Nita Transfert / Amana au +227 92 28 57 37.\nMerci pour votre confiance.`;
      const link = getWhatsAppDirectLink(guardianPhone, message);
      window.open(link, '_blank');
      showToast(`Ouverture de WhatsApp pour ${guardianName}...`, 'info');
    }
  };

  const handleProceedPayment = () => {
    if (invoice) {
      if (invoice.isFamilyInvoice) {
        setFamilyPaymentTargetParent({
          guardianName: invoice.guardianName,
          guardianPhone: invoice.guardianPhone,
          studentIds: invoice.studentItems.map((s) => s.studentId),
        });
      }
      if (onPayInvoice) {
        onPayInvoice(invoice);
      } else {
        setIsNewPaymentModalOpen(true);
        onClose();
      }
    } else {
      setIsNewPaymentModalOpen(true);
      onClose();
    }
  };

  const invoiceNumber = customData?.invoiceNumber || invoice?.invoiceNumber || 'FAC-2026-10-0008';
  const monthLabel = customData?.monthLabel || invoice?.monthLabel || 'Octobre 2026';
  const netDue = customData?.netDue ?? (invoice?.netDue ?? 0);

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Facture Scolarité · <span className="font-mono text-indigo-300">{invoiceNumber}</span>
                </span>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                  {monthLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Format Officiel A4 Pleine Page (210mm × 297mm) · 1 Seule Page Garantie
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Send Button */}
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
              title="Ouvrir WhatsApp avec le message pré-rempli pour ce parent"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Copy SMS Button */}
            <button
              onClick={handleCopySMS}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copier le message SMS au format court"
            >
              {copiedSMS ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{copiedSMS ? 'Copié !' : 'Copier SMS'}</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
              title="Exporter au format PDF A4"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? 'Export...' : 'PDF'}</span>
            </button>

            {/* Print Button principal */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer"
              title="Lancer l'impression directe (1 page)"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Lancer l'impression</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
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

                /* Cacher l'arbre React principal en arrière-plan (sibling du portal) */
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

                #printable-invoice-modal-content {
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

                .official-invoice-sheet {
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
        {/* APERÇU ÉCRAN RÉALISTE DU DOCUMENT A4 FULL HEIGHT              */}
        {/* ============================================================== */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-950/70 flex justify-center printable-document print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div
            id="printable-invoice-modal-content"
            className="w-[210mm] max-w-full bg-white text-slate-900 rounded-sm shadow-2xl print:shadow-none border border-slate-200 print:border-none print:m-0 print:p-0"
          >
            <OfficialInvoiceA4Document
              invoice={invoice}
              customData={customData}
              cashierName={currentUser?.fullName || 'Direction CAS-MANI'}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL FOOTER (MASQUÉ À L'IMPRESSION VIA print:hidden)         */}
        {/* ============================================================== */}
        <div className="border-t border-slate-800 bg-slate-850 px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span>
              Net à payer :{' '}
              <strong className="text-emerald-400 font-mono text-sm">
                {(netDue ?? 0).toLocaleString()} FCFA
              </strong>
            </span>
            {netDue > 0 && (
              <button
                onClick={handleProceedPayment}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors cursor-pointer ml-2"
                title="Encaisser immédiatement le règlement de cette facture"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Encaisser Maintenant</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Fermer (Échap)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer (1 page)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
