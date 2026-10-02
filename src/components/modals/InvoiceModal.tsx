import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  FileText,
  Users,
  Phone,
  MessageCircle,
  Copy,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  ShieldCheck,
  Scissors,
  LayoutGrid,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MonthlyInvoice, InvoiceStudentItem } from '../../types';
import {
  generateWhatsAppInvoiceMessage,
  generateSMSInvoiceMessage,
  getWhatsAppDirectLink,
} from '../../utils/invoiceUtils';
import {
  OfficialInvoiceA4Document,
  InvoiceLayoutOption,
  OfficialInvoiceData,
} from '../invoices/OfficialInvoiceA4Document';

export interface InvoiceModalProps {
  invoice?: MonthlyInvoice | null;
  customData?: Partial<OfficialInvoiceData>;
  isOpen: boolean;
  onClose: () => void;
  onPayInvoice?: (invoice: MonthlyInvoice) => void;
  defaultLayoutOption?: InvoiceLayoutOption;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  customData,
  isOpen,
  onClose,
  onPayInvoice,
  defaultLayoutOption = 'with-coupon',
}) => {
  const { showToast, setIsNewPaymentModalOpen, setFamilyPaymentTargetParent, currentUser } = useApp();
  const [exporting, setExporting] = useState(false);
  const [copiedSMS, setCopiedSMS] = useState(false);
  const [layoutOption, setLayoutOption] = useState<InvoiceLayoutOption>(defaultLayoutOption);

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

  if (!isOpen || (!invoice && !customData)) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setExporting(true);
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
      const text = `CABINET MANI: Facture N° ${customData?.invoiceNumber || 'CAS'} de ${customData?.netDue?.toLocaleString() || 0} FCFA pour ${customData?.studentName}. Dépôt MyNita/Amana au +227 92 28 57 37.`;
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
      const message = `Bonjour M./Mme ${guardianName},\nVoici votre avis d'échéance de cours d'appuis CAS-MANI N° ${customData?.invoiceNumber} d'un montant de ${customData?.netDue?.toLocaleString()} FCFA.\nDépôt MyNita/Amana au +227 92 28 57 37.\nMerci pour votre confiance.`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* ============================================================== */}
        {/* TOP BAR / CONTROLS (MASQUÉ À L'IMPRESSION)                      */}
        {/* ============================================================== */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-850 px-4 sm:px-6 py-3 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs font-bold text-white">
                Facture Scolarité · <span className="font-mono text-indigo-300">{invoiceNumber}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">({monthLabel})</span>
            </div>
          </div>

          {/* SÉLECTEUR DES 2 OPTIONS D'ARCHITECTURE A4 (COUPON VS PLEINE PAGE) */}
          <div className="flex items-center rounded-xl bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setLayoutOption('with-coupon')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                layoutOption === 'with-coupon'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Page A4 structurée avec talon de caisse détachable et ligne de découpe"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Avec Talon Découpable</span>
              <span className="sm:hidden">Talon</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutOption('full-page')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                layoutOption === 'full-page'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Page A4 pleine page aérée sans souche de découpe"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pleine Page Aérée</span>
              <span className="sm:hidden">Pleine Page</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Send Button */}
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
              title="Ouvrir WhatsApp avec le message pré-rempli pour ce parent"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Envoyer WhatsApp</span>
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
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? 'Export...' : 'PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer</span>
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
        {/* CSS PRINT STRICT & PARFAITEMENT ÉTALONNÉ POUR A4 PORTRAIT     */}
        {/* ============================================================== */}
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
                #printable-invoice-modal-content {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                }
                .official-invoice-sheet {
                  height: 273mm !important;
                  max-height: 273mm !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                }
              }
            `,
          }}
        />

        {/* ============================================================== */}
        {/* APERÇU ÉCRAN RÉALISTE DU DOCUMENT A4                          */}
        {/* ============================================================== */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-950/60 flex justify-center printable-document">
          {/* Cadre Feuille Papier A4 Blanche avec Ombre Réaliste */}
          <div
            id="printable-invoice-modal-content"
            className="w-full max-w-[210mm] bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 print:p-0 border border-slate-200 print:border-none min-h-[260mm] print:min-h-0"
          >
            <OfficialInvoiceA4Document
              invoice={invoice}
              customData={customData}
              layoutOption={layoutOption}
              cashierName={currentUser?.fullName || 'Direction CAS-MANI'}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL FOOTER (MASQUÉ À L'IMPRESSION)                           */}
        {/* ============================================================== */}
        <div className="border-t border-slate-800 bg-slate-850 px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span>
              Net à payer :{' '}
              <strong className="text-emerald-400 font-mono text-sm">
                {netDue.toLocaleString()} FCFA
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
              <span>Imprimer la Facture</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
