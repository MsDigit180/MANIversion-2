import React, { useState } from 'react';
import {
  X,
  Layers,
  Users,
  Calendar,
  Clock,
  GraduationCap,
  CreditCard,
  ArrowRight,
  Search,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { TutoringGroup } from '../../types';
import { formatSessionHours, calculateWeeklyHours } from '../../utils/dateUtils';

interface AllGroupsModalProps {
  groups: TutoringGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSelectGroup: (group: TutoringGroup) => void;
}

export const AllGroupsModal: React.FC<AllGroupsModalProps> = ({
  groups,
  isOpen,
  onClose,
  onSelectGroup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      g.tutors.some((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStream = streamFilter === 'all' || g.stream.toLowerCase().includes(streamFilter.toLowerCase());

    return matchesSearch && matchesStream;
  });

  const totalGroupStudents = groups.reduce((sum, g) => sum + g.students.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Groupes d'Encadrement Collectif · Cab-Appuis
              </h2>
              <p className="text-xs text-slate-400">
                {groups.length} groupe(s) mutualisé(s) répertorié(s) · {totalGroupStudents} élève(s) au total
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

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de groupe, code, encadreur ou matière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="inline-flex rounded-xl bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                streamFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous Cycles ({groups.length})
            </button>
            <button
              onClick={() => setStreamFilter('primaire')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                streamFilter === 'primaire' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Primaire
            </button>
            <button
              onClick={() => setStreamFilter('collège')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                streamFilter === 'collège' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Collège
            </button>
            <button
              onClick={() => setStreamFilter('lycée')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                streamFilter === 'lycée' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lycée
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Layers className="h-10 w-10 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="font-semibold text-white">Aucun groupe d'encadrement trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                Créez ou affectez un identifiant de groupe (ex: GRP-CM1-A) lors de l'inscription d'un élève.
              </p>
            </div>
          ) : (
            filteredGroups.map((g) => {
              const weeklyHours = calculateWeeklyHours(g.sessionsPerWeek);

              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup(g)}
                  className="rounded-2xl border border-slate-800 bg-slate-850 hover:border-indigo-500/60 p-5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Code, Stream badge & Students count */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800 px-2 py-0.5 rounded">
                          {g.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {g.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <Users className="h-3.5 w-3.5" />
                        <span>{g.students.length} élève(s)</span>
                      </div>
                    </div>

                    {/* Group Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {g.name}
                    </h3>

                    {/* Schedule & Sessions */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-slate-300 font-semibold">{g.sessionsPerWeek} séa/sem.</span>
                        <span className="font-mono text-[11px]">({formatSessionHours(weeklyHours)})</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="truncate max-w-[200px]">{g.timeSlot}</span>
                      </div>
                    </div>

                    {/* Tutors */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span className="truncate font-medium">
                          {g.tutors.length > 0 ? g.tutors.map((t) => t.name).join(', ') : 'Aucun encadreur'}
                        </span>
                      </div>
                    </div>

                    {/* Subjects Badges */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {g.subjects.slice(0, 3).map((sub, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded"
                        >
                          {sub}
                        </span>
                      ))}
                      {g.subjects.length > 3 && (
                        <span className="text-[10px] text-slate-500">+{g.subjects.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">
                      Scolarité : <strong className="text-white">{g.totalMonthlyFee.toLocaleString()}</strong> FCFA
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Voir la liste ({g.students.length})</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-850 px-6 py-3.5 flex justify-between items-center text-xs text-slate-400">
          <span>
            {filteredGroups.length} groupe(s) affiché(s) · Gestion centralisée des effectifs
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
