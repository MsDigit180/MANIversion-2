import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Shield, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NewExamDossierModal: React.FC = () => {
  const { isNewExamModalOpen, setIsNewExamModalOpen, addExam, networkStatus } = useApp();

  const [candidateName, setCandidateName] = useState('');
  const [gender, setGender] = useState<'Masculin (M)' | 'Féminin (F)'>('Masculin (M)');
  const [examType, setExamType] = useState<string>('ENA / ENAM');
  const [examBatch, setExamBatch] = useState('ENAM Niamey - Cycle Supérieur (Administration Générale)');
  const [contactPhone, setContactPhone] = useState('+227 96 ');
  const [submittedPieces, setSubmittedPieces] = useState<string[]>([
    'Certificat de nationalité nigérienne',
    'Extrait de naissance ou jugement supplétif',
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const defaultPieces = [
    'Extrait de naissance ou jugement supplétif légalisé',
    'Certificat de nationalité nigérienne',
    'Casier judiciaire (Bulletin N° 3 - Tribunal Niamey)',
    'Copie certifiée conforme du Diplôme (Licence/Master/Bac)',
    'Certificat médical d\'aptitude physique et toise',
    'Quittance de versement Trésor Public du Niger',
    'Photos d\'identité couleur fond blanc (4)',
  ];

  if (!isNewExamModalOpen) return null;

  const togglePiece = (piece: string) => {
    if (submittedPieces.includes(piece)) {
      setSubmittedPieces(submittedPieces.filter((p) => p !== piece));
    } else {
      setSubmittedPieces([...submittedPieces, piece]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addExam({
        candidateName: candidateName.trim(),
        gender,
        examType: examType.trim() || 'Concours Général',
        examBatch: examBatch.trim() || 'Session 2026',
        contactPhone: contactPhone.trim(),
        requiredPieces: defaultPieces,
        submittedPieces,
        status: submittedPieces.length === defaultPieces.length ? 'Validé' : 'Pièces manquantes',
        submissionDate: 'Aujourd\'hui',
      });

      // Reset
      setCandidateName('');
      setExamType('ENA / ENAM');
      setIsNewExamModalOpen(false);
    } catch (error) {
      console.error('Error saving exam application to Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Candidature Concours Professionnel</h3>
              <p className="text-xs text-slate-400">Enregistrement sécurisé Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewExamModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-lg bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Mode Hors-ligne :</strong> Le dossier du candidat sera enregistré en cache local et répliqué vers Firestore lors de la reconnexion.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom complet du candidat *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Hassane Ousmane Dan Mallam"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="Masculin (M)">Masculin (M)</option>
                <option value="Féminin (F)">Féminin (F)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Type de Concours (Saisie libre) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: ENA / ENAM, Police, Douanes..."
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none font-semibold text-purple-300"
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
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Intitulé de la Session / Batch de Recrutement
            </label>
            <input
              type="text"
              value={examBatch}
              onChange={(e) => setExamBatch(e.target.value)}
              placeholder="Ex: Session 2026 - Cycle Supérieur"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Checklist of Pieces */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pièces du dossier fournies par le candidat :
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-2.5">
              {defaultPieces.map((piece, idx) => {
                const isChecked = submittedPieces.includes(piece);
                return (
                  <div
                    key={idx}
                    onClick={() => togglePiece(piece)}
                    className="flex items-center gap-2 text-xs text-slate-200 hover:bg-slate-750 p-1.5 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                    />
                    <span className={isChecked ? 'line-through opacity-75' : ''}>{piece}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsNewExamModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la Candidature'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
