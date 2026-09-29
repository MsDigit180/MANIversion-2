import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle2, Clock, ShieldCheck, Download, Calendar, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatReceiptPaymentDate } from '../../utils/dateUtils';

export const ReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt, students } = useApp();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReceipt(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedReceipt]);

  if (!selectedReceipt) return null;

  const studentRecord = students.find(
    (s) => s.id === selectedReceipt.studentId || selectedReceipt.studentName.toLowerCase().includes(s.fullName.toLowerCase())
  );
  const studentEnrollmentDate = studentRecord?.enrollmentDate || '29/09/2026';

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setExporting(true);
    // Trigger window.print() which allows direct "Save as PDF" in all modern browsers
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  };

  const formattedPaymentDate = formatReceiptPaymentDate(selectedReceipt.paymentDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Top bar controls (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white">
              Aperçu du Reçu Officiel & Export PDF
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? 'Génération...' : 'Exporter PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-8 bg-white text-slate-900 text-xs font-sans">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-900 text-white font-extrabold text-base px-2.5 py-1 rounded shadow-sm">
                  CAS-MANI
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight uppercase text-slate-900">
                    Cabinet d'Appuis Scolaire MANI
                  </h1>
                  <p className="text-[11px] font-semibold text-indigo-900">
                    Encadrement Pédagogique, Cours d'Appuis & Prépa Concours
                  </p>
                </div>
              </div>
              
              <div className="mt-2.5 text-[10px] text-slate-700 space-y-0.5">
                <p className="font-medium">
                  📍 <span className="font-semibold">Adresse :</span> Quartier Niamey 2000, Niamey (République du Niger)
                </p>
                <div className="flex flex-wrap items-center gap-x-3 text-[10px] font-semibold text-slate-900">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    NIF : <span className="font-mono font-bold text-indigo-900">153633/P</span>
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    RCCM : <span className="font-mono font-bold text-indigo-900">NE-NIM-A10-05126</span>
                  </span>
                  <span className="text-slate-800">📞 <span className="font-mono font-bold">+227 91 58 44 59 / 96 16 51 81</span></span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block bg-slate-100 text-slate-900 border-2 border-slate-900 font-mono font-bold text-xs px-3 py-1 rounded shadow-sm">
                REÇU N° {selectedReceipt.receiptNumber}
              </span>
              <p className="text-[10.5px] text-slate-700 mt-1.5 font-medium flex items-center justify-end gap-1">
                <Calendar className="h-3 w-3 text-indigo-700" />
                <span>Date de Paiement : <span className="font-bold text-slate-900">{formattedPaymentDate}</span></span>
              </p>
              <p className="text-[9px] text-slate-500 font-mono">
                Site : Niamey 2000
              </p>
            </div>
          </div>

          {/* Beneficiary details */}
          <div className="grid grid-cols-2 gap-4 my-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Bénéficiaire / Élève :
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {selectedReceipt.studentName}
              </span>
              <span className="text-[11px] text-slate-600 block mt-0.5">
                Catégorie : <span className="font-semibold text-slate-800">{selectedReceipt.category}</span>
              </span>
              <span className="text-[10.5px] text-slate-600 block mt-0.5 font-medium">
                Date d'inscription initiale : <span className="font-bold text-slate-900">{studentEnrollmentDate}</span>
              </span>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Mode de Règlement :
              </span>
              <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                {selectedReceipt.paymentMethod}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedReceipt.agentAvatar && (
                  <img
                    src={selectedReceipt.agentAvatar}
                    alt={selectedReceipt.agentName}
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-300"
                  />
                )}
                <span className="text-[11px] text-slate-600">
                  Caissier : <span className="font-semibold text-slate-800">{selectedReceipt.cashierName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <table className="w-full text-left my-4 border border-slate-200 rounded">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px]">
                <th className="py-2 px-3 font-semibold">Désignation de la prestation</th>
                <th className="py-2 px-3 font-semibold text-center">Quantité</th>
                <th className="py-2 px-3 font-semibold text-right">Montant Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
              <tr>
                <td className="py-2.5 px-3">
                  <span className="font-semibold block">{selectedReceipt.category}</span>
                  <span className="text-[11px] text-slate-500">
                    {selectedReceipt.notes || "Prestation pédagogique, encadrement académique et cours d'appuis"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">1</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">
                  {selectedReceipt.amount.toLocaleString()} FCFA
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50">
                <td colSpan={2} className="py-2 px-3 font-bold text-right text-xs text-slate-900 uppercase">
                  TOTAL ENCAISSÉ :
                </td>
                <td className="py-2 px-3 font-mono font-extrabold text-right text-sm text-indigo-950">
                  {selectedReceipt.amount.toLocaleString()} FCFA
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Legal references strip */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[9px] text-slate-600 flex justify-between items-center">
            <span>Cabinet d'Appuis Scolaire MANI · Niamey 2000</span>
            <span className="font-mono">NIF: 153633/P | RCCM: NE-NIM-A10-05126</span>
            <span className="font-semibold text-slate-800">Quittance réglée le {formattedPaymentDate}</span>
          </div>

          {/* Security & Stamp Section */}
          <div className="mt-6 flex justify-between items-end border-t border-slate-200 pt-4">
            <div className="max-w-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Certification d'Authenticité</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                {selectedReceipt.syncStatus === 'synced'
                  ? `Reçu officiel validé le ${formattedPaymentDate} et archivé sur le serveur central Cloud du Cabinet d'Appuis Scolaire MANI.`
                  : `Écriture certifiée en caisse le ${formattedPaymentDate}. Enregistrement central conforme.`}
              </p>
              <div className="mt-1.5 text-[9px] font-mono text-slate-400">
                CERT-ID: CAS-MANI-{selectedReceipt.receiptNumber}-N2000
              </div>
            </div>

            {/* Official Stamp */}
            <div className="flex flex-col items-center">
              <div className="border-2 border-indigo-900 text-indigo-900 rounded-lg p-2 text-center uppercase tracking-wider font-bold text-[8.5px] rotate-[-3deg] opacity-90 shadow-sm bg-indigo-50/40">
                <div className="font-extrabold">CABINET D'APPUIS SCOLAIRE MANI</div>
                <div className="text-[10px] text-emerald-700 font-black">✓ ENCAISSÉ LE {formattedPaymentDate.split(' à ')[0]}</div>
                <div className="text-[8px] text-slate-700 font-mono">NIF: 153633/P · RCCM: NE-NIM-A10-05126</div>
                <div className="text-[7.5px] text-slate-500">QUARTIER NIAMEY 2000</div>
              </div>
              <span className="text-[9px] text-slate-500 mt-1">Visa & Cachet de la caisse</span>
            </div>
          </div>
        </div>

        {/* Modal footer (hidden in print) */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <span className="text-[11px] text-slate-400">Reçu officiel certifié · Prêt pour PDF ou Impression</span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Annuler / Fermer (Échap)
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Génération...' : 'Exporter en PDF'}</span>
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
