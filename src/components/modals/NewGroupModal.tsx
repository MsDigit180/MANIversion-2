import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Layers,
  Users,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  Check,
  Plus,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TutoringGroup } from '../../types';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStream?: string;
  initialLevel?: string;
  onSuccess?: (group: TutoringGroup) => void;
}

const COMMON_SUBJECTS_BY_STREAM: Record<string, string[]> = {
  Primaire: ['Calcul & Maths', 'Français / Lecture', 'Dictée & Grammaire', 'Sciences d\'Observation', 'Histoire & Géo'],
  Collège: ['Mathématiques', 'Sciences Physiques (PC)', 'SVT', 'Français', 'Anglais', 'Histoire-Géographie'],
  Lycée: ['Mathématiques', 'Sciences Physiques', 'SVT', 'Français', 'Philosophie', 'Anglais'],
  'Prépa Concours': ['Culture Générale', 'Mathématiques & Logique', 'Français & Rédaction', 'Tests Psychotechniques', 'Droit & Législation'],
};

const SCHEDULE_PRESETS = [
  'Samedi & Dimanche 09h-11h',
  'Samedi & Dimanche 15h-17h',
  'Mercredi 15h-17h & Samedi 09h-11h',
  'Samedi 15h-18h & Dimanche 09h-12h',
  'Lundi, Mercredi & Vendredi 16h-18h',
  'Mardi & Jeudi 16h-18h',
];

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  initialStream = 'Lycée',
  initialLevel,
  onSuccess,
}) => {
  const { students, tutors, tutoringGroups, createTutoringGroup, showToast } = useApp();

  const [stream, setStream] = useState<string>(initialStream);
  const [level, setLevel] = useState<string>(initialLevel || 'Terminale D (Bac Scientifique)');
  const [groupId, setGroupId] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathématiques', 'Sciences Physiques']);
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('Samedi & Dimanche 09h-11h');
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [studentSearch, setStudentSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  // Auto generate a recommended group code and title based on stream & level
  const generateRecommendedCode = (lvl: string, strm: string) => {
    let prefix = 'GRP';
    const lvlLower = lvl.toLowerCase();

    if (lvlLower.includes('terminale d')) prefix = 'GRP-TERM-D';
    else if (lvlLower.includes('terminale c')) prefix = 'GRP-TERM-C';
    else if (lvlLower.includes('terminale a')) prefix = 'GRP-TERM-A';
    else if (lvlLower.includes('première') || lvlLower.includes('1ère')) prefix = 'GRP-1ERE';
    else if (lvlLower.includes('seconde') || lvlLower.includes('2nde')) prefix = 'GRP-2NDE';
    else if (lvlLower.includes('troisième') || lvlLower.includes('3ème')) prefix = 'GRP-3EME';
    else if (lvlLower.includes('quatrième') || lvlLower.includes('4ème')) prefix = 'GRP-4EME';
    else if (lvlLower.includes('cinquième') || lvlLower.includes('5ème')) prefix = 'GRP-5EME';
    else if (lvlLower.includes('sixième') || lvlLower.includes('6ème')) prefix = 'GRP-6EME';
    else if (lvlLower.includes('cm2')) prefix = 'GRP-CM2';
    else if (lvlLower.includes('cm1')) prefix = 'GRP-CM1';
    else if (lvlLower.includes('ce2')) prefix = 'GRP-CE2';
    else if (lvlLower.includes('ce1')) prefix = 'GRP-CE1';
    else if (lvlLower.includes('cp')) prefix = 'GRP-CP';
    else if (lvlLower.includes('ci')) prefix = 'GRP-CI';
    else if (strm === 'Prépa Concours') prefix = 'GRP-PREPA';
    else prefix = `GRP-${lvl.substring(0, 3).toUpperCase()}`;

    // Ensure unique suffix if code already exists
    let candidate = prefix;
    let counter = 1;
    const existingIds = new Set(tutoringGroups.map((g) => g.id.toUpperCase()));
    while (existingIds.has(candidate)) {
      candidate = `${prefix}-${String.fromCharCode(65 + counter)}`; // A, B, C...
      counter++;
    }

    return candidate;
  };

  // Reset or preset fields on open
  useEffect(() => {
    if (isOpen) {
      const activeStream = initialStream || 'Lycée';
      setStream(activeStream);

      let defaultLevel = initialLevel;
      if (!defaultLevel) {
        if (activeStream === 'Primaire') defaultLevel = 'CM2 (CFEPD & Entrée en 6ème)';
        else if (activeStream === 'Collège') defaultLevel = 'Troisième 3ème (Prépa BEPC)';
        else if (activeStream === 'Lycée') defaultLevel = 'Terminale D (Bac Scientifique)';
        else defaultLevel = 'Prépa Concours Direct';
      }
      setLevel(defaultLevel);

      const recCode = generateRecommendedCode(defaultLevel, activeStream);
      setGroupId(recCode);
      setGroupName(`Groupe ${defaultLevel.split('(')[0].trim()} Excellence`);
      setSelectedSubjects(COMMON_SUBJECTS_BY_STREAM[activeStream]?.slice(0, 3) || ['Mathématiques']);
      setTimeSlot('Samedi & Dimanche 09h-11h');
      setSessionsPerWeek(3);
      setSelectedStudentIds([]);
      setSelectedTutorIds([]);
      setNotes('');
      setCodeTouched(false);
      setIsSubmitting(false);
    }
  }, [isOpen, initialStream, initialLevel]);

  // When stream changes, update available levels and subject suggestions
  const handleStreamChange = (newStream: string) => {
    setStream(newStream);
    let newLevel = 'Terminale D (Bac Scientifique)';
    if (newStream === 'Primaire') newLevel = 'CM2 (CFEPD & Entrée en 6ème)';
    else if (newStream === 'Collège') newLevel = 'Troisième 3ème (Prépa BEPC)';
    else if (newStream === 'Prépa Concours') newLevel = 'Prépa Concours Direct';

    setLevel(newLevel);
    setSelectedSubjects(COMMON_SUBJECTS_BY_STREAM[newStream]?.slice(0, 3) || ['Général']);

    if (!codeTouched) {
      const rec = generateRecommendedCode(newLevel, newStream);
      setGroupId(rec);
      setGroupName(`Groupe ${newLevel.split('(')[0].trim()} Excellence`);
    }
  };

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    if (!codeTouched) {
      const rec = generateRecommendedCode(newLevel, stream);
      setGroupId(rec);
      setGroupName(`Groupe ${newLevel.split('(')[0].trim()} Excellence`);
    }
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSubjectInput.trim();
    if (clean && !selectedSubjects.includes(clean)) {
      setSelectedSubjects((prev) => [...prev, clean]);
      setCustomSubjectInput('');
    }
  };

  // Filter candidates for inclusion in this new group
  const candidateStudents = useMemo(() => {
    return students.filter((stu) => {
      // Prioritize students in same stream or level
      const matchesSearch =
        !studentSearch.trim() ||
        stu.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        stu.matricule.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (stu.guardianName || '').toLowerCase().includes(studentSearch.toLowerCase());

      return matchesSearch;
    });
  }, [students, studentSearch]);

  const toggleStudentSelection = (sId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const toggleTutorSelection = (tId: string) => {
    setSelectedTutorIds((prev) =>
      prev.includes(tId) ? prev.filter((id) => id !== tId) : [...prev, tId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = groupId.trim().toUpperCase();
    const cleanName = groupName.trim();

    if (!cleanId) {
      showToast("L'identifiant du groupe (Code) est obligatoire.", 'warning');
      return;
    }

    if (!cleanName) {
      showToast('Le libellé / nom du groupe est obligatoire.', 'warning');
      return;
    }

    if (selectedSubjects.length === 0) {
      showToast('Veuillez sélectionner au moins une matière d\'encadrement.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTutoringGroup({
        id: cleanId,
        name: cleanName,
        level,
        stream,
        subjects: selectedSubjects,
        timeSlot: timeSlot.trim() || 'Créneau mutualisé',
        sessionsPerWeek,
        initialStudentIds: selectedStudentIds,
        initialTutorIds: selectedTutorIds,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
      }
    } catch (err) {
      console.error('Error creating study group:', err);
      showToast('Une erreur est survenue lors de la création du groupe.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Créer un Nouveau Groupe d'Étude</span>
                <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Cab-Appuis
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mutualisation des effectifs · Emploi du temps partagé · Attribution centralisée d'encadreurs
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {/* Section 1: Cycle & Classe */}
          <div className="rounded-xl border border-slate-800 bg-slate-850/70 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              <span>1. Niveau Académique & Identité du Groupe</span>
            </h3>

            {/* Cycle Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Cycle d'Enseignement :
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Primaire', 'Collège', 'Lycée', 'Prépa Concours'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleStreamChange(c)}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs transition-colors cursor-pointer ${
                      stream === c
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Classe / Niveau */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Classe d'Appui * :
              </label>
              <input
                type="text"
                required
                value={level}
                onChange={(e) => handleLevelChange(e.target.value)}
                placeholder="Ex: Terminale D, CM2, 3ème, ou classe personnalisée..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none mb-2"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Suggestions rapides :</span>
                {(
                  stream === 'Primaire'
                    ? ['CM2 (CFEPD)', 'CM1', 'CE2', 'CE1', 'CP', 'CI']
                    : stream === 'Collège'
                    ? ['Sixième 6ème', 'Cinquième 5ème', 'Quatrième 4ème', 'Troisième 3ème (BEPC)']
                    : stream === 'Lycée'
                    ? ['Terminale D', 'Terminale C', 'Terminale A4', 'Première D', 'Seconde 2nde']
                    : ['Prépa Concours Direct', 'Prépa Concours Pro']
                ).map((lvlPreset) => (
                  <button
                    key={lvlPreset}
                    type="button"
                    onClick={() => handleLevelChange(lvlPreset)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                      level === lvlPreset
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    {lvlPreset}
                  </button>
                ))}
              </div>
            </div>

            {/* Code & Nom du Groupe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Code Unique du Groupe * :
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rec = generateRecommendedCode(level, stream);
                      setGroupId(rec);
                      setCodeTouched(true);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    Générer Code
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value.toUpperCase());
                    setCodeTouched(true);
                  }}
                  placeholder="Ex: GRP-TERM-D-SCI"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-indigo-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Identifiant technique unique utilisé pour regrouper les élèves
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Libellé du Groupe d'Étude * :
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Groupe Terminale D Sciences & Maths"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Nom affiché sur les fiches de cours, reçus et tableaux de bord
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Matières, Séances & Créneau */}
          <div className="rounded-xl border border-slate-800 bg-slate-850/70 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>2. Matières Enseignées & Planning Hebdomadaire</span>
            </h3>

            {/* Matières Badges */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Matières prises en charge dans ce groupe :
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(COMMON_SUBJECTS_BY_STREAM[stream] || []).map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600/80 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom subject */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  placeholder="Ajouter une autre matière (ex: Dessin, Allemand)..."
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-400 font-semibold border border-slate-700 cursor-pointer"
                >
                  + Ajouter
                </button>
              </div>
            </div>

            {/* Séances & Créneau */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre de Séances par Semaine :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                    className="w-24 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-400">
                    séances / sem. (ex: 3 séances = 6h/semaine)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Créneau Horaire Mutualisé :
                </label>
                <input
                  type="text"
                  required
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  placeholder="ex: Samedi & Dimanche 09h-11h"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick schedule presets */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">
                Suggestions rapides d'horaires :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SCHEDULE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTimeSlot(p)}
                    className="text-[10.5px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Attribution d'un Encadreur Référent */}
          <div className="rounded-xl border border-slate-800 bg-slate-850/70 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                <span>3. Enseignant(s) / Encadreur(s) Référent(s) (Optionnel)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {selectedTutorIds.length} sélectionné(s)
              </span>
            </h3>

            {tutors.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Aucun enseignant enregistré dans le système pour le moment. Vous pourrez en affecter ultérieurement.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {tutors.map((t) => {
                  const isSelected = selectedTutorIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTutorSelection(t.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500/80 text-white'
                          : 'bg-slate-800/80 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold block truncate">{t.fullName}</span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {(t.subjects || []).join(', ') || 'Toutes matières'} · {t.phone}
                        </span>
                      </div>
                      <div
                        className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Élèves à intégrer immédiatement */}
          <div className="rounded-xl border border-slate-800 bg-slate-850/70 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>4. Intégrer Immédiatement des Élèves ({selectedStudentIds.length} sélectionnés)</span>
              </h3>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Chercher un élève..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-7 pr-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {candidateStudents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Aucun élève trouvé. Vous pourrez créer le groupe vide et y affecter des élèves par la suite.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {candidateStudents.slice(0, 30).map((stu) => {
                  const isSelected = selectedStudentIds.includes(stu.id);
                  const isAlreadyInGroup = !!stu.groupId;

                  return (
                    <div
                      key={stu.id}
                      onClick={() => toggleStudentSelection(stu.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white'
                          : 'bg-slate-800/70 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold block truncate text-xs">{stu.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {stu.matricule} · {stu.level} · {stu.guardianName}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isAlreadyInGroup ? (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                            Déjà en {stu.groupId}
                          </span>
                        ) : (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Sans groupe
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Notes / Remarques */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Notes & Objectifs Pédagogiques (Optionnel) :
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Groupe axé sur les épreuves de type Bac et renforcement des acquis méthodologiques..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !groupId.trim() || !groupName.trim()}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Création en cours...' : 'Créer le Groupe d\'Étude'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
