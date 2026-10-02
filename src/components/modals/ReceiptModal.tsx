import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Calendar,
  FileText,
  Users,
  User,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatReceiptPaymentDate } from '../../utils/dateUtils';
import { numberToFrenchWords } from '../../utils/familyUtils';
import { CAB_APPUIS_LOGO } from '../../assets/logo';

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

  const studentEnrollmentDate = studentRecord?.enrollmentDate || '29/09/2026';

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

  const formattedPaymentDate = formatReceiptPaymentDate(selectedReceipt.paymentDate);
  const amountInWords = numberToFrenchWords(selectedReceipt.amount);

  const modalContent = (
    <div
      id="print-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:z-auto print:block animate-in fade-in duration-150"
    >
      <div className={`w-full ${isMulti ? 'max-w-2xl' : 'max-w-xl'} rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:overflow-visible`}>
        {/* Top bar controls (hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-white">
              {isMulti
                ? 'Aperçu du Reçu Groupé (Famille / Multi-Élèves) & Export PDF'
                : 'Aperçu du Reçu Officiel & Export PDF'}
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

        {/* Scoped print style for clean single-page A4 portrait */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait !important;
                  margin: 12mm !important;
                }
              }
            `,
          }}
        />

        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt"
          className="relative p-6 sm:p-8 print:p-4 bg-white text-slate-900 text-xs font-sans overflow-hidden single-page-doc print:max-h-[280mm] print:overflow-hidden print:flex print:flex-col print:justify-between"
        >
          {/* Subtle Authentic Security Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.05] print:opacity-[0.06]">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Filigrane Cabinet d'Appuis Scolaire MANI"
              className="w-80 h-80 print:w-72 print:h-72 object-contain filter grayscale"
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex justify-between items-start border-b-2 border-slate-900 pb-3 print:pb-2">
            <div className="flex items-start gap-3">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Logo Cabinet d'Appuis Scolaire MANI"
                className="w-14 h-14 print:w-12 print:h-12 rounded-xl object-contain border border-slate-200 shadow-sm shrink-0 bg-white p-0.5 print:border-slate-400"
              />
              <div>
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-900 text-white font-black text-xs px-2 py-0.5 rounded shadow-sm tracking-wide">
                    CAS-MANI
                  </div>
                  <span className="text-[9.5px] print:text-[8.5px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Agrément & Enregistrement Officiel
                  </span>
                </div>

                <h1 className="text-sm print:text-xs font-black tracking-tight uppercase text-slate-950 mt-0.5">
                  Cabinet d'Appuis Scolaire MANI
                </h1>
                <p className="text-[10px] print:text-[9px] font-bold text-indigo-950">
                  {isMulti
                    ? 'Quittance Officielle de Paiement Groupé · Fratrie & Famille'
                    : "Encadrement Pédagogique, Cours d'Appuis & Prépa Concours"}
                </p>

                <div className="mt-0.5 text-[9px] print:text-[8px] text-slate-700 space-y-0.5">
                  <p className="font-medium">
                    📍 <span className="font-semibold">Adresse :</span> Quartier Niamey 2000, Niamey (République du Niger)
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 text-[8.5px] print:text-[8px] font-semibold text-slate-900">
                    <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                      NIF : <span className="font-mono font-bold text-indigo-900">153633/P</span>
                    </span>
                    <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
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
              <span className="inline-block bg-slate-100 text-slate-900 border-2 border-slate-900 font-mono font-extrabold text-[11px] print:text-[10px] px-2.5 py-0.5 rounded shadow-sm">
                REÇU N° {selectedReceipt.receiptNumber}
              </span>
              <p className="text-[10px] print:text-[9px] text-slate-700 mt-1 font-medium flex items-center justify-end gap-1">
                <Calendar className="h-3 w-3 text-indigo-700" />
                <span>
                  Date de Paiement : <span className="font-bold text-slate-900">{formattedPaymentDate}</span>
                </span>
              </p>
              <p className="text-[8.5px] print:text-[8px] text-slate-500 font-mono">
                Site : Niamey 2000 · Année Scolaire 2026/2027
              </p>
              {isMulti && (
                <span className="inline-block mt-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[9px] print:text-[8px] px-1.5 py-0.2 rounded uppercase">
                  Reçu Groupé Famille
                </span>
              )}
            </div>
          </div>

          {/* Beneficiary Details Box */}
          <div className="grid grid-cols-2 gap-3 my-2.5 print:my-1.5 bg-slate-50 p-2.5 print:p-2 rounded-lg border border-slate-200 text-xs print:text-[10px]">
            <div>
              {isMulti ? (
                <>
                  <span className="text-[9.5px] print:text-[8.5px] font-bold uppercase text-purple-900 block flex items-center gap-1">
                    <Users className="h-3 w-3 text-purple-700" />
                    <span>Tuteur Légal / Famille Payeuse :</span>
                  </span>
                  <span className="text-xs print:text-[11px] font-bold text-slate-950 block mt-0.5">
                    {selectedReceipt.guardianName || selectedReceipt.studentName}
                  </span>
                  {selectedReceipt.guardianPhone && (
                    <span className="text-[10.5px] print:text-[9.5px] text-slate-700 font-mono block mt-0.5 flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      <span>{selectedReceipt.guardianPhone}</span>
                    </span>
                  )}
                  <span className="text-[10px] print:text-[9px] text-slate-600 block mt-0.5">
                    Règlement groupé couvrant :{' '}
                    <strong className="text-indigo-900">
                      {selectedReceipt.studentBreakdown?.length || 2} enfants inscrits
                    </strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9.5px] print:text-[8.5px] font-bold uppercase text-slate-500 block">
                    Bénéficiaire / Élève :
                  </span>
                  <span className="text-xs print:text-[11px] font-bold text-slate-900 block mt-0.5">
                    {selectedReceipt.studentName}
                  </span>
                  <span className="text-[10.5px] print:text-[9.5px] text-slate-600 block mt-0.5">
                    Catégorie : <span className="font-semibold text-slate-800">{selectedReceipt.category}</span>
                  </span>
                  <span className="text-[10px] print:text-[9px] text-slate-600 block mt-0.5 font-medium">
                    Date d'inscription : <span className="font-bold text-slate-900">{studentEnrollmentDate}</span>
                  </span>
                </>
              )}
            </div>

            <div className="text-right flex flex-col items-end justify-between">
              <div>
                <span className="text-[9.5px] print:text-[8.5px] font-bold uppercase text-slate-500 block">
                  Mode de Règlement :
                </span>
                <span className="text-[11px] print:text-[10px] font-bold text-slate-900 inline-block mt-0.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {selectedReceipt.paymentMethod}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedReceipt.agentAvatar && (
                  <img
                    src={selectedReceipt.agentAvatar}
                    alt={selectedReceipt.agentName}
                    className="h-4 w-4 rounded-full object-cover ring-1 ring-slate-300"
                  />
                )}
                <span className="text-[10px] print:text-[9px] text-slate-600">
                  Caissier : <span className="font-semibold text-slate-800">{selectedReceipt.cashierName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          {isMulti && selectedReceipt.studentBreakdown && selectedReceipt.studentBreakdown.length > 0 ? (
            /* Multi-student family breakdown table */
            <table className="w-full text-left my-2 print:my-1.5 border border-slate-200 rounded text-[11px] print:text-[9.5px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10px] print:text-[9px]">
                  <th className="py-1.5 print:py-1 px-2 w-6 text-center">N°</th>
                  <th className="py-1.5 print:py-1 px-2.5">Élève Bénéficiaire (Fratrie)</th>
                  <th className="py-1.5 print:py-1 px-2">Classe / Niveau</th>
                  <th className="py-1.5 print:py-1 px-2">Désignation / Objet</th>
                  <th className="py-1.5 print:py-1 px-2.5 text-right font-bold">Montant Encaissé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {selectedReceipt.studentBreakdown.map((item, idx) => (
                  <tr key={item.studentId || idx} className="hover:bg-slate-50/50">
                    <td className="py-1.5 print:py-1 px-2 text-center font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 print:py-1 px-2.5">
                      <span className="font-bold text-slate-950 block">{item.studentName}</span>
                      {item.studentMatricule && (
                        <span className="text-[9.5px] print:text-[8.5px] text-slate-500 font-mono">{item.studentMatricule}</span>
                      )}
                    </td>
                    <td className="py-1.5 print:py-1 px-2">
                      <span className="font-semibold text-slate-800">{item.level}</span>
                    </td>
                    <td className="py-1.5 print:py-1 px-2">
                      <span className="text-[10px] print:text-[9px] text-slate-700 block">
                        {item.category || 'Scolarité Mensuelle'}
                      </span>
                      {item.notes && (
                        <span className="text-[9px] print:text-[8px] text-slate-500 italic block">{item.notes}</span>
                      )}
                    </td>
                    <td className="py-1.5 print:py-1 px-2.5 text-right font-mono font-bold text-slate-950">
                      {item.amount.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-50">
                  <td colSpan={4} className="py-1.5 print:py-1 px-2.5 font-bold text-right text-[10px] print:text-[9px] text-slate-900 uppercase">
                    TOTAL GÉNÉRAL ENCAISSÉ :
                  </td>
                  <td className="py-1.5 print:py-1 px-2.5 font-mono font-black text-right text-xs print:text-[11px] text-indigo-950">
                    {selectedReceipt.amount.toLocaleString()} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* Standard single-student table */
            <table className="w-full text-left my-2 print:my-1.5 border border-slate-200 rounded text-[11px] print:text-[9.5px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10px] print:text-[9px]">
                  <th className="py-1.5 print:py-1 px-3 font-semibold">Désignation de la prestation</th>
                  <th className="py-1.5 print:py-1 px-3 font-semibold text-center w-20">Quantité</th>
                  <th className="py-1.5 print:py-1 px-3 font-semibold text-right w-36">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="py-2 print:py-1.5 px-3">
                    <span className="font-semibold block">{selectedReceipt.category}</span>
                    <span className="text-[10px] print:text-[9px] text-slate-500">
                      {selectedReceipt.notes || "Prestation pédagogique, encadrement académique et cours d'appuis"}
                    </span>
                  </td>
                  <td className="py-2 print:py-1.5 px-3 text-center font-mono">1</td>
                  <td className="py-2 print:py-1.5 px-3 text-right font-mono font-bold">
                    {selectedReceipt.amount.toLocaleString()} FCFA
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-50">
                  <td colSpan={2} className="py-1.5 print:py-1 px-3 font-bold text-right text-[10px] print:text-[9px] text-slate-900 uppercase">
                    TOTAL ENCAISSÉ :
                  </td>
                  <td className="py-1.5 print:py-1 px-3 font-mono font-extrabold text-right text-xs print:text-[11px] text-indigo-950">
                    {selectedReceipt.amount.toLocaleString()} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Amount in French Words (Administrative Requirement) */}
          <div className="my-2 print:my-1 p-2 print:p-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] print:text-[9px] text-slate-800">
            <span>Arrêté la présente quittance à la somme totale de : </span>
            <strong className="text-indigo-950 uppercase">{amountInWords} Francs CFA</strong>.
          </div>

          {/* Legal references strip */}
          <div className="bg-slate-50 border border-slate-200 rounded p-1.5 print:p-1 text-[8.5px] print:text-[8px] text-slate-600 flex justify-between items-center">
            <span>Cabinet d'Appuis Scolaire MANI · Quartier Niamey 2000</span>
            <span className="font-mono">NIF: 153633/P | RCCM: NE-NIM-A10-05126</span>
            <span className="font-semibold text-slate-800">Quittance réglée le {formattedPaymentDate}</span>
          </div>

          {/* Security & Stamp Section */}
          <div className="mt-2.5 print:mt-1.5 flex justify-between items-end border-t border-slate-200 pt-2 print:pt-1">
            <div className="max-w-xs">
              <div className="flex items-center gap-1 text-[10px] print:text-[9px] font-semibold text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Certification d'Authenticité</span>
              </div>
              <p className="text-[8.5px] print:text-[8px] text-slate-500 mt-0.5 leading-tight">
                {selectedReceipt.syncStatus === 'synced'
                  ? `Reçu officiel validé le ${formattedPaymentDate} et archivé sur le serveur Cloud CAS MANI.`
                  : `Écriture certifiée en caisse le ${formattedPaymentDate}. Enregistrement conforme.`}
              </p>
              <div className="mt-0.5 text-[8px] print:text-[7.5px] font-mono text-slate-400">
                CERT-ID: CAS-MANI-{selectedReceipt.receiptNumber}-N2000
              </div>
            </div>

            {/* Official Stamp with logo */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 border-2 border-indigo-900 text-indigo-900 rounded-lg p-1.5 text-center uppercase tracking-wider font-bold text-[8px] rotate-[-1deg] opacity-95 shadow-sm bg-indigo-50/50">
                <img
                  src={CAB_APPUIS_LOGO}
                  alt="Sceau Officiel"
                  className="w-8 h-8 rounded-full object-contain shrink-0 border border-indigo-900 bg-white"
                />
                <div className="text-left">
                  <div className="font-extrabold text-[8.5px] text-indigo-950">CABINET D'APPUIS SCOLAIRE MANI</div>
                  <div className="text-[9px] text-emerald-700 font-black">
                    ✓ ENCAISSÉ LE {formattedPaymentDate.split(' à ')[0]}
                  </div>
                  <div className="text-[7.5px] text-slate-700 font-mono">NIF: 153633/P · RCCM: NE-NIM-A10-05126</div>
                  <div className="text-[7px] text-slate-600">CENTRE PÉDAGOGIQUE NIAMEY 2000</div>
                </div>
              </div>
              <span className="text-[8px] text-slate-500 mt-0.5">Visa & Cachet Officiel de la Caisse</span>
            </div>
          </div>
        </div>

        {/* Modal footer (hidden in print) */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400 print:hidden">
          <span className="text-[11px] text-slate-400">
            {isMulti
              ? `Reçu groupé certifié (${selectedReceipt.studentBreakdown?.length || 2} enfants)`
              : 'Reçu officiel certifié'} · Prêt pour PDF ou Impression
          </span>
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

  return createPortal(modalContent, document.body);
};
