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
  Send,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MonthlyInvoice } from '../../types';
import { numberToFrenchWords } from '../../utils/familyUtils';
import { formatSessionHours, calculateWeeklyHours } from '../../utils/dateUtils';
import {
  generateWhatsAppInvoiceMessage,
  generateSMSInvoiceMessage,
  getWhatsAppDirectLink,
} from '../../utils/invoiceUtils';
import { CAB_APPUIS_LOGO } from '../../assets/logo';

interface InvoiceModalProps {
  invoice: MonthlyInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  onPayInvoice?: (invoice: MonthlyInvoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPayInvoice,
}) => {
  const { showToast, setIsNewPaymentModalOpen, setFamilyPaymentTargetParent } = useApp();
  const [exporting, setExporting] = useState(false);
  const [copiedSMS, setCopiedSMS] = useState(false);

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

  if (!isOpen || !invoice) return null;

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
    const text = generateSMSInvoiceMessage(invoice);
    navigator.clipboard.writeText(text);
    setCopiedSMS(true);
    showToast('Texte SMS de la facture copié dans le presse-papiers !', 'success');
    setTimeout(() => setCopiedSMS(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const message = generateWhatsAppInvoiceMessage(invoice);
    const link = getWhatsAppDirectLink(invoice.guardianPhone, message);
    window.open(link, '_blank');
    showToast(`Ouverture de WhatsApp pour ${invoice.guardianName}...`, 'info');
  };

  const handleProceedPayment = () => {
    if (invoice.isFamilyInvoice) {
      setFamilyPaymentTargetParent({
        guardianName: invoice.guardianName,
        guardianPhone: invoice.guardianPhone,
        studentIds: invoice.studentItems.map((s) => s.studentId),
      });
    }
    setIsNewPaymentModalOpen(true);
    onClose();
  };

  const amountInWords = numberToFrenchWords(invoice.netDue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top bar controls (hidden in print) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-3.5 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white">
              Facture Scolarité · <span className="font-mono text-indigo-300">{invoice.invoiceNumber}</span> ({invoice.monthLabel})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Send Button */}
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
              title="Ouvrir WhatsApp avec le message pré-rempli pour ce parent"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Envoyer WhatsApp</span>
            </button>

            {/* Copy SMS Button */}
            <button
              onClick={handleCopySMS}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copier le message SMS au format court"
            >
              {copiedSMS ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSMS ? 'Copié !' : 'Copier SMS'}</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? 'Génération...' : 'PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors shadow cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans relative printable-document">
          {/* Subtle Security Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.06] print:opacity-[0.08]">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Filigrane Cabinet d'Appuis Scolaire MANI"
              className="w-96 h-96 object-contain filter grayscale"
            />
          </div>

          {/* Official Document Header */}
          <div className="relative z-10 flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div className="flex items-start gap-3.5">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Logo Cabinet d'Appuis Scolaire MANI"
                className="w-16 h-16 rounded-xl object-contain border border-slate-200 shadow-sm shrink-0 bg-white p-0.5 print:border-slate-400"
              />
              <div>
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-900 text-white font-black text-sm px-2.5 py-0.5 rounded shadow-sm tracking-wide">
                    CAS-MANI
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Agrément & Enregistrement Officiel
                  </span>
                </div>

                <h1 className="text-base font-black tracking-tight uppercase text-slate-950 mt-1">
                  Cabinet d'Appuis Scolaire MANI
                </h1>
                <p className="text-[11px] font-bold text-indigo-950">
                  Encadrement Pédagogique, Cours d'Appuis & Prépa Concours
                </p>

                <div className="mt-1 text-[9.5px] text-slate-700 space-y-0.5">
                  <p className="font-medium">
                    📍 <span className="font-semibold">Adresse :</span> Quartier Niamey 2000, Niamey (République du Niger)
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 text-[9.5px] font-semibold text-slate-900">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      NIF : <span className="font-mono font-bold text-indigo-900">153633/P</span>
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      RCCM : <span className="font-mono font-bold text-indigo-900">NE-NIM-A10-05126</span>
                    </span>
                    <span className="text-slate-800">
                      📞 <span className="font-mono font-bold">+227 91 58 44 59 / 96 16 51 81</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block bg-slate-900 text-white font-mono font-extrabold text-xs px-3 py-1 rounded shadow-sm">
                FACTURE N° {invoice.invoiceNumber}
              </span>
              <div className="text-[11px] text-slate-800 mt-1.5 font-bold uppercase tracking-wide">
                AVIS D'ÉCHÉANCE MENSUEL
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Période : <strong className="text-indigo-950 font-bold">{invoice.monthLabel}</strong>
              </p>
              <div className="mt-1.5 inline-block bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-[10px] text-rose-900 font-bold">
                ⏰ Échéance : {invoice.dueDate}
              </div>
            </div>
          </div>

          {/* Client / Guardian Box */}
          <div className="grid grid-cols-2 gap-4 my-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-900 block flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-indigo-700" />
                <span>Facturé à / Tuteur Légal :</span>
              </span>
              <span className="text-sm font-bold text-slate-950 block mt-0.5">
                {invoice.guardianName}
              </span>
              {invoice.guardianPhone && (
                <span className="text-[11px] text-slate-700 font-mono block mt-0.5 flex items-center gap-1">
                  <Phone className="h-2.5 w-2.5" />
                  <span>{invoice.guardianPhone}</span>
                </span>
              )}
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Niamey (République du Niger)
              </span>
            </div>

            <div className="text-right flex flex-col items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Date d'Émission :
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {invoice.issueDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Statut du Règlement :
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10.5px] font-bold uppercase mt-0.5 ${
                    invoice.status === 'Payée'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : invoice.status === 'Partielle'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : invoice.status === 'En retard'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <table className="w-full text-left my-4 border border-slate-200 rounded">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10.5px]">
                <th className="py-2 px-2.5 w-7 text-center">N°</th>
                <th className="py-2 px-3">Élève & Matricule</th>
                <th className="py-2 px-3">Classe / Cycle</th>
                <th className="py-2 px-3">Encadrement & Matières</th>
                <th className="py-2 px-3 text-right">Mensualité</th>
                <th className="py-2 px-3 text-right">Déjà Versé</th>
                <th className="py-2 px-3 text-right">Net à Payer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
              {invoice.studentItems.map((item, idx) => {
                const weeklyHours = calculateWeeklyHours(item.sessionsPerWeek || 3);
                return (
                  <tr key={item.studentId || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 font-bold text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-950 block">{item.studentName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.studentMatricule}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800 block">{item.level}</span>
                      <span className="text-[10px] text-slate-500">{item.stream}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] text-indigo-950 font-semibold block">
                        {item.sessionsPerWeek || 3} séa./sem. ({formatSessionHours(weeklyHours)})
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[170px]">
                        {item.subjects.join(', ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {item.monthlyFee.toLocaleString()} FCFA
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      {item.paidAmount > 0 ? `${item.paidAmount.toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                      {item.balanceRemaining.toLocaleString()} FCFA
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 text-slate-900 font-bold">
                <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-xs">
                  TOTAL GÉNÉRAL À RECOUVRER :
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-800">
                  {invoice.totalMonthlyFee.toLocaleString()} FCFA
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-emerald-700">
                  {invoice.totalPaid > 0 ? `${invoice.totalPaid.toLocaleString()} FCFA` : '0 FCFA'}
                </td>
                <td className="py-2.5 px-3 font-mono font-black text-right text-sm text-indigo-950">
                  {invoice.netDue.toLocaleString()} FCFA
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in French Words */}
          <div className="my-3 p-3 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-800">
            <span>Arrêtée la présente facture à la somme nette à payer de : </span>
            <strong className="text-indigo-950 uppercase">{amountInWords} Francs CFA</strong>.
          </div>

          {/* Authorized Payment Channels Strip */}
          <div className="my-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-[10px] text-slate-700 space-y-1">
            <div className="font-bold text-indigo-950 text-[11px] flex items-center gap-1 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-indigo-700" />
              <span>Modalités & Coordonnées de Paiement Agréées (Niger) :</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                • <strong>Dépôt MyNita :</strong> <span className="font-mono font-bold text-indigo-900 text-xs">+227 92 28 57 37</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                • <strong>Dépôt Amana Transfert :</strong> <span className="font-mono font-bold text-indigo-900 text-xs">+227 92 28 57 37</span>
              </div>
              <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                • <strong>Guichet Caisse :</strong> Siège Cabinet MANI (Niamey 2000)
              </div>
              <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                • <strong>Contact Caisse / Support :</strong> <span className="font-mono font-semibold">+227 92 28 57 37</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 italic mt-1 pt-1 border-t border-indigo-100">
              * Veuillez mentionner le numéro de facture ({invoice.invoiceNumber}) ou le nom de l'élève lors de votre dépôt MyNita / Amana (+227 92285737) pour validation instantanée de votre quittance officielle.
            </p>
          </div>

          {/* Legal references & Certification */}
          <div className="mt-4 flex justify-between items-end border-t border-slate-200 pt-3">
            <div className="max-w-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-indigo-700" />
                <span>Engagement Pédagogique & Continuité</span>
              </div>
              <p className="text-[9.5px] text-slate-500 mt-1 leading-tight">
                Le règlement ponctuel des frais d'encadrement garantit la continuité des plannings de cours, la rémunération des encadreurs et le suivi pédagogique personnalisé de vos enfants.
              </p>
              <div className="mt-1 text-[8.5px] font-mono text-slate-400">
                RÉF-FACT: CAS-MANI-{invoice.invoiceNumber}-N2000
              </div>
            </div>

            {/* Official Stamp */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 border-2 border-indigo-900 text-indigo-900 rounded-lg p-2 text-center uppercase tracking-wider font-bold text-[8.5px] rotate-[-2deg] opacity-95 shadow-sm bg-indigo-50/50">
                <img
                  src={CAB_APPUIS_LOGO}
                  alt="Sceau Officiel"
                  className="w-10 h-10 rounded-full object-contain shrink-0 border border-indigo-900 bg-white"
                />
                <div className="text-left">
                  <div className="font-extrabold text-[9px] text-indigo-950">CABINET D'APPUIS SCOLAIRE MANI</div>
                  <div className="text-[10px] text-indigo-900 font-black">
                    SERVICE DE COMPTABILITÉ & RECOUVREMENT
                  </div>
                  <div className="text-[8px] text-slate-700 font-mono">NIF: 153633/P · RCCM: NE-NIM-A10-05126</div>
                  <div className="text-[7.5px] text-slate-600">CENTRE PÉDAGOGIQUE NIAMEY 2000</div>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 mt-1">Visa & Cachet Officiel du Cabinet</span>
            </div>
          </div>
        </div>

        {/* Modal footer (hidden in print) */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span>
              Net à payer : <strong className="text-emerald-400 font-mono text-sm">{invoice.netDue.toLocaleString()} FCFA</strong>
            </span>
            {invoice.netDue > 0 && (
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
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
