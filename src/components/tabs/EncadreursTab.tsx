import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  BookOpen,
  Edit,
  Trash2,
  ShieldCheck,
  Award,
  Calendar,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor, Student } from '../../types';
import { NewEncadreurModal } from '../modals/NewEncadreurModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { AssignTutorToGroupModal } from '../modals/AssignTutorToGroupModal';
import {
  formatSessionHours,
  calculateWeeklyHours,
  calculateMonthlyHours,
} from '../../utils/dateUtils';
import {
  isPrimaryStudent,
  getPrimaryTutorForStudent,
  getStudentPedagogicalCoverage,
} from '../../utils/tutorAssignmentValidation';

export const EncadreursTab: React.FC = () => {
  const {
    tutors,
    deleteTutor,
    students,
    showToast,
    isAssignModalOpen,
    setIsAssignModalOpen,
    selectedStudentForAssignment,
    setSelectedStudentForAssignment,
    selectedTutorForAssignment,
    setSelectedTutorForAssignment,
  } = useApp();

  const [activeView, setActiveView] = useState<'annuaire' | 'planning'>('annuaire');
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'hours' | 'students' | 'name'>('hours');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tutorForGroupAssignment, setTutorForGroupAssignment] = useState<Tutor | null>(null);

  const safeTutors = tutors || [];
  const safeStudents = students || [];

  // Helper pour calculer les heures déduites d'un encadreur (1 séance = 1.5h = 1h 30mn)
  const getTutorHours = (t: Tutor) => {
    const tStudents = safeStudents.filter((s) => t.assignedStudentIds?.includes(s.id));
    const tSessions = tStudents.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0);
    const weekly = calculateWeeklyHours(tSessions);
    const monthly = calculateMonthlyHours(tSessions);
    return {
      sessionsCount: tSessions,
      weeklyHours: weekly,
      monthlyHours: monthly,
      studentsCount: tStudents.length,
    };
  };

  // Filtrage et tri des encadreurs
  const filteredTutors = safeTutors
    .filter((t) => {
      const searchLower = (search || '').toLowerCase();
      const nameSafe = (t.fullName || '').toLowerCase();
      const matriculeSafe = (t.matricule || '').toLowerCase();
      const subjectsSafe = t.subjects || [];
      const levelsSafe = t.levels || [];

      const matchesSearch =
        nameSafe.includes(searchLower) ||
        matriculeSafe.includes(searchLower) ||
        subjectsSafe.some((s) => (s || '').toLowerCase().includes(searchLower));

      const matchesGender = genderFilter === 'all' || t.gender === genderFilter;
      const matchesLevel = levelFilter === 'all' || levelsSafe.includes(levelFilter);

      return matchesSearch && matchesGender && matchesLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'hours') {
        return getTutorHours(b).weeklyHours - getTutorHours(a).weeklyHours;
      }
      if (sortBy === 'students') {
        return (b.assignedStudentIds?.length || 0) - (a.assignedStudentIds?.length || 0);
      }
      return (a.fullName || '').localeCompare(b.fullName || '');
    });

  // Filtrage des élèves pour le tableau de planification des séances
  const filteredStudentsForPlanning = safeStudents.filter((s) => {
    const searchLower = (search || '').toLowerCase();
    const nameSafe = (s.fullName || '').toLowerCase();
    const matriculeSafe = (s.matricule || '').toLowerCase();
    const levelSafe = (s.level || '').toLowerCase();
    const subjectsSafe = s.subjects || [];

    const matchesSearch =
      nameSafe.includes(searchLower) ||
      matriculeSafe.includes(searchLower) ||
      levelSafe.includes(searchLower) ||
      subjectsSafe.some((sub) => (sub || '').toLowerCase().includes(searchLower));

    const matchesLevel =
      levelFilter === 'all' ||
      s.stream === levelFilter ||
      levelSafe.includes((levelFilter || '').toLowerCase());

    return matchesSearch && matchesLevel;
  });

  const totalTutors = tutors.length;
  const totalWeeklyHoursAll = tutors.reduce((acc, t) => acc + getTutorHours(t).weeklyHours, 0);
  const totalMonthlyHoursAll = totalWeeklyHoursAll * 4;
  const totalStudentsAssigned = tutors.reduce((acc, t) => acc + (t.assignedStudentIds?.length || 0), 0);

  const handleDeleteConfirm = async () => {
    if (!tutorToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTutor(tutorToDelete.id);
      showToast('Encadreur supprimé avec succès', 'success');
      setIsDeleteModalOpen(false);
      setTutorToDelete(null);
    } catch (err) {
      showToast("Erreur lors de la suppression de l'encadreur", 'warning');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAssignModalForStudent = (student: Student) => {
    setSelectedStudentForAssignment(student);
    setSelectedTutorForAssignment(null);
    setIsAssignModalOpen(true);
  };

  const handleOpenAssignModalForTutor = (tutor: Tutor) => {
    setSelectedTutorForAssignment(tutor);
    setSelectedStudentForAssignment(null);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Cards with Deduced Volume Horaire (1 séance = 1h 30mn) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Encadreurs Actifs</span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {totalTutors}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Corps professoral qualifié</span>
        </div>

        {/* Deduced total hours KPI */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Volume Horaire Déduit</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {formatSessionHours(totalWeeklyHoursAll)} <span className="text-xs font-normal text-slate-500">/ sem.</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            <span>{totalMonthlyHoursAll}h / mois cumulées</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">1 séance = 1h 30mn</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Élèves sous Encadrement</span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {totalStudentsAssigned} <span className="text-xs font-normal text-slate-500">Affectations</span>
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Contrôle d'intégrité strict</span>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
          <button
            onClick={() => setActiveView('annuaire')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeView === 'annuaire'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Annuaire des Encadreurs & Volumes Horaires</span>
          </button>
          <button
            onClick={() => setActiveView('planning')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeView === 'planning'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Tableau de Planification des Séances & Affectations Matières</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedStudentForAssignment(null);
              setSelectedTutorForAssignment(null);
              setIsAssignModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            <span>Affecter Matière / Élève</span>
          </button>

          <button
            onClick={() => {
              setEditingTutor(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Encadreur</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeView === 'annuaire'
                  ? 'Rechercher encadreur par nom, matière, matricule...'
                  : 'Rechercher élève par nom, niveau, matière...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {activeView === 'annuaire' && (
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Sexe : Tous</option>
              <option value="Masculin (M)">Masculin (M)</option>
              <option value="Féminin (F)">Féminin (F)</option>
            </select>
          )}

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Niveau : Tous</option>
            <option value="Primaire">Primaire</option>
            <option value="Collège">Collège</option>
            <option value="Lycée">Lycée</option>
            <option value="Supérieur">Supérieur</option>
            <option value="Prépa Concours">Prépa Concours</option>
          </select>

          {activeView === 'annuaire' && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="hours">Trier par : Volume Horaire Déduit</option>
              <option value="students">Trier par : Nombre d'élèves</option>
              <option value="name">Trier par : Ordre Alphabétique</option>
            </select>
          )}
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {activeView === 'annuaire' ? (
            <span>{filteredTutors.length} encadreur(s) affiché(s)</span>
          ) : (
            <span>{filteredStudentsForPlanning.length} dossier(s) en planification</span>
          )}
        </div>
      </div>

      {/* VUE 1 : ANNUAIRE DES ENCADREURS & VOLUMES HORAIRES DÉDUITS */}
      {activeView === 'annuaire' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Encadreur & Matricule</th>
                  <th className="py-3 px-4">Sexe</th>
                  <th className="py-3 px-4">Matières Enseignées</th>
                  <th className="py-3 px-4">Niveaux d'Intervention</th>
                  <th className="py-3 px-4">Élèves & Séances Attribuées</th>
                  <th className="py-3 px-4 text-center">Volume Horaire Déduit (1h30/séance)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {safeTutors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun encadreur dans la base de données</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            La base de données est actuellement vide. Cliquez sur le bouton ci-dessous pour ajouter votre premier enseignant.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingTutor(null);
                            setIsModalOpen(true);
                          }}
                          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Nouvel Encadreur</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredTutors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucun encadreur trouvé selon vos critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredTutors.map((tutor) => {
                    const assignedStudentsList = students.filter((s) => tutor.assignedStudentIds?.includes(s.id));
                    const tutorHours = getTutorHours(tutor);

                    return (
                      <tr key={tutor.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={tutor.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                              alt={tutor.fullName}
                              className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{tutor.fullName}</span>
                              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{tutor.matricule}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tutor.gender === 'Masculin (M)'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                            }`}
                          >
                            {tutor.gender === 'Masculin (M)' ? 'M' : 'F'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {tutor.subjects.map((subj, idx) => (
                              <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {subj}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {tutor.levels.map((lvl, idx) => (
                              <span key={idx} className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {lvl}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Élèves et Séances */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {assignedStudentsList.length} élève{assignedStudentsList.length > 1 ? 's' : ''}
                              </span>
                              {assignedStudentsList.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold font-mono">
                                  <Calendar className="h-3 w-3" />
                                  {tutorHours.sessionsCount} séa./sem.
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {assignedStudentsList.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">Aucun élève affecté</span>
                              ) : (
                                assignedStudentsList.map((s) => (
                                  <span
                                    key={s.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]"
                                    title={`${s.level} · Quota : ${s.sessionsPerWeek || 3} séances/semaine = ${formatSessionHours((s.sessionsPerWeek || 3) * 1.5)}`}
                                  >
                                    <span>{s.fullName}</span>
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                      ({s.sessionsPerWeek || 3}s/sem. = {formatSessionHours((s.sessionsPerWeek || 3) * 1.5)})
                                    </span>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </td>

                        {/* VOLUME HORAIRE DÉDUIT (1 SÉANCE = 1H 30MN) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border border-emerald-500/20">
                              <Clock className="h-3 w-3" />
                              {formatSessionHours(tutorHours.weeklyHours)} / sem.
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                              soit <strong>{tutorHours.monthlyHours}h / mois</strong>
                            </span>
                            <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-medium">
                              1 séance = 1h 30mn
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAssignModalForTutor(tutor)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors text-[11px] font-semibold cursor-pointer"
                              title="Affecter un élève à cet encadreur"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span>Élève</span>
                            </button>
                            <button
                              onClick={() => setTutorForGroupAssignment(tutor)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors text-[11px] font-semibold cursor-pointer"
                              title="Affecter cet encadreur à un groupe d'encadrement collectif"
                            >
                              <Layers className="h-3 w-3" />
                              <span>+ Groupe</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingTutor(tutor);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors text-[11px] font-semibold cursor-pointer"
                              title="Modifier l'encadreur et ses affectations"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => {
                                setTutorToDelete(tutor);
                                setIsDeleteModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors text-[11px] font-semibold cursor-pointer"
                              title="Supprimer l'encadreur"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE 2 : TABLEAU DE PLANIFICATION DES SÉANCES & AFFECTATIONS MATIÈRES (REQUIREMENT 3) */}
      {activeView === 'planning' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Élève & Matricule</th>
                  <th className="py-3 px-4">Niveau / Cycle</th>
                  <th className="py-3 px-4">Quota Hebdomadaire (1h30/séance)</th>
                  <th className="py-3 px-4">Matières Attribuées & Encadreurs Responsables (Nom & Photo)</th>
                  <th className="py-3 px-4 text-center">Statut Couverture</th>
                  <th className="py-3 px-4 text-right">Actions Planification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudentsForPlanning.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucun élève trouvé pour la planification des séances.
                    </td>
                  </tr>
                ) : (
                  filteredStudentsForPlanning.map((student) => {
                    const isPrimary = isPrimaryStudent(student);
                    const coverage = getStudentPedagogicalCoverage(student, tutors);
                    const weeklySessions = student.sessionsPerWeek || 3;
                    const studentWeeklyDuration = calculateWeeklyHours(weeklySessions);
                    const assignedCount = coverage.filter((c) => c.isAssigned).length;
                    const totalSubjects = student.subjects.length;
                    const isFullyCovered = assignedCount === totalSubjects;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                        {/* Élève */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={student.fullName}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {student.fullName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                  {student.matricule}
                                </span>
                                <span className="text-[10px] text-slate-400">· Tuteur : {student.guardianName}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Niveau & Cycle */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                            {student.level}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                              isPrimary
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {student.stream}
                          </span>
                        </td>

                        {/* Quota hebdomadaire (1 séance = 1h 30mn) */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800 w-fit">
                              <Calendar className="h-3 w-3" />
                              {weeklySessions} séance{weeklySessions > 1 ? 's' : ''}/semaine
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-semibold">
                              = {formatSessionHours(studentWeeklyDuration)} / sem. (1h30/séance)
                            </span>
                          </div>
                        </td>

                        {/* REQUIS : LISTE DES MATIÈRES AVEC NOM ET PHOTO DE L'ENCADREUR RESPONSABLE */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-2 max-w-md">
                            {coverage.map((item) => (
                              <div
                                key={item.subject}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs gap-2 ${
                                  item.isAssigned
                                    ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-800/60'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {item.isAssigned && item.tutorAvatar ? (
                                    <img
                                      src={item.tutorAvatar}
                                      alt={item.tutorName}
                                      className="h-7 w-7 rounded-full object-cover ring-1 ring-indigo-500 shrink-0"
                                      title={item.tutorName}
                                    />
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-400 text-[10px]">
                                      <BookOpen className="h-3.5 w-3.5" />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                      {item.subject}
                                    </span>
                                    {item.isAssigned ? (
                                      <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium block truncate">
                                        Resp. : <strong>{item.tutorName}</strong>{' '}
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          ({item.tutorMatricule})
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 italic block">
                                        Matière en attente d'affectation
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                    item.isAssigned
                                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {item.isAssigned ? 'Attribué' : 'À planifier'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Statut Couverture */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isFullyCovered
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : assignedCount > 0
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isFullyCovered ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Complet ({assignedCount}/{totalSubjects})</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                <span>Partiel ({assignedCount}/{totalSubjects})</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Actions Planification */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAssignModalForStudent(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Gérer l'affectation</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Tutor Modal */}
      <NewEncadreurModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTutor(null);
        }}
        editingTutor={editingTutor}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Confirmer la suppression de l'encadreur"
        message={`Êtes-vous sûr de vouloir supprimer l'encadreur "${tutorToDelete?.fullName}" ? Cette action est irréversible et retirera toutes ses affectations d'élèves.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTutorToDelete(null);
        }}
        isDeleting={isDeleting}
      />

      {/* Assign Tutor to Group Modal */}
      <AssignTutorToGroupModal
        isOpen={!!tutorForGroupAssignment}
        onClose={() => setTutorForGroupAssignment(null)}
        initialTutor={tutorForGroupAssignment}
      />
    </div>
  );
};
