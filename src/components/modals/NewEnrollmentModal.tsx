import React, { useState, useEffect } from 'react';
import { X, UserCheck, Clock, Camera, Loader2, Calendar, Sparkles, Minus, Plus, Edit, GraduationCap, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageOptimizer';
import {
  getCurrentFrenchDate,
  formatSessionHours,
  calculateWeeklyHours,
  calculateMonthlyHours,
} from '../../utils/dateUtils';
import { DEFAULT_PROMOTION, PRESET_PROMOTIONS } from '../../utils/promotionUtils';
import { calculateAccountStatus } from '../../utils/financialUtils';

export const NewEnrollmentModal: React.FC = () => {
  const {
    isNewStudentModalOpen,
    setIsNewStudentModalOpen,
    editingStudent,
    setEditingStudent,
    addStudent,
    updateStudent,
    addPayment,
    networkStatus,
    showToast,
  } = useApp();

  const [stream, setStream] = useState<'Primaire' | 'Collège' | 'Lycée' | 'Prépa Concours'>('Primaire');
  const [level, setLevel] = useState('CM2 (CFEPD & Entrée en 6ème)');
  const [promotion, setPromotion] = useState<string>(DEFAULT_PROMOTION);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [avatar, setAvatar] = useState<string>('');
  const [subjects, setSubjects] = useState('Calcul, Français, Dictée, Éveil');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('+227 ');
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [monthlyFee, setMonthlyFee] = useState<number>(20000);
  const [initialTuition, setInitialTuition] = useState<number>(0);
  const [registrationFeeDue, setRegistrationFeeDue] = useState<number>(10000);
  const [registrationFeePaid, setRegistrationFeePaid] = useState<number>(10000);
  const [includeRegistration, setIncludeRegistration] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [schoolAttended, setSchoolAttended] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setStream((editingStudent.stream as any) || 'Primaire');
      setLevel(editingStudent.level);
      setPromotion(editingStudent.promotion || DEFAULT_PROMOTION);
      setFullName(editingStudent.fullName);
      setGender(editingStudent.gender || 'Masculin (M)');
      setAvatar(editingStudent.avatar || '');
      setSubjects(editingStudent.subjects ? editingStudent.subjects.join(', ') : '');
      setGuardianName(editingStudent.guardianName);
      setGuardianPhone(editingStudent.guardianPhone);
      setSessionsPerWeek(editingStudent.sessionsPerWeek || 3);
      setGroupId(editingStudent.groupId || '');
      setGroupName(editingStudent.groupName || '');
      setTimeSlot(editingStudent.timeSlot || '');
      setMonthlyFee(editingStudent.encadrement?.due ?? editingStudent.monthlyFee ?? 20000);
      setInitialTuition(editingStudent.encadrement?.paid ?? editingStudent.paidAmount ?? 0);
      setRegistrationFeeDue(editingStudent.inscription?.due ?? 10000);
      setRegistrationFeePaid(editingStudent.inscription?.paid ?? 0);
      setIncludeRegistration(true);
      setNotes(editingStudent.notes || '');
      setSchoolAttended(editingStudent.schoolAttended || editingStudent.etablissementFrequente || '');
    } else {
      setStream('Primaire');
      setLevel('CM2 (CFEPD & Entrée en 6ème)');
      setPromotion(DEFAULT_PROMOTION);
      setFullName('');
      setGender('Masculin (M)');
      setAvatar('');
      setSubjects('Calcul & Problèmes, Français, Dictée, Éveil');
      setGuardianName('');
      setGuardianPhone('+227 ');
      setSessionsPerWeek(3);
      setGroupId('');
      setGroupName('');
      setTimeSlot('');
      setMonthlyFee(20000);
      setInitialTuition(0);
      setRegistrationFeeDue(10000);
      setRegistrationFeePaid(10000);
      setIncludeRegistration(true);
      setNotes('');
      setSchoolAttended('');
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
        setInitialTuition(20000);
        setSessionsPerWeek(3);
      } else if (newStream === 'Collège') {
        setLevel('Troisième 3ème (Prépa BEPC)');
        setSubjects('Mathématiques, Physique-Chimie, Français, Anglais');
        setMonthlyFee(25000);
        setInitialTuition(25000);
        setSessionsPerWeek(3);
      } else if (newStream === 'Lycée') {
        setLevel('Terminale D (Bac Scientifique)');
        setSubjects('Mathématiques, Sciences Physiques, SVT');
        setMonthlyFee(35000);
        setInitialTuition(35000);
        setSessionsPerWeek(4);
      } else {
        setLevel('Prépa Concours Direct');
        setSubjects('Culture Générale, Épreuves Spécifiques, Entretien');
        setMonthlyFee(50000);
        setInitialTuition(50000);
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
      const cleanPromotion = promotion.trim() || DEFAULT_PROMOTION;
      const regDue = Number(registrationFeeDue || 0);
      const regPaid = includeRegistration ? Number(registrationFeePaid || 0) : 0;
      const regStatus = calculateAccountStatus(regDue, regPaid);

      const encDue = Number(monthlyFee || 0);
      const encPaid = Number(initialTuition || 0);
      const encStatus = calculateAccountStatus(encDue, encPaid);

      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          fullName: fullName.trim(),
          gender,
          avatar: avatar || undefined,
          promotion: cleanPromotion,
          level,
          stream,
          subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          sessionsPerWeek: validatedSessions,
          groupId: groupId.trim() || undefined,
          groupName: groupName.trim() || undefined,
          timeSlot: timeSlot.trim() || undefined,
          monthlyFee: encDue,
          paidAmount: encPaid,
          paymentStatus: encStatus === 'PAID' ? 'A jour' : encStatus === 'PENDING' ? 'Partiel' : 'En retard',
          inscription: {
            due: regDue,
            paid: regPaid,
            status: regStatus,
          },
          encadrement: {
            due: encDue,
            paid: encPaid,
            status: encStatus,
          },
          notes,
          schoolAttended: schoolAttended.trim() || undefined,
          etablissementFrequente: schoolAttended.trim() || undefined,
        });
        showToast(`Dossier de l'élève ${fullName.trim()} mis à jour avec succès (${cleanPromotion}). Flux financiers cloisonnés.`, 'success');
      } else {
        const newStu = await addStudent({
          fullName: fullName.trim(),
          gender,
          avatar: avatar || undefined,
          promotion: cleanPromotion,
          level,
          stream,
          subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          sessionsPerWeek: validatedSessions,
          groupId: groupId.trim() || undefined,
          groupName: groupName.trim() || undefined,
          timeSlot: timeSlot.trim() || undefined,
          monthlyFee: encDue,
          paidAmount: encPaid,
          paymentStatus: encStatus === 'PAID' ? 'A jour' : encStatus === 'PENDING' ? 'Partiel' : 'En retard',
          inscription: {
            due: regDue,
            paid: regPaid,
            status: regStatus,
          },
          encadrement: {
            due: encDue,
            paid: encPaid,
            status: encStatus,
          },
          tutoringStatus: 'Actif',
          enrollmentDate: getCurrentFrenchDate(),
          notes,
          schoolAttended: schoolAttended.trim() || undefined,
          etablissementFrequente: schoolAttended.trim() || undefined,
        });

        // 1. Émission du reçu autonome pour les Frais d'Inscription si encaissés
        if (regPaid > 0 && newStu) {
          await addPayment({
            studentId: newStu.id,
            studentName: fullName.trim(),
            category: 'Inscription',
            amount: regPaid,
            paymentMethod: 'Espèces',
            paymentDate: `${getCurrentFrenchDate()} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            cashierName: 'Guichet Inscription CAS MANI',
            status: 'Validé',
            notes: `Frais d'inscription uniques (Compte Inscription Cloisonné) pour ${fullName.trim()}`,
          });
        }

        // 2. Émission du reçu autonome pour les Frais d'Encadrement si acompte versé
        if (encPaid > 0 && newStu) {
          await addPayment({
            studentId: newStu.id,
            studentName: fullName.trim(),
            category: 'Scolarité Mensuelle',
            amount: encPaid,
            paymentMethod: 'Espèces',
            paymentDate: `${getCurrentFrenchDate()} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            cashierName: 'Guichet Inscription CAS MANI',
            status: 'Validé',
            notes: `Acompte frais d'encadrement périodiques (Compte Encadrement Cloisonné) pour ${fullName.trim()}`,
          });
        }

        showToast(`Nouvelle inscription de ${fullName.trim()} enregistrée. Flux Inscription & Encadrement strictement cloisonnés.`, 'success');
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
                  ? `Matricule : ${editingStudent.matricule} · Mise à jour du dossier`
                  : 'Frais d\'inscription et d\'encadrement distincts · Google Firebase'}
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

        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Mode Hors-ligne :</strong> L'élève et ses reçus seront mis en cache local et répliqués vers Firestore.
            </span>
          </div>
        )}

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
                  <option value="CI (Cours d'Initiation)">CI (Cours d'Initiation)</option>
                  <option value="CP (Cours Préparatoire)">CP (Cours Préparatoire)</option>
                  <option value="CE1">CE1</option>
                  <option value="CE2">CE2</option>
                  <option value="CM1">CM1</option>
                  <option value="CM2 (CFEPD & Entrée en 6ème)">CM2 (CFEPD & Entrée en 6ème)</option>
                </>
              )}
              {stream === 'Collège' && (
                <>
                  <option value="Sixième 6ème">Sixième 6ème</option>
                  <option value="Cinquième 5ème">Cinquième 5ème</option>
                  <option value="Quatrième 4ème">Quatrième 4ème</option>
                  <option value="Troisième 3ème (Prépa BEPC)">Troisième 3ème (Prépa BEPC)</option>
                </>
              )}
              {stream === 'Lycée' && (
                <>
                  <option value="Seconde 2nde (A / C / D)">Seconde 2nde (A / C / D)</option>
                  <option value="Première 1ère (A / C / D / D+)">Première 1ère (A / C / D / D+)</option>
                  <option value="Terminale D (Bac Scientifique)">Terminale D (Bac Scientifique)</option>
                  <option value="Terminale C (Maths & Physiques)">Terminale C (Maths & Physiques)</option>
                  <option value="Terminale A4 (Lettres & philo)">Terminale A4 (Lettres & philo)</option>
                </>
              )}
              {stream === 'Prépa Concours' && (
                <>
                  <option value="Prépa Concours Direct">Prépa Concours Direct</option>
                  <option value="Prépa Concours Professionnel">Prépa Concours Professionnel</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom du Tuteur / Parent (Niamey) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: M. Oumarou Garba"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Téléphone du Tuteur *
              </label>
              <input
                type="text"
                required
                placeholder="+227 90 ..."
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Établissement fréquenté (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: École Primaire Publique / Collège Mariama..."
              value={schoolAttended}
              onChange={(e) => setSchoolAttended(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Séances d'Encadrement par Semaine *
              </label>
              <input
                type="number"
                min="1"
                max="7"
                required
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Promotion Académique *
              </label>
              <select
                value={promotion}
                onChange={(e) => setPromotion(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer font-semibold"
              >
                {PRESET_PROMOTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BANDEAU RÈGLE MÉTIER : CLOISONNEMENT STRICT DES COMPTES */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 flex items-start gap-2.5 text-xs text-indigo-300">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Règle Financière CAS-MANI : Isolation des Comptes</strong>
              <span>
                Les <strong>Frais d'inscription</strong> (admission unique) et les <strong>Frais d'encadrement</strong> (scolarité périodique) sont gérés dans des comptes strictement séparés. Aucun versement d'une catégorie ne peut compenser l'autre.
              </span>
            </div>
          </div>

          {/* COMPTE 1 : FRAIS D'INSCRIPTION (ADMISSION UNIQUE) */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                  1
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Compte Frais d'Inscription (Admission & Enregistrement Unique)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Admission Unique
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Montant dû d'inscription (FCFA) *
                </label>
                <input
                  type="number"
                  step="500"
                  value={registrationFeeDue}
                  onChange={(e) => setRegistrationFeeDue(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ex: 10 000 FCFA pour l'ouverture du dossier élève.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Montant versé à l'admission (FCFA) *
                </label>
                <input
                  type="number"
                  step="500"
                  value={registrationFeePaid}
                  onChange={(e) => setRegistrationFeePaid(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[10px] mt-1">
                  <span className="text-slate-400">
                    Reste dû : {Math.max(0, registrationFeeDue - registrationFeePaid).toLocaleString()} FCFA
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                      registrationFeePaid >= registrationFeeDue && registrationFeeDue > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : registrationFeePaid > 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {registrationFeePaid >= registrationFeeDue && registrationFeeDue > 0
                      ? 'PAID (Soldé)'
                      : registrationFeePaid > 0
                      ? 'PENDING (Partiel)'
                      : 'UNPAID (Non réglé)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COMPTE 2 : FRAIS D'ENCADREMENT (SCOLARITÉ PÉRIODIQUE) */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  2
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Compte Frais d'Encadrement (Scolarité & Cours Périodiques)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Périodique (Mois)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tarif Mensuel d'Encadrement (FCFA) *
                </label>
                <input
                  type="number"
                  step="1000"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Échéance due par mois d'encadrement pédagogique.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Acompte scolarité / encadrement versé (FCFA)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={initialTuition}
                  onChange={(e) => setInitialTuition(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[10px] mt-1">
                  <span className="text-slate-400">
                    Reste dû : {Math.max(0, monthlyFee - initialTuition).toLocaleString()} FCFA
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                      initialTuition >= monthlyFee && monthlyFee > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : initialTuition > 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {initialTuition >= monthlyFee && monthlyFee > 0
                      ? 'PAID (Soldé)'
                      : initialTuition > 0
                      ? 'PENDING (Partiel)'
                      : 'UNPAID (Non réglé)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quartier à Niamey / Observations
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Quartier Yantala / Plateau..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
              <span>{editingStudent ? 'Mettre à jour le dossier' : "Valider l'Inscription"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
