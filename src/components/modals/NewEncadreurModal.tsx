import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Loader2,
  UserCheck,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  Camera,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor } from '../../types';
import { compressImage } from '../../utils/imageOptimizer';

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
  const [totalHours, setTotalHours] = useState<number>(12);
  const [studentSearch, setStudentSearch] = useState('');
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
      setTotalHours(editingTutor.totalHours || 12);
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
    setStudentSearch('');
  }, [editingTutor, isOpen]);

  if (!isOpen) return null;

  const handleLevelToggle = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.7 });
      setAvatar(compressed);
    } catch (err) {
      console.error('Failed to compress avatar', err);
    }
  };

  const handleStudentToggle = (sId: string) => {
    const student = students.find((s) => s.id === sId);
    if (!student) return;

    if (selectedStudentIds.includes(sId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== sId));
    } else {
      // Primary rule validation reminder
      if (student.stream === 'Primaire') {
        // Can be assigned
      }
      setSelectedStudentIds([...selectedStudentIds, sId]);
    }
  };

  // Compute total weekly sessions and estimated weekly hours of selected students
  const assignedStudents = students.filter((s) => selectedStudentIds.includes(s.id));
  const totalWeeklySessions = assignedStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
  const estimatedWeeklyHours = totalWeeklySessions * 2; // Standard ~2 hours per session in Niger pedagogical tutoring

  const filteredStudents = students.filter(
    (stu) =>
      stu.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      stu.matricule.toLowerCase().includes(studentSearch.toLowerCase()) ||
      stu.level.toLowerCase().includes(studentSearch.toLowerCase())
  );

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
          fullName: fullName.trim(),
          gender,
          phone: phone.trim(),
          email: email.trim(),
          avatar,
          subjects,
          levels: selectedLevels,
          assignedStudentIds: selectedStudentIds,
          totalHours,
        });
        showToast(`Encadreur ${fullName.trim()} mis à jour avec ${selectedStudentIds.length} élève(s) (${totalWeeklySessions} séances/semaine).`, 'success');
      } else {
        await addTutor({
          fullName: fullName.trim(),
          gender,
          phone: phone.trim(),
          email: email.trim(),
          avatar,
          subjects,
          levels: selectedLevels,
          assignedStudentIds: selectedStudentIds,
          totalHours,
          sessions: [],
        });
        showToast(`Nouvel encadreur ${fullName.trim()} enregistré avec succès (${totalWeeklySessions} séances/semaine prévues).`, 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'enregistrement de l'encadreur", 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableLevels = ['Primaire', 'Collège', 'Lycée', 'Supérieur', 'Prépa Concours'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingTutor ? `Modifier l'Encadreur : ${editingTutor.fullName}` : 'Ajouter un Nouvel Encadreur'}
              </h3>
              <p className="text-xs text-slate-400">Gestion pédagogique et ajustement du planning des séances</p>
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
          {/* Avatar and Info Banner */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-slate-700 border-2 border-indigo-500/40 flex items-center justify-center shrink-0">
              <img src={avatar} alt="Aperçu encadreur" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Photo de profil de l'encadreur
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Changer la photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <input
                  type="url"
                  placeholder="Ou URL directe d'image"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

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
                Téléphone au Niger (+227) *
              </label>
              <input
                type="text"
                required
                placeholder="+227 94 33 44 55"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adresse Email professionnelle
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
                Matières enseignées (séparées par virgules) *
              </label>
              <input
                type="text"
                required
                placeholder="Mathématiques, Physique-Chimie, Calcul..."
                value={subjectsStr}
                onChange={(e) => setSubjectsStr(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Volume horaire global attribué (Heures/mois) *
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
              Niveaux d'intervention de l'encadreur *
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

          {/* USER REQUIREMENT 3: Affectation des Élèves avec RAPPEL VISUEL DU QUOTA DE SÉANCES */}
          <div className="rounded-2xl border border-indigo-500/40 bg-slate-800/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700">
              <div>
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <span>Affectation des Élèves & Rappel des Quotas de Séances</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chaque élève affiche son quota hebdomadaire obligatoire pour calibrer le planning des séances.
                </p>
              </div>

              {/* Live search input */}
              <input
                type="text"
                placeholder="Filtrer élève par nom/classe..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-48 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* DYNAMIC VISUAL RECALL BANNER FOR PLANNING */}
            <div className="rounded-xl bg-indigo-950/70 border border-indigo-500/50 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">
                    Élèves sélectionnés : <strong className="text-white font-mono">{selectedStudentIds.length}</strong>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="font-semibold text-indigo-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Quota cumulé : <strong className="text-white font-mono">{totalWeeklySessions}</strong> séance{totalWeeklySessions > 1 ? 's' : ''}/sem.
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Charge hebdomadaire estimée : <strong className="text-emerald-400 font-mono">~{estimatedWeeklyHours}h / semaine</strong> pour cet encadreur
                </div>
              </div>

              {/* Planning synchronization helper button */}
              {estimatedWeeklyHours > 0 && totalHours < estimatedWeeklyHours && (
                <button
                  type="button"
                  onClick={() => setTotalHours(estimatedWeeklyHours * 4)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-sm shrink-0"
                  title="Ajuster le volume horaire mensuel de l'encadreur (4 semaines)"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Ajuster à {estimatedWeeklyHours * 4}h/mois</span>
                </button>
              )}
            </div>

            {/* Student selection cards with clear session quota indicators */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/90 p-2 space-y-1.5 divide-y divide-slate-850">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Aucun élève trouvé.
                </div>
              ) : (
                filteredStudents.map((stu) => {
                  const isAssigned = selectedStudentIds.includes(stu.id);
                  const sessions = stu.sessionsPerWeek || 3;

                  return (
                    <div
                      key={stu.id}
                      onClick={() => handleStudentToggle(stu.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isAssigned
                          ? 'bg-indigo-950/90 border border-indigo-500/60 shadow-sm text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {}}
                          className="rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{stu.fullName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {stu.matricule}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {stu.level} · ({stu.stream})
                            {stu.stream === 'Primaire' && (
                              <span className="text-amber-400/90 ml-1.5 font-medium text-[10px]">
                                · 1 seul encadreur référent
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Visual reminder of student's weekly session quota */}
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors ${
                            isAssigned
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50'
                          }`}
                        >
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{sessions} séance{sessions > 1 ? 's' : ''}/sem.</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          ~{sessions * 2}h planning
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[10px] text-slate-400 italic">
              📌 Règle pédagogique : Pour les élèves du Primaire, 1 seul encadreur est affecté. Pour les collégiens et lycéens, les séances peuvent être réparties entre plusieurs encadreurs selon les matières.
            </p>
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
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : editingTutor
                  ? 'Enregistrer les modifications'
                  : "Ajouter l'encadreur"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
