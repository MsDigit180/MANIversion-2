import React, { useState } from 'react';
import { X, RefreshCw, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RestockModal: React.FC = () => {
  const {
    isRestockModalOpen,
    setIsRestockModalOpen,
    selectedProductForRestock,
    setSelectedProductForRestock,
    updateStock,
  } = useApp();

  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState<number>(20);
  const [reason, setReason] = useState<string>('Livraison réassort fournisseur');
  const [invoiceRef, setInvoiceRef] = useState<string>('BL-2026-');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isRestockModalOpen || !selectedProductForRestock) return null;

  const currentStock = selectedProductForRestock.stockQuantity;
  const quantityDelta = movementType === 'in' ? quantity : -quantity;
  const newStock = Math.max(0, currentStock + quantityDelta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || isSubmitting) return;

    const fullReason = `${reason} ${invoiceRef ? `(Réf: ${invoiceRef})` : ''}`.trim();
    setIsSubmitting(true);

    try {
      await updateStock(selectedProductForRestock.id, quantityDelta, fullReason);
      setIsRestockModalOpen(false);
      setSelectedProductForRestock(null);
    } catch (error) {
      console.error('Error updating stock in Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickQty = (q: number) => {
    setQuantity(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gestion & Mouvement de Stock</h3>
              <p className="text-xs text-slate-400">Synchronisé en temps réel sur Firestore</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsRestockModalOpen(false);
              setSelectedProductForRestock(null);
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Details Header */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-850 p-3.5">
          <div className="text-[11px] font-mono text-amber-400 font-semibold">
            {selectedProductForRestock.sku}
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {selectedProductForRestock.name}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>
              Stock actuel : <strong className="text-white font-mono">{currentStock}</strong>
            </span>
            <span>
              Seuil d'alerte : <strong className="text-slate-300 font-mono">{selectedProductForRestock.minThreshold}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Movement Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Type d'Opération
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('in')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors ${
                  movementType === 'in'
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                <span>Entrée (+ Réassort)</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('out')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-medium transition-colors ${
                  movementType === 'out'
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                    : 'border-slate-800 bg-slate-800 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4 text-rose-400" />
                <span>Sortie / Ajustement (-)</span>
              </button>
            </div>
          </div>

          {/* Quantity with quick buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Quantité d'unités à {movementType === 'in' ? 'ajouter' : 'déduire'} *
              </label>
              <div className="flex items-center gap-1">
                {[5, 10, 20, 50].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuickQty(q)}
                    className="rounded bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 transition-colors"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-mono font-bold text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motif du mouvement
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="Livraison réassort fournisseur">Livraison réassort fournisseur</option>
              <option value="Inventaire périodique">Régularisation inventaire physique</option>
              <option value="Retour client / Annulation">Retour client ou annulation</option>
              <option value="Détérioration / Perte">Article endommagé ou perte</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              N° Bon de Livraison / Facture Fournisseur
            </label>
            <input
              type="text"
              placeholder="Ex: BL-2026-089 ou FAC-789"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Resulting Stock Preview Banner */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 flex items-center justify-between">
            <span className="text-xs text-indigo-200">Nouveau stock résultant :</span>
            <span className="font-mono text-base font-bold text-white tabular-nums">
              {currentStock} {quantityDelta >= 0 ? '+' : ''} {quantityDelta} ={' '}
              <span className="text-emerald-400">{newStock} unités</span>
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsRestockModalOpen(false);
                setSelectedProductForRestock(null);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{isSubmitting ? 'Mise à jour Firestore...' : 'Valider le Mouvement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
