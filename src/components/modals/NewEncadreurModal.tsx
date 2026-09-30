import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Loader2, UserCheck, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor } from '../../types';

interface NewEncadreurModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTutor?: Tutor | null;
}

export const NewEncadreurModal: React.FC<NewEncadreurModalProps> = ({
  isOpen,
  onClose,
  editingTutor = null,
}) => {
  const { addTutor, updateTutor, students, showToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
  const [subjectsStr, setSubjectsStr] = useState('Mathématiques, Physique-Chimie');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['Collège', 'Lycée']);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [totalHours, setTotalHours] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTutor) {
      setFullName(editingTutor.fullName);
      setGender(editingTutor.gender || 'Masculin (M)');
      setPhone(editingTutor.phone);
      setEmail(editingTutor.email);
      setAvatar(editingTutor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
      setSubjectsStr(editingTutor.subjects.join(', '));
      setSelectedLevels(editingTutor.levels || ['Collège']);
      setSelectedStudentIds(editingTutor.assignedStudentIds || []);
      setTotalHours(editingTutor.totalHours || 10);
    } else {
      setFullName('');
      setGender('Masculin (M)');
      setPhone('');
      setEmail('');
      setAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
      setSubjectsStr('Mathématiques, Français');
      setSelectedLevels(['Collège', 'Lycée']);
      setSelectedStudentIds([]);
      setTotalHours(12);
    }
  }, [editingTutor, isOpen]);

  if (!isOpen) return null;

  const handleLevelToggle = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const handleStudentToggle = (sId: string) => {
    // Check primary rule rule if student is primary school
    const student = students.find((s) => s.id === sId);
    if (student && student.stream === 'Primaire') {
      // Primary rule: 1 tutor max. If selecting this student, ensure no other tutor has them, or notify user.
      // We will allow assignment and handle in context/backend logic.
    }

    if (selectedStudentIds.includes(sId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== sId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, sId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Veuillez remplir les champs obligatoires (Nom, Téléphone)', 'warning');
      return;
    }

    setIsSubmitting(true);
    const subjects = subjectsStr.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      if (editingTutor) {
        await updateTutor(editingTutor.id, {
          fullName,
          gender,
          phone,
          email,
          avatar,
          subjects,
          levels: selectedLevels,
          assignedStudentIds: selectedStudentIds,
          totalHours,
        });
        showToast('Encadreur mis à jour avec succès', 'success');
      } else {
        await addTutor({
          fullName,
          gender,
          phone,
          email,
          avatar,
          subjects,
          levels: selectedLevels,
          assignedStudentIds: selectedStudentIds,
          totalHours,
          sessions: [],
        });
        showToast('Nouvel encadreur enregistré avec succès', 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'enregistrement de l\'encadreur', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableLevels = ['Primaire', 'Collège', 'Lycée', 'Supérieur', 'Prépa Concours'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingTutor ? 'Modifier l\'Encadreur' : 'Ajouter un Nouvel Encadreur'}
              </h3>
              <p className="text-xs text-slate-400">Gestion pédagogique et affectation des élèves</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom complet de l'encadreur *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Prof. Ousmane Adamou"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sexe / Genre *
              </label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="Masculin (M)">Masculin (M)</option>
                <option value="Féminin (F)">Féminin (F)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Téléphone *
              </label>
              <input
                type="text"
                required
                placeholder="+227 94 33 44 55"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adresse Email
              </label>
              <input
                type="email"
                placeholder="encadreur@cabappuis.ne"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Matières enseignées (séparées par des virgules) *
              </label>
              <input
                type="text"
                required
                placeholder="Mathématiques, Physique, Français..."
                value={subjectsStr}
                onChange={(e) => setSubjectsStr(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Heures d'encadrement attribuées / effectuées *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={totalHours}
                onChange={(e) => setTotalHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 font-mono font-bold focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Niveaux d'intervention multiples *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLevels.map((lvl) => {
                const isSelected = selectedLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelToggle(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lvl} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Affectation des Élèves (Multi-élèves / Polyvalence)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Règle : Un élève du Primaire est restreint à 1 seul encadreur référent. Les élèves du Collège / Lycée peuvent avoir plusieurs encadreurs.
            </p>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-2 space-y-1.5">
              {students.map((stu) => {
                const isAssigned = selectedStudentIds.includes(stu.id);
                return (
                  <div
                    key={stu.id}
                    onClick={() => handleStudentToggle(stu.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isAssigned ? 'bg-indigo-950/80 border border-indigo-500/50 text-white' : 'hover:bg-slate-755 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {}}
                        className="rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <div>
                        <span className="font-bold">{stu.fullName}</span>
                        <span className="text-[10px] text-slate-400 block">{stu.level} · ({stu.stream})</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {stu.matricule}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              URL de la Photo de Profil (Avatar)
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
              <span>{isSubmitting ? 'Enregistrement...' : editingTutor ? 'Enregistrer les modifications' : 'Ajouter l\'encadreur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
