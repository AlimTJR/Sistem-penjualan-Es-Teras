import React, { useState } from 'react';
import {
  Package, Plus, AlertTriangle, CheckCircle2, RefreshCw,
  Search, ArrowDown, ArrowUp, DollarSign, Edit2, X, Check
} from 'lucide-react';
import { Ingredient } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface StockManagementProps {
  ingredients: Ingredient[];
  onUpdateIngredient: (ingredient: Ingredient) => void;
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onRestock: (ingredientId: string, additionalStock: number) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  ingredients,
  onUpdateIngredient,
  onAddIngredient,
  onRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowOnly, setFilterLowOnly] = useState(false);

  // Restock modal
  const [restockModalItem, setRestockModalItem] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(100);

  // Edit/Add modal
  const [editModalItem, setEditModalItem] = useState<Ingredient | null>(null);
  const [isNewIngredient, setIsNewIngredient] = useState(false);
  const [formIngredient, setFormIngredient] = useState<Omit<Ingredient, 'id'>>({
    namaBahan: '',
    satuan: 'gram',
    stokSaatIni: 0,
    minStok: 100,
    hargaPerSatuan: 0,
  });

  const filtered = ingredients.filter(i => {
    const matchesSearch = i.namaBahan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLow = filterLowOnly ? i.stokSaatIni <= i.minStok : true;
    return matchesSearch && matchesLow;
  });

  const lowStockCount = ingredients.filter(i => i.stokSaatIni <= i.minStok).length;

  const handleOpenRestock = (item: Ingredient) => {
    setRestockModalItem(item);
    setRestockAmount(item.minStok || 50);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem || restockAmount <= 0) return;
    onRestock(restockModalItem.id, restockAmount);
    setRestockModalItem(null);
  };

  const handleOpenAdd = () => {
    setIsNewIngredient(true);
    setEditModalItem(null);
    setFormIngredient({
      namaBahan: '',
      satuan: 'pcs',
      stokSaatIni: 1000,
      minStok: 200,
      hargaPerSatuan: 500,
    });
  };

  const handleOpenEdit = (item: Ingredient) => {
    setIsNewIngredient(false);
    setEditModalItem(item);
    setFormIngredient({
      namaBahan: item.namaBahan,
      satuan: item.satuan,
      stokSaatIni: item.stokSaatIni,
      minStok: item.minStok,
      hargaPerSatuan: item.hargaPerSatuan,
    });
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIngredient.namaBahan.trim()) return;

    if (isNewIngredient) {
      onAddIngredient(formIngredient);
    } else if (editModalItem) {
      onUpdateIngredient({
        ...editModalItem,
        ...formIngredient,
      });
    }
    setEditModalItem(null);
    setIsNewIngredient(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Inventory &amp; Backward Deduction
            </span>
            {lowStockCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {lowStockCount} Bahan Kritis
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Manajemen Stok Bahan Baku (Ingredients)
          </h2>
          <p className="text-xs text-slate-500">
            Stok otomatis berkurang (Backward Inventory Deduction) saat form closing dikirim oleh karyawan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Master Bahan Baku</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bahan (kopi, teh, cup, susu)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-600 shadow-xs"
          />
        </div>

        <button
          onClick={() => setFilterLowOnly(!filterLowOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterLowOnly
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Tampilkan Hanya Stok Tipis ({lowStockCount})</span>
        </button>
      </div>

      {/* Table of Ingredients */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Nama Bahan Baku</th>
                <th className="px-5 py-3">Satuan</th>
                <th className="px-5 py-3 text-right">Harga Beli / Satuan</th>
                <th className="px-5 py-3 text-right">Stok Saat Ini</th>
                <th className="px-5 py-3 text-right">Batas Min Stok</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const isLow = item.stokSaatIni <= item.minStok;
                const percentage = Math.min(100, Math.round((item.stokSaatIni / (item.minStok * 2)) * 100));

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      <div>{item.namaBahan}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {item.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {item.satuan}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-700">
                      {formatRupiah(item.hargaPerSatuan)} <span className="text-[10px] font-normal text-slate-400">/{item.satuan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                      <div className="text-sm">{formatNumber(item.stokSaatIni)}</div>
                      <div className="w-20 ml-auto bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500 font-medium">
                      {formatNumber(item.minStok)} {item.satuan}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          Kritis / Restock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenRestock(item)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                      >
                        + Restock
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit Master Bahan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Restock: {restockModalItem.namaBahan}</h3>
                <p className="text-xs text-emerald-200">
                  Stok saat ini: {formatNumber(restockModalItem.stokSaatIni)} {restockModalItem.satuan}
                </p>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Jumlah Stok Masuk ({restockModalItem.satuan}):
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={restockAmount}
                  onChange={e => setRestockAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900">
                <span className="font-bold block">Hasil Setelah Restock:</span>
                <span className="text-base font-black text-emerald-800">
                  {formatNumber(restockModalItem.stokSaatIni + restockAmount)} {restockModalItem.satuan}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Konfirmasi Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {(editModalItem || isNewIngredient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isNewIngredient ? 'Tambah Bahan Baku Baru' : `Edit: ${editModalItem?.namaBahan}`}
              </h3>
              <button
                onClick={() => {
                  setEditModalItem(null);
                  setIsNewIngredient(false);
                }}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-5 space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Bahan Baku:</label>
                <input
                  type="text"
                  required
                  value={formIngredient.namaBahan}
                  onChange={e => setFormIngredient({ ...formIngredient, namaBahan: e.target.value })}
                  placeholder="Contoh: Biji Kopi Robusta Blend"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Satuan:</label>
                  <select
                    value={formIngredient.satuan}
                    onChange={e => setFormIngredient({ ...formIngredient, satuan: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                  >
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="lembar">lembar</option>
                    <option value="kg">kg</option>
                    <option value="bal">bal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Harga Beli / Satuan (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formIngredient.hargaPerSatuan}
                    onChange={e => setFormIngredient({ ...formIngredient, hargaPerSatuan: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stok Saat Ini:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formIngredient.stokSaatIni}
                    onChange={e => setFormIngredient({ ...formIngredient, stokSaatIni: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batas Minimum Stok:</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formIngredient.minStok}
                    onChange={e => setFormIngredient({ ...formIngredient, minStok: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalItem(null);
                    setIsNewIngredient(false);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
