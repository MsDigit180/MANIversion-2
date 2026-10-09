import React from 'react';
import {
  Users,
  User,
  Phone,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Scissors,
  MapPin,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { PaymentReceipt, Student } from '../../types';
import { numberToFrenchWords } from '../../utils/familyUtils';
import { formatReceiptPaymentDate } from '../../utils/dateUtils';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';

export interface OfficialReceiptA4DocumentProps {
  receipt: PaymentReceipt;
  student?: Student | null;
  className?: string;
}

export const OfficialReceiptA4Document: React.FC<OfficialReceiptA4DocumentProps> = ({
  receipt,
  student,
  className = '',
}) => {
  const isMulti =
    receipt.isMultiStudent ||
    (receipt.studentBreakdown && receipt.studentBreakdown.length > 1);

  const formattedPaymentDate = formatReceiptPaymentDate(receipt.paymentDate);
  const amountInWords = numberToFrenchWords(receipt.amount).toUpperCase();
  const studentEnrollmentDate = student?.enrollmentDate || '29/09/2026';
  const studentLevel = student?.level || 'Secondaire';
  const studentStream = student?.stream || 'Enseignement Général';
  const studentMatricule = student?.matricule || 'CAS-2026-0042';

  return (
    <div
      className={`official-receipt-sheet w-[210mm] h-[297mm] max-h-[297mm] p-[10mm] mx-auto flex flex-col justify-between box-border bg-white text-gray-900 font-sans relative overflow-hidden select-text ${className}`}
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        pageBreakAfter: 'avoid',
        breakAfter: 'avoid',
      }}
    >
      {/* Filigrane de sécurité discret en arrière-plan */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.03] print:opacity-[0.035]">
        <img
          src={CAB_APPUIS_LOGO}
          alt="Filigrane CAS-MANI"
          className="w-[105mm] h-[105mm] object-contain filter grayscale"
        />
      </div>

      {/* ==================================================================== */}
      {/* BLOC 1 : EN-TÊTE NOBLE (Branding & Cartouche Reçu Officiel)          */}
      {/* ==================================================================== */}
      <div className="relative z-10 border-b-2 border-slate-900 pb-2.5 flex justify-between items-start gap-3 shrink-0">
        {/* Branding Officiel Gauche */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Logo CAS-MANI"
              className="w-13 h-13 rounded-lg object-contain border border-slate-200 p-0.5 bg-white shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-indigo-950 text-white font-black text-[10px] px-1.5 py-0.2 rounded tracking-wider">
                {CAB_APPUIS_INFO.acronym}
              </span>
            </div>

            <h1 className="text-[13.5px] font-black tracking-tight uppercase text-slate-950 mt-0.5 leading-tight">
              {CAB_APPUIS_INFO.name}
            </h1>

            <p className="text-[9px] font-bold text-indigo-950 leading-tight">
              {isMulti
                ? 'Quittance Officielle de Paiement Groupé · Fratrie & Famille'
                : 'Quittance Officielle de Paiement & Récépissé Libératoire'}
            </p>

            <div className="mt-0.5 text-[8.5px] text-slate-700 space-y-0.2">
              <p className="flex items-center gap-1 font-medium">
                <MapPin className="h-2.5 w-2.5 text-slate-500 shrink-0 inline" />
                <span>Siège Central : <strong className="text-slate-900">{CAB_APPUIS_INFO.address}</strong></span>
              </p>
              <div className="flex flex-wrap items-center gap-x-2 text-[8px] text-slate-800 font-medium">
                <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                  NIF : <strong className="font-mono text-indigo-950 font-bold">{CAB_APPUIS_INFO.nif}</strong>
                </span>
                <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                  RCCM : <strong className="font-mono text-indigo-950 font-bold">{CAB_APPUIS_INFO.rccm}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-2 w-2 text-slate-500 inline" />
                  <span className="font-mono font-semibold">+227 91 58 44 59 / 96 16 51 81</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cartouche Reçu Droite */}
        <div className="text-right shrink-0 flex flex-col items-end">
          <div className="bg-emerald-950 text-white font-mono font-black text-[11px] px-2.5 py-0.5 rounded shadow-2xs tracking-wider">
            REÇU N° {receipt.receiptNumber}
          </div>

          <div className="mt-1 text-[10px] font-black text-emerald-950 uppercase tracking-wide">
            QUITTANCE DE PAIEMENT
          </div>

          <p className="text-[9px] text-slate-600 flex items-center justify-end gap-1 mt-0.5">
            <Calendar className="h-3 w-3 text-indigo-700 inline" />
            <span>
              Date de règlement : <strong className="text-slate-900">{formattedPaymentDate}</strong>
            </span>
          </p>

          <div className="mt-0.5 text-[8.5px] text-slate-600 space-y-0.2">
            <div>Mode : <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">{receipt.paymentMethod}</strong></div>
            <div className="text-[8px] text-slate-500 font-mono">
              Site : Niamey 2000 · Année 2026/2027
            </div>
          </div>

          {/* Badge Statut Encaissé */}
          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.2 rounded text-[8.5px] font-extrabold uppercase border bg-emerald-50 text-emerald-800 border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>ENCAISSÉ & VALIDÉ EN CAISSE</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 2 : GRILLE À 2 COLONNES (Élève & Tuteur Payeur)                 */}
      {/* ==================================================================== */}
      <div className="relative z-10 grid grid-cols-2 gap-3 shrink-0">
        {/* Carte Élève Bénéficiaire */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-0.5 mb-1">
              <User className="h-3 w-3 text-indigo-700" />
              <span>BÉNÉFICIAIRE / ÉLÈVE</span>
            </div>

            {isMulti && receipt.studentBreakdown && receipt.studentBreakdown.length > 0 ? (
              <div>
                <p className="text-[11px] font-black text-purple-950">
                  Règlement Groupé Famille ({(receipt.studentBreakdown || []).length} Élèves Couverts)
                </p>
                <p className="text-[8.5px] text-slate-600 mt-0.2 line-clamp-2">
                  {(receipt.studentBreakdown || []).map((s) => `${s?.studentName || 'Élève'} (${s?.level || '-'})`).join(' · ')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[12px] font-black text-slate-950 leading-tight">
                  {receipt.studentName}
                </p>
                <div className="mt-0.5 grid grid-cols-2 gap-x-2 text-[9px] text-slate-700">
                  <div>
                    Matricule : <strong className="font-mono text-slate-950">{studentMatricule}</strong>
                  </div>
                  <div>
                    Classe/Niveau : <strong className="text-slate-950">{studentLevel}</strong>
                  </div>
                  <div>
                    Catégorie : <strong className="text-slate-900">{receipt.category}</strong>
                  </div>
                  <div>
                    Inscription : <strong className="text-indigo-950">{studentEnrollmentDate}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-1 pt-0.5 border-t border-slate-200 text-[7.5px] text-slate-500 flex justify-between">
            <span>Dossier Pédagogique Conforme</span>
            <span>Site d'Encadrement Niamey 2000</span>
          </div>
        </div>

        {/* Carte Tuteur Légal & Caissier */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-0.5 mb-1">
              <Users className="h-3 w-3 text-indigo-700" />
              <span>PAYEUR / TUTEUR LÉGAL</span>
            </div>
            <p className="text-[12px] font-black text-slate-950 leading-tight">
              {receipt.guardianName || receipt.studentName}
            </p>
            <div className="mt-0.5 text-[9px] text-slate-700 space-y-0.2">
              <p className="flex items-center gap-1 font-mono">
                <Phone className="h-2.5 w-2.5 text-slate-500" />
                <span>{receipt.guardianPhone || '+227 96 16 51 81'}</span>
              </p>
              <p className="text-[8.5px] text-slate-600">
                📍 Quartier Niamey 2000, Niamey (Niger)
              </p>
            </div>
          </div>
          <div className="mt-1 pt-0.5 border-t border-slate-200 text-[7.5px] text-slate-500 flex justify-between items-center">
            <span>Agent Caissier : <strong>{receipt.cashierName}</strong></span>
            <span className="font-mono">RÉF-PAIEMENT: {receipt.id}</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 3 : TABLEAU FINANCIER STRUCTURÉ (table-fixed)                   */}
      {/* ==================================================================== */}
      <div className="relative z-10 overflow-hidden rounded-lg border border-gray-300 shadow-2xs shrink-0">
        {isMulti && receipt.studentBreakdown && receipt.studentBreakdown.length > 0 ? (
          /* Tableau Multi-Élèves Fratrie */
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-gray-300 text-slate-800 text-[9.5px] font-bold uppercase tracking-wider">
                <th className="w-[6%] py-2 px-2 text-center">N°</th>
                <th className="w-[32%] py-2 px-2.5">Élève Bénéficiaire (Fratrie)</th>
                <th className="w-[20%] py-2 px-2.5">Classe / Niveau</th>
                <th className="w-[22%] py-2 px-2.5">Désignation / Objet</th>
                <th className="w-[20%] py-2 px-2.5 text-right">Montant Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-900 bg-white">
              {(receipt.studentBreakdown || []).map((item, idx) => (
                <tr
                  key={item.studentId || idx}
                  className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                >
                  <td className="py-2 px-2 text-center font-mono text-slate-500 font-bold text-[9px]">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 align-middle">
                    <div className="font-bold text-slate-950 text-[10.5px] leading-tight">
                      {item.studentName}
                    </div>
                    {item.studentMatricule && (
                      <div className="font-mono text-[8.5px] text-slate-500">
                        {item.studentMatricule}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2.5 align-middle text-[10px] font-semibold text-slate-900">
                    {item.level}
                  </td>
                  <td className="py-2 px-2.5 align-middle">
                    <div className="text-[9.5px] text-slate-800 font-medium">
                      {item.category || 'Scolarité Mensuelle'}
                    </div>
                    {item.notes && (
                      <div className="text-[8px] text-slate-500 italic truncate">
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-right align-middle font-mono tabular-nums font-bold text-slate-950 text-[11px]">
                    {(item?.amount ?? 0).toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-100 text-slate-950 font-bold">
                <td colSpan={4} className="py-2 px-2.5 text-right uppercase text-[9px] tracking-wider">
                  TOTAL GÉNÉRAL ENCAISSÉ :
                </td>
                <td className="py-2 px-2.5 text-right font-mono tabular-nums font-black text-[12.5px] text-emerald-950 bg-emerald-50/80">
                  {(receipt?.amount ?? 0).toLocaleString()} FCFA
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          /* Tableau Élève Unique */
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-gray-300 text-slate-800 text-[9.5px] font-bold uppercase tracking-wider">
                <th className="w-[45%] py-2 px-3">Désignation de la Prestation</th>
                <th className="w-[15%] py-2 px-2.5 text-center">Quantité</th>
                <th className="w-[20%] py-2 px-2.5 text-center">Canal Règlement</th>
                <th className="w-[20%] py-2 px-3 text-right">Montant Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-900 bg-white">
              <tr>
                <td className="py-2.5 px-3 align-middle">
                  <div className="font-bold text-slate-950 text-[11px] leading-tight">
                    {receipt.category}
                  </div>
                  <div className="text-[8.5px] text-slate-600 mt-0.5">
                    {receipt.notes || "Encadrement pédagogique régulier, cours d'appuis et suivi continu de l'élève"}
                  </div>
                </td>
                <td className="py-2.5 px-2.5 text-center align-middle font-mono text-[10px] text-slate-800">
                  1 Versement
                </td>
                <td className="py-2.5 px-2.5 text-center align-middle text-[9.5px] font-semibold text-slate-800">
                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {receipt.paymentMethod}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right align-middle font-mono tabular-nums font-black text-slate-950 text-[12px]">
                  {(receipt?.amount ?? 0).toLocaleString()} FCFA
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-100 text-slate-950 font-bold">
                <td colSpan={3} className="py-2 px-3 text-right uppercase text-[9px] tracking-wider">
                  TOTAL REÇU & ENCAISSÉ :
                </td>
                <td className="py-2 px-3 text-right font-mono tabular-nums font-black text-[12.5px] text-emerald-950 bg-emerald-50/80">
                  {(receipt?.amount ?? 0).toLocaleString()} FCFA
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ==================================================================== */}
      {/* BLOC 4 : ARRESTATION DE LA SOMME & MENTIONS LÉGALES                  */}
      {/* ==================================================================== */}
      <div className="relative z-10 space-y-1.5 shrink-0">
        {/* Encadré Arrêté la présente quittance */}
        <div className="p-2 rounded-lg bg-slate-50 border border-gray-300 text-[10px] text-slate-900 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-600 font-medium">
              Arrêté la présente quittance à la somme totale encaissée de :{' '}
            </span>
            <strong className="text-emerald-950 font-black tracking-wide">
              {amountInWords} FRANCS CFA
            </strong>.
          </div>
          <span className="font-mono font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded text-[11px] shrink-0 ml-2">
            {(receipt?.amount ?? 0).toLocaleString()} FCFA
          </span>
        </div>

        {/* Bandeau de conformité et de certification */}
        <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[8px] text-slate-600 flex justify-between items-center">
          <span>Cabinet d'Appuis Scolaire MANI · Quartier Niamey 2000 (Niger)</span>
          <span className="font-mono">NIF: {CAB_APPUIS_INFO.nif} | RCCM: {CAB_APPUIS_INFO.rccm}</span>
          <span className="font-semibold text-slate-800">
            Quittance certifiée le {formattedPaymentDate}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 5 : CERTIFICATION ADMINISTRATIVE & SIGNATURES                   */}
      {/* ==================================================================== */}
      <div className="relative z-10 pt-1.5 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-1 text-[8px] text-slate-600 mb-1.5">
          <ShieldCheck className="h-3 w-3 text-emerald-700 shrink-0" />
          <span>
            <strong>Certification d'Authenticité :</strong> Le présent reçu tient lieu de quittance définitive et libératoire pour les prestations et montants détaillés ci-dessus, enregistrés et archivés dans le grand livre de caisse CAS-MANI.
          </span>
        </div>

        {/* 2 Blocs côte à côte avec zone libre généreuse */}
        <div className="grid grid-cols-2 gap-4 text-[9.5px]">
          {/* Bloc Gauche : Le Tuteur / Déposant */}
          <div className="border border-slate-300 rounded-lg p-2 bg-slate-50/50 flex flex-col justify-between h-20">
            <div className="flex justify-between items-center text-slate-700 font-bold border-b border-slate-200 pb-0.5">
              <span>Le Tuteur / Client Déposant</span>
            </div>
            <div className="text-[8px] text-slate-400 italic text-center pb-0.5">
              Émargement & Signature du Client
            </div>
          </div>

          {/* Bloc Droite : La Caisse & Direction CAS-MANI */}
          <div className="border-2 border-emerald-900 rounded-lg p-2 bg-emerald-50/20 flex flex-col justify-between h-20 relative overflow-hidden">
            <div className="flex justify-between items-center text-emerald-950 font-black border-b border-emerald-200 pb-0.5">
              <span>La Caisse / Direction CAS-MANI</span>
              <span className="text-[7.5px] font-mono text-emerald-800">CENTRE NIAMEY 2000</span>
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Sceau CAS-MANI"
                className="w-7 h-7 rounded-full object-contain border border-emerald-900 bg-white p-0.5 shrink-0"
              />
              <div className="text-left leading-tight">
                <div className="font-extrabold text-[8px] text-emerald-950 uppercase">
                  CAS-MANI · COMPTABILITÉ & CAISSE
                </div>
                <div className="text-[7.5px] text-emerald-700 font-bold font-mono">
                  ✓ ENCAISSÉ LE {formattedPaymentDate.split(' à ')[0]}
                </div>
                <div className="text-[7px] text-slate-600 font-mono">
                  NIF: {CAB_APPUIS_INFO.nif} · RCCM: {CAB_APPUIS_INFO.rccm}
                </div>
              </div>
            </div>

            <div className="text-[7.5px] text-slate-500 flex justify-between items-center">
              <span>Caissier : {receipt.cashierName}</span>
              <span className="font-mono">CERT-ID: CAS-REC-{receipt.receiptNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 6 : COUPON DE CAISSE / SOUCHE DETACHABLE (Bas de page A4)       */}
      {/* ==================================================================== */}
      <div className="relative z-10 pt-1 shrink-0">
        {/* Ligne pointillée avec ciseaux */}
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-400" />
          </div>
          <div className="relative bg-white px-2.5 text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 select-none">
            <Scissors className="h-2.5 w-2.5 text-slate-700" />
            <span>TALON DE QUITTANCE / COUPON DE CAISSE À DÉTACHER ET CONSERVER</span>
            <Scissors className="h-2.5 w-2.5 text-slate-700 rotate-180" />
          </div>
        </div>

        {/* Contenu du Coupon de Quittance Récapitulatif */}
        <div className="rounded-lg border-2 border-slate-700 bg-slate-50 p-2 text-[9px]">
          <div className="flex justify-between items-center border-b border-slate-300 pb-0.5 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-900 text-white font-mono font-black text-[8px] px-1 py-0.2 rounded">
                SOUCHE QUITTANCE
              </span>
              <strong className="text-slate-900 uppercase font-black text-[9.5px]">
                CABINET D'APPUIS SCOLAIRE MANI (CAS-MANI)
              </strong>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-slate-900 text-[10px]">
                REÇU N° {receipt.receiptNumber}
              </span>
              <span className="text-slate-500 ml-1.5 font-mono text-[8.5px]">
                ({formattedPaymentDate.split(' à ')[0]})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-slate-800">
            <div>
              <span className="text-[7.5px] uppercase text-slate-500 block font-semibold">Bénéficiaire :</span>
              <strong className="text-[9.5px] text-slate-950 block truncate">
                {receipt.studentName}
              </strong>
              <span className="font-mono text-[7.5px] text-slate-600 block">
                {isMulti ? `${receipt.studentBreakdown?.length || 2} enfants` : `Matr : ${studentMatricule}`}
              </span>
            </div>

            <div>
              <span className="text-[7.5px] uppercase text-slate-500 block font-semibold">Tuteur / Tél :</span>
              <strong className="text-[9.5px] text-slate-950 block truncate">
                {receipt.guardianName || receipt.studentName}
              </strong>
              <span className="font-mono text-[7.5px] text-slate-600 block">
                {receipt.guardianPhone || '+227 96 16 51 81'}
              </span>
            </div>

            <div>
              <span className="text-[7.5px] uppercase text-slate-500 block font-semibold">Montant Réglé :</span>
              <span className="font-mono font-black text-[11px] text-emerald-950 block">
                {(receipt?.amount ?? 0).toLocaleString()} FCFA
              </span>
              <span className="text-[7.5px] text-emerald-700 font-semibold block">
                Règlement : {receipt.paymentMethod}
              </span>
            </div>

            <div className="border-l border-slate-300 pl-2 flex flex-col justify-between">
              <div>
                <span className="text-[7.5px] uppercase text-slate-500 block font-semibold">Certification Caisse :</span>
                <div className="text-[7.5px] text-slate-700 font-medium mt-0.5">
                  Caissier : <strong>{receipt.cashierName}</strong>
                </div>
              </div>
              <div className="text-[7px] text-slate-500 mt-0.5 flex justify-between items-center">
                <span>Visa Caisse : _______</span>
                <span>Date : {formattedPaymentDate.split(' à ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
