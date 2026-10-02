import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  Users,
  Check,
  Plus,
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, TutoringGroup } from '../../types';
import { extractTutoringGroups } from '../../utils/groupUtils';

interface SelectGroupForStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SelectGroupForStudentModal: React.FC<SelectGroupForStudentModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const { students, tutors, assignStudentToGroup, removeStudentFromGroup, showToast } = useApp();

  const allGroups = useMemo(() => extractTutoringGroups(students, tutors), [students, tutors]);

  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // New group fields
  const [newGroupId, setNewGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize
  React.useEffect(() => {
    if (isOpen && student) {
      if (student.groupId) {
        setSelectedGroupId(student.groupId);
      } else {
        // Find best matching group by level
        const matchingGroup = allGroups.find(
          (g) => g.level.toLowerCase() === student.level.toLowerCase()
        ) || allGroups[0];

        setSelectedGroupId(matchingGroup ? matchingGroup.id : '');
      }

      setNewGroupId(`GRP-${student.level.split(' ')[0].toUpperCase()}-${String(allGroups.length + 1)}`);
      setNewGroupName(`Groupe ${student.level} Encadrement`);
      setNewTimeSlot('Samedi & Dimanche 09h-11h');
    }
  }, [isOpen, student, allGroups]);

  if (!isOpen || !student) return null;

  const currentGroup = allGroups.find((g) => g.id.toLowerCase() === student.groupId?.toLowerCase());

  const handleAssignExisting = async () => {
    if (!selectedGroupId || isSubmitting) return;

    const targetGrp = allGroups.find((g) => g.id === selectedGroupId);
    setIsSubmitting(true);
    try {
      const res = await assignStudentToGroup(
        student.id,
        selectedGroupId,
        targetGrp?.name,
        targetGrp?.timeSlot
      );
      if (res.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndAssignNew = async () => {
    if (!newGroupId.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await assignStudentToGroup(
        student.id,
        newGroupId.trim(),
        newGroupName.trim() || undefined,
        newTimeSlot.trim() || undefined
      );
      if (res.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromGroup = async () => {
    if (window.confirm(`Confirmez-vous le retrait de l'élève "${student.fullName}" de son groupe actuel ?`)) {
      setIsSubmitting(true);
      try {
        await removeStudentFromGroup(student.id);
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{student.fullName}</span>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {student.matricule}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {student.level} · {student.stream} · {student.sessionsPerWeek} séances/semaine
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

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Current Status banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Statut Actuel :</span>
                {student.groupId ? (
                  <span className="text-xs text-indigo-300 font-medium">
                    Membre du groupe <strong className="font-mono">{student.groupId}</strong> ({student.groupName || currentGroup?.name})
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Encadrement individuel (Aucun groupe collectif assigné)
                  </span>
                )}
              </div>
            </div>

            {student.groupId && (
              <button
                type="button"
                onClick={handleRemoveFromGroup}
                disabled={isSubmitting}
                className="px-2.5 py-1 rounded-lg border border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer"
                title="Retirer du groupe pour repasser en individuel pur"
              >
                Retirer du groupe
              </button>
            )}
          </div>

          {/* Mode Switcher: Existing vs New Group */}
          <div className="flex items-center rounded-xl bg-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                mode === 'existing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Choisir un Groupe Existant ({allGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                mode === 'new'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              + Créer un Nouveau Groupe
            </button>
          </div>

          {/* Mode 1: Existing Groups List */}
          {mode === 'existing' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Sélectionnez le groupe d'encadrement à intégrer :
              </label>

              {allGroups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Aucun groupe existant. Cliquez sur "+ Créer un Nouveau Groupe" ci-dessus.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {allGroups.map((grp) => {
                    const isSelected = selectedGroupId === grp.id;
                    const isSameLevel = grp.level.toLowerCase() === student.level.toLowerCase();
                    const isCurrent = student.groupId?.toUpperCase() === grp.id.toUpperCase();

                    return (
                      <div
                        key={grp.id}
                        onClick={() => setSelectedGroupId(grp.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500/80 shadow-sm'
                            : 'bg-slate-850 hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                              {grp.id}
                            </span>
                            <span className="font-bold text-white text-xs">{grp.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                Groupe actuel
                              </span>
                            )}
                            {isSameLevel && !isCurrent && (
                              <span className="text-[9.5px] font-semibold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                Recommandé ({grp.level})
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                              {grp.students.length} él.
                            </span>
                          </div>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>📍 {grp.timeSlot}</span>
                          <span>·</span>
                          <span>{grp.sessionsPerWeek} séa/sem</span>
                          <span>·</span>
                          <span>Encadreurs : {grp.tutors.length > 0 ? grp.tutors.map((t) => t.name).join(', ') : 'Aucun'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Create New Group */}
          {mode === 'new' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Code / Identifiant du Groupe (ex: GRP-3EME-SCI) :
                </label>
                <input
                  type="text"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="GRP-..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Libellé du Groupe :
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="ex: Groupe Terminale D Sciences"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Créneau Horaire Mutualisé :
                </label>
                <input
                  type="text"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="ex: Samedi & Dimanche 09h-11h"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200">
                <span>
                  Ce groupe sera immédiatement créé avec <strong>{student.fullName}</strong> comme premier élève inscrit. Vous pourrez ensuite y ajouter d'autres élèves et lui affecter un ou plusieurs enseignants.
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
            onClick={mode === 'existing' ? handleAssignExisting : handleCreateAndAssignNew}
            disabled={
              (mode === 'existing' && !selectedGroupId) ||
              (mode === 'new' && !newGroupId.trim()) ||
              isSubmitting
            }
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white shadow transition-colors cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>
              {isSubmitting
                ? 'Affectation en cours...'
                : mode === 'existing'
                ? "Affecter à ce Groupe"
                : "Créer et Affecter au Groupe"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
