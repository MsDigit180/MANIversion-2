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
  FileCheck,
} from 'lucide-react';
import { MonthlyInvoice, InvoiceStudentItem } from '../../types';
import { numberToFrenchWords } from '../../utils/familyUtils';
import { calculateWeeklyHours, formatSessionHours } from '../../utils/dateUtils';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';

export type InvoiceLayoutOption = 'with-coupon' | 'full-page';

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
  layoutOption?: InvoiceLayoutOption;
  cashierName?: string;
  className?: string;
}

export const OfficialInvoiceA4Document: React.FC<OfficialInvoiceA4DocumentProps> = ({
  invoice,
  customData,
  layoutOption = 'with-coupon',
  cashierName = 'Service Comptabilité & Caisse',
  className = '',
}) => {
  // Merge invoice and customData with safe sensible fallbacks
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
            monthlyFee: customData?.totalMonthlyFee || 35000,
            paidAmount: customData?.totalPaid || 0,
            balanceRemaining: customData?.netDue ?? 35000,
            tutoringStatus: 'Actif',
          },
        ],
    totalMonthlyFee: customData?.totalMonthlyFee ?? (invoice?.totalMonthlyFee || 35000),
    totalPaid: customData?.totalPaid ?? (invoice?.totalPaid || 0),
    netDue: customData?.netDue ?? (invoice?.netDue ?? 35000),
    notes: customData?.notes || invoice?.notes,
  };

  const amountInWords = numberToFrenchWords(data.netDue);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Payée':
      case 'Payé':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          label: 'RÈGLEMENT EFFECTUÉ · PAYÉ',
          icon: CheckCircle2,
        };
      case 'Partielle':
      case 'Partiel':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-600',
          label: 'RÈGLEMENT PARTIEL',
          icon: Clock,
        };
      case 'En retard':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          label: 'ÉCHÉANCE DÉPASSÉE · EN RETARD',
          icon: AlertTriangle,
        };
      case 'En attente':
      default:
        return {
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          dot: 'bg-indigo-600',
          label: 'EN ATTENTE DE RÈGLEMENT',
          icon: Clock,
        };
    }
  };

  const statusConfig = getStatusBadge(data.status);
  const StatusIcon = statusConfig.icon;

  const isCouponMode = layoutOption === 'with-coupon';

  return (
    <div
      className={`official-invoice-sheet bg-white text-slate-900 font-sans relative ${
        isCouponMode
          ? 'print:min-h-[273mm] print:h-[273mm] print:max-h-[273mm] flex flex-col justify-between'
          : 'print:min-h-[273mm] flex flex-col justify-between'
      } ${className}`}
    >
      {/* Subtle Security Filigree Watermark (non-intrusive) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-[0.035] print:opacity-[0.04]">
        <img
          src={CAB_APPUIS_LOGO}
          alt="Filigrane CAS-MANI"
          className="w-96 h-96 object-contain filter grayscale"
        />
      </div>

      {/* ============================================================== */}
      {/* CORPS PRINCIPAL DE LA FACTURE                                 */}
      {/* ============================================================== */}
      <div className={`relative z-10 flex-1 flex flex-col ${isCouponMode ? 'space-y-3 print:space-y-2' : 'space-y-4 print:space-y-3.5'}`}>
        
        {/* 1. EN-TÊTE NOBLE & BRANDING */}
        <header className="border-b-2 border-slate-900 pb-3 print:pb-2.5 flex justify-between items-start gap-4">
          {/* Gauche : Logo & Métadonnées Administratives Officielles */}
          <div className="flex items-start gap-3.5">
            <div className="relative">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Logo CAS-MANI"
                className="w-16 h-16 print:w-14 print:h-14 rounded-xl object-contain border border-slate-200 p-0.5 bg-white shadow-sm shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 bg-indigo-900 text-white font-mono text-[8px] font-black px-1 rounded shadow">
                NIGER
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-950 text-white font-black text-[11px] print:text-[10px] px-2 py-0.5 rounded tracking-wider shadow-xs">
                  {CAB_APPUIS_INFO.acronym}
                </span>
                <span className="text-[9px] print:text-[8px] font-bold text-emerald-800 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Agrément Pédagogique & Enregistrement Officiel
                </span>
              </div>

              <h1 className="text-base print:text-[13.5px] font-black tracking-tight uppercase text-slate-950 mt-1">
                {CAB_APPUIS_INFO.name}
              </h1>
              
              <p className="text-[10.5px] print:text-[9.5px] font-bold text-indigo-950">
                {CAB_APPUIS_INFO.subtitle}
              </p>

              <div className="mt-1 text-[9.5px] print:text-[8.5px] text-slate-700 space-y-0.5">
                <p className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3 w-3 text-slate-500 shrink-0 inline" />
                  <span>Siège Central : <strong className="text-slate-900">{CAB_APPUIS_INFO.address}</strong></span>
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] print:text-[8px] text-slate-800 font-medium">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    NIF : <strong className="font-mono text-indigo-950 font-bold">{CAB_APPUIS_INFO.nif}</strong>
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
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

          {/* Droite : Badge Titre, N° Facture, Dates & Statut */}
          <div className="text-right shrink-0 flex flex-col items-end">
            <div className="bg-slate-900 text-white font-mono font-extrabold text-[12px] print:text-[11px] px-3 py-1 rounded shadow-xs tracking-wider">
              FACTURE N° {data.invoiceNumber}
            </div>

            <div className="mt-1.5 text-[11px] print:text-[10px] font-black text-indigo-950 uppercase tracking-wide">
              AVIS D'ÉCHÉANCE MENSUELLE
            </div>
            
            <p className="text-[10px] print:text-[9px] text-slate-600 mt-0.5">
              Période Académique : <strong className="text-slate-900">{data.monthLabel}</strong>
            </p>

            <div className="mt-1 text-[9.5px] print:text-[8.5px] text-slate-600 space-y-0.5">
              <div>Émise le : <strong className="font-mono text-slate-900">{data.issueDate}</strong></div>
              <div className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded font-bold inline-block">
                Échéance limite : <span className="font-mono">{data.dueDate}</span>
              </div>
            </div>

            <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9.5px] print:text-[8.5px] font-extrabold uppercase border ${statusConfig.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </header>

        {/* 2. SECTION CLIENT / TUTEUR (Grid 2 colonnes bien équilibrée) */}
        <section className="grid grid-cols-2 gap-3.5 print:gap-3">
          {/* Bloc Tuteur Légal */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 print:p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] print:text-[9px] font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-1 mb-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-700" />
                <span>Facturé à / Tuteur Légal</span>
              </div>
              <p className="text-[13px] print:text-[11.5px] font-black text-slate-950 leading-tight">
                {data.guardianName}
              </p>
              <div className="mt-1 text-[10.5px] print:text-[9.5px] text-slate-700 space-y-0.5">
                <p className="flex items-center gap-1 font-mono">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>{data.guardianPhone || 'Non spécifié'}</span>
                </p>
                <p className="text-[9.5px] print:text-[8.5px] text-slate-600">
                  📍 {data.guardianAddress}
                </p>
              </div>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-200/60 text-[8.5px] print:text-[8px] text-slate-500 flex justify-between">
              <span>Compte Parent Certifié</span>
              <span className="font-mono">RÉF: PAR-{data.guardianPhone.replace(/[^\d]/g, '').slice(-4) || '2026'}</span>
            </div>
          </div>

          {/* Bloc Élève & Inscription */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 print:p-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] print:text-[9px] font-bold uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-1 mb-1.5">
                <User className="h-3.5 w-3.5 text-indigo-700" />
                <span>Détails Élève & Inscription</span>
              </div>
              {data.isFamilyInvoice && data.studentItems.length > 1 ? (
                <div>
                  <p className="text-[12px] print:text-[11px] font-black text-purple-950">
                    Facturation Groupée Famille ({data.studentItems.length} Élèves Inscrits)
                  </p>
                  <p className="text-[9.5px] print:text-[8.5px] text-slate-600 mt-0.5">
                    {data.studentItems.map((s) => `${s.studentName} (${s.level})`).join(' · ')}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] print:text-[11.5px] font-black text-slate-950 leading-tight">
                    {data.studentName}
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-x-2 text-[10px] print:text-[9px] text-slate-700">
                    <div>
                      Matricule : <strong className="font-mono text-slate-950">{data.studentMatricule}</strong>
                    </div>
                    <div>
                      Classe/Série : <strong className="text-slate-950">{data.level}</strong>
                    </div>
                    <div>
                      Cycle : <strong className="text-slate-900">{data.stream}</strong>
                    </div>
                    <div>
                      Rythme : <strong className="text-indigo-950">{data.sessionsPerWeek} séances/sem.</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-1 pt-1 border-t border-slate-200/60 text-[8.5px] print:text-[8px] text-slate-500 flex justify-between">
              <span>Site Pédagogique : Niamey 2000</span>
              <span>Année Scolaire 2026 - 2027</span>
            </div>
          </div>
        </section>

        {/* 3. TABLEAU FINANCIER STRUCTURÉ (table-fixed, largeurs relatives strictes) */}
        <section className="overflow-hidden rounded-lg border border-gray-300">
          <table className="w-full table-fixed border-collapse text-left text-[11px] print:text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 border-b border-gray-300 text-slate-800 text-[10px] print:text-[9px] font-bold uppercase tracking-wider">
                <th className="w-[42%] py-2 print:py-1.5 px-3">
                  Description / Matières & Prestations
                </th>
                <th className="w-[18%] py-2 print:py-1.5 px-3 text-right">
                  Mensualité
                </th>
                <th className="w-[20%] py-2 print:py-1.5 px-3 text-right">
                  Déjà Versé
                </th>
                <th className="w-[20%] py-2 print:py-1.5 px-3 text-right">
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
                    className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}
                  >
                    <td className="py-2.5 print:py-1.5 px-3">
                      <div className="font-bold text-slate-950 text-[11.5px] print:text-[10px]">
                        {item.studentName}{' '}
                        <span className="font-mono font-normal text-[9.5px] print:text-[8.5px] text-slate-500">
                          ({item.studentMatricule})
                        </span>
                      </div>
                      <div className="text-[9.5px] print:text-[8.5px] text-slate-600 mt-0.5">
                        <strong className="text-slate-800">{item.level}</strong> · {item.stream} · {item.sessionsPerWeek || 3} séa./sem. ({formatSessionHours(weeklyHours)})
                      </div>
                      {item.subjects && item.subjects.length > 0 && (
                        <div className="text-[9px] print:text-[8px] text-indigo-950 font-medium truncate mt-0.5">
                          Matières : {item.subjects.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 print:py-1.5 px-3 text-right font-mono tabular-nums text-slate-800">
                      {item.monthlyFee.toLocaleString()} FCFA
                    </td>
                    <td className="py-2.5 print:py-1.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                      {item.paidAmount > 0 ? `${item.paidAmount.toLocaleString()} FCFA` : '0 FCFA'}
                    </td>
                    <td className="py-2.5 print:py-1.5 px-3 text-right font-mono tabular-nums font-black text-slate-950">
                      {item.balanceRemaining.toLocaleString()} FCFA
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-100/90 text-slate-950 font-bold">
                <td className="py-2.5 print:py-1.5 px-3 text-right uppercase text-[10px] print:text-[9px] tracking-wider">
                  TOTAL GÉNÉRAL NET À RECOUVRER :
                </td>
                <td className="py-2.5 print:py-1.5 px-3 text-right font-mono tabular-nums text-[10.5px] print:text-[9.5px] text-slate-800">
                  {data.totalMonthlyFee.toLocaleString()} F
                </td>
                <td className="py-2.5 print:py-1.5 px-3 text-right font-mono tabular-nums text-[10.5px] print:text-[9.5px] text-emerald-800">
                  {data.totalPaid.toLocaleString()} F
                </td>
                <td className="py-2.5 print:py-1.5 px-3 text-right font-mono tabular-nums font-black text-[13px] print:text-[11.5px] text-indigo-950 bg-indigo-50/70">
                  {data.netDue.toLocaleString()} FCFA
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* 4. SECTION ARRESTATION DE LA SOMME & MODALITÉS DE PAIEMENT */}
        <section className="space-y-2 print:space-y-1.5">
          {/* Somme en toutes lettres */}
          <div className="p-2.5 print:p-2 rounded-lg bg-slate-50 border border-gray-300 text-[10.5px] print:text-[9px] text-slate-900 flex items-center justify-between">
            <div>
              <span className="text-slate-600 font-medium">
                Arrêtée la présente facture à la somme nette à payer de :{' '}
              </span>
              <strong className="text-indigo-950 uppercase font-black tracking-wide">
                {amountInWords} Francs CFA
              </strong>.
            </div>
            <span className="font-mono font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px] print:text-[9.5px] shrink-0 ml-2">
              {data.netDue.toLocaleString()} FCFA
            </span>
          </div>

          {/* Modalités de paiement locales Niger */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-2.5 print:p-2 text-[9.5px] print:text-[8.5px] text-slate-800">
            <div className="font-bold text-indigo-950 text-[10px] print:text-[9px] flex items-center gap-1.5 mb-1.5">
              <CreditCard className="h-3.5 w-3.5 text-indigo-700" />
              <span>Modalités Officielles de Règlement Agréées au Niger :</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 print:p-1.5 rounded border border-indigo-100 shadow-2xs">
                <span className="font-bold text-indigo-900 block text-[9.5px] print:text-[8.5px]">
                  📱 Dépôt Mobile MyNita :
                </span>
                <span className="font-mono font-black text-indigo-950 text-[11px] print:text-[9.5px] block">
                  +227 92 28 57 37
                </span>
                <span className="text-[8px] print:text-[7.5px] text-slate-500 block">
                  Compte Caisse CAS-MANI
                </span>
              </div>

              <div className="bg-white p-2 print:p-1.5 rounded border border-indigo-100 shadow-2xs">
                <span className="font-bold text-indigo-900 block text-[9.5px] print:text-[8.5px]">
                  📱 Transfert Amana :
                </span>
                <span className="font-mono font-black text-indigo-950 text-[11px] print:text-[9.5px] block">
                  +227 92 28 57 37
                </span>
                <span className="text-[8px] print:text-[7.5px] text-slate-500 block">
                  Caisse Centrale Niamey 2000
                </span>
              </div>

              <div className="bg-white p-2 print:p-1.5 rounded border border-indigo-100 shadow-2xs">
                <span className="font-bold text-indigo-900 block text-[9.5px] print:text-[8.5px]">
                  🏢 Caisse Physique :
                </span>
                <span className="font-bold text-slate-900 text-[10px] print:text-[9px] block">
                  Guichet Niamey 2000
                </span>
                <span className="text-[8px] print:text-[7.5px] text-slate-500 block">
                  Règlement Espèces immédiat
                </span>
              </div>
            </div>

            <p className="text-[8.5px] print:text-[7.5px] text-slate-500 italic mt-1.5">
              * Veuillez obligatoirement mentionner la référence de facture <strong className="text-slate-800">{data.invoiceNumber}</strong> ou le nom de l'élève lors du versement sur le <strong>+227 92 28 57 37</strong>.
            </p>
          </div>
        </section>

        {/* 5. ZONE D'ENGAGEMENT & SIGNATURES */}
        <section className={`pt-2 border-t border-slate-200 ${isCouponMode ? 'pb-1' : 'pb-3'}`}>
          <div className="flex items-center gap-1.5 text-[9px] print:text-[8px] text-slate-600 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
            <span>
              <strong>Engagement Pédagogique :</strong> Le respect scrupuleux des échéances de paiement garantit la continuité des cours, la rémunération des enseignants encadreurs et la sérénité du suivi de l'élève.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 print:gap-4 text-[10px] print:text-[8.5px]">
            {/* Bloc Signature Tuteur */}
            <div className="border border-slate-300 rounded-lg p-2.5 print:p-2 bg-slate-50/50 flex flex-col justify-between h-24 print:h-20">
              <div className="flex justify-between items-center text-slate-700 font-bold border-b border-slate-200 pb-1">
                <span>Le Tuteur / Client Payeur</span>
                <span className="text-[8px] font-normal italic">Mention "Lu et approuvé"</span>
              </div>
              <div className="text-[8px] text-slate-400 italic text-center">
                Date & Signature du Tuteur Légal
              </div>
            </div>

            {/* Bloc Signature & Cachet Officiel CAS-MANI */}
            <div className="border-2 border-indigo-900 rounded-lg p-2.5 print:p-2 bg-indigo-50/30 flex flex-col justify-between h-24 print:h-20 relative overflow-hidden">
              <div className="flex justify-between items-center text-indigo-950 font-black border-b border-indigo-200 pb-1">
                <span>La Caisse / Direction CAS-MANI</span>
                <span className="text-[8px] font-mono text-indigo-800">NIAMEY 2000</span>
              </div>

              {/* Authentic Digital Stamp Badge */}
              <div className="flex items-center justify-center gap-2 py-0.5">
                <img
                  src={CAB_APPUIS_LOGO}
                  alt="Sceau CAS-MANI"
                  className="w-9 h-9 print:w-7 print:h-7 rounded-full object-contain border border-indigo-900 bg-white p-0.5 shrink-0"
                />
                <div className="text-left leading-tight">
                  <div className="font-extrabold text-[8.5px] print:text-[7.5px] text-indigo-950 uppercase">
                    CAS-MANI RECOUVREMENT
                  </div>
                  <div className="text-[7.5px] print:text-[7px] text-emerald-800 font-bold font-mono">
                    VISA & CACHET OFFICIEL
                  </div>
                  <div className="text-[7px] print:text-[6.5px] text-slate-600 font-mono">
                    NIF: {CAB_APPUIS_INFO.nif} · RCCM: {CAB_APPUIS_INFO.rccm}
                  </div>
                </div>
              </div>

              <div className="text-[7.5px] print:text-[7px] text-slate-500 flex justify-between items-center">
                <span>Caissier : {cashierName}</span>
                <span className="font-mono">RÉF: CAS-MANI-{data.invoiceNumber}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* 6. COUPON DE DÉCOUPE / SOUCHE COMPTABLE (Bas de la feuille A4) */}
      {/* ============================================================== */}
      {isCouponMode && (
        <div className="relative z-10 mt-3 print:mt-2 pt-2 print:pt-1">
          {/* Ligne de découpe pointillée avec ciseaux */}
          <div className="relative flex items-center justify-center my-1 print:my-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-slate-400" />
            </div>
            <div className="relative bg-white px-3 text-[9px] print:text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 select-none">
              <Scissors className="h-3 w-3 text-slate-700" />
              <span>Ligne de Découpe · Talon de Caisse à Conserver par l'Administration</span>
              <Scissors className="h-3 w-3 text-slate-700 rotate-180" />
            </div>
          </div>

          {/* Corps de la Souche Comptable */}
          <div className="rounded-lg border-2 border-slate-700 bg-slate-50/90 p-2.5 print:p-2 text-[9.5px] print:text-[8.5px]">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white font-mono font-black text-[9px] print:text-[8px] px-1.5 py-0.5 rounded">
                  SOUCHE CAISSE
                </span>
                <strong className="text-slate-900 uppercase font-black text-[10px] print:text-[9px]">
                  CABINET D'APPUIS SCOLAIRE MANI (CAS-MANI)
                </strong>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 text-[10px] print:text-[9px]">
                  FACTURE N° {data.invoiceNumber}
                </span>
                <span className="text-slate-500 ml-2 font-mono text-[9px] print:text-[8px]">
                  ({data.monthLabel})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-slate-800">
              <div>
                <span className="text-[8px] uppercase text-slate-500 block">Élève Bénéficiaire :</span>
                <strong className="text-[10px] print:text-[9px] text-slate-950 block truncate">
                  {data.studentName}
                </strong>
                <span className="font-mono text-[8px] text-slate-600 block">
                  Matricule : {data.studentMatricule}
                </span>
              </div>

              <div>
                <span className="text-[8px] uppercase text-slate-500 block">Tuteur / Tél :</span>
                <strong className="text-[10px] print:text-[9px] text-slate-950 block truncate">
                  {data.guardianName}
                </strong>
                <span className="font-mono text-[8px] text-slate-600 block">
                  {data.guardianPhone}
                </span>
              </div>

              <div>
                <span className="text-[8px] uppercase text-slate-500 block">Net à Recouvrer :</span>
                <span className="font-mono font-black text-[12px] print:text-[10.5px] text-indigo-950 block">
                  {data.netDue.toLocaleString()} FCFA
                </span>
                <span className="text-[8px] text-rose-700 font-semibold block">
                  Limite : {data.dueDate}
                </span>
              </div>

              <div className="border-l border-slate-300 pl-2 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] uppercase text-slate-500 block">Mode de Règlement :</span>
                  <div className="flex gap-1 mt-0.5 text-[7.5px] text-slate-700">
                    <span className="border border-slate-300 px-1 rounded">MyNita</span>
                    <span className="border border-slate-300 px-1 rounded">Amana</span>
                    <span className="border border-slate-300 px-1 rounded">Espèces</span>
                  </div>
                </div>
                <div className="text-[7.5px] text-slate-500 mt-1 flex justify-between">
                  <span>Visa Caisse : _______</span>
                  <span>Date : __/__/2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
