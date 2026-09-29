import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Clock,
  Phone,
  CheckSquare,
  Square,
  ChevronRight,
  Shield,
  Award,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExamApplication } from '../../types';

export const ConcoursTab: React.FC = () => {
  const { exams, setIsNewExamModalOpen, toggleExamPiece, validateExamDossier, showToast } = useApp();
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [activeDossierForChecklist, setActiveDossierForChecklist] = useState<ExamApplication | null>(null);

  const filteredExams = exams.filter((ex) => {
    const matchesSearch =
      ex.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      ex.dossierNumber.toLowerCase().includes(search.toLowerCase()) ||
      ex.examBatch.toLowerCase().includes(search.toLowerCase()) ||
      ex.contactPhone.includes(search);

    const matchesExamType = examTypeFilter === 'all' || ex.examType === examTypeFilter;
    const matchesStatus = statusFilter === 'all' || ex.status === statusFilter;

    return matchesSearch && matchesExamType && matchesStatus;
  });

  const getStatusBadge = (status: ExamApplication['status']) => {
    switch (status) {
      case 'Validé':
      case 'Admis':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>{status}</span>
          </span>
        );
      case 'Pièces manquantes':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            <span>Incomplet</span>
          </span>
        );
      case 'En instruction':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>En instruction</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Highlights - Niger Civil Service Exams */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">ENA / ENAM</span>
            <span className="rounded bg-indigo-50 dark:bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-700 dark:text-indigo-300">Niamey</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">28 candidats</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Admin & Magistrature</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Police Nationale</span>
            <span className="rounded bg-blue-50 dark:bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 dark:text-blue-300">ENP</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">22 candidats</div>
          <div className="text-[10px] text-blue-600 dark:text-blue-300 mt-1">Inspecteurs & Gardiens</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Gendarmerie</span>
            <span className="rounded bg-emerald-50 dark:bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">Koira Tegui</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">19 candidats</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-1">Sous-Officiers</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Garde Nationale</span>
            <span className="rounded bg-amber-50 dark:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-800 dark:text-amber-300">GNN</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">15 candidats</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-300 mt-1">Défense & Sécurité</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Santé (ENSP)</span>
            <span className="rounded bg-rose-50 dark:bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-mono text-rose-700 dark:text-rose-300">ENSP</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">17 candidats</div>
          <div className="text-[10px] text-rose-600 dark:text-rose-300 mt-1">Infirmiers & Sages-Femmes</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Douanes & Trésor</span>
            <span className="rounded bg-purple-50 dark:bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300">Finances</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">14 candidats</div>
          <div className="text-[10px] text-purple-600 dark:text-purple-300 mt-1">Contrôleurs & Agents</div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher candidat, dossier, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <select
            value={examTypeFilter}
            onChange={(e) => setExamTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Tous Concours</option>
            <option value="ENA / ENAM">ENA / ENAM</option>
            <option value="Police Nationale">Police Nationale</option>
            <option value="Gendarmerie Nationale">Gendarmerie Nationale</option>
            <option value="Garde Nationale (GNN)">Garde Nationale (GNN)</option>
            <option value="Santé Publique (ENSP)">Santé Publique (ENSP)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Tous Statuts</option>
            <option value="Validé">Dossiers Complets (Validés)</option>
            <option value="Pièces manquantes">Pièces Manquantes</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewExamModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle Candidature</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">N° Dossier & Date</th>
                <th className="py-3 px-4">Candidat (Niamey)</th>
                <th className="py-3 px-4">Corps / Concours Visé</th>
                <th className="py-3 px-4">Pièces Fournies</th>
                <th className="py-3 px-4">Statut Dossier</th>
                <th className="py-3 px-4">Agent Enregistreur</th>
                <th className="py-3 px-4 text-right">Vérification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">Aucune candidature ne correspond à ce filtre.</p>
                  </td>
                </tr>
              ) : (
                filteredExams.map((ex) => {
                  const progressPct = Math.round(
                    (ex.submittedPieces.length / ex.requiredPieces.length) * 100
                  );

                  return (
                    <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {ex.dossierNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ex.submissionDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {ex.candidateName}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{ex.contactPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {ex.examType}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ex.examBatch}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full ${
                                progressPct === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {ex.submittedPieces.length}/{ex.requiredPieces.length}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(ex.status)}
                      </td>

                      {/* Explicit Agent Traceability (USER REQUIREMENT) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200 font-medium">
                          <BadgeCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          <span>{ex.agentName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ex.agentRole}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveDossierForChecklist(ex)}
                          className="px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[11px] font-semibold hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                        >
                          Checklist ({ex.submittedPieces.length}/{ex.requiredPieces.length})
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist Side Modal */}
      {activeDossierForChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Checklist Dossier : {activeDossierForChecklist.dossierNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Candidat : {activeDossierForChecklist.candidateName} · {activeDossierForChecklist.examType}
                </p>
              </div>
              <button
                onClick={() => setActiveDossierForChecklist(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activeDossierForChecklist.requiredPieces.map((piece, idx) => {
                const isChecked = activeDossierForChecklist.submittedPieces.includes(piece);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleExamPiece(activeDossierForChecklist.id, piece)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        isChecked
                          ? 'text-slate-900 dark:text-white font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {piece}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  validateExamDossier(activeDossierForChecklist.id);
                  setActiveDossierForChecklist(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Valider toutes les pièces
              </button>
              <button
                onClick={() => setActiveDossierForChecklist(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
