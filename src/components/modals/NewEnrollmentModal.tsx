import React, { useState, useEffect } from 'react';
import { X, UserCheck, Clock, Camera, Loader2, Calendar, Sparkles, Minus, Plus, Edit } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageOptimizer';
import { getCurrentFrenchDate } from '../../utils/dateUtils';

export const NewEnrollmentModal: React.FC = () => {
  const {
    isNewStudentModalOpen,
    setIsNewStudentModalOpen,
    editingStudent,
    setEditingStudent,
    addStudent,
    updateStudent,
    networkStatus,
    showToast,
  } = useApp();

  const [stream, setStream] = useState<'Primaire' | 'Collège' | 'Lycée' | 'Prépa Concours'>('Primaire');
  const [level, setLevel] = useState('CM2 (CFEPD & Entrée en 6ème)');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [avatar, setAvatar] = useState<string>('');
  const [subjects, setSubjects] = useState('Calcul, Français, Dictée, Éveil');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('+227 ');
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
  const [monthlyFee, setMonthlyFee] = useState<number>(20000);
  const [initialPayment, setInitialPayment] = useState<number>(20000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setStream((editingStudent.stream as any) || 'Primaire');
      setLevel(editingStudent.level);
      setFullName(editingStudent.fullName);
      setGender(editingStudent.gender || 'Masculin (M)');
      setAvatar(editingStudent.avatar || '');
      setSubjects(editingStudent.subjects ? editingStudent.subjects.join(', ') : '');
      setGuardianName(editingStudent.guardianName);
      setGuardianPhone(editingStudent.guardianPhone);
      setSessionsPerWeek(editingStudent.sessionsPerWeek || 3);
      setMonthlyFee(editingStudent.monthlyFee);
      setInitialPayment(editingStudent.paidAmount);
      setNotes(editingStudent.notes || '');
    } else {
      setStream('Primaire');
      setLevel('CM2 (CFEPD & Entrée en 6ème)');
      setFullName('');
      setGender('Masculin (M)');
      setAvatar('');
      setSubjects('Calcul & Problèmes, Français, Dictée, Éveil');
      setGuardianName('');
      setGuardianPhone('+227 ');
      setSessionsPerWeek(3);
      setMonthlyFee(20000);
      setInitialPayment(20000);
      setNotes('');
    }
  }, [editingStudent, isNewStudentModalOpen]);

  if (!isNewStudentModalOpen) return null;

  const handleClose = () => {
    setIsNewStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleStreamChange = (newStream: 'Primaire' | 'Collège' | 'Lycée' | 'Prépa Concours') => {
    setStream(newStream);
    if (!editingStudent) {
      if (newStream === 'Primaire') {
        setLevel('CM2 (CFEPD & Entrée en 6ème)');
        setSubjects('Calcul & Problèmes, Français, Dictée, Éveil');
        setMonthlyFee(20000);
        setInitialPayment(20000);
        setSessionsPerWeek(3);
      } else if (newStream === 'Collège') {
        setLevel('Troisième 3ème (Prépa BEPC)');
        setSubjects('Mathématiques, Physique-Chimie, Français, Anglais');
        setMonthlyFee(25000);
        setInitialPayment(25000);
        setSessionsPerWeek(3);
      } else if (newStream === 'Lycée') {
        setLevel('Terminale D (Bac Scientifique)');
        setSubjects('Mathématiques, Sciences Physiques, SVT');
        setMonthlyFee(35000);
        setInitialPayment(35000);
        setSessionsPerWeek(4);
      } else {
        setLevel('Prépa Concours Direct');
        setSubjects('Culture Générale, Épreuves Spécifiques, Entretien');
        setMonthlyFee(50000);
        setInitialPayment(50000);
        setSessionsPerWeek(3);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.7 });
      setAvatar(compressed);
    } catch (err) {
      console.error('Failed to compress avatar', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !guardianName.trim() || isSubmitting) return;

    const validatedSessions = Math.max(1, Number(sessionsPerWeek) || 1);

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          fullName: fullName.trim(),
          gender,
          avatar: avatar || undefined,
          level,
          stream,
          subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          sessionsPerWeek: validatedSessions,
          monthlyFee,
          notes,
        });
        showToast(`Dossier de l'élève ${fullName.trim()} mis à jour avec succès.`, 'success');
      } else {
        await addStudent({
          fullName: fullName.trim(),
          gender,
          avatar: avatar || undefined,
          level,
          stream,
          subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          sessionsPerWeek: validatedSessions,
          monthlyFee,
          paidAmount: initialPayment,
          paymentStatus: initialPayment >= monthlyFee ? 'A jour' : initialPayment > 0 ? 'Partiel' : 'En retard',
          tutoringStatus: 'Actif',
          enrollmentDate: getCurrentFrenchDate(),
          notes,
        });
        showToast(`Nouvelle inscription de ${fullName.trim()} enregistrée (${validatedSessions} séances/semaine).`, 'success');
      }

      handleClose();
    } catch (error) {
      console.error('Error saving enrollment to Firestore:', error);
      showToast("Erreur lors de l'enregistrement de l'élève.", 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              editingStudent ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              {editingStudent ? <Edit className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingStudent ? `Modifier l'Élève : ${editingStudent.fullName}` : 'Nouvelle Inscription Élève'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingStudent
                  ? `Matricule : ${editingStudent.matricule} · Mise à jour du dossier et quota séances`
                  : 'Enregistrement direct dans Google Firebase Cloud Firestore'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Offline indicator banner inside modal */}
        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Mode Hors-ligne :</strong> L'élève sera mis en file d'attente locale et répliqué vers Firestore dès le rétablissement réseau.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 flex items-center justify-center shrink-0">
              {avatar ? (
                <img src={avatar} alt="Aperçu élève" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Photo d'identité de l'élève (Optionnel)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">Format portrait, compression automatique &lt; 600x600px</p>
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer transition-colors">
                <Camera className="h-3.5 w-3.5" />
                <span>Sélectionner une photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Cycle selector buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cycle Scolaire *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleStreamChange('Primaire')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  stream === 'Primaire'
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                1. Primaire (CI-CM2)
              </button>
              <button
                type="button"
                onClick={() => handleStreamChange('Collège')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  stream === 'Collège'
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                2. Collège (6e-3e)
              </button>
              <button
                type="button"
                onClick={() => handleStreamChange('Lycée')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  stream === 'Lycée'
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                3. Lycée (2nde-Tle)
              </button>
              <button
                type="button"
                onClick={() => handleStreamChange('Prépa Concours')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  stream === 'Prépa Concours'
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                4. Prépa Concours
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom complet de l'élève *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Hadiza Moussa Garba"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="Masculin (M)">Masculin (M)</option>
                <option value="Féminin (F)">Féminin (F)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Classe d'Appui ({stream}) *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {stream === 'Primaire' && (
                <>
                  <option value="CM2 (CFEPD & Entrée en 6ème)">CM2 (Prépa Examen CFEPD & Entrée en 6ème)</option>
                  <option value="CM1">CM1 (Cours Moyen 1ère Année)</option>
                  <option value="CE2">CE2 (Cours Élémentaire 2)</option>
                  <option value="CE1">CE1 (Cours Élémentaire 1)</option>
                  <option value="CP">CP (Cours Préparatoire)</option>
                  <option value="CI">CI (Cours d'Initiation)</option>
                </>
              )}

              {stream === 'Collège' && (
                <>
                  <option value="Troisième 3ème (BEPC)">Troisième 3ème (Préparation BEPC Niger)</option>
                  <option value="Quatrième 4ème">Quatrième 4ème</option>
                  <option value="Cinquième 5ème">Cinquième 5ème</option>
                  <option value="Sixième 6ème">Sixième 6ème (Entrée en Collège)</option>
                </>
              )}

              {stream === 'Lycée' && (
                <>
                  <option value="Terminale D (Bac Scientifique)">Terminale D (Baccalauréat Scientifique SVT/Maths)</option>
                  <option value="Terminale C (Bac Maths Expertes)">Terminale C (Baccalauréat Mathématiques & Phys)</option>
                  <option value="Terminale A4 (Bac Littéraire)">Terminale A4 (Baccalauréat Lettres & Philo)</option>
                  <option value="Première D (Sciences Naturelles)">Première D (Sciences Naturelles)</option>
                  <option value="Première C (Sciences Exactes)">Première C (Sciences Exactes)</option>
                  <option value="Première A (Lettres)">Première A (Lettres)</option>
                  <option value="Seconde C (Scientifique)">Seconde C (Scientifique)</option>
                  <option value="Seconde A (Littéraire)">Seconde A (Littéraire)</option>
                </>
              )}

              {stream === 'Prépa Concours' && (
                <>
                  <option value="Prépa ENAM Niamey">Préparation ENAM Niamey</option>
                  <option value="Prépa Police Nationale">Préparation Police Nationale du Niger</option>
                  <option value="Prépa Gendarmerie Nationale">Préparation Gendarmerie Nationale</option>
                  <option value="Prépa Garde Nationale (GNN)">Préparation Garde Nationale du Niger (GNN)</option>
                  <option value="Prépa Douanes & Trésor">Préparation Douanes & Trésor Niger</option>
                  <option value="Prépa Santé Publique (ENSP)">Préparation ENSP Niamey</option>
                </>
              )}
            </select>
          </div>

          {/* CRITICAL NEW FIELD: Nombre de séances par semaine */}
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-600/30 p-1.5 text-indigo-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <label htmlFor="sessionsPerWeekInput" className="block text-xs font-bold text-white">
                    Nombre de séances par semaine *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Quota hebdomadaire d'encadrement pédagogique saisi manuellement
                  </span>
                </div>
              </div>

              {/* Dynamic weekly hours estimate */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  {sessionsPerWeek} séance{sessionsPerWeek > 1 ? 's' : ''}/sem.
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                  ~{sessionsPerWeek * 2} heures/semaine
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {/* Stepper Controls */}
              <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setSessionsPerWeek((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Diminuer d'une séance"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  id="sessionsPerWeekInput"
                  type="number"
                  required
                  min={1}
                  max={14}
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-14 bg-transparent text-center font-mono text-sm font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSessionsPerWeek((prev) => Math.min(14, prev + 1))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title="Augmenter d'une séance"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 mr-1">Raccourcis :</span>
                {[2, 3, 4, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSessionsPerWeek(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      sessionsPerWeek === preset
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    {preset} {preset === 2 ? '(Week-end)' : preset === 3 ? '(Standard)' : preset === 5 ? '(Intensif)' : 'séances'}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-indigo-300/80">
              💡 Ce quota servira de repère obligatoire lors de l'affectation des encadreurs pour équilibrer leur emploi du temps.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Matières de renforcement (séparées par virgules)
            </label>
            <input
              type="text"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Parent ou Tuteur Légal *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Elhadj Moussa Oumarou (Père)"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Téléphone au Niger (+227) *
              </label>
              <input
                type="tel"
                required
                placeholder="+227 96 00 00 00"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tarif Mensuel Scolarité (FCFA)
              </label>
              <input
                type="number"
                step="1000"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {editingStudent ? 'Montant déjà réglé (FCFA)' : "Acompte versé à l'inscription (FCFA)"}
              </label>
              <input
                type="number"
                step="1000"
                value={initialPayment}
                onChange={(e) => setInitialPayment(Number(e.target.value))}
                disabled={!!editingStudent}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
              />
              {editingStudent && (
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Utilisez le module Caisse & Reçus pour encaisser un versement supplémentaire.
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quartier à Niamey / Observations
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Quartier Yantala / Plateau, renforcement en calcul pour le CFEPD..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Enregistrement Cloud...'
                  : editingStudent
                  ? 'Enregistrer les modifications'
                  : "Enregistrer l'inscription"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
