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
  Lock,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor, Student } from '../../types';
import { compressImage } from '../../utils/imageOptimizer';
import {
  formatSessionHours,
  calculateWeeklyHours,
  calculateMonthlyHours,
} from '../../utils/dateUtils';
import {
  isPrimaryStudent,
  getPrimaryTutorForStudent,
  getAssignedSubjectsMapForStudent,
  validateTutorAssignment,
  normalizeSubjectName,
} from '../../utils/tutorAssignmentValidation';

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
  const { addTutor, updateTutor, updateStudent, students, tutors, showToast } = useApp();

  const safeStudents = students || [];
  const safeTutors = tutors || [];

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
  const [subjectsStr, setSubjectsStr] = useState('Mathématiques, Physique-Chimie');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['Collège', 'Lycée']);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSubjectsMap, setStudentSubjectsMap] = useState<Record<string, string[]>>({});
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState<number>(18);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTutor) {
      setFullName(editingTutor.fullName || '');
      setGender(editingTutor.gender || 'Masculin (M)');
      setPhone(editingTutor.phone || '');
      setEmail(editingTutor.email || '');
      setAvatar(editingTutor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
      setSubjectsStr((editingTutor.subjects || []).join(', '));
      setSelectedLevels(editingTutor.levels || ['Collège']);
      const currentIds = editingTutor.assignedStudentIds || [];
      setSelectedStudentIds(currentIds);
      setStudentSubjectsMap(editingTutor.assignedStudentSubjects || {});

      // Déduction volume horaire : 1 séance = 1h 30mn
      const currentAssigned = safeStudents.filter((s) => currentIds.includes(s.id));
      const sessionsCount = currentAssigned.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
      const deducedMonthly = calculateMonthlyHours(sessionsCount);
      setTotalHours(editingTutor.totalHours ?? (deducedMonthly > 0 ? deducedMonthly : 18));
    } else {
      setFullName('');
      setGender('Masculin (M)');
      setPhone('');
      setEmail('');
      setAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
      setSubjectsStr('Mathématiques, Français');
      setSelectedLevels(['Collège', 'Lycée']);
      setSelectedStudentIds([]);
      setStudentSubjectsMap({});
      setTotalHours(0);
    }
    setValidationError(null);
    setExpandedStudentId(null);
    setStudentSearch('');
  }, [editingTutor, isOpen, safeStudents]);

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

  // Liste des matières déclarées pour cet encadreur
  const tutorTaughtSubjects = subjectsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Volume horaire déduit : 1 séance = 1h 30mn
  const assignedStudents = safeStudents.filter((s) => selectedStudentIds.includes(s.id));
  const totalWeeklySessions = assignedStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
  const weeklyHours = calculateWeeklyHours(totalWeeklySessions);
  const monthlyHours = calculateMonthlyHours(totalWeeklySessions);

  /**
   * Clic sur un élève pour l'ajouter / le retirer
   */
  const handleStudentToggle = (stu: Student) => {
    setValidationError(null);
    const isCurrentlySelected = selectedStudentIds.includes(stu.id);

    if (isCurrentlySelected) {
      // Désélection
      const nextIds = selectedStudentIds.filter((id) => id !== stu.id);
      setSelectedStudentIds(nextIds);
      const nextMap = { ...studentSubjectsMap };
      delete nextMap[stu.id];
      setStudentSubjectsMap(nextMap);

      const nextAssigned = students.filter((s) => nextIds.includes(s.id));
      const nextSessions = nextAssigned.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
      setTotalHours(calculateMonthlyHours(nextSessions));
      if (expandedStudentId === stu.id) setExpandedStudentId(null);
      return;
    }

    // TENTATIVE DE SÉLECTION : VÉRIFICATION DES RÈGLES STRICTES

    // 1. RÈGLE PRIMAIRE : 1 SEUL ET UNIQUE ENCADREUR
    if (isPrimaryStudent(stu)) {
      const existingTutor = getPrimaryTutorForStudent(stu, tutors, editingTutor?.id);
      if (existingTutor) {
        const errorMsg =
          "Erreur : Un élève du primaire ne peut pas avoir plus d'un encadreur. Veuillez d'abord retirer l'encadreur actuel.";
        setValidationError(errorMsg);
        showToast(errorMsg, 'warning');
        return;
      }
    }

    // 2. RÈGLE COLLÈGE & LYCÉE : PAS DE DOUBLE ATTRIBUTION PAR MATIÈRE
    if (!isPrimaryStudent(stu)) {
      const assignedMap = getAssignedSubjectsMapForStudent(stu, tutors, editingTutor?.id);

      // Déterminer les matières disponibles pour ce tuteur
      const availableSubjects = tutorTaughtSubjects.filter((subj) => {
        const normalized = normalizeSubjectName(subj);
        return (
          (stu.subjects || []).some((s) => normalizeSubjectName(s) === normalized) &&
          !assignedMap.has(normalized)
        );
      });

      // Si toutes les matières que cet encadreur enseigne sont déjà couvertes par un autre pour cet élève
      const hasAnyCompatible = tutorTaughtSubjects.some((subj) =>
        (stu.subjects || []).some((s) => normalizeSubjectName(s) === normalizeSubjectName(subj))
      );

      if (hasAnyCompatible && availableSubjects.length === 0) {
        // Conflit direct
        const conflictSubj = tutorTaughtSubjects.find((subj) =>
          assignedMap.has(normalizeSubjectName(subj))
        );
        const errorMsg = `Erreur : Cet élève a déjà un encadreur attribué pour la matière [${conflictSubj || 'sélectionnée'}].`;
        setValidationError(errorMsg);
        showToast(errorMsg, 'warning');
        return;
      }

      const nextMap = {
        ...studentSubjectsMap,
        [stu.id]: availableSubjects.length > 0 ? availableSubjects : tutorTaughtSubjects,
      };
      setStudentSubjectsMap(nextMap);
      setExpandedStudentId(stu.id);
    } else {
      // Pour le primaire, toutes les matières de l'élève sont prises en charge
      const nextMap = {
        ...studentSubjectsMap,
        [stu.id]: stu.subjects || [],
      };
      setStudentSubjectsMap(nextMap);
    }

    const nextIds = [...selectedStudentIds, stu.id];
    setSelectedStudentIds(nextIds);

    const nextAssigned = students.filter((s) => nextIds.includes(s.id));
    const nextSessions = nextAssigned.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
    setTotalHours(calculateMonthlyHours(nextSessions));
  };

  /**
   * Toggling d'une matière spécifique pour un élève Collège / Lycée
   */
  const handleToggleSubjectForStudent = (studentId: string, subject: string) => {
    const stu = students.find((s) => s.id === studentId);
    if (!stu || isPrimaryStudent(stu)) return;

    const assignedMap = getAssignedSubjectsMapForStudent(stu, tutors, editingTutor?.id);
    const normalized = normalizeSubjectName(subject);

    if (assignedMap.has(normalized)) {
      const conflict = assignedMap.get(normalized);
      const errorMsg = `Erreur : Cet élève a déjà un encadreur attribué pour la matière [${conflict?.subjectName || subject}].`;
      setValidationError(errorMsg);
      showToast(errorMsg, 'warning');
      return;
    }

    setValidationError(null);
    const currentList = studentSubjectsMap[studentId] || [];
    let nextList: string[];
    if (currentList.includes(subject)) {
      nextList = currentList.filter((s) => s !== subject);
    } else {
      nextList = [...currentList, subject];
    }

    setStudentSubjectsMap({
      ...studentSubjectsMap,
      [studentId]: nextList,
    });
  };

  const filteredStudents = safeStudents.filter((stu) => {
    if (!stu) return false;
    const searchLower = (studentSearch ?? '').trim().toLowerCase();
    if (!searchLower) return true;
    const nameSafe = (stu.fullName ?? '').toLowerCase();
    const matriculeSafe = (stu.matricule ?? '').toLowerCase();
    const levelSafe = (stu.level ?? '').toLowerCase();
    const guardianSafe = (stu.guardianName ?? '').toLowerCase();

    return (
      nameSafe.includes(searchLower) ||
      matriculeSafe.includes(searchLower) ||
      levelSafe.includes(searchLower) ||
      guardianSafe.includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim() || !phone.trim()) {
      showToast('Veuillez remplir les champs obligatoires (Nom, Téléphone)', 'warning');
      return;
    }

    // VALIDATION STRICTE GLOBALE AVANT ENREGISTREMENT
    for (const stuId of selectedStudentIds) {
      const stu = students.find((s) => s.id === stuId);
      if (!stu) continue;

      const validation = validateTutorAssignment({
        student: stu,
        targetTutorId: editingTutor?.id || 'temp-id',
        targetSubjects: isPrimaryStudent(stu) ? stu.subjects : studentSubjectsMap[stu.id] || tutorTaughtSubjects,
        allTutors: tutors,
        currentEditingTutorId: editingTutor?.id,
      });

      if (!validation.valid) {
        setValidationError(validation.error || 'Erreur de validation');
        showToast(validation.error || 'Erreur de validation', 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    const subjects = subjectsStr.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      let savedTutorId = editingTutor?.id;

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
          assignedStudentSubjects: studentSubjectsMap,
          totalHours,
        });
        showToast(
          `Encadreur ${fullName.trim()} mis à jour : ${selectedStudentIds.length} élève(s) (${totalWeeklySessions} séances/sem. = ${formatSessionHours(weeklyHours)}/sem., ${totalHours}h/mois).`,
          'success'
        );
      } else {
        const newT = await addTutor({
          fullName: fullName.trim(),
          gender,
          phone: phone.trim(),
          email: email.trim(),
          avatar,
          subjects,
          levels: selectedLevels,
          assignedStudentIds: selectedStudentIds,
          assignedStudentSubjects: studentSubjectsMap,
          totalHours,
          sessions: [],
        });
        savedTutorId = newT.id;
        showToast(
          `Nouvel encadreur ${fullName.trim()} enregistré : ${totalWeeklySessions} séances/sem. = ${formatSessionHours(weeklyHours)}/sem. (${totalHours}h/mois déduits).`,
          'success'
        );
      }

      // Synchronisation relationnelle dans les fiches élèves
      for (const stu of students) {
        const isSelected = selectedStudentIds.includes(stu.id);
        const isPrimary = isPrimaryStudent(stu);

        if (isSelected && savedTutorId) {
          const subjectsForThisStudent = isPrimary ? stu.subjects : studentSubjectsMap[stu.id] || subjects;
          const otherAssignments = (stu.tutorAssignments || []).filter((a) => a.tutorId !== savedTutorId);
          const newAssignment = {
            tutorId: savedTutorId,
            tutorName: fullName.trim(),
            tutorAvatar: avatar,
            tutorPhone: phone.trim(),
            subjects: subjectsForThisStudent,
            assignedAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          };

          await updateStudent(stu.id, {
            tutorId: isPrimary ? savedTutorId : stu.tutorId,
            tutorIds: isPrimary ? [savedTutorId] : Array.from(new Set([...(stu.tutorIds || []), savedTutorId])),
            tutorAssignments: isPrimary ? [newAssignment] : [...otherAssignments, newAssignment],
          });
        } else if (!isSelected && editingTutor) {
          // L'élève a été retiré de cet encadreur
          if (stu.tutorIds?.includes(editingTutor.id) || stu.tutorId === editingTutor.id) {
            await updateStudent(stu.id, {
              tutorId: stu.tutorId === editingTutor.id ? undefined : stu.tutorId,
              tutorIds: (stu.tutorIds || []).filter((id) => id !== editingTutor.id),
              tutorAssignments: (stu.tutorAssignments || []).filter((a) => a.tutorId !== editingTutor.id),
            });
          }
        }
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
              <p className="text-xs text-slate-400">
                Pédagogie, déduction horaire (1 séance = 1h 30mn) et verrous d'affectation
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

            {/* DEDUCED VOLUME HORAIRE FIELD: 1 séance = 1h 30mn */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Volume horaire déduit (Heures/mois) *
                </label>
                <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/80">
                  1 séance = 1h 30mn
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-indigo-500/50 bg-slate-800 px-3 py-2 text-xs text-white font-mono font-bold focus:border-indigo-400 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                  heures/mois
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>
                  Déduit : {selectedStudentIds.length} élève(s) = <strong className="text-white font-mono">{formatSessionHours(weeklyHours)}/sem.</strong>
                </span>
                <span className="text-emerald-400 font-semibold font-mono">
                  {monthlyHours}h / mois (base 4 sem.)
                </span>
              </div>
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

          {/* AFFECTATION DES ÉLÈVES & CONTRÔLE STRICT D'INTÉGRITÉ */}
          <div className="rounded-2xl border border-indigo-500/40 bg-slate-800/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700">
              <div>
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <span>Affectation des Élèves & Verrous Anti-Double Attribution</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Primaire : 1 seul encadreur max · Collège & Lycée : matières strictement distinctes.
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

            {/* MESSAGE D'ERREUR STRICT SI CONFLIT DÉTECTÉ */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-rose-100 uppercase tracking-wider text-[10px]">
                    Blocage de validation métier
                  </strong>
                  <span>{validationError}</span>
                </div>
              </div>
            )}

            {/* DYNAMIC RECALL BANNER: 1 SEANCE = 1H 30MN */}
            <div className="rounded-xl bg-indigo-950/70 border border-indigo-500/50 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-200">
                    Élèves affectés : <strong className="text-white font-mono">{selectedStudentIds.length}</strong>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="font-semibold text-indigo-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Séances à assurer : <strong className="text-white font-mono">{totalWeeklySessions}</strong> séance{totalWeeklySessions > 1 ? 's' : ''}/sem.
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-amber-300 font-medium">1 séance = 1h 30mn</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Volume horaire déduit : <strong className="text-emerald-400 font-mono">{formatSessionHours(weeklyHours)} par semaine</strong> (soit <strong className="text-emerald-300 font-mono">{monthlyHours} heures par mois</strong>).
                </div>
              </div>

              {totalHours !== monthlyHours && (
                <button
                  type="button"
                  onClick={() => setTotalHours(monthlyHours)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-sm shrink-0"
                  title="Recaler le volume horaire sur la valeur exacte déduite des séances (1h30)"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Recaler à {monthlyHours}h/mois</span>
                </button>
              )}
            </div>

            {/* Student selection cards with clear session quota and duration indicators */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/90 p-2 space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Aucun élève trouvé.
                </div>
              ) : (
                filteredStudents.map((stu) => {
                  const isAssigned = selectedStudentIds.includes(stu.id);
                  const isPrimary = isPrimaryStudent(stu);
                  const sessions = stu.sessionsPerWeek || 3;
                  const studentWeeklyDuration = calculateWeeklyHours(sessions);

                  // Contrôle primaire : déjà attribué à un autre encadreur ?
                  const otherPrimaryTutor = isPrimary
                    ? getPrimaryTutorForStudent(stu, tutors, editingTutor?.id)
                    : null;

                  // Contrôle collège/lycée : carte des matières déjà couvertes par d'autres
                  const coveredMap = !isPrimary
                    ? getAssignedSubjectsMapForStudent(stu, tutors, editingTutor?.id)
                    : new Map();

                  const isExpanded = expandedStudentId === stu.id;

                  return (
                    <div
                      key={stu.id}
                      className={`rounded-xl border transition-all ${
                        isAssigned
                          ? 'bg-indigo-950/80 border-indigo-500/70 shadow-sm'
                          : otherPrimaryTutor
                          ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        onClick={() => handleStudentToggle(stu)}
                        className="flex items-center justify-between p-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => {}}
                            className="rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{stu.fullName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {stu.matricule}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {stu.level} · ({stu.stream})
                              {isPrimary && otherPrimaryTutor && (
                                <span className="text-amber-400 ml-1.5 font-semibold text-[10px] inline-flex items-center gap-1">
                                  <Lock className="h-2.5 w-2.5" />
                                  Déjà assigné à : {otherPrimaryTutor.fullName}
                                </span>
                              )}
                              {!isPrimary && coveredMap.size > 0 && (
                                <span className="text-indigo-400 ml-1.5 font-medium text-[10px]">
                                  · {coveredMap.size} matière(s) déjà couverte(s)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Quotas and collapse trigger */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                                isAssigned
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50'
                              }`}
                            >
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{sessions} séa./sem.</span>
                            </span>
                            <span className="block text-[9px] text-emerald-400 font-mono mt-0.5 font-semibold">
                              = {formatSessionHours(studentWeeklyDuration)} / sem. (1h30/s)
                            </span>
                          </div>

                          {!isPrimary && isAssigned && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedStudentId(isExpanded ? null : stu.id);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300"
                              title="Voir les matières attribuées"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* DROPDOWN / SÉLECTEUR DYNAMIQUE DES MATIÈRES POUR ÉLÈVES COLLÈGE / LYCÉE */}
                      {!isPrimary && isAssigned && isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-indigo-900/60 bg-slate-950/50 rounded-b-xl space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-indigo-400" />
                              Matières prises en charge par cet encadreur :
                            </span>
                            <span className="text-[10px] font-mono text-indigo-400">
                              (Règle : matières déjà couvertes désactivées)
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(stu.subjects || []).map((subj) => {
                              const normalized = normalizeSubjectName(subj);
                              const conflictEntry = coveredMap.get(normalized);
                              const isAlreadyCoveredByOther = !!conflictEntry;
                              const isChecked = (studentSubjectsMap[stu.id] || []).includes(subj);

                              return (
                                <button
                                  key={subj}
                                  type="button"
                                  disabled={isAlreadyCoveredByOther}
                                  onClick={() => handleToggleSubjectForStudent(stu.id, subj)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                    isAlreadyCoveredByOther
                                      ? 'bg-rose-950/40 border-rose-900/60 text-slate-400 opacity-70 cursor-not-allowed'
                                      : isChecked
                                      ? 'bg-indigo-600 border-indigo-500 text-white cursor-pointer shadow-xs'
                                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 cursor-pointer'
                                  }`}
                                  title={
                                    isAlreadyCoveredByOther
                                      ? `Déjà couverte par ${conflictEntry?.tutor.fullName} (${conflictEntry?.tutor.matricule})`
                                      : `Cliquer pour attribuer ${subj} à cet encadreur`
                                  }
                                >
                                  {isAlreadyCoveredByOther ? (
                                    <>
                                      <Lock className="h-2.5 w-2.5 text-rose-400" />
                                      <span className="line-through">{subj}</span>
                                      <span className="text-[9px] text-rose-300 ml-1">
                                        ({conflictEntry?.tutor.fullName})
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      {isChecked ? '✓ ' : '+ '}
                                      <span>{subj}</span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-[10px] text-slate-400 italic">
              📌 Règle de déduction horaire : Chaque séance équivaut strictement à 1h 30mn (90 minutes). Le volume de travail de l'encadreur s'actualise automatiquement au fur et à mesure des affectations.
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
              disabled={isSubmitting || !!validationError}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow transition-colors ${
                validationError
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
              }`}
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
