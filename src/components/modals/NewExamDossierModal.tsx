import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Shield, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NewExamDossierModal: React.FC = () => {
  const { isNewExamModalOpen, setIsNewExamModalOpen, addExam, networkStatus } = useApp();

  const [candidateName, setCandidateName] = useState('');
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

  const handleExamTypeChange = (selected: string) => {
    setExamType(selected);
    if (selected === 'ENA / ENAM') {
      setExamBatch('ENAM Niamey - Cycle Supérieur (Administration / Diplomatie)');
    } else if (selected === 'Police Nationale') {
      setExamBatch('École Nationale de Police de Niamey - Officiers & Inspecteurs');
    } else if (selected === 'Gendarmerie Nationale') {
      setExamBatch('Élèves Sous-Officiers de Gendarmerie - Centre d\'Instruction Koira Tegui');
    } else if (selected === 'Garde Nationale (GNN)') {
      setExamBatch('Commandement de la Garde Nationale du Niger (GNN) - Promotion 2026');
    } else if (selected === 'Douanes & Trésor') {
      setExamBatch('Direction Générale des Douanes (DGD Niger) - Contrôleurs des Douanes');
    } else if (selected === 'Santé Publique (ENSP)') {
      setExamBatch('ENSP Niamey - Infirmiers Diplômés d\'État & Sages-Femmes');
    } else {
      setExamBatch('Fonction Publique Générale - Cadre A & B');
    }
  };

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
        examType: examType as any,
        examBatch: examBatch.trim(),
        contactPhone: contactPhone.trim(),
        requiredPieces: defaultPieces,
        submittedPieces,
        status: submittedPieces.length === defaultPieces.length ? 'Validé' : 'Pièces manquantes',
        submissionDate: 'Aujourd\'hui',
      });

      // Reset
      setCandidateName('');
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
              <h3 className="text-base font-bold text-white">Candidature Concours Fonction Publique</h3>
              <p className="text-xs text-slate-400">Enregistrement sécurisé Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewExamModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corps / Concours Visé (Niger) *
              </label>
              <select
                value={examType}
                onChange={(e) => handleExamTypeChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none cursor-pointer"
              >
                <option value="ENA / ENAM">1. ENA / ENAM (Administration & Magistrature)</option>
                <option value="Police Nationale">2. Police Nationale du Niger</option>
                <option value="Gendarmerie Nationale">3. Gendarmerie Nationale du Niger</option>
                <option value="Garde Nationale (GNN)">4. Garde Nationale du Niger (GNN)</option>
                <option value="Douanes & Trésor">5. Douanes & Trésor (DGD Niger)</option>
                <option value="Santé Publique (ENSP)">6. Santé Publique (ENSP Niamey)</option>
                <option value="Fonction Publique">7. Autre concours Fonction Publique</option>
              </select>
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
              Filière / Section / Centre de Formation
            </label>
            <input
              type="text"
              value={examBatch}
              onChange={(e) => setExamBatch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Pièces administratives déjà réunies par le candidat :
            </label>
            <div className="grid grid-cols-1 gap-2">
              {defaultPieces.map((p) => {
                const checked = submittedPieces.includes(p);
                return (
                  <div
                    key={p}
                    onClick={() => togglePiece(p)}
                    className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'border-purple-500/40 bg-purple-500/10 text-purple-200'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded text-purple-600 shrink-0" />
                    <span>{p}</span>
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
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{isSubmitting ? 'Enregistrement Firestore...' : 'Créer le Dossier Candidature'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
