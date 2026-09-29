import React, { useState } from 'react';
import { X, UserCheck, Clock, Camera, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageOptimizer';
import { getCurrentFrenchDate } from '../../utils/dateUtils';

export const NewEnrollmentModal: React.FC = () => {
  const { isNewStudentModalOpen, setIsNewStudentModalOpen, addStudent, networkStatus } = useApp();

  const [stream, setStream] = useState<'Primaire' | 'Collège' | 'Lycée' | 'Prépa Concours'>('Primaire');
  const [level, setLevel] = useState('CM2 (CFEPD & Entrée en 6ème)');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [subjects, setSubjects] = useState('Calcul, Français, Dictée, Éveil');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('+227 ');
  const [monthlyFee, setMonthlyFee] = useState<number>(20000);
  const [initialPayment, setInitialPayment] = useState<number>(20000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNewStudentModalOpen) return null;

  const handleStreamChange = (newStream: 'Primaire' | 'Collège' | 'Lycée' | 'Prépa Concours') => {
    setStream(newStream);
    if (newStream === 'Primaire') {
      setLevel('CM2 (CFEPD & Entrée en 6ème)');
      setSubjects('Calcul & Problèmes, Français, Dictée, Éveil');
      setMonthlyFee(20000);
      setInitialPayment(20000);
    } else if (newStream === 'Collège') {
      setLevel('Troisième 3ème (Prépa BEPC)');
      setSubjects('Mathématiques, Physique-Chimie, Français, Anglais');
      setMonthlyFee(25000);
      setInitialPayment(25000);
    } else if (newStream === 'Lycée') {
      setLevel('Terminale D (Bac Scientifique)');
      setSubjects('Mathématiques, Sciences Physiques, SVT');
      setMonthlyFee(35000);
      setInitialPayment(35000);
    } else {
      setLevel('Prépa Concours Direct');
      setSubjects('Culture Générale, Épreuves Spécifiques, Entretien');
      setMonthlyFee(50000);
      setInitialPayment(50000);
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

    setIsSubmitting(true);
    try {
      await addStudent({
        fullName: fullName.trim(),
        avatar: avatar || undefined,
        level,
        stream,
        subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        monthlyFee,
        paidAmount: initialPayment,
        paymentStatus: initialPayment >= monthlyFee ? 'A jour' : initialPayment > 0 ? 'Partiel' : 'En retard',
        tutoringStatus: 'Actif',
        enrollmentDate: getCurrentFrenchDate(),
        notes,
      });

      // Reset fields
      setFullName('');
      setAvatar('');
      setGuardianName('');
      setNotes('');
      setIsNewStudentModalOpen(false);
    } catch (error) {
      console.error('Error saving enrollment to Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nouvelle Inscription Élève</h3>
              <p className="text-xs text-slate-400">Enregistrement direct dans Google Firebase Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewStudentModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Offline indicator banner inside modal */}
        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-lg bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
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
              <p className="text-[11px] text-slate-400 mb-2">Compression automatique &lt; 800x800px pour Firestore</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
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
                Acompte versé à l'inscription (FCFA)
              </label>
              <input
                type="number"
                step="1000"
                value={initialPayment}
                onChange={(e) => setInitialPayment(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
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
              onClick={() => setIsNewStudentModalOpen(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Enregistrement Cloud...' : "Enregistrer l'inscription"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
