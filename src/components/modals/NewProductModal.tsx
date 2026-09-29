import React, { useState } from 'react';
import { X, PackagePlus, Clock, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NewProductModal: React.FC = () => {
  const { isNewProductModalOpen, setIsNewProductModalOpen, addProduct, networkStatus } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Manuels & Annales' | 'Cahiers & Stylos' | 'Tenues & Blasons' | 'Outils & Géométrie' | string>('Manuels & Annales');
  const [sku, setSku] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(5000);
  const [stockQuantity, setStockQuantity] = useState<number>(25);
  const [minThreshold, setMinThreshold] = useState<number>(10);
  const [supplier, setSupplier] = useState('Librairie Centrale Niamey');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNewProductModalOpen) return null;

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!sku || sku.startsWith('FOU-')) {
      const prefix = newCat.includes('Manuel')
        ? 'ANN'
        : newCat.includes('Cahier')
        ? 'CAH'
        : newCat.includes('Tenue')
        ? 'UNIF'
        : 'OUT';
      setSku(`FOU-${prefix}-${Math.floor(10 + Math.random() * 90)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    const finalSku = sku.trim() || `FOU-${Math.floor(100 + Math.random() * 900)}`;
    setIsSubmitting(true);

    try {
      await addProduct({
        name: name.trim(),
        category,
        sku: finalSku,
        unitPrice,
        stockQuantity,
        minThreshold,
        supplier,
        description,
      });

      // Reset and close
      setName('');
      setDescription('');
      setIsNewProductModalOpen(false);
    } catch (error) {
      console.error('Error adding product to Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <PackagePlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ajouter un Nouveau Produit</h3>
              <p className="text-xs text-slate-400">Enregistrement sécurisé Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewProductModalOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {networkStatus === 'offline' && (
          <div className="mt-4 rounded-lg bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Mode Hors-ligne :</strong> L'article sera créé dans le cache Firestore et synchronisé dès reconnexion.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Désignation du Produit / Fourniture *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Annales Baccalauréat SVT Tle D (Édition 2026)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="Manuels & Annales">Manuels & Annales</option>
                <option value="Cahiers & Stylos">Cahiers & Stylos</option>
                <option value="Tenues & Blasons">Tenues & Blasons</option>
                <option value="Outils & Géométrie">Outils & Géométrie</option>
                <option value="Accessoires Divers">Accessoires Divers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Référence SKU / Code Article
              </label>
              <input
                type="text"
                placeholder="Ex: FOU-ANN-08"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Prix Unitaire (FCFA) *
              </label>
              <input
                type="number"
                step="500"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stock Initial *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seuil Alerte Stock
              </label>
              <input
                type="number"
                min="1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fournisseur / Distributeur
              </label>
              <input
                type="text"
                placeholder="Ex: Éditions Pédagogiques du Niger"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Remarques
              </label>
              <input
                type="text"
                placeholder="Ex: Conforme au programme officiel Niger 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsNewProductModalOpen(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
              <span>{isSubmitting ? 'Enregistrement Firestore...' : 'Créer et Référencer le Produit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
