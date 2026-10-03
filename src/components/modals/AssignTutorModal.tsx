import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Lock,
  Loader2,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, Tutor } from '../../types';
import {
  isPrimaryStudent,
  getPrimaryTutorForStudent,
  getAssignedSubjectsMapForStudent,
  validateTutorAssignment,
  normalizeSubjectName,
} from '../../utils/tutorAssignmentValidation';
import {
  formatSessionHours,
  calculateWeeklyHours,
  SESSION_DURATION_HOURS,
} from '../../utils/dateUtils';

interface AssignTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: Student | null;
  initialTutor?: Tutor | null;
}

export const AssignTutorModal: React.FC<AssignTutorModalProps> = ({
  isOpen,
  onClose,
  initialStudent = null,
  initialTutor = null,
}) => {
  const {
    students,
    tutors,
    assignTutorToStudent,
    unassignTutorFromStudent,
    showToast,
  } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const safeStudents = students || [];
  const safeTutors = tutors || [];

  // Initialisation lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialStudent) {
        setSelectedStudentId(initialStudent.id);
      } else if (safeStudents.length > 0) {
        setSelectedStudentId(safeStudents[0].id);
      } else {
        setSelectedStudentId('');
      }

      if (initialTutor) {
        setSelectedTutorId(initialTutor.id);
      } else if (safeTutors.length > 0) {
        setSelectedTutorId(safeTutors[0].id);
      } else {
        setSelectedTutorId('');
      }

      setSelectedSubjects([]);
    }
  }, [isOpen, initialStudent, initialTutor, safeStudents, safeTutors]);

  const selectedStudent = useMemo(
    () => safeStudents.find((s) => s.id === selectedStudentId) || null,
    [safeStudents, selectedStudentId]
  );

  const selectedTutor = useMemo(
    () => safeTutors.find((t) => t.id === selectedTutorId) || null,
    [safeTutors, selectedTutorId]
  );

  const isPrimary = useMemo(
    () => (selectedStudent ? isPrimaryStudent(selectedStudent) : false),
    [selectedStudent]
  );

  // Encadreur primaire actuel
  const currentPrimaryTutor = useMemo(() => {
    if (!selectedStudent || !isPrimary) return null;
    return getPrimaryTutorForStudent(selectedStudent, safeTutors);
  }, [selectedStudent, isPrimary, safeTutors]);

  // Carte des matières déjà couvertes par d'autres encadreurs pour cet élève
  const assignedSubjectsMap = useMemo(() => {
    if (!selectedStudent) return new Map();
    return getAssignedSubjectsMapForStudent(selectedStudent, safeTutors, selectedTutorId);
  }, [selectedStudent, safeTutors, selectedTutorId]);

  // Pré-sélection des matières lorsque le tuteur ou l'élève change
  useEffect(() => {
    if (!selectedStudent || !selectedTutor) {
      setSelectedSubjects([]);
      return;
    }

    if (isPrimary) {
      // Pour le primaire, l'encadreur prend en charge l'ensemble des matières
      setSelectedSubjects(selectedStudent.subjects || []);
      return;
    }

    // Pour collège / lycée : présélectionner les matières compatibles non encore attribuées à un autre
    const currentSubjectsWithThisTutor =
      selectedTutor.assignedStudentSubjects?.[selectedStudent.id] || [];

    if (currentSubjectsWithThisTutor.length > 0) {
      setSelectedSubjects(currentSubjectsWithThisTutor);
    } else {
      // Suggérer les matières enseignées par ce tuteur qui sont dans le programme de l'élève et pas encore couvertes
      const availableMatches = (selectedStudent.subjects || []).filter((stuSubj) => {
        const isTaughtByTutor = (selectedTutor.subjects || []).some(
          (tSubj) => normalizeSubjectName(tSubj) === normalizeSubjectName(stuSubj)
        );
        const isAlreadyCoveredByOther = assignedSubjectsMap.has(
          normalizeSubjectName(stuSubj)
        );
        return isTaughtByTutor && !isAlreadyCoveredByOther;
      });
      setSelectedSubjects(availableMatches);
    }
  }, [selectedStudent, selectedTutor, isPrimary, assignedSubjectsMap]);

  // Validation en temps réel selon les règles strictes
  const validationResult = useMemo(() => {
    if (!selectedStudent || !selectedTutor) {
      return { valid: false, error: 'Veuillez sélectionner un élève et un encadreur.' };
    }

    return validateTutorAssignment({
      student: selectedStudent,
      targetTutorId: selectedTutor.id,
      targetSubjects: isPrimary ? (selectedStudent.subjects || []) : selectedSubjects,
      allTutors: safeTutors,
    });
  }, [selectedStudent, selectedTutor, selectedSubjects, isPrimary, safeTutors]);

  if (!isOpen) return null;

  const handleSubjectToggle = (subject: string) => {
    if (isPrimary) return; // Non modifiable individuellement pour le primaire

    const isAlreadyCovered = assignedSubjectsMap.has(normalizeSubjectName(subject));
    if (isAlreadyCovered) {
      const conflict = assignedSubjectsMap.get(normalizeSubjectName(subject));
      showToast(
        `Erreur : Cet élève a déjà un encadreur attribué pour la matière [${conflict?.subjectName || subject}].`,
        'warning'
      );
      return;
    }

    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleRemoveCurrentPrimaryTutor = async () => {
    if (!selectedStudent || !currentPrimaryTutor) return;
    try {
      await unassignTutorFromStudent(currentPrimaryTutor.id, selectedStudent.id);
      showToast(
        `L'encadreur actuel (${currentPrimaryTutor.fullName}) a été retiré. Vous pouvez maintenant affecter le nouvel encadreur référent.`,
        'success'
      );
    } catch (e) {
      showToast('Erreur lors du retrait de l\'encadreur.', 'warning');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !selectedTutor) {
      showToast('Veuillez sélectionner un élève et un encadreur.', 'warning');
      return;
    }

    if (!validationResult.valid) {
      showToast(validationResult.error || "Règle de validation non respectée", 'warning');
      return;
    }

    if (!isPrimary && selectedSubjects.length === 0) {
      showToast('Veuillez sélectionner au moins une matière à encadrer.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignTutorToStudent(
        selectedTutor.id,
        selectedStudent.id,
        isPrimary ? selectedStudent.subjects : selectedSubjects
      );

      if (res.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = safeStudents.filter(
    (s) =>
      (s.fullName || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.matricule || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.level || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Affectation d'un Encadreur & Contrôle d'Intégrité
              </h3>
              <p className="text-xs text-slate-400">
                Verrous techniques et règles strictes anti-double affectation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* SÉLECTION DE L'ÉLÈVE */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>1. Sélectionner l'Élève *</span>
              {selectedStudent && (
                <span className="text-[11px] font-mono text-indigo-400 font-bold">
                  {selectedStudent.matricule} · {selectedStudent.level}
                </span>
              )}
            </label>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer font-medium"
            >
              {safeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName || 'Élève'} ({s.matricule || 'N/A'}) — {s.level || 'Non spécifié'} [{s.stream || 'Général'}] ({s.sessionsPerWeek || 3} séa./sem.)
                </option>
              ))}
            </select>
          </div>

          {/* CARTE RÉCAPITULATIF DE L'ÉLÈVE SÉLECTIONNÉ */}
          {selectedStudent && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden ring-2 ring-indigo-500/30 shrink-0">
                  <img
                    src={selectedStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={selectedStudent.fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{selectedStudent.fullName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPrimary
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {selectedStudent.stream}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {selectedStudent.level} · Tuteur légal : {selectedStudent.guardianName}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono text-[11px] font-bold">
                  <Calendar className="h-3 w-3" />
                  {selectedStudent.sessionsPerWeek || 3} séances/sem.
                </span>
                <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                  = {formatSessionHours(calculateWeeklyHours(selectedStudent.sessionsPerWeek || 3))} (1h30/séance)
                </span>
              </div>
            </div>
          )}

          {/* RÈGLE 1 - CAS PARTICULIER PRIMAIRE (1 SEUL ENCADREUR) */}
          {isPrimary && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-200">
                    RÈGLE STRICTE NIVEAU PRIMAIRE (CFEPD & Classes Élémentaires)
                  </h4>
                  <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
                    Un élève inscrit au niveau "Primaire" ne peut avoir qu'<strong>UN SEUL ET UNIQUE encadreur référent</strong> qui assure l'ensemble du suivi pédagogique.
                  </p>
                </div>
              </div>

              {currentPrimaryTutor && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentPrimaryTutor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                      alt={currentPrimaryTutor.fullName}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-amber-400"
                    />
                    <div>
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                        Encadreur référent actuellement attribué :
                      </span>
                      <span className="font-bold text-white text-xs">{currentPrimaryTutor.fullName}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({currentPrimaryTutor.matricule})</span>
                    </div>
                  </div>

                  {currentPrimaryTutor.id !== selectedTutorId && (
                    <button
                      type="button"
                      onClick={handleRemoveCurrentPrimaryTutor}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Retirer l'encadreur actuel</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SÉLECTION DE L'ENCADREUR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>2. Choisir l'Encadreur Référent *</span>
              {selectedTutor && (
                <span className="text-[11px] font-mono text-indigo-400 font-bold">
                  {selectedTutor.matricule} · {selectedTutor.phone}
                </span>
              )}
            </label>

            <select
              value={selectedTutorId}
              onChange={(e) => setSelectedTutorId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer font-medium"
            >
              {safeTutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || 'Enseignant'} ({t.matricule || 'N/A'}) — Matières : {(t.subjects || []).join(', ')} [{(t.levels || []).join(', ')}]
                </option>
              ))}
            </select>
          </div>

          {/* RÈGLE 2 - SÉLECTION DES MATIÈRES & DÉSACTIVATION DYNAMIQUE (COLLÈGE & LYCÉE) */}
          {!isPrimary && selectedStudent && selectedTutor && (
            <div className="rounded-xl border border-indigo-500/40 bg-slate-800/80 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    <span>3. Matières Attribuées à cet Encadreur *</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Règle stricte Collège & Lycée : Deux encadreurs ne peuvent PAS encadrer pour la même matière.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700 text-indigo-300">
                  {selectedSubjects.length} sélectionnée(s)
                </span>
              </div>

              {/* LISTE DYNAMIQUE DES MATIÈRES DE L'ÉLÈVE */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedStudent.subjects.map((subject) => {
                  const normalized = normalizeSubjectName(subject);
                  const isConflict = assignedSubjectsMap.has(normalized);
                  const conflictTutor = isConflict ? assignedSubjectsMap.get(normalized)?.tutor : null;
                  const isAssignedToOther = isConflict && conflictTutor?.id !== selectedTutor.id;
                  const isCurrentlySelected = selectedSubjects.includes(subject);

                  // Matière enseignée par le tuteur choisi ?
                  const isTaughtBySelectedTutor = selectedTutor.subjects.some(
                    (s) => normalizeSubjectName(s) === normalized
                  );

                  return (
                    <div
                      key={subject}
                      onClick={() => !isAssignedToOther && handleSubjectToggle(subject)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        isAssignedToOther
                          ? 'bg-rose-950/40 border-rose-900/60 text-slate-400 cursor-not-allowed opacity-80'
                          : isCurrentlySelected
                          ? 'bg-indigo-950 border-indigo-500 text-white shadow-xs cursor-pointer'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-750 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          disabled={isAssignedToOther}
                          checked={isCurrentlySelected}
                          onChange={() => {}}
                          className={`rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 ${
                            isAssignedToOther ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isAssignedToOther ? 'line-through text-slate-400' : ''}`}>
                              {subject}
                            </span>
                            {isTaughtBySelectedTutor && !isAssignedToOther && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Dans les compétences de l'encadreur
                              </span>
                            )}
                          </div>

                          {/* ALERTE VISUELLE POUR LES MATIÈRES DÉJÀ COUVERTES */}
                          {isAssignedToOther && conflictTutor && (
                            <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5 font-medium">
                              <Lock className="h-3 w-3 shrink-0" />
                              <span>Déjà attribuée à : <strong>{conflictTutor.fullName}</strong> ({conflictTutor.matricule})</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Statut badge */}
                      <div>
                        {isAssignedToOther ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/50 text-rose-300 border border-rose-700/50">
                            <Lock className="h-2.5 w-2.5" />
                            DÉSACTIVÉ
                          </span>
                        ) : isCurrentlySelected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Sélectionné
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BANNIÈRE DE VALIDATION STRICTE (MESSAGE D'ERREUR VISUEL REQUIS) */}
          {!validationResult.valid && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-rose-100 uppercase tracking-wider text-[11px]">
                  Verrou Technique & Blocage Métier
                </strong>
                <span className="font-semibold text-rose-200 block mt-0.5">
                  {validationResult.error}
                </span>
                {validationResult.conflictingTutor && (
                  <span className="text-[11px] text-rose-300/90 block mt-1">
                    Encadreur actuel en conflit : <strong>{validationResult.conflictingTutor.fullName}</strong> ({validationResult.conflictingTutor.phone})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* RAPPEL DU VOLUME HORAIRE DÉDUIT (1 SÉANCE = 1H 30MN) */}
          {validationResult.valid && selectedStudent && selectedTutor && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Validation réussie : Quota élève de <strong>{selectedStudent.sessionsPerWeek || 3} séances/semaine</strong>.
                </span>
              </div>
              <span className="font-mono text-emerald-300 font-bold bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/60 text-[11px]">
                1 séance = 1h 30mn
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !validationResult.valid}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow transition-colors ${
                !validationResult.valid
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>
                {isSubmitting
                  ? 'Validation en cours...'
                  : 'Valider et Enregistrer l\'Affectation'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
