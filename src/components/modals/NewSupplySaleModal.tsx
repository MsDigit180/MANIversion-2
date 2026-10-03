import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NewSupplySaleModal: React.FC = () => {
  const { isNewSupplySaleModalOpen, setIsNewSupplySaleModalOpen, inventory, recordSupplySale } = useApp();

  const safeInventory = inventory || [];

  const [customerName, setCustomerName] = useState('Client Comptoir');
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: number }[]>(() => [
    { itemId: safeInventory[0]?.id || '', quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'Espèces' | 'Wave / Mobile Money' | 'Orange Money'>('Espèces');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNewSupplySaleModalOpen) return null;

  const addItemRow = () => {
    const nextAvailable = safeInventory.find((i) => !selectedItems.some((si) => si.itemId === i.id));
    if (nextAvailable) {
      setSelectedItems([...selectedItems, { itemId: nextAvailable.id, quantity: 1 }]);
    }
  };

  const removeItemRow = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, itemId: string) => {
    const updated = [...selectedItems];
    updated[index].itemId = itemId;
    setSelectedItems(updated);
  };

  const updateQty = (index: number, quantity: number) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, quantity);
    setSelectedItems(updated);
  };

  // Calculate cart total
  const cartTotal = selectedItems.reduce((acc, row) => {
    const item = inventory.find((i) => i.id === row.itemId);
    return acc + (item ? item.unitPrice * row.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await recordSupplySale(customerName, selectedItems, paymentMethod);
      setIsNewSupplySaleModalOpen(false);
    } catch (error) {
      console.error('Error recording supply sale to Firestore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vente de Fournitures en Caisse</h3>
              <p className="text-xs text-slate-400">Enregistrement sécurisé Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewSupplySaleModalOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nom de l'acheteur / Élève
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Cart Items Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Articles à déstocker :
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300"
              >
                <Plus className="h-3 w-3" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedItems.map((row, idx) => {
                const currentItem = inventory.find((i) => i.id === row.itemId);
                return (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                    <select
                      value={row.itemId}
                      onChange={(e) => updateItem(idx, e.target.value)}
                      className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer truncate"
                    >
                      {safeInventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name || 'Article'} ({(inv?.unitPrice ?? 0).toLocaleString()} FCFA - Stock: {inv?.stockQuantity ?? 0})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      max={currentItem ? (currentItem?.stockQuantity ?? 99) : 99}
                      value={row.quantity}
                      onChange={(e) => updateQty(idx, Number(e.target.value))}
                      className="w-16 rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs font-mono text-center text-slate-200"
                    />

                    <span className="font-mono text-xs font-semibold text-white w-20 text-right tabular-nums">
                      {currentItem ? ((currentItem?.unitPrice ?? 0) * (row.quantity ?? 1)).toLocaleString() : 0} F
                    </span>

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mode de Paiement
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Espèces">Espèces (Comptoir)</option>
                <option value="Wave / Mobile Money">Wave / Mobile Money</option>
                <option value="Orange Money">Orange Money</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/80 p-3 flex flex-col justify-center items-end">
              <span className="text-[11px] text-slate-400">Total à percevoir :</span>
              <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                {(cartTotal ?? 0).toLocaleString()} FCFA
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsNewSupplySaleModalOpen(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              <span>{isSubmitting ? 'Enregistrement Firestore...' : 'Valider la Vente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
