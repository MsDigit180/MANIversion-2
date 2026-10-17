import React from 'react';
import { GraduationCap, Users, Clock, ShieldCheck, Award } from 'lucide-react';
import { Tutor, Student } from '../../types';
import { formatSessionHours } from '../../utils/dateUtils';
import {
  calculateTutorWeeklySessions,
  getTutorStudentWeeklySessions,
  getTutorStudentAssignedSubjects,
  isPrimaryStudent,
} from '../../utils/tutorAssignmentValidation';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';

interface OfficialAssignmentTableA4DocumentProps {
  tutors: Tutor[];
  students: Student[];
  onClose?: () => void;
}

export const OfficialAssignmentTableA4Document: React.FC<OfficialAssignmentTableA4DocumentProps> = ({
  tutors,
  students,
  onClose,
}) => {
  const safeTutors = tutors || [];
  const safeStudents = students || [];

  const getTutorStats = (t: Tutor) => {
    const assignedIds = Array.isArray(t.assignedStudentIds) ? t.assignedStudentIds : [];
    const assignedStudents = safeStudents.filter((s) => s && assignedIds.includes(s.id));
    const totalSessions = calculateTutorWeeklySessions(t, safeStudents);
    return {
      assignedStudents,
      totalSessions,
      studentsCount: assignedStudents.length,
    };
  };

  const totalTutors = safeTutors.length;
  const totalStudentsAssigned = safeTutors.reduce((acc, t) => acc + (t?.assignedStudentIds?.length || 0), 0);
  const totalSessionsAll = safeTutors.reduce((acc, t) => acc + getTutorStats(t).totalSessions, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 my-auto print:m-0 print:p-0 print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Print / Close Actions Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            <span>Aperçu avant impression PDF (Tableau Officiel des Affectations)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              Imprimer / Enregistrer en PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            )}
          </div>
        </div>

        {/* Printable A4 Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-6">
            <div className="flex items-center gap-3">
              <img
                src={CAB_APPUIS_LOGO}
                alt="Logo Cabinet MANI"
                className="h-14 w-14 rounded-xl object-contain border border-indigo-200 p-1 bg-white shadow-sm"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {CAB_APPUIS_INFO.name}
                </h1>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  {CAB_APPUIS_INFO.subtitle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Siège : {CAB_APPUIS_INFO.address} · Tél : {CAB_APPUIS_INFO.phones[0]}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                TABLEAU OFFICIEL DES AFFECTATIONS
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Édition du {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                NIF: {CAB_APPUIS_INFO.nif} · RCCM: {CAB_APPUIS_INFO.rccm}
              </p>
            </div>
          </div>

          {/* Summary KPI Box */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Encadreurs</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">{totalTutors}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Élèves Encadrés</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{totalStudentsAssigned}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Volume Séances Semaine</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{totalSessionsAll} séances</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-indigo-600 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">N°</th>
                  <th className="py-3 px-3.5">Nom Complet de l'Encadreur</th>
                  <th className="py-3 px-3.5">Élèves Encadrés & Classes</th>
                  <th className="py-3 px-3.5 text-center w-28">Nombre de Séances</th>
                  <th className="py-3 px-3.5 text-center w-24">Nombre d'Élèves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {safeTutors.map((t, idx) => {
                  const stats = getTutorStats(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{t.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {t.matricule} · {Array.isArray(t.subjects) ? t.subjects.join(', ') : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 align-top">
                        {stats.assignedStudents.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">Aucun élève affecté</span>
                        ) : (
                          <div className="space-y-1">
                            {stats.assignedStudents.map((s) => {
                              const sSessions = getTutorStudentWeeklySessions(t, s);
                              const sSubjects = getTutorStudentAssignedSubjects(t, s);
                              const isPrimary = isPrimaryStudent(s);
                              return (
                                <div key={s.id} className="text-xs flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-0.5 last:border-0">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">• {s.fullName}</span>
                                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded">
                                    {s.level} {!isPrimary && sSubjects.length > 0 ? `[${sSubjects.join(', ')}] ` : ''}({sSessions}s/sem)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center align-top font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {stats.totalSessions} <span className="text-[10px] font-normal text-slate-500">séances</span>
                      </td>
                      <td className="py-3 px-3.5 text-center align-top font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {stats.studentsCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer & Signatures */}
          <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Cabinet d'Appuis Scolaire MANI</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Direction Pédagogique & Suivi des Affectations</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-8">Visa de la Direction / Pédagogie</p>
              <div className="h-12 border-b border-dashed border-slate-400 w-48"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
