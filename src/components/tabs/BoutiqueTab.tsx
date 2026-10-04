import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PackagePlus,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Boxes,
  Truck,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';

export const BoutiqueTab: React.FC = () => {
  const {
    inventory,
    setIsNewSupplySaleModalOpen,
    setIsNewProductModalOpen,
    setIsRestockModalOpen,
    setSelectedProductForRestock,
    updateStock,
    deleteProduct,
    showToast,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStateFilter, setStockStateFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const safeInventory = inventory || [];

  const filteredInventory = safeInventory.filter((item) => {
    const searchLower = (search || '').toLowerCase();
    const nameSafe = (item.name || '').toLowerCase();
    const skuSafe = (item.sku || '').toLowerCase();
    const suppSafe = (item.supplier || '').toLowerCase();

    const matchesSearch =
      nameSafe.includes(searchLower) ||
      skuSafe.includes(searchLower) ||
      suppSafe.includes(searchLower);

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    let matchesStock = true;
    if (stockStateFilter === 'normal') {
      matchesStock = (item.stockQuantity || 0) > (item.minThreshold || 0);
    } else if (stockStateFilter === 'critical') {
      matchesStock = (item.stockQuantity || 0) <= (item.minThreshold || 0) && (item.stockQuantity || 0) > 0;
    } else if (stockStateFilter === 'out') {
      matchesStock = (item.stockQuantity || 0) === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalStockValue = safeInventory.reduce((acc, curr) => acc + (curr.unitPrice || 0) * (curr.stockQuantity || 0), 0);
  const totalUnits = safeInventory.reduce((acc, curr) => acc + (curr.stockQuantity || 0), 0);
  const lowStockItems = safeInventory.filter((i) => (i.stockQuantity || 0) <= (i.minThreshold || 0) && (i.stockQuantity || 0) > 0);
  const outOfStockItems = safeInventory.filter((i) => (i.stockQuantity || 0) === 0);

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedProductForRestock(item);
    setIsRestockModalOpen(true);
  };

  const handleQuickAdjust = (e: React.MouseEvent, item: InventoryItem, delta: number) => {
    e.stopPropagation();
    if (item.stockQuantity + delta < 0) return;
    updateStock(item.id, delta, delta > 0 ? 'Entrée rapide comptoir' : 'Sortie rapide comptoir');
  };

  return (
    <div className="space-y-6">
      {/* Top summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valeur Marchande du Stock</span>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {(totalStockValue ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">FCFA</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{totalUnits} articles disponibles en magasin</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Articles Référencés</span>
          <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {inventory.length}
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400">Catalogue fournitures & manuels</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Articles en Seuil Critique</span>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {lowStockItems.length}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-300">Sous le seuil d'alerte configuré</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ruptures Totales</span>
          <div className="mt-2 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {outOfStockItems.length}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-300">Nécessite réapprovisionnement</span>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher produit, référence SKU, fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Toutes Catégories</option>
            <option value="Manuels & Annales">Manuels & Annales</option>
            <option value="Cahiers & Stylos">Cahiers & Stylos</option>
            <option value="Tenues & Blasons">Tenues & Blasons</option>
            <option value="Outils & Géométrie">Outils & Géométrie</option>
          </select>

          <select
            value={stockStateFilter}
            onChange={(e) => setStockStateFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Tous Niveaux de Stock</option>
            <option value="normal">Stock Normal (&gt; seuil)</option>
            <option value="critical">Seuil Critique</option>
            <option value="out">Rupture de Stock (0)</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewSupplySaleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Vente en Caisse</span>
          </button>

          <button
            onClick={() => setIsNewProductModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Référence SKU & Article</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Fournisseur (Niamey)</th>
                <th className="py-3 px-4 text-right">Prix Unitaire</th>
                <th className="py-3 px-4 text-center">Quantité & Seuil</th>
                <th className="py-3 px-4 text-center">État Stock</th>
                <th className="py-3 px-4 text-right">Ajustement & Réassort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {safeInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun article en stock dans la base de données</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Le catalogue de fournitures est actuellement vide. Cliquez sur le bouton ci-dessous pour créer votre premier article.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsNewProductModalOpen(true)}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nouvel Article de Magasin</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">Aucun produit ne correspond à vos filtres.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.stockQuantity <= item.minThreshold && item.stockQuantity > 0;
                  const isOut = item.stockQuantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.sku}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {item.supplier || 'Grossiste Niamey'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {(item?.unitPrice ?? 0).toLocaleString()} FCFA
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {item.stockQuantity}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Seuil min : {item.minThreshold}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Rupture</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Critique</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Normal</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleQuickAdjust(e, item, -1)}
                            title="-1 sortie rapide"
                            disabled={item.stockQuantity === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                          >
                            -
                          </button>
                          <button
                            onClick={(e) => handleQuickAdjust(e, item, +1)}
                            title="+1 entrée rapide"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleOpenRestock(item)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm transition-colors ml-1"
                          >
                            Réassort
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
    </div>
  );
};
