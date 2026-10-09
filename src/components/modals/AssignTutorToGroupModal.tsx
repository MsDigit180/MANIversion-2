import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GraduationCap,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor, TutoringGroup } from '../../types';
import { extractTutoringGroups } from '../../utils/groupUtils';

interface AssignTutorToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroup?: TutoringGroup | null;
  initialTutor?: Tutor | null;
  onSuccess?: () => void;
}

export const AssignTutorToGroupModal: React.FC<AssignTutorToGroupModalProps> = ({
  isOpen,
  onClose,
  targetGroup = null,
  initialTutor = null,
  onSuccess,
}) => {
  const { tutors, students, assignTutorToGroup, showToast } = useApp();

  const allGroups = useMemo(() => extractTutoringGroups(students, tutors), [students, tutors]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [tutorSearchTerm, setTutorSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine active group & active tutor
  useEffect(() => {
    if (isOpen) {
      if (targetGroup) {
        setSelectedGroupId(targetGroup.id);
        setSelectedSubjects(targetGroup.subjects || []);
        if (initialTutor) {
          setSelectedTutorId(initialTutor.id);
        } else {
          const firstTutor = tutors[0];
          setSelectedTutorId(firstTutor ? firstTutor.id : '');
        }
      } else {
        if (allGroups.length > 0) {
          const g0 = allGroups[0];
          setSelectedGroupId(g0.id);
          setSelectedSubjects(g0.subjects || []);
        } else {
          setSelectedGroupId('');
          setSelectedSubjects([]);
        }
        if (initialTutor) {
          setSelectedTutorId(initialTutor.id);
        } else if (tutors.length > 0) {
          setSelectedTutorId(tutors[0].id);
        }
      }
    }
  }, [isOpen, targetGroup, initialTutor, allGroups, tutors]);

  const activeGroup = useMemo(() => {
    if (targetGroup && targetGroup.id === selectedGroupId) return targetGroup;
    return allGroups.find((g) => g.id === selectedGroupId) || null;
  }, [targetGroup, selectedGroupId, allGroups]);

  const activeTutor = useMemo(() => {
    if (initialTutor && initialTutor.id === selectedTutorId) return initialTutor;
    return tutors.find((t) => t.id === selectedTutorId) || null;
  }, [initialTutor, selectedTutorId, tutors]);

  // When group changes, update suggested subjects
  const handleGroupChange = (gId: string) => {
    setSelectedGroupId(gId);
    const grp = allGroups.find((g) => g.id === gId);
    if (grp) {
      setSelectedSubjects(grp.subjects || []);
    }
  };

  const filteredTutors = useMemo(() => {
    return (tutors || []).filter((t) => {
      if (!t) return false;
      const searchLower = (tutorSearchTerm ?? '').trim().toLowerCase();
      if (!searchLower) return true;
      const nameSafe = (t.fullName ?? '').toLowerCase();
      const matriculeSafe = (t.matricule ?? '').toLowerCase();
      const subjectsSafe = Array.isArray(t.subjects) ? t.subjects : [];
      const match =
        nameSafe.includes(searchLower) ||
        matriculeSafe.includes(searchLower) ||
        subjectsSafe.some((s) => (s ?? '').toLowerCase().includes(searchLower));
      return match;
    });
  }, [tutors, tutorSearchTerm]);

  const filteredGroups = useMemo(() => {
    return (allGroups || []).filter((g) => {
      if (!g) return false;
      const searchLower = (groupSearchTerm ?? '').trim().toLowerCase();
      if (!searchLower) return true;
      const nameSafe = (g.name ?? '').toLowerCase();
      const idSafe = (g.id ?? '').toLowerCase();
      const levelSafe = (g.level ?? '').toLowerCase();
      const match =
        nameSafe.includes(searchLower) ||
        idSafe.includes(searchLower) ||
        levelSafe.includes(searchLower);
      return match;
    });
  }, [allGroups, groupSearchTerm]);

  // Available subjects from group and tutor
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    if (activeGroup) {
      (activeGroup.subjects || []).forEach((s) => {
        if (s) set.add(s);
      });
    }
    if (activeTutor) {
      (activeTutor.subjects || []).forEach((s) => {
        if (s) set.add(s);
      });
    }
    return Array.from(set);
  }, [activeGroup, activeTutor]);

  if (!isOpen) return null;

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSelectAllGroupSubjects = () => {
    if (activeGroup) {
      setSelectedSubjects(activeGroup.subjects);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutorId || !selectedGroupId || isSubmitting) return;

    if (selectedSubjects.length === 0) {
      showToast('Veuillez sélectionner au moins une matière.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignTutorToGroup(selectedTutorId, selectedGroupId, selectedSubjects);
      if (res.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error assigning tutor to group:', err);
      showToast("Erreur lors de l'affectation de l'encadreur.", 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Affecter un Enseignant à un Groupe d'Encadrement
              </h2>
              <p className="text-xs text-slate-400">
                L'encadreur sera relié à l'ensemble des élèves du groupe pour les matières choisies.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Group Selection: either fixed if targetGroup provided, or selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>1. Groupe d'Encadrement Cible :</span>
              {targetGroup && (
                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800">
                  {targetGroup.id}
                </span>
              )}
            </label>

            {targetGroup ? (
              <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 font-bold">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {targetGroup.name} ({targetGroup.students.length} élèves)
                    </span>
                    <span className="text-[11px] text-indigo-300 block">
                      {targetGroup.level} · {targetGroup.stream} · Créneau : {targetGroup.timeSlot}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {targetGroup.sessionsPerWeek} séa/sem
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={selectedGroupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {allGroups.length === 0 ? (
                    <option value="">Aucun groupe existant</option>
                  ) : (
                    allGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.id} - {g.name} ({g.students.length} élèves · {g.level})
                      </option>
                    ))
                  )}
                </select>
                {activeGroup && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    📍 {activeGroup.timeSlot} · {activeGroup.sessionsPerWeek} séances/semaine · Matières : {activeGroup.subjects.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tutor Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>2. Enseignant / Encadreur à Affecter :</span>
              {activeTutor && (
                <span className="text-[11px] text-purple-300 font-semibold">
                  Sélectionné : {activeTutor.fullName}
                </span>
              )}
            </label>

            {initialTutor ? (
              <div className="rounded-xl border border-purple-900/50 bg-purple-950/30 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {initialTutor.avatar ? (
                    <img src={initialTutor.avatar} alt={initialTutor.fullName} className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                      {initialTutor.fullName[0]}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {initialTutor.fullName} ({initialTutor.matricule})
                    </span>
                    <span className="text-[11px] text-purple-300 block">
                      Spécialités : {initialTutor.subjects.join(', ')} · 📞 {initialTutor.phone}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher encadreur par nom ou matière..."
                    value={tutorSearchTerm}
                    onChange={(e) => setTutorSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-850 p-2">
                  {filteredTutors.map((tut) => {
                    const isSelected = tut.id === selectedTutorId;
                    const isAlreadyInGroup = activeGroup?.tutors.some((t) => t.id === tut.id);

                    return (
                      <div
                        key={tut.id}
                        onClick={() => setSelectedTutorId(tut.id)}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/60 border border-purple-500/60 shadow-sm'
                            : 'hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tut.avatar ? (
                            <img src={tut.avatar} alt={tut.fullName} className="h-7 w-7 rounded-lg object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                              {tut.fullName[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white text-xs">{tut.fullName}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[260px]">
                              {tut.subjects.join(', ')}
                            </div>
                          </div>
                        </div>

                        {isAlreadyInGroup ? (
                          <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Déjà affecté
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tut.assignedStudentIds?.length || 0} él.
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                3. Matières attribuées à cet enseignant pour le groupe :
              </label>
              {activeGroup && (
                <button
                  type="button"
                  onClick={handleSelectAllGroupSubjects}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Toutes les matières du groupe
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-800 bg-slate-850">
              {availableSubjects.length === 0 ? (
                <span className="text-xs text-slate-500 italic">Aucune matière disponible</span>
              ) : (
                availableSubjects.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  const isTutorDiscipline = activeTutor?.subjects.includes(sub);

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      <div
                        className={`h-3.5 w-3.5 rounded flex items-center justify-center border text-[9px] ${
                          isSelected ? 'border-white bg-purple-700' : 'border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{sub}</span>
                      {isTutorDiscipline && (
                        <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1 rounded">
                          Spécialité
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Effect summary */}
          {activeTutor && activeGroup && selectedSubjects.length > 0 && (
            <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-3 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200">
                <span className="font-bold">Confirmation d'affectation : </span>
                <span>
                  <strong>{activeTutor.fullName}</strong> sera affecté à l'ensemble des{' '}
                  <strong>{activeGroup.students.length} élèves</strong> du groupe{' '}
                  <strong>{activeGroup.name}</strong> ({activeGroup.id}) pour :{' '}
                  <strong className="text-white">{selectedSubjects.join(', ')}</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedTutorId || !selectedGroupId || selectedSubjects.length === 0 || isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white shadow transition-colors cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            <span>{isSubmitting ? 'Affectation...' : "Valider l'Affectation au Groupe"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
