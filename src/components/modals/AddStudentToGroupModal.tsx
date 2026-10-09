import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Check,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, TutoringGroup } from '../../types';

interface AddStudentToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroup: TutoringGroup | null;
  onSuccess?: () => void;
}

export const AddStudentToGroupModal: React.FC<AddStudentToGroupModalProps> = ({
  isOpen,
  onClose,
  targetGroup,
  onSuccess,
}) => {
  const { students, assignStudentToGroup, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'no_group' | 'same_level'>('no_group');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group's existing student IDs
  const existingStudentIds = useMemo(() => {
    if (!targetGroup) return new Set<string>();
    return new Set(targetGroup.students.map((s) => s.id));
  }, [targetGroup]);

  // Candidates list
  const filteredCandidates = useMemo(() => {
    if (!targetGroup) return [];

    return (students || []).filter((stu) => {
      if (!stu) return false;
      const searchLower = (searchTerm ?? '').trim().toLowerCase();
      const nameSafe = (stu.fullName ?? '').toLowerCase();
      const matriculeSafe = (stu.matricule ?? '').toLowerCase();
      const guardianSafe = (stu.guardianName ?? '').toLowerCase();
      const levelSafe = (stu.level ?? '').toLowerCase();
      const streamSafe = (stu.stream ?? '').toLowerCase();

      // Don't show students already in this group in the selectable list, or flag them
      const matchesSearch =
        !searchLower ||
        nameSafe.includes(searchLower) ||
        matriculeSafe.includes(searchLower) ||
        guardianSafe.includes(searchLower) ||
        levelSafe.includes(searchLower);

      if (!matchesSearch) return false;

      if (filterMode === 'no_group') {
        return !stu.groupId || !stu.groupId.trim();
      }

      if (filterMode === 'same_level') {
        const targetLevel = (targetGroup.level ?? '').toLowerCase();
        const targetStream = (targetGroup.stream ?? '').toLowerCase();
        const sameLevel = levelSafe === targetLevel;
        const sameStream = streamSafe === targetStream;
        return sameLevel || sameStream;
      }

      return true;
    });
  }, [students, targetGroup, searchTerm, filterMode]);

  if (!isOpen || !targetGroup) return null;

  const toggleStudentSelection = (studentId: string) => {
    if (existingStudentIds.has(studentId)) return; // already in group

    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllVisible = () => {
    const selectable = filteredCandidates
      .filter((s) => !existingStudentIds.has(s.id))
      .map((s) => s.id);
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...selectable])));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      for (const sId of selectedStudentIds) {
        await assignStudentToGroup(
          sId,
          targetGroup.id,
          targetGroup.name,
          targetGroup.timeSlot
        );
      }
      showToast(
        `✅ ${selectedStudentIds.length} élève(s) ajouté(s) avec succès au groupe ${targetGroup.name}.`,
        'success'
      );
      setSelectedStudentIds([]);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error adding students to group:', err);
      showToast("Erreur lors de l'ajout des élèves au groupe.", 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded">
                  {targetGroup.id}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {targetGroup.level} · {targetGroup.stream}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Ajouter des Élèves au Groupe : {targetGroup.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, matricule ou parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-800 p-0.5 text-xs w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => setFilterMode('no_group')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'no_group' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sans Groupe
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('same_level')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'same_level' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Même Niveau ({targetGroup.level})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous les Élèves
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {filteredCandidates.length} élève(s) trouvé(s) · {selectedStudentIds.length} sélectionné(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Tout sélectionner
              </button>
              {selectedStudentIds.length > 0 && (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] text-slate-400 hover:text-slate-300 underline cursor-pointer"
                  >
                    Désélectionner tout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Students list */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 divide-y divide-slate-800/60">
          {filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-semibold text-white">Aucun élève disponible</p>
              <p className="text-xs text-slate-400 mt-1">
                Modifiez vos filtres ou effectuez une recherche par nom.
              </p>
            </div>
          ) : (
            filteredCandidates.map((stu) => {
              const isAlreadyInGroup = existingStudentIds.has(stu.id);
              const isSelected = selectedStudentIds.includes(stu.id);
              const isInAnotherGroup = !!stu.groupId && stu.groupId !== targetGroup.id;

              return (
                <div
                  key={stu.id}
                  onClick={() => !isAlreadyInGroup && toggleStudentSelection(stu.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    isAlreadyInGroup
                      ? 'bg-slate-800/30 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-950/50 border border-indigo-500/50 shadow-sm cursor-pointer'
                      : 'hover:bg-slate-800/60 cursor-pointer border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${
                        isAlreadyInGroup
                          ? 'border-slate-600 bg-slate-700 text-slate-400'
                          : isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {(isSelected || isAlreadyInGroup) && <Check className="h-3.5 w-3.5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{stu.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {stu.matricule}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{stu.level}</span>
                        <span>·</span>
                        <span>Tuteur : {stu.guardianName} ({stu.guardianPhone})</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {isAlreadyInGroup ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Déjà membre</span>
                      </span>
                    ) : isInAnotherGroup ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title={`Actuellement dans ${stu.groupId}`}>
                        <span>Groupe {stu.groupId}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        <span>Sans groupe</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {selectedStudentIds.length === 0 ? (
              <span>Sélectionnez au moins un élève pour l'intégrer au groupe.</span>
            ) : (
              <span className="text-indigo-300 font-semibold">
                {selectedStudentIds.length} élève(s) sélectionné(s) pour intégrer {targetGroup.id} ({targetGroup.timeSlot})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedStudentIds.length === 0 || isSubmitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white shadow transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>{isSubmitting ? 'Enregistrement...' : `Ajouter au Groupe (${selectedStudentIds.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
