import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  CreditCard,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  GraduationCap,
  BookOpen,
  UserX,
  UserCheck,
  AlertTriangle,
  BadgeCheck,
  Eye,
  FileSpreadsheet,
  Download,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { PrintStudentListModal, exportStudentsToCSV } from '../modals/PrintStudentListModal';
import { StudentDetailModal } from '../modals/StudentDetailModal';

export const InscriptionsTab: React.FC = () => {
  const {
    students,
    setIsNewStudentModalOpen,
    setIsNewPaymentModalOpen,
    setIsStopTutoringModalOpen,
    setSelectedStudentForStop,
    campus,
    showToast,
  } = useApp();

  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [tutoringFilter, setTutoringFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent');
  const [search, setSearch] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Statistics counters
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.tutoringStatus === 'Actif').length;
  const stoppedDemand = students.filter((s) => s.tutoringStatus === 'Arrêté (À la demande)').length;
  const stoppedUnpaid = students.filter((s) => s.tutoringStatus === 'Arrêté (Défaut de paiement)').length;

  const filteredStudents = students.filter((stu) => {
    const matchesSearch =
      stu.fullName.toLowerCase().includes(search.toLowerCase()) ||
      stu.matricule.toLowerCase().includes(search.toLowerCase()) ||
      stu.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      stu.guardianPhone.includes(search);

    const matchesCycle =
      cycleFilter === 'all' ||
      (cycleFilter === 'Primaire' && (stu.stream === 'Primaire' || stu.level.includes('CM') || stu.level.includes('CE') || stu.level.includes('CP') || stu.level.includes('CI'))) ||
      (cycleFilter === 'Collège' && (stu.stream === 'Collège' || stu.level.includes('3ème') || stu.level.includes('4ème') || stu.level.includes('5ème') || stu.level.includes('6ème') || stu.level.includes('BEPC'))) ||
      (cycleFilter === 'Lycée' && (stu.stream === 'Lycée' || stu.level.includes('Terminale') || stu.level.includes('Première') || stu.level.includes('Seconde') || stu.level.includes('Bac'))) ||
      (cycleFilter === 'Concours' && stu.stream === 'Prépa Concours');

    const matchesPaymentStatus = statusFilter === 'all' || stu.paymentStatus === statusFilter;

    let matchesTutoring = true;
    if (tutoringFilter === 'active') {
      matchesTutoring = stu.tutoringStatus === 'Actif';
    } else if (tutoringFilter === 'stopped_demand') {
      matchesTutoring = stu.tutoringStatus === 'Arrêté (À la demande)';
    } else if (tutoringFilter === 'stopped_unpaid') {
      matchesTutoring = stu.tutoringStatus === 'Arrêté (Défaut de paiement)';
    } else if (tutoringFilter === 'stopped_all') {
      matchesTutoring = stu.tutoringStatus !== 'Actif';
    }

    return matchesSearch && matchesCycle && matchesPaymentStatus && matchesTutoring;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'name') {
      return a.fullName.localeCompare(b.fullName);
    }
    const parseDate = (dStr: string) => {
      if (!dStr) return 0;
      const clean = dStr.split(' à ')[0].trim();
      const parts = clean.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() || 0;
      }
      return new Date(dStr).getTime() || 0;
    };
    const timeA = parseDate(a.enrollmentDate);
    const timeB = parseDate(b.enrollmentDate);
    if (sortBy === 'recent') {
      return timeB - timeA;
    } else {
      return timeA - timeB;
    }
  });

  const handleDirectExportCSV = () => {
    exportStudentsToCSV(filteredStudents);
    showToast(`Export CSV généré avec succès pour ${filteredStudents.length} élève(s).`, 'success');
  };

  const getStatusBadge = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'A jour':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>À jour</span>
          </span>
        );
      case 'Partiel':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-3 w-3" />
            <span>Partiel</span>
          </span>
        );
      case 'En retard':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            <span>En retard</span>
          </span>
        );
    }
  };

  const getTutoringBadge = (student: Student) => {
    switch (student.tutoringStatus) {
      case 'Actif':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <UserCheck className="h-3 w-3" />
            <span>Actif</span>
          </span>
        );
      case 'Arrêté (À la demande)':
        return (
          <span
            title={student.stopReason || "Arrêté à la demande de l'élève ou parent"}
            className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20"
          >
            <UserX className="h-3 w-3" />
            <span>Arrêt (Demande)</span>
          </span>
        );
      case 'Arrêté (Défaut de paiement)':
        return (
          <span
            title={student.stopReason || 'Arrêté pour impayés de scolarité'}
            className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Arrêt (Impayé)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Interactive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total */}
        <div
          onClick={() => setTutoringFilter('all')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            tutoringFilter === 'all'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Élèves Inscrits</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Effectif total (Niamey)</span>
        </div>

        {/* Card 2: Active */}
        <div
          onClick={() => setTutoringFilter('active')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            tutoringFilter === 'active'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Encadrement Actif</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeStudents}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">En cours réguliers</span>
        </div>

        {/* Card 3: Stopped on demand */}
        <div
          onClick={() => setTutoringFilter('stopped_demand')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            tutoringFilter === 'stopped_demand'
              ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Arrêt : À la Demande</span>
            <UserX className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-purple-600 dark:text-purple-400">{stoppedDemand}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Déménagement / Tuteur</span>
        </div>

        {/* Card 4: Stopped for unpaid */}
        <div
          onClick={() => setTutoringFilter('stopped_unpaid')}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            tutoringFilter === 'stopped_unpaid'
              ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Arrêt : Défaut de Paiement</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">{stoppedUnpaid}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Suspension scolarité</span>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher élève, matricule, parent ou téléphone..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors shadow-sm"
          />
        </div>

        {/* Right: Actions (CSV Export, Print/PDF & New Student) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV Export Button (USER REQUIREMENT) */}
          <button
            onClick={handleDirectExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600/80 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-sm"
            title="Exporter directement la liste filtrée au format CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Exporter CSV</span>
          </button>

          {/* Print / PDF Button (USER REQUIREMENT) */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
            title="Ouvrir la vue optimisée d'impression et export PDF"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Imprimer la Liste Filtrée</span>
          </button>

          {/* New Enrollment Button */}
          <button
            onClick={() => setIsNewStudentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Inscription</span>
          </button>
        </div>
      </div>

      {/* Cycle, Tutoring & Payment Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Cycle filter */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700 p-0.5 text-xs">
            <button
              onClick={() => setCycleFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                cycleFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous Cycles
            </button>
            <button
              onClick={() => setCycleFilter('Primaire')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                cycleFilter === 'Primaire'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Primaire (CFEPD)
            </button>
            <button
              onClick={() => setCycleFilter('Collège')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                cycleFilter === 'Collège'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Collège (BEPC)
            </button>
            <button
              onClick={() => setCycleFilter('Lycée')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                cycleFilter === 'Lycée'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lycée (Bac D/C/A)
            </button>
          </div>

          {/* Tutoring Status selector */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={tutoringFilter}
              onChange={(e) => setTutoringFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Tous statuts encadrement</option>
              <option value="active">Encadrement Actif uniquement</option>
              <option value="stopped_all">Tous les arrêts d'encadrement</option>
              <option value="stopped_demand">Arrêté : À la demande</option>
              <option value="stopped_unpaid">Arrêté : Défaut de paiement</option>
            </select>
          </div>

          {/* Financial Status selector */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Tous paiements</option>
              <option value="A jour">À jour uniquement</option>
              <option value="Partiel">Partiel</option>
              <option value="En retard">En retard (Impayé)</option>
            </select>
          </div>

          {/* Sorting selector */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'name')}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 px-2.5 py-1 text-xs text-indigo-700 dark:text-indigo-300 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              title="Trier les inscriptions"
            >
              <option value="recent">Tri : Plus récents d'abord</option>
              <option value="oldest">Tri : Plus anciens d'abord</option>
              <option value="name">Tri : Par Nom (Alphabétique)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{sortedStudents.length}</span> élève(s) trié(s)
        </div>
      </div>

      {/* Main Students Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-4">Niveau & Matières</th>
                <th className="py-3 px-4">Date d'Inscription</th>
                <th className="py-3 px-4">Tuteur Légal (Niamey)</th>
                <th className="py-3 px-4 text-center">Encadrement</th>
                <th className="py-3 px-4">Scolarité (FCFA)</th>
                <th className="py-3 px-4">Agent Responsable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">Aucun élève ne correspond aux critères.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos filtres ou effectuez une recherche.</p>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((stu) => {
                  const balanceDue = stu.monthlyFee - stu.paidAmount;

                  return (
                    <tr
                      key={stu.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-750/70 transition-colors ${
                        stu.tutoringStatus !== 'Actif' ? 'bg-slate-50/50 dark:bg-slate-850/40 opacity-90' : ''
                      }`}
                    >
                      {/* Élève & Matricule */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            {stu.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <button
                              onClick={() => setSelectedStudentForDetail(stu)}
                              className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>{stu.fullName}</span>
                              <Eye className="h-3 w-3 text-slate-400" />
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                {stu.matricule}
                              </span>
                              {stu.syncStatus === 'pending' && (
                                <span className="text-[9px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 px-1 rounded border border-amber-200 dark:border-amber-500/30">
                                  Cache Local
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Niveau & Matières */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{stu.level}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          {stu.subjects.join(', ')}
                        </div>
                      </td>

                      {/* Date d'Inscription */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800 dark:text-slate-200 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{stu.enrollmentDate}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Enregistré au cabinet
                        </div>
                      </td>

                      {/* Tuteur & Téléphone */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{stu.guardianName}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{stu.guardianPhone}</span>
                        </div>
                      </td>

                      {/* Encadrement */}
                      <td className="py-3.5 px-4 text-center">
                        {getTutoringBadge(stu)}
                        {stu.stopReason && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[130px] mx-auto italic" title={stu.stopReason}>
                            {stu.stopDate ? `depuis le ${stu.stopDate}` : stu.stopReason}
                          </div>
                        )}
                      </td>

                      {/* Scolarité & Paiement */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {stu.paidAmount.toLocaleString()} / {stu.monthlyFee.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getStatusBadge(stu.paymentStatus)}
                          {balanceDue > 0 && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-semibold">
                              -{balanceDue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Responsible Agent Traceability with Profile Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={stu.agentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={stu.agentName}
                            className="h-6 w-6 rounded-lg object-cover ring-1 ring-indigo-500/30 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate max-w-[110px]">
                              {stu.agentName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {stu.agentRole}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Profile Button */}
                          <button
                            onClick={() => setSelectedStudentForDetail(stu)}
                            title="Voir le profil 360° et liaisons de l'élève"
                            className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-750 px-2 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden sm:inline">Profil</span>
                          </button>

                          {/* Quick Pay */}
                          <button
                            onClick={() => setIsNewPaymentModalOpen(true)}
                            title="Encaisser scolarité"
                            className="flex h-7 items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span className="hidden sm:inline">Payer</span>
                          </button>

                          {/* Stop/Status Button */}
                          <button
                            onClick={() => {
                              setSelectedStudentForStop(stu);
                              setIsStopTutoringModalOpen(true);
                            }}
                            title={
                              stu.tutoringStatus === 'Actif'
                                ? "Arrêter l'encadrement (demande ou impayé)"
                                : "Gérer le statut d'arrêt ou réactiver"
                            }
                            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium border transition-colors cursor-pointer ${
                              stu.tutoringStatus === 'Actif'
                                ? 'border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20'
                                : 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                            }`}
                          >
                            {stu.tutoringStatus === 'Actif' ? (
                              <>
                                <UserX className="h-3 w-3" />
                                <span className="hidden sm:inline">Arrêter</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" />
                                <span className="hidden sm:inline">Statut Arrêt</span>
                              </>
                            )}
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

        {/* Footer info bar */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between bg-slate-50 dark:bg-slate-750">
          <span>
            {filteredStudents.length} élèves affichés · ({activeStudents} actifs, {stoppedDemand + stoppedUnpaid} arrêts)
          </span>
          <span>Cabinet Cab-Appuis · {campus} · Niamey (Niger)</span>
        </div>
      </div>

      {/* Print & PDF Student List Modal */}
      <PrintStudentListModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        students={filteredStudents}
        cycleFilter={cycleFilter}
        statusFilter={statusFilter}
        tutoringFilter={tutoringFilter}
        searchQuery={search}
        campusName={campus}
      />

      {/* Student 360 Detail Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        student={selectedStudentForDetail}
      />
    </div>
  );
};
