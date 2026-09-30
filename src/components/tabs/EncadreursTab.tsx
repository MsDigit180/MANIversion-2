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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tutor } from '../../types';
import { NewEncadreurModal } from '../modals/NewEncadreurModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';

export const EncadreursTab: React.FC = () => {
  const { tutors, deleteTutor, students, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'hours' | 'students' | 'name'>('hours');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Sort tutors
  const filteredTutors = tutors.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.matricule.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesGender = genderFilter === 'all' || t.gender === genderFilter;
    const matchesLevel = levelFilter === 'all' || t.levels.includes(levelFilter);

    return matchesSearch && matchesGender && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === 'hours') {
      return b.totalHours - a.totalHours;
    }
    if (sortBy === 'students') {
      return (b.assignedStudentIds?.length || 0) - (a.assignedStudentIds?.length || 0);
    }
    return a.fullName.localeCompare(b.fullName);
  });

  const totalTutors = tutors.length;
  const totalHoursAll = tutors.reduce((acc, t) => acc + (t.totalHours || 0), 0);
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
      showToast('Erreur lors de la suppression de l\'encadreur', 'warning');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
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

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Heures Totales Dispensées</span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {totalHoursAll} <span className="text-xs font-normal text-slate-500">Heures</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Volume horaire cumulé</span>
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
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Suivi individualisé</span>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matière, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Sexe : Tous</option>
            <option value="Masculin (M)">Masculin (M)</option>
            <option value="Féminin (F)">Féminin (F)</option>
          </select>

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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="hours">Trier par : Volume Horaire</option>
            <option value="students">Trier par : Nombre d'élèves</option>
            <option value="name">Trier par : Ordre Alphabétique</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingTutor(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Encadreur</span>
        </button>
      </div>

      {/* Tutors Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Encadreur & Matricule</th>
                <th className="py-3 px-4">Sexe</th>
                <th className="py-3 px-4">Matières Enseignées</th>
                <th className="py-3 px-4">Niveaux d'Intervention</th>
                <th className="py-3 px-4">Élèves à Charge</th>
                <th className="py-3 px-4 text-center">Volume Horaire</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTutors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun encadreur trouvé selon vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredTutors.map((tutor) => {
                  const assignedStudentsList = students.filter((s) => tutor.assignedStudentIds?.includes(s.id));
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

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {assignedStudentsList.length} élève{assignedStudentsList.length > 1 ? 's' : ''}
                            </span>
                            {assignedStudentsList.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold font-mono">
                                {assignedStudentsList.reduce((acc, s) => acc + (s.sessionsPerWeek || 3), 0)} séa./sem.
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
                                  title={`${s.level} · Quota : ${s.sessionsPerWeek || 3} séances/semaine`}
                                >
                                  <span>{s.fullName}</span>
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    ({s.sessionsPerWeek || 3}s/s)
                                  </span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                          <Clock className="h-3 w-3" />
                          {tutor.totalHours}h
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTutor(tutor);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors text-[11px] font-semibold cursor-pointer"
                            title="Modifier l'encadreur"
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
    </div>
  );
};
