import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Shield,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCurrentFrenchDate } from '../../utils/dateUtils';

const QUICK_EXAM_SUGGESTIONS = [
  'ENA / ENAM (Administration)',
  'Police Nationale (ENP)',
  'Douanes & Trésor',
  'Gendarmerie Nationale',
  'Garde Nationale (GNN)',
  'Santé Publique (ENSP)',
  'Eaux & Forêts',
  'Impôts & Domaines',
  'Magistrature & Justice',
];

const DIPLOMA_SUGGESTIONS = [
  'Doctorat / Ph.D',
  'Master 2 / DESS',
  'Master 1 / Maîtrise',
  'Licence 3 / L3',
  'BTS / DUT (Bac+2)',
  'Baccalauréat (Séries A/C/D/G)',
  'BEPC / Niveau Secondaire',
];

const NIGER_CITIES = [
  'Niamey',
  'Zinder',
  'Maradi',
  'Tahoua',
  'Agadez',
  'Dosso',
  'Tillabéri',
  'Diffa',
];

export const NewExamDossierModal: React.FC = () => {
  const { isNewExamModalOpen, setIsNewExamModalOpen, addExam, networkStatus } = useApp();

  // Candidat - Identité
  const [candidateName, setCandidateName] = useState('');
  const [gender, setGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('Niamey');
  const [nationality, setNationality] = useState('Nigérienne');

  // Candidat - Coordonnées & Résidence
  const [contactPhone, setContactPhone] = useState('+227 ');
  const [email, setEmail] = useState('');
  const [residenceCity, setResidenceCity] = useState('Niamey');

  // Candidat - Profil académique
  const [educationLevel, setEducationLevel] = useState('Licence 3 / L3');
  const [fieldOfStudy, setFieldOfStudy] = useState('');

  // Concours visé
  const [examType, setExamType] = useState<string>('ENA / ENAM');
  const [examBatch, setExamBatch] = useState('Cycle Supérieur - Administration Générale');
  const [examCenter, setExamCenter] = useState('Niamey (Centre Unique)');
  const [prepFee, setPrepFee] = useState<number>(35000);
  const [status, setStatus] = useState<string>('Inscrit');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isNewExamModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addExam({
        candidateName: candidateName.trim(),
        gender,
        birthDate: birthDate.trim() || undefined,
        birthPlace: birthPlace.trim() || undefined,
        nationality: nationality.trim() || 'Nigérienne',
        contactPhone: contactPhone.trim(),
        email: email.trim() || undefined,
        residenceCity: residenceCity.trim() || undefined,
        educationLevel: educationLevel.trim() || undefined,
        fieldOfStudy: fieldOfStudy.trim() || undefined,
        examType: examType.trim() || 'Concours Professionnel',
        examBatch: examBatch.trim() || 'Session 2026',
        examCenter: examCenter.trim() || 'Niamey',
        prepFee: prepFee ? Number(prepFee) : undefined,
        status: (status as any) || 'Inscrit',
        notes: notes.trim() || undefined,
        submissionDate: getCurrentFrenchDate(),
      });

      // Reset form
      setCandidateName('');
      setContactPhone('+227 ');
      setEmail('');
      setFieldOfStudy('');
      setNotes('');
      setIsNewExamModalOpen(false);
    } catch (error) {
      console.error('Error saving exam application to Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Inscription Candidat - Concours Professionnel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saisie des informations complètes du candidat & enregistrement Cloud
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNewExamModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Offline Warning banner if any */}
        {networkStatus === 'offline' && (
          <div className="px-6 py-2 bg-amber-500/15 border-b border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>Mode Hors-ligne :</strong> Le dossier sera conservé localement et répliqué vers Firestore dès rétablissement réseau.
            </span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* SECTION 1: Identité & État Civil du Candidat */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              <User className="h-4 w-4" />
              <span>1. Identité & État Civil du Candidat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom & Prénoms complets du candidat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hassane Ousmane Dan Mallam"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sexe / Genre <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="Masculin (M)">Masculin (M)</option>
                  <option value="Féminin (F)">Féminin (F)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lieu de naissance
                </label>
                <input
                  type="text"
                  placeholder="Ex: Niamey, Zinder, Tahoua..."
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nationalité
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nigérienne"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Coordonnées & Résidence */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              <Phone className="h-4 w-4" />
              <span>2. Coordonnées & Résidence au Niger</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Téléphone Contact (+227) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+227 96 00 00 00"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse Email (Optionnel)
                </label>
                <input
                  type="email"
                  placeholder="candidat@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ville & Quartier de résidence
                </label>
                <input
                  type="text"
                  placeholder="Ex: Niamey - Banifandou / Yantala"
                  value={residenceCity}
                  onChange={(e) => setResidenceCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Profil Académique & Diplômes */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              <Award className="h-4 w-4" />
              <span>3. Profil Académique & Dernier Diplôme</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dernier Diplôme / Niveau d'Études
                </label>
                <input
                  type="text"
                  list="diploma-options"
                  placeholder="Ex: Licence 3, Master 2, Baccalauréat..."
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none font-medium"
                />
                <datalist id="diploma-options">
                  {DIPLOMA_SUGGESTIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Série / Filière / Spécialité
                </label>
                <input
                  type="text"
                  placeholder="Ex: Droit Public, Économie, Sciences Gestion, Santé..."
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Concours & Session Visée */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                <Shield className="h-4 w-4" />
                <span>4. Concours Professionnel & Session Visée</span>
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
                Saisie libre garantie
              </span>
            </div>

            {/* Quick Suggestions Chips */}
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span>Raccourcis concours courants au Niger :</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXAM_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setExamType(sug)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer border ${
                      examType === sug
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type de Concours (Saisie libre) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ENA / ENAM, Police, Douanes..."
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corps / Grade / Option Visée <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cycle Supérieur - Administrateur Général"
                  value={examBatch}
                  onChange={(e) => setExamBatch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Centre d'Examen / Ville
                </label>
                <input
                  type="text"
                  list="city-options"
                  placeholder="Ex: Niamey (Centre Unique)"
                  value={examCenter}
                  onChange={(e) => setExamCenter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                />
                <datalist id="city-options">
                  {NIGER_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Frais de Préparation (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="35000"
                  value={prepFee || ''}
                  onChange={(e) => setPrepFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Statut de la Candidature
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="Inscrit">Inscrit (En cours de prépa)</option>
                  <option value="Validé">Validé (Dossier conforme)</option>
                  <option value="En instruction">En instruction</option>
                  <option value="Admis">Admis au Concours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observations & Remarques (Optionnel)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Candidat inscrit pour la session intensive du soir. Préparation accélérée..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer / Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsNewExamModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Enregistrement Cloud...' : 'Enregistrer le Candidat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
