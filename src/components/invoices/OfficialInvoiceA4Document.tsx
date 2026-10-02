import React from 'react';
import {
  Users,
  User,
  Phone,
  Calendar,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scissors,
  MapPin,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { MonthlyInvoice, InvoiceStudentItem } from '../../types';
import { numberToFrenchWords } from '../../utils/familyUtils';
import { calculateWeeklyHours, formatSessionHours } from '../../utils/dateUtils';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';

export interface OfficialInvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  monthLabel: string;
  status: 'Payée' | 'Partielle' | 'En attente' | 'En retard' | string;
  guardianName: string;
  guardianPhone: string;
  guardianAddress?: string;
  studentName?: string;
  studentMatricule?: string;
  level?: string;
  stream?: string;
  subjects?: string[];
  sessionsPerWeek?: number;
  isFamilyInvoice?: boolean;
  studentItems: InvoiceStudentItem[];
  totalMonthlyFee: number;
  totalPaid: number;
  netDue: number;
  notes?: string;
}

export interface OfficialInvoiceA4DocumentProps {
  invoice?: MonthlyInvoice | null;
  customData?: Partial<OfficialInvoiceData>;
  cashierName?: string;
  className?: string;
}

export const OfficialInvoiceA4Document: React.FC<OfficialInvoiceA4DocumentProps> = ({
  invoice,
  customData,
  cashierName = 'Service Caisse & Comptabilité',
  className = '',
}) => {
  // Extraction des données avec valeurs par défaut réelles
  const data: OfficialInvoiceData = {
    invoiceNumber: customData?.invoiceNumber || invoice?.invoiceNumber || 'FAC-2026-10-0008',
    issueDate: customData?.issueDate || invoice?.issueDate || '01/10/2026',
    dueDate: customData?.dueDate || invoice?.dueDate || '10/10/2026',
    monthLabel: customData?.monthLabel || invoice?.monthLabel || 'Octobre 2026',
    status: customData?.status || invoice?.status || 'En attente',
    guardianName: customData?.guardianName || invoice?.guardianName || 'M. Abdoulaye Seydou Oumarou',
    guardianPhone: customData?.guardianPhone || invoice?.guardianPhone || '+227 96 16 51 81',
    guardianAddress: customData?.guardianAddress || 'Quartier Niamey 2000, Niamey (Niger)',
    studentName: customData?.studentName || invoice?.studentItems?.[0]?.studentName || 'Ibrahim Seydou Oumarou',
    studentMatricule: customData?.studentMatricule || invoice?.studentItems?.[0]?.studentMatricule || 'CAS-2026-0042',
    level: customData?.level || invoice?.studentItems?.[0]?.level || 'Terminale D (Scientifique)',
    stream: customData?.stream || invoice?.studentItems?.[0]?.stream || 'Lycée',
    subjects: customData?.subjects || invoice?.studentItems?.[0]?.subjects || ['Mathématiques', 'Physique-Chimie', 'SVT'],
    sessionsPerWeek: customData?.sessionsPerWeek || invoice?.studentItems?.[0]?.sessionsPerWeek || 3,
    isFamilyInvoice: customData?.isFamilyInvoice ?? (invoice?.isFamilyInvoice || (invoice?.studentItems && invoice.studentItems.length > 1) || false),
    studentItems: (customData?.studentItems && customData.studentItems.length > 0)
      ? customData.studentItems
      : (invoice?.studentItems && invoice.studentItems.length > 0)
      ? invoice.studentItems
      : [
          {
            studentId: 'default-student',
            studentMatricule: customData?.studentMatricule || 'CAS-2026-0042',
            studentName: customData?.studentName || 'Ibrahim Seydou Oumarou',
            level: customData?.level || 'Terminale D (Scientifique)',
            stream: customData?.stream || 'Lycée',
            subjects: customData?.subjects || ['Mathématiques', 'Physique-Chimie', 'SVT'],
            sessionsPerWeek: customData?.sessionsPerWeek || 3,
            monthlyFee: customData?.totalMonthlyFee || 40000,
            paidAmount: customData?.totalPaid || 0,
            balanceRemaining: customData?.netDue ?? 40000,
            tutoringStatus: 'Actif',
          },
        ],
    totalMonthlyFee: customData?.totalMonthlyFee ?? (invoice?.totalMonthlyFee || 40000),
    totalPaid: customData?.totalPaid ?? (invoice?.totalPaid || 0),
    netDue: customData?.netDue ?? (invoice?.netDue ?? 40000),
    notes: customData?.notes || invoice?.notes,
  };

  const amountInWords = numberToFrenchWords(data.netDue).toUpperCase();

  const isPaid = data.status === 'Payée' || data.status === 'Payé';
  const isPartial = data.status === 'Partielle' || data.status === 'Partiel';
  const isOverdue = data.status === 'En retard';

  return (
    <div
      className={`official-invoice-sheet w-[210mm] h-[296mm] max-h-[296mm] p-[12mm] mx-auto flex flex-col justify-between box-border bg-white text-gray-900 font-sans relative overflow-hidden select-text ${className}`}
    >
      {/* Subtle Security Filigree Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.035] print:opacity-[0.04]">
        <img
          src={CAB_APPUIS_LOGO}
          alt="Filigrane CAS-MANI"
          className="w-[120mm] h-[120mm] object-contain filter grayscale"
        />
      </div>

      {/* ==================================================================== */}
      {/* BLOC 1 : EN-TÊTE NOBLE (Branding & Cartouche Facture)                */}
      {/* ==================================================================== */}
      <div className="relative z-10 border-b-2 border-slate-900 pb-3 flex justify-between items-start gap-4">
        {/* Gauche : Branding Officiel CAS-MANI */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={CAB_APPUIS_LOGO}
              alt="Logo CAS-MANI"
              className="w-16 h-16 rounded-xl object-contain border border-slate-200 p-0.5 bg-white shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 bg-indigo-950 text-white font-mono text-[8px] font-black px-1 rounded shadow-xs">
              NIGER
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-950 text-white font-black text-[11px] px-2 py-0.5 rounded tracking-wider shadow-2xs">
                {CAB_APPUIS_INFO.acronym}
              </span>
              <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Agrément Pédagogique & Enregistrement Officiel
              </span>
            </div>

            <h1 className="text-base font-black tracking-tight uppercase text-slate-950 mt-1 leading-tight">
              {CAB_APPUIS_INFO.name}
            </h1>

            <p className="text-[10px] font-bold text-indigo-950">
              {CAB_APPUIS_INFO.subtitle}
            </p>

            <div className="mt-1 text-[9px] text-slate-700 space-y-0.5">
              <p className="flex items-center gap-1 font-medium">
                <MapPin className="h-3 w-3 text-slate-500 shrink-0 inline" />
                <span>Siège Central : <strong className="text-slate-900">{CAB_APPUIS_INFO.address}</strong></span>
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8.5px] text-slate-800 font-medium">
                <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                  NIF : <strong className="font-mono text-indigo-950 font-bold">{CAB_APPUIS_INFO.nif}</strong>
                </span>
                <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                  RCCM : <strong className="font-mono text-indigo-950 font-bold">{CAB_APPUIS_INFO.rccm}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-2.5 w-2.5 text-slate-500 inline" />
                  <span className="font-mono font-semibold">+227 91 58 44 59 / 96 16 51 81 / 92 28 57 37</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Droite : Cartouche de Facture & Statut */}
        <div className="text-right shrink-0 flex flex-col items-end">
          <div className="bg-slate-900 text-white font-mono font-extrabold text-[12px] px-3 py-1 rounded shadow-xs tracking-wider">
            FACTURE N° {data.invoiceNumber}
          </div>

          <div className="mt-1.5 text-[11px] font-black text-indigo-950 uppercase tracking-wide">
            AVIS D'ÉCHÉANCE MENSUELLE
          </div>

          <p className="text-[10px] text-slate-600 mt-0.5">
            Période : <strong className="text-slate-900">{data.monthLabel}</strong>
          </p>

          <div className="mt-1 text-[9.5px] text-slate-600 space-y-0.5">
            <div>Date d'émission : <strong className="font-mono text-slate-900">{data.issueDate}</strong></div>
            <div className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded font-bold inline-block">
              Date d'échéance : <span className="font-mono">{data.dueDate}</span>
            </div>
          </div>

          {/* Badge de Statut Coloré */}
          <div
            className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase border ${
              isPaid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isPartial
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : isOverdue
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPaid
                  ? 'bg-emerald-600'
                  : isPartial
                  ? 'bg-amber-600'
                  : isOverdue
                  ? 'bg-rose-600'
                  : 'bg-indigo-600'
              }`}
            />
            {isPaid ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>RÈGLEMENT EFFECTUÉ · PAYÉ</span>
              </>
            ) : isPartial ? (
              <>
                <Clock className="h-3 w-3" />
                <span>RÈGLEMENT PARTIEL</span>
              </>
            ) : isOverdue ? (
              <>
                <AlertTriangle className="h-3 w-3" />
                <span>ÉCHÉANCE DÉPASSÉE · EN RETARD</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>EN ATTENTE DE RÈGLEMENT</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 2 : GRILLE À 2 COLONNES (Tuteur & Élève)                        */}
      {/* ==================================================================== */}
      <div className="relative z-10 grid grid-cols-2 gap-4">
        {/* Carte Facturé à / Tuteur Légal */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-1 mb-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-700" />
              <span>FACTURE À / TUTEUR LÉGAL</span>
            </div>
            <p className="text-[13px] font-black text-slate-950 leading-tight">
              {data.guardianName}
            </p>
            <div className="mt-1 text-[10px] text-slate-700 space-y-0.5">
              <p className="flex items-center gap-1 font-mono">
                <Phone className="h-3 w-3 text-slate-500" />
                <span>{data.guardianPhone || '+227 96 16 51 81'}</span>
              </p>
              <p className="text-[9.5px] text-slate-600">
                📍 {data.guardianAddress}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-slate-200 text-[8.5px] text-slate-500 flex justify-between">
            <span>Compte Famille / Client Enregistré</span>
            <span className="font-mono">ID: PAR-{data.guardianPhone.replace(/[^\d]/g, '').slice(-4) || '2026'}</span>
          </div>
        </div>

        {/* Carte Détails Élève & Inscription */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-1 mb-1.5">
              <User className="h-3.5 w-3.5 text-indigo-700" />
              <span>DÉTAILS ÉLÈVE & INSCRIPTION</span>
            </div>
            {data.isFamilyInvoice && data.studentItems.length > 1 ? (
              <div>
                <p className="text-[12.5px] font-black text-purple-950">
                  Facturation Fratrie & Famille ({data.studentItems.length} Élèves Inscrits)
                </p>
                <p className="text-[9.5px] text-slate-600 mt-0.5">
                  {data.studentItems.map((s) => `${s.studentName} (${s.level})`).join(' · ')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[13px] font-black text-slate-950 leading-tight">
                  {data.studentName}
                </p>
                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-700">
                  <div>
                    Matricule : <strong className="font-mono text-slate-950">{data.studentMatricule}</strong>
                  </div>
                  <div>
                    Classe/Série : <strong className="text-slate-950">{data.level}</strong>
                  </div>
                  <div>
                    Cycle Scolaire : <strong className="text-slate-900">{data.stream}</strong>
                  </div>
                  <div>
                    Volume Horaire : <strong className="text-indigo-950">{data.sessionsPerWeek} séances/sem.</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 pt-1 border-t border-slate-200 text-[8.5px] text-slate-500 flex justify-between">
            <span>Centre Pédagogique : Niamey 2000</span>
            <span>Année Scolaire 2026 - 2027</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 3 : TABLEAU FINANCIER (Aéré avec largeurs strictes)              */}
      {/* Colonnes : Élève/Matr (20%) | Classe (20%) | Encadrement (30%)       */}
      {/*            Mensualité (15%) | Net à Payer (15%)                      */}
      {/* ==================================================================== */}
      <div className="relative z-10 overflow-hidden rounded-lg border border-gray-300 shadow-2xs">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="bg-slate-100 border-b border-gray-300 text-slate-800 text-[10.5px] font-bold uppercase tracking-wider">
              <th className="w-[20%] py-2.5 px-3">
                Élève / Matricule
              </th>
              <th className="w-[20%] py-2.5 px-3">
                Classe / Cycle
              </th>
              <th className="w-[30%] py-2.5 px-3">
                Encadrement & Matières
              </th>
              <th className="w-[15%] py-2.5 px-3 text-right">
                Mensualité
              </th>
              <th className="w-[15%] py-2.5 px-3 text-right">
                Net à Payer
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-slate-900 bg-white">
            {data.studentItems.map((item, idx) => {
              const weeklyHours = calculateWeeklyHours(item.sessionsPerWeek || 3);
              return (
                <tr
                  key={item.studentId || idx}
                  className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                >
                  {/* Élève / Matricule (20%) */}
                  <td className="py-3 px-3 align-middle">
                    <div className="font-bold text-slate-950 text-[12px] leading-tight">
                      {item.studentName}
                    </div>
                    <div className="font-mono text-[9.5px] text-slate-500 mt-0.5">
                      {item.studentMatricule}
                    </div>
                  </td>

                  {/* Classe / Cycle (20%) */}
                  <td className="py-3 px-3 align-middle">
                    <div className="font-semibold text-slate-900 text-[11px]">
                      {item.level}
                    </div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">
                      Cycle {item.stream}
                    </div>
                  </td>

                  {/* Encadrement & Matières (30%) */}
                  <td className="py-3 px-3 align-middle">
                    <div className="text-[10.5px] font-bold text-indigo-950">
                      {item.sessionsPerWeek || 3} séances/semaine ({formatSessionHours(weeklyHours)})
                    </div>
                    <div className="text-[9.5px] text-slate-600 mt-0.5 line-clamp-1">
                      {item.subjects && item.subjects.length > 0
                        ? item.subjects.join(', ')
                        : 'Matières principales de la série'}
                    </div>
                  </td>

                  {/* Mensualité (15%) */}
                  <td className="py-3 px-3 text-right align-middle font-mono tabular-nums text-slate-800 text-[11.5px]">
                    {item.monthlyFee.toLocaleString()} F
                  </td>

                  {/* Net à Payer (15%) */}
                  <td className="py-3 px-3 text-right align-middle font-mono tabular-nums font-black text-slate-950 text-[12.5px]">
                    {item.balanceRemaining.toLocaleString()} FCFA
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-100/95 text-slate-950 font-bold">
              <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider">
                TOTAL GÉNÉRAL NET À RECOUVRER :
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[11px] text-slate-800">
                {data.totalMonthlyFee.toLocaleString()} F
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-[13px] text-indigo-950 bg-indigo-50/80">
                {data.netDue.toLocaleString()} FCFA
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 4 : ARRESTATION DE SOMME & MODALITÉS PAIEMENT (NIGER)            */}
      {/* ==================================================================== */}
      <div className="relative z-10 space-y-2">
        {/* Encadré Arrêtée la présente facture */}
        <div className="p-3 rounded-lg bg-slate-50 border border-gray-300 text-[11px] text-slate-900 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-600 font-medium">
              Arrêtée la présente facture à la somme nette à payer de :{' '}
            </span>
            <strong className="text-indigo-950 font-black tracking-wide">
              {amountInWords} FRANCS CFA
            </strong>.
          </div>
          <span className="font-mono font-black text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded text-[12px] shrink-0 ml-2">
            {data.netDue.toLocaleString()} FCFA
          </span>
        </div>

        {/* Badges / Cartes des canaux de paiement Niger */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-2.5 text-[9.5px] text-slate-800">
          <div className="font-bold text-indigo-950 text-[10px] flex items-center gap-1.5 mb-1.5">
            <CreditCard className="h-3.5 w-3.5 text-indigo-700" />
            <span>MODALITÉS OFFICIELLES DE PAIEMENT AGRÉÉES (RÉPUBLIQUE DU NIGER) :</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white p-2 rounded border border-indigo-100 shadow-2xs">
              <span className="font-bold text-indigo-900 block text-[9.5px]">
                📱 Dépôt Mobile MyNita :
              </span>
              <span className="font-mono font-black text-indigo-950 text-[11.5px] block">
                +227 92 28 57 37
              </span>
              <span className="text-[8px] text-slate-500 block">
                Compte Caisse CAS-MANI
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-indigo-100 shadow-2xs">
              <span className="font-bold text-indigo-900 block text-[9.5px]">
                📱 Transfert Amana :
              </span>
              <span className="font-mono font-black text-indigo-950 text-[11.5px] block">
                +227 92 28 57 37
              </span>
              <span className="text-[8px] text-slate-500 block">
                Caisse Centrale Niamey 2000
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-indigo-100 shadow-2xs">
              <span className="font-bold text-indigo-900 block text-[9.5px]">
                🏢 Caisse Physique :
              </span>
              <span className="font-bold text-slate-900 text-[10.5px] block">
                Guichet Niamey 2000
              </span>
              <span className="text-[8px] text-slate-500 block">
                Paiement Espèces direct
              </span>
            </div>
          </div>

          <p className="text-[8.5px] text-slate-500 italic mt-1.5">
            * Prière de mentionner le N° de facture <strong className="text-slate-800">{data.invoiceNumber}</strong> ou le nom de l'élève lors de votre transfert au <strong>+227 92 28 57 37</strong>.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 5 : ENGAGEMENT PÉDAGOGIQUE & SIGNATURES                         */}
      {/* ==================================================================== */}
      <div className="relative z-10 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600 mb-2">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
          <span>
            <strong>Engagement Pédagogique :</strong> Le respect scrupuleux des échéances de paiement assure la continuité régulière des plannings de cours, la rémunération des enseignants encadreurs et l'excellence académique de vos enfants.
          </span>
        </div>

        {/* 2 Blocs côte à côte avec zone libre généreuse */}
        <div className="grid grid-cols-2 gap-5 text-[10px]">
          {/* Bloc Gauche : Le Tuteur / Client */}
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 flex flex-col justify-between h-26">
            <div className="flex justify-between items-center text-slate-700 font-bold border-b border-slate-200 pb-1">
              <span>Le Tuteur / Client Payeur</span>
              <span className="text-[8.5px] font-normal italic text-slate-500">Mention "Lu et approuvé"</span>
            </div>
            <div className="text-[8.5px] text-slate-400 italic text-center pb-1">
              Date & Signature du Tuteur Légal
            </div>
          </div>

          {/* Bloc Droite : La Caisse & Direction CAS-MANI (Zone pour tampon et signature) */}
          <div className="border-2 border-indigo-900 rounded-lg p-2.5 bg-indigo-50/30 flex flex-col justify-between h-26 relative overflow-hidden">
            <div className="flex justify-between items-center text-indigo-950 font-black border-b border-indigo-200 pb-1">
              <span>La Caisse / Direction CAS-MANI</span>
              <span className="text-[8px] font-mono text-indigo-800">CENTRE NIAMEY 2000</span>
            </div>

            {/* Sceau & Visa Officiel CAS-MANI */}
            <div className="flex items-center justify-center gap-2.5 py-0.5">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Sceau CAS-MANI"
                className="w-9 h-9 rounded-full object-contain border border-indigo-900 bg-white p-0.5 shrink-0"
              />
              <div className="text-left leading-tight">
                <div className="font-extrabold text-[8.5px] text-indigo-950 uppercase">
                  CAS-MANI · COMPTABILITÉ & RECOUVREMENT
                </div>
                <div className="text-[8px] text-emerald-800 font-bold font-mono">
                  VISA & CACHET OFFICIEL DU CABINET
                </div>
                <div className="text-[7.5px] text-slate-600 font-mono">
                  NIF: {CAB_APPUIS_INFO.nif} · RCCM: {CAB_APPUIS_INFO.rccm}
                </div>
              </div>
            </div>

            <div className="text-[8px] text-slate-500 flex justify-between items-center">
              <span>Agent Caissier : {cashierName}</span>
              <span className="font-mono">RÉF: CAS-MANI-{data.invoiceNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOC 6 : COUPON DE CAISSE / SOUCHE DETACHABLE (Bas de page A4)       */}
      {/* ==================================================================== */}
      <div className="relative z-10 pt-1">
        {/* Ligne pointillée de découpe avec icônes ciseaux */}
        <div className="relative flex items-center justify-center my-1.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-400" />
          </div>
          <div className="relative bg-white px-3 text-[8.5px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 select-none">
            <Scissors className="h-3 w-3 text-slate-700" />
            <span>TALON DE RÈGLEMENT / COUPON DE CAISSE À DÉTACHER ET CONSERVER PAR LE CABINET</span>
            <Scissors className="h-3 w-3 text-slate-700 rotate-180" />
          </div>
        </div>

        {/* Contenu du Coupon de Caisse Récapitulatif */}
        <div className="rounded-lg border-2 border-slate-700 bg-slate-50 p-2.5 text-[9.5px]">
          <div className="flex justify-between items-center border-b border-slate-300 pb-1 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded">
                SOUCHE CAISSE
              </span>
              <strong className="text-slate-900 uppercase font-black text-[10px]">
                CABINET D'APPUIS SCOLAIRE MANI (CAS-MANI)
              </strong>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-slate-900 text-[10.5px]">
                FACTURE N° {data.invoiceNumber}
              </span>
              <span className="text-slate-500 ml-2 font-mono text-[9px]">
                ({data.monthLabel})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-slate-800">
            <div>
              <span className="text-[8px] uppercase text-slate-500 block font-semibold">Élève Bénéficiaire :</span>
              <strong className="text-[10px] text-slate-950 block truncate">
                {data.studentName}
              </strong>
              <span className="font-mono text-[8px] text-slate-600 block">
                Matricule : {data.studentMatricule}
              </span>
            </div>

            <div>
              <span className="text-[8px] uppercase text-slate-500 block font-semibold">Tuteur / Tél :</span>
              <strong className="text-[10px] text-slate-950 block truncate">
                {data.guardianName}
              </strong>
              <span className="font-mono text-[8px] text-slate-600 block">
                {data.guardianPhone}
              </span>
            </div>

            <div>
              <span className="text-[8px] uppercase text-slate-500 block font-semibold">Montant Réglé / Dû :</span>
              <span className="font-mono font-black text-[12px] text-indigo-950 block">
                {data.netDue.toLocaleString()} FCFA
              </span>
              <span className="text-[8px] text-rose-700 font-semibold block">
                Échéance : {data.dueDate}
              </span>
            </div>

            <div className="border-l border-slate-300 pl-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[8px] uppercase text-slate-500 block font-semibold">Canal Règlement :</span>
                <div className="flex gap-1 mt-0.5 text-[7.5px] text-slate-700 font-medium">
                  <span className="border border-slate-300 px-1 rounded bg-white">MyNita</span>
                  <span className="border border-slate-300 px-1 rounded bg-white">Amana</span>
                  <span className="border border-slate-300 px-1 rounded bg-white">Espèces</span>
                </div>
              </div>
              <div className="text-[7.5px] text-slate-500 mt-1 flex justify-between items-center">
                <span>Visa Caisse : _______</span>
                <span>Date : __/__/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
