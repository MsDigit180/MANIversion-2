import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Shield,
  Award,
  BadgeCheck,
  User,
  MapPin,
  Mail,
  Calendar,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  Printer,
  X,
  Loader2,
  FileText,
  Sparkles,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExamApplication } from '../../types';
import { CAB_APPUIS_LOGO, CAB_APPUIS_INFO } from '../../assets/logo';

export const ConcoursTab: React.FC = () => {
  const { exams, setIsNewExamModalOpen, updateExam, deleteExam, showToast, currentUser } = useApp();

  const [genderFilter, setGenderFilter] = useState<'all' | 'Masculin (M)' | 'Féminin (F)'>('all');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Selected candidate for View Details Modal
  const [selectedCandidateForDetails, setSelectedCandidateForDetails] = useState<ExamApplication | null>(null);

  // Selected candidate for Edit Modal
  const [editingExam, setEditingExam] = useState<ExamApplication | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Selected candidate for Delete Confirmation
  const [examToDelete, setExamToDelete] = useState<ExamApplication | null>(null);

  const safeExams = exams || [];

  const filteredExams = safeExams.filter((ex) => {
    const searchLower = (search || '').toLowerCase();
    const nameSafe = (ex.candidateName || '').toLowerCase();
    const dossierSafe = (ex.dossierNumber || '').toLowerCase();
    const batchSafe = (ex.examBatch || '').toLowerCase();
    const eduSafe = (ex.educationLevel || '').toLowerCase();
    const fieldSafe = (ex.fieldOfStudy || '').toLowerCase();
    const citySafe = (ex.residenceCity || '').toLowerCase();
    const phoneSafe = ex.contactPhone || '';

    const matchesSearch =
      nameSafe.includes(searchLower) ||
      dossierSafe.includes(searchLower) ||
      batchSafe.includes(searchLower) ||
      eduSafe.includes(searchLower) ||
      fieldSafe.includes(searchLower) ||
      citySafe.includes(searchLower) ||
      phoneSafe.includes(search);

    const matchesGender = genderFilter === 'all' || ex.gender === genderFilter;
    const matchesExamType = examTypeFilter === 'all' || ex.examType === examTypeFilter;
    const matchesStatus = statusFilter === 'all' || ex.status === statusFilter;

    return matchesSearch && matchesGender && matchesExamType && matchesStatus;
  });

  const getStatusBadge = (status: ExamApplication['status']) => {
    switch (status) {
      case 'Validé':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Validé</span>
          </span>
        );
      case 'Admis':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
            <Award className="h-3 w-3" />
            <span>Admis</span>
          </span>
        );
      case 'Inscrit':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <GraduationCap className="h-3 w-3" />
            <span>Inscrit</span>
          </span>
        );
      case 'Pièces manquantes':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            <span>Incomplet</span>
          </span>
        );
      case 'En instruction':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>En cours</span>
          </span>
        );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;

    setIsSavingEdit(true);
    try {
      await updateExam(editingExam.id, {
        candidateName: editingExam.candidateName.trim(),
        gender: editingExam.gender,
        birthDate: editingExam.birthDate,
        birthPlace: editingExam.birthPlace,
        nationality: editingExam.nationality,
        contactPhone: editingExam.contactPhone.trim(),
        email: editingExam.email,
        residenceCity: editingExam.residenceCity,
        educationLevel: editingExam.educationLevel,
        fieldOfStudy: editingExam.fieldOfStudy,
        examType: editingExam.examType.trim(),
        examBatch: editingExam.examBatch.trim(),
        examCenter: editingExam.examCenter,
        prepFee: editingExam.prepFee ? Number(editingExam.prepFee) : undefined,
        status: editingExam.status,
        notes: editingExam.notes,
      });

      showToast(`Candidature de ${editingExam.candidateName} mise à jour avec succès.`, 'success');
      setEditingExam(null);
    } catch (err) {
      console.error('Error updating exam candidate:', err);
      showToast('Erreur lors de la mise à jour.', 'warning');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!examToDelete) return;
    try {
      await deleteExam(examToDelete.id);
      showToast(`Candidature de ${examToDelete.candidateName} supprimée.`, 'info');
      setExamToDelete(null);
    } catch (err) {
      console.error('Error deleting exam application:', err);
      showToast('Erreur lors de la suppression.', 'warning');
    }
  };

  // Real KPIs strictly from the Firestore database
  const totalExamsCount = safeExams.length;
  const validatedExamsCount = safeExams.filter(
    (e) => e?.status === 'Validé' || e?.status === 'Admis'
  ).length;
  const inProgressExamsCount = safeExams.filter(
    (e) => e?.status === 'En instruction' || e?.status === 'Inscrit'
  ).length;
  const missingPiecesCount = safeExams.filter(
    (e) => e?.status === 'Pièces manquantes'
  ).length;

  // Real concours breakdown strictly from the database records
  const dynamicExamTypes = useMemo(() => {
    const map = new Map<string, { count: number; centers: Set<string>; fields: Set<string> }>();
    safeExams.forEach((ex) => {
      if (!ex) return;
      const type = (ex.examType ?? '').trim();
      if (!type) return;
      const cur = map.get(type) || {
        count: 0,
        centers: new Set<string>(),
        fields: new Set<string>(),
      };
      cur.count += 1;
      if (ex.examCenter?.trim()) cur.centers.add(ex.examCenter.trim());
      if (ex.fieldOfStudy?.trim()) cur.fields.add(ex.fieldOfStudy.trim());
      map.set(type, cur);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        center: data.centers.size > 0 ? Array.from(data.centers)[0] : 'Centre officiel',
        field: data.fields.size > 0 ? Array.from(data.fields)[0] : 'Préparation concours',
      }))
      .sort((a, b) => b.count - a.count);
  }, [safeExams]);

  // Distinct exam types for filter dropdown (from actual DB records)
  const distinctExamTypes = useMemo(() => {
    return Array.from(
      new Set(safeExams.map((e) => (e?.examType ?? '').trim()).filter(Boolean))
    );
  }, [safeExams]);

  return (
    <div className="space-y-6">
      {/* 4 Interactive KPI Cards - Strictly Synced With Firestore Database */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Candidatures */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Dossiers Concours</span>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {totalExamsCount}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span>Base de données</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {dynamicExamTypes.length} concours distinct{dynamicExamTypes.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Card 2: Validés & Admis */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Validé' ? 'all' : 'Validé')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            statusFilter === 'Validé'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Dossiers Validés / Admis</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {validatedExamsCount}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Dossiers prêts & conformes
          </span>
        </div>

        {/* Card 3: En cours d'instruction */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'En instruction' ? 'all' : 'En instruction')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            statusFilter === 'En instruction'
              ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">En cours d'instruction</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {inProgressExamsCount}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            En vérification administrative
          </span>
        </div>

        {/* Card 4: Pièces Manquantes */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'Pièces manquantes' ? 'all' : 'Pièces manquantes')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            statusFilter === 'Pièces manquantes'
              ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Pièces Manquantes</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {missingPiecesCount}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Compléments requis
          </span>
        </div>
      </div>

      {/* Dynamic Breakdown by Registered Exam Types - ONLY Displayed if records exist in DB */}
      {dynamicExamTypes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              Répartition par Concours ({dynamicExamTypes.length} filière{dynamicExamTypes.length > 1 ? 's' : ''} en base de données)
            </span>
            {examTypeFilter !== 'all' && (
              <button
                onClick={() => setExamTypeFilter('all')}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Afficher tous les concours
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {dynamicExamTypes.map((item) => {
              const isSelected = examTypeFilter === item.name;
              return (
                <div
                  key={item.name}
                  onClick={() => setExamTypeFilter(isSelected ? 'all' : item.name)}
                  className={`rounded-2xl border p-3 shadow-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-purple-300 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="rounded bg-purple-50 dark:bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 shrink-0 truncate max-w-[70px]">
                      {item.center}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {item.count} candidat{item.count > 1 ? 's' : ''}
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 truncate" title={item.field}>
                    {item.field}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Header & Multi-Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher candidat, diplôme, tél..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Sexe / Genre Filter */}
          <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                genderFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous ({safeExams.length})
            </button>
            <button
              onClick={() => setGenderFilter('Masculin (M)')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                genderFilter === 'Masculin (M)'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hommes (M)
            </button>
            <button
              onClick={() => setGenderFilter('Féminin (F)')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                genderFilter === 'Féminin (F)'
                  ? 'bg-pink-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Femmes (F)
            </button>
          </div>

          {/* Type de Concours Filter */}
          <select
            value={examTypeFilter}
            onChange={(e) => setExamTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous Concours</option>
            {distinctExamTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Statut Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous Statuts</option>
            <option value="Inscrit">Inscrits</option>
            <option value="Validé">Validés</option>
            <option value="Admis">Admis</option>
            <option value="En instruction">En instruction</option>
          </select>
        </div>

        {/* Action Button: Nouvelle Candidature */}
        <button
          onClick={() => setIsNewExamModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Saisir Candidat Concours</span>
        </button>
      </div>

      {/* Main Candidates Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">N° Dossier & Date</th>
                <th className="py-3 px-4">Candidat (Identité & Tél)</th>
                <th className="py-3 px-4">Profil Académique</th>
                <th className="py-3 px-4">Concours & Corps Visé</th>
                <th className="py-3 px-4">Frais & Statut</th>
                <th className="py-3 px-4">Agent Enregistreur</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {safeExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun dossier de concours dans la base de données</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          La base de données est actuellement vide. Cliquez sur le bouton ci-dessous pour inscrire votre premier candidat.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsNewExamModalOpen(true)}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nouveau Dossier Concours</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Aucune candidature ne correspond à ce filtre.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExams.map((ex) => {
                  return (
                    <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Dossier & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {ex.dossierNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ex.submissionDate}
                        </div>
                      </td>

                      {/* Candidate Identity, Gender & Contacts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {ex.candidateName}
                          </span>
                          {ex.gender && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ex.gender === 'Féminin (F)'
                                  ? 'bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50'
                                  : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                              }`}
                            >
                              {ex.gender === 'Féminin (F)' ? 'F' : 'M'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {ex.contactPhone}
                          </span>
                          {ex.residenceCity && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[130px]">
                              <MapPin className="h-2.5 w-2.5 text-slate-400" />
                              {ex.residenceCity}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Academic Profile */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {ex.educationLevel || 'Non spécifié'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {ex.fieldOfStudy || 'Formation générale'}
                        </div>
                      </td>

                      {/* Target Exam & Corps */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-purple-700 dark:text-purple-300">
                          {ex.examType}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                          {ex.examBatch}
                        </div>
                      </td>

                      {/* Fees & Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(ex.status)}
                          {ex.prepFee != null ? (
                            <div className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {Number(ex.prepFee).toLocaleString('fr-FR')} FCFA
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Agent Traceability */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200 font-medium">
                          <BadgeCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          <span>{ex.agentName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ex.agentRole}
                        </div>
                      </td>

                      {/* Action Buttons: Fiche, Modifier, Supprimer */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir Fiche */}
                          <button
                            onClick={() => setSelectedCandidateForDetails(ex)}
                            title="Voir la fiche complète du candidat"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Modifier */}
                          <button
                            onClick={() => setEditingExam(ex)}
                            title="Modifier les informations du candidat"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => setExamToDelete(ex)}
                            title="Supprimer la candidature"
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* MODAL 1: FICHE COMPLÈTE DU CANDIDAT (View Profile & Details) */}
      {selectedCandidateForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={CAB_APPUIS_LOGO}
                  alt="CAB APPUIS"
                  className="w-12 h-12 object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                      {selectedCandidateForDetails.dossierNumber}
                    </span>
                    {getStatusBadge(selectedCandidateForDetails.status)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {selectedCandidateForDetails.candidateName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fiche Officielle de Candidature · Concours Professionnel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidateForDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Candidate Identity */}
            <div className="space-y-4 text-xs">
              {/* Group 1: État Civil */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3.5 space-y-2">
                <div className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <User className="h-3.5 w-3.5" />
                  <span>État Civil & Identité</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nom Complet :</span>
                    <strong className="text-slate-900 dark:text-white">{selectedCandidateForDetails.candidateName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sexe / Genre :</span>
                    <strong className="text-slate-900 dark:text-white">{selectedCandidateForDetails.gender || 'Non spécifié'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date & Lieu de Naissance :</span>
                    <span>
                      {selectedCandidateForDetails.birthDate || 'N/A'}{' '}
                      {selectedCandidateForDetails.birthPlace ? `à ${selectedCandidateForDetails.birthPlace}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nationalité :</span>
                    <span>{selectedCandidateForDetails.nationality || 'Nigérienne'}</span>
                  </div>
                </div>
              </div>

              {/* Group 2: Coordonnées */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3.5 space-y-2">
                <div className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <Phone className="h-3.5 w-3.5" />
                  <span>Coordonnées & Résidence</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Téléphone au Niger :</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedCandidateForDetails.contactPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email :</span>
                    <span>{selectedCandidateForDetails.email || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Ville / Quartier :</span>
                    <span>{selectedCandidateForDetails.residenceCity || 'Niamey'}</span>
                  </div>
                </div>
              </div>

              {/* Group 3: Diplôme & Concours */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-3.5 space-y-2">
                <div className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Profil Académique & Concours Visé</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dernier Diplôme :</span>
                    <strong className="text-slate-900 dark:text-white">{selectedCandidateForDetails.educationLevel || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Filière / Spécialité :</span>
                    <span>{selectedCandidateForDetails.fieldOfStudy || 'Générale'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Concours Visé :</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">{selectedCandidateForDetails.examType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Corps / Option :</span>
                    <span>{selectedCandidateForDetails.examBatch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Centre d'Examen :</span>
                    <span>{selectedCandidateForDetails.examCenter || 'Niamey'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Frais de Préparation :</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedCandidateForDetails.prepFee != null ? `${Number(selectedCandidateForDetails.prepFee).toLocaleString('fr-FR')} FCFA` : 'Non renseigné'}
                    </span>
                  </div>
                </div>

                {selectedCandidateForDetails.notes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400 block text-[10px]">Observations :</span>
                    <p className="text-slate-600 dark:text-slate-300 italic">{selectedCandidateForDetails.notes}</p>
                  </div>
                )}
              </div>

              {/* Group 4: Traçabilité */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20 text-[11px]">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-purple-600" />
                  <span>Enregistré par : <strong>{selectedCandidateForDetails.agentName}</strong> ({selectedCandidateForDetails.agentRole})</span>
                </div>
                <span className="font-mono text-slate-500">{selectedCandidateForDetails.submissionDate}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimer Fiche</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = selectedCandidateForDetails;
                    setSelectedCandidateForDetails(null);
                    setEditingExam(next);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Modifier Informations
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForDetails(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MODIFICATION D'UN CANDIDAT CONCOURS */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Modifier Candidat : {editingExam.dossierNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mise à jour des informations du candidat et du concours visé
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingExam(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom complet du candidat *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingExam.candidateName}
                    onChange={(e) => setEditingExam({ ...editingExam, candidateName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sexe / Genre *
                  </label>
                  <select
                    value={editingExam.gender || 'Masculin (M)'}
                    onChange={(e) => setEditingExam({ ...editingExam, gender: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
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
                    value={editingExam.birthDate || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, birthDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    value={editingExam.birthPlace || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, birthPlace: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nationalité
                  </label>
                  <input
                    type="text"
                    value={editingExam.nationality || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, nationality: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone (+227) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingExam.contactPhone}
                    onChange={(e) => setEditingExam({ ...editingExam, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingExam.email || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ville / Quartier
                  </label>
                  <input
                    type="text"
                    value={editingExam.residenceCity || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, residenceCity: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dernier Diplôme / Niveau d'études
                  </label>
                  <input
                    type="text"
                    value={editingExam.educationLevel || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, educationLevel: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Filière / Spécialité
                  </label>
                  <input
                    type="text"
                    value={editingExam.fieldOfStudy || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, fieldOfStudy: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type de Concours (Saisie libre) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingExam.examType}
                    onChange={(e) => setEditingExam({ ...editingExam, examType: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corps / Grade / Option visée *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingExam.examBatch}
                    onChange={(e) => setEditingExam({ ...editingExam, examBatch: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Centre d'Examen
                  </label>
                  <input
                    type="text"
                    value={editingExam.examCenter || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, examCenter: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frais Prépa (FCFA)
                  </label>
                  <input
                    type="number"
                    value={editingExam.prepFee || ''}
                    onChange={(e) => setEditingExam({ ...editingExam, prepFee: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut Candidature
                  </label>
                  <select
                    value={editingExam.status}
                    onChange={(e) => setEditingExam({ ...editingExam, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Inscrit">Inscrit</option>
                    <option value="Validé">Validé</option>
                    <option value="Admis">Admis</option>
                    <option value="En instruction">En instruction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observations
                </label>
                <textarea
                  rows={2}
                  value={editingExam.notes || ''}
                  onChange={(e) => setEditingExam({ ...editingExam, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{isSavingEdit ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMATION SUPPRESSION CANDIDATURE */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Supprimer la Candidature ?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dossier N° {examToDelete.dossierNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Êtes-vous certain de vouloir supprimer définitivement la candidature de{' '}
              <strong className="text-slate-900 dark:text-white">{examToDelete.candidateName}</strong> pour le concours{' '}
              <strong className="text-purple-600 dark:text-purple-400">{examToDelete.examType}</strong> ?
            </p>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
