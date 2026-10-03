import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Users,
  CreditCard,
  GraduationCap,
  Package,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchPalette: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    students,
    payments,
    exams,
    inventory,
    setCurrentTab,
    setSelectedReceipt,
  } = useApp();

  const [query, setQuery] = useState('');

  // Handle keyboard shortcut '/' to open, 'Escape' to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const safeStudents = students || [];
  const safePayments = payments || [];
  const safeExams = exams || [];
  const safeInventory = inventory || [];
  const queryLower = query.trim().toLowerCase();

  const filteredStudents = queryLower
    ? safeStudents.filter(
        (s) =>
          (s.fullName || '').toLowerCase().includes(queryLower) ||
          (s.matricule || '').toLowerCase().includes(queryLower) ||
          (s.guardianName || '').toLowerCase().includes(queryLower)
      )
    : [];

  const filteredPayments = queryLower
    ? safePayments.filter(
        (p) =>
          (p.receiptNumber || '').toLowerCase().includes(queryLower) ||
          (p.studentName || '').toLowerCase().includes(queryLower)
      )
    : [];

  const filteredExams = queryLower
    ? safeExams.filter(
        (e) =>
          (e.candidateName || '').toLowerCase().includes(queryLower) ||
          (e.dossierNumber || '').toLowerCase().includes(queryLower) ||
          (e.examType || '').toLowerCase().includes(queryLower)
      )
    : [];

  const filteredInventory = queryLower
    ? safeInventory.filter(
        (i) =>
          (i.name || '').toLowerCase().includes(queryLower) ||
          (i.sku || '').toLowerCase().includes(queryLower)
      )
    : [];

  const hasResults =
    filteredStudents.length > 0 ||
    filteredPayments.length > 0 ||
    filteredExams.length > 0 ||
    filteredInventory.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-20 animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search input bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 bg-slate-850">
          <Search className="h-4 w-4 text-indigo-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher par élève, n° reçu (REC-...), dossier (CNR-...) ou fourniture..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
            ÉCHAP
          </kbd>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tapez au moins 2 lettres pour explorer les élèves, la caisse, les concours et le stock.
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun résultat correspondant à "<span className="text-slate-200">{query}</span>".
            </div>
          ) : (
            <>
              {/* Students Results */}
              {filteredStudents.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Élèves & Inscriptions ({filteredStudents.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setCurrentTab('inscriptions');
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{s.fullName}</div>
                          <div className="text-[11px] text-slate-400">
                            {s.matricule} · {s.level} · Tuteur : {s.guardianName}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Results */}
              {filteredPayments.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Reçus & Caisse ({filteredPayments.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredPayments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedReceipt(p);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {p.receiptNumber} — {p.studentName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.category} · {p.amount.toLocaleString()} FCFA ({p.paymentMethod})
                          </div>
                        </div>
                        <span className="text-[11px] text-indigo-400 font-medium">Voir le reçu</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Results */}
              {filteredExams.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
                    <span>Concours Professionnels ({filteredExams.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredExams.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setCurrentTab('concours');
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {e.dossierNumber} — {e.candidateName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {e.examType} ({e.examBatch}) · Statut : {e.status}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplies Results */}
              {filteredInventory.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-amber-400" />
                    <span>Boutique & Fournitures ({filteredInventory.length})</span>
                  </div>
                  <div className="space-y-1">
                    {filteredInventory.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          setCurrentTab('boutique');
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{i.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {i.sku} · {i.unitPrice.toLocaleString()} FCFA · Stock: {i.stockQuantity}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-850 px-4 py-2.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Recherche unifiée instantanée</span>
          <span>Cab-Appuis Core</span>
        </div>
      </div>
    </div>
  );
};
