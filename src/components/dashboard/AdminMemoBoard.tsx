import React, { useMemo, useState } from 'react';
import {
  StickyNote,
  Pin,
  PinOff,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Check,
  X,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminMemo, MemoCategory } from '../../types';

type MemoFilter = 'all' | 'pinned' | 'reminders';

function formatMemoTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} · ${hh}:${min}`;
}

function formatDueDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function isDueTodayOrOverdue(dueDate?: string): 'overdue' | 'today' | 'future' | null {
  if (!dueDate) return null;
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dueDate < todayIso) return 'overdue';
  if (dueDate === todayIso) return 'today';
  return 'future';
}

export const AdminMemoBoard: React.FC = () => {
  const {
    adminMemos,
    addAdminMemo,
    updateAdminMemo,
    togglePinAdminMemo,
    toggleCompleteAdminMemo,
    deleteAdminMemo,
    showToast,
  } = useApp();

  const [filter, setFilter] = useState<MemoFilter>('all');
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);

  // Composer state
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<MemoCategory>('Rappel');
  const [dueDate, setDueDate] = useState<string>('');
  const [pinOnCreate, setPinOnCreate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Inline edit state
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editCategory, setEditCategory] = useState<MemoCategory>('Note');
  const [editDueDate, setEditDueDate] = useState<string>('');

  const safeMemos = adminMemos || [];

  const stats = useMemo(() => {
    const pinnedCount = safeMemos.filter((m) => m.pinned && !m.completed).length;
    const activeCount = safeMemos.filter((m) => !m.completed).length;
    const completedCount = safeMemos.filter((m) => m.completed).length;
    return { pinnedCount, activeCount, completedCount };
  }, [safeMemos]);

  const sortedAndFilteredMemos = useMemo(() => {
    return safeMemos
      .filter((memo) => {
        if (hideCompleted && memo.completed) return false;
        if (filter === 'pinned') return memo.pinned;
        if (filter === 'reminders') return memo.category === 'Rappel' || memo.category === 'Urgent';
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [safeMemos, filter, hideCompleted]);

  const handleCreateMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      showToast('Veuillez saisir un titre ou le contenu de la note.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAdminMemo({
        title: title.trim(),
        content: content.trim(),
        category,
        pinned: pinOnCreate,
        dueDate: dueDate || undefined,
      });
      setTitle('');
      setContent('');
      setCategory('Rappel');
      setDueDate('');
      setPinOnCreate(true);
      setIsComposerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (memo: AdminMemo) => {
    setEditingMemoId(memo.id);
    setEditTitle(memo.title);
    setEditContent(memo.content);
    setEditCategory(memo.category);
    setEditDueDate(memo.dueDate || '');
  };

  const cancelEditing = () => {
    setEditingMemoId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim() && !editContent.trim()) {
      showToast('Le mémo ne peut pas être vide.', 'warning');
      return;
    }
    await updateAdminMemo(id, {
      title: editTitle.trim() || editContent.trim().split('\n')[0],
      content: editContent.trim(),
      category: editCategory,
      dueDate: editDueDate,
    });
    setEditingMemoId(null);
    showToast('Note mise à jour.', 'success');
  };

  const getCategoryTextColor = (cat: MemoCategory) => {
    switch (cat) {
      case 'Urgent':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      case 'Rappel':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      default:
        return 'text-indigo-600 dark:text-indigo-400 font-semibold';
    }
  };

  return (
    <section
      aria-label="Aide-mémoire et rappels administratifs"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <StickyNote className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Aide-mémoire &amp; Rappels
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>{stats.pinnedCount} épinglé{stats.pinnedCount > 1 ? 's' : ''}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{stats.activeCount} actif{stats.activeCount > 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsComposerOpen((prev) => !prev)}
          className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            isComposerOpen
              ? 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
          }`}
        >
          {isComposerOpen ? (
            <>
              <X className="h-3.5 w-3.5" />
              <span>Fermer</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Nouvelle note</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Inline Composer */}
      {isComposerOpen && (
        <form
          onSubmit={handleCreateMemo}
          className="mt-4 pb-4 border-b border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Titre court (ex: Relancer parents Terminale D)..."
              aria-label="Titre de la note"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Détails ou consignes du rappel quotidien (optionnel)..."
              aria-label="Contenu de la note"
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="group"
              aria-label="Catégorie du mémo"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]"
            >
              {(['Note', 'Rappel', 'Urgent'] as MemoCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-label="Date d'échéance du rappel"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                />
              </label>

              <button
                type="button"
                onClick={() => setPinOnCreate((prev) => !prev)}
                aria-pressed={pinOnCreate}
                title="Épingler en haut de la liste"
                className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  pinOnCreate
                    ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Pin className="h-3 w-3" />
                <span>Épingler</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      {safeMemos.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div
            role="group"
            aria-label="Filtrer les notes"
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]"
          >
            {(
              [
                { id: 'all', label: 'Tous' },
                { id: 'pinned', label: 'Épinglés' },
                { id: 'reminders', label: 'Rappels' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {stats.completedCount > 0 && (
            <button
              type="button"
              onClick={() => setHideCompleted((prev) => !prev)}
              className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {hideCompleted
                ? `Afficher terminés (${stats.completedCount})`
                : `Masquer terminés (${stats.completedCount})`}
            </button>
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[380px] overflow-y-auto pr-1">
        {sortedAndFilteredMemos.length === 0 ? (
          <div className="py-8 text-center">
            <StickyNote className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {safeMemos.length === 0
                ? 'Aucune note ou rappel enregistré.'
                : 'Aucune note ne correspond à ce filtre.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {safeMemos.length === 0
                ? 'Épinglez vos rappels quotidiens et consignes administratives ici.'
                : 'Modifiez le filtre ou créez une nouvelle note.'}
            </p>
            {!isComposerOpen && safeMemos.length === 0 && (
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Créer un premier mémo</span>
              </button>
            )}
          </div>
        ) : (
          sortedAndFilteredMemos.map((memo) => {
            const isEditing = editingMemoId === memo.id;
            const dueState = isDueTodayOrOverdue(memo.dueDate);

            if (isEditing) {
              return (
                <div key={memo.id} className="py-3 space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={1000}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as MemoCategory)}
                        aria-label="Catégorie"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Note">Note</option>
                        <option value="Rappel">Rappel</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        aria-label="Échéance"
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(memo.id)}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={memo.id}
                className={`group py-3 transition-colors ${
                  memo.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleCompleteAdminMemo(memo.id)}
                      title={memo.completed ? 'Marquer comme actif' : 'Marquer comme fait'}
                      aria-label={memo.completed ? 'Marquer comme actif' : 'Marquer comme fait'}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {memo.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {memo.pinned && (
                          <Pin
                            className="h-3 w-3 shrink-0 text-amber-500"
                            aria-label="Note épinglée"
                          />
                        )}
                        <p
                          className={`text-xs font-bold leading-snug break-words ${
                            memo.completed
                              ? 'line-through text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {memo.title}
                        </p>
                      </div>

                      {memo.content && memo.content !== memo.title && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed break-words">
                          {memo.content}
                        </p>
                      )}

                      {/* Unboxed metadata line */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className={getCategoryTextColor(memo.category)}>
                          {memo.category}
                        </span>
                        {memo.dueDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono tabular-nums ${
                                !memo.completed && dueState === 'overdue'
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                  : !memo.completed && dueState === 'today'
                                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                  : ''
                              }`}
                            >
                              {dueState === 'today' && !memo.completed
                                ? `Aujourd'hui (${formatDueDate(memo.dueDate)})`
                                : dueState === 'overdue' && !memo.completed
                                ? `Échu (${formatDueDate(memo.dueDate)})`
                                : `Échéance ${formatDueDate(memo.dueDate)}`}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{memo.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatMemoTimestamp(memo.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePinAdminMemo(memo.id)}
                      title={memo.pinned ? 'Désépingler' : 'Épingler en haut'}
                      aria-label={memo.pinned ? 'Désépingler' : 'Épingler en haut'}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                        memo.pinned
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                          : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {memo.pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditing(memo)}
                      title="Modifier la note"
                      aria-label="Modifier la note"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAdminMemo(memo.id)}
                      title="Supprimer la note"
                      aria-label="Supprimer la note"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
