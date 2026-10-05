import React, { useState } from 'react';
import {
  Package, Plus, AlertTriangle, CheckCircle2, RefreshCw,
  Search, ArrowDown, ArrowUp, DollarSign, Edit2, X, Check,
  TrendingUp, TrendingDown, Layers, Calculator, HelpCircle, Sparkles
} from 'lucide-react';
import { Ingredient } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface StockManagementProps {
  ingredients: Ingredient[];
  onUpdateIngredient: (ingredient: Ingredient) => void;
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onRestock: (
    ingredientId: string,
    additionalStock: number,
    source?: 'Marketplace' | 'Langsung',
    options?: {
      newUnitPrice?: number;
      totalCost?: number;
      priceUpdateMode?: 'moving_average' | 'last_price' | 'keep_old';
    }
  ) => void;
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
  const [restockSource, setRestockSource] = useState<'Marketplace' | 'Langsung'>('Marketplace');
  const [restockUnitPrice, setRestockUnitPrice] = useState<number>(0);
  const [restockTotalCost, setRestockTotalCost] = useState<number>(0);
  const [priceUpdateMode, setPriceUpdateMode] = useState<'moving_average' | 'last_price' | 'keep_old'>('moving_average');

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
    const amount = item.minStok || 50;
    setRestockAmount(amount);
    setRestockUnitPrice(item.hargaPerSatuan);
    setRestockTotalCost(Math.round(amount * item.hargaPerSatuan));
    setPriceUpdateMode('moving_average');

    // Suggest Marketplace for packaging & raw leaves, Langsung for perishables like fresh milk
    if (item.namaBahan.toLowerCase().includes('susu') || item.namaBahan.toLowerCase().includes('gula')) {
      setRestockSource('Langsung');
    } else {
      setRestockSource('Marketplace');
    }
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem || restockAmount <= 0) return;
    onRestock(restockModalItem.id, restockAmount, restockSource, {
      newUnitPrice: restockUnitPrice,
      totalCost: restockTotalCost,
      priceUpdateMode,
    });
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
              {/* Pilihan Metode Pembelian: Marketplace (Bank) vs Langsung (Tunai) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Sumber &amp; Metode Pembelian Kas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockSource('Marketplace')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      restockSource === 'Marketplace'
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-blue-950">Marketplace Online</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Bank</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Shopee / Tokopedia / Transfer BCA. Memotong <strong>Kas Bank</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestockSource('Langsung')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      restockSource === 'Langsung'
                        ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-amber-950">Belanja Langsung</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Tunai</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Pasar / Toko Grosir Offline. Memotong <strong>Kas Tunai Laci</strong>.
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Input Jumlah & Harga Beli Baru */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Jumlah Stok Masuk ({restockModalItem.satuan}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={restockAmount}
                    onChange={e => {
                      const amount = Math.max(0, Number(e.target.value) || 0);
                      setRestockAmount(amount);
                      setRestockTotalCost(Math.round(amount * restockUnitPrice));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                {/* Dynamic Price Inputs: Harga Satuan Baru vs Total Nota Belanja */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga Beli Satuan Baru:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={restockUnitPrice}
                        onChange={e => {
                          const unitP = Math.max(0, Number(e.target.value) || 0);
                          setRestockUnitPrice(unitP);
                          setRestockTotalCost(Math.round(restockAmount * unitP));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-emerald-600"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">
                        /{restockModalItem.satuan}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Harga Master Lama: {formatRupiah(restockModalItem.hargaPerSatuan)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Total Belanja di Nota (Riil):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={restockTotalCost}
                      onChange={e => {
                        const total = Math.max(0, Number(e.target.value) || 0);
                        setRestockTotalCost(total);
                        if (restockAmount > 0) {
                          setRestockUnitPrice(Math.round((total / restockAmount) * 100) / 100);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-950 focus:outline-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {formatRupiah(restockTotalCost)} dipotong dari {restockSource === 'Marketplace' ? 'Kas Bank' : 'Kas Tunai'}
                    </span>
                  </div>
                </div>

                {/* Deteksi Fluktuasi Harga Pasar */}
                {restockUnitPrice !== restockModalItem.hargaPerSatuan && (
                  <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    restockUnitPrice > restockModalItem.hargaPerSatuan
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black">
                        {restockUnitPrice > restockModalItem.hargaPerSatuan ? (
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>
                          {restockUnitPrice > restockModalItem.hargaPerSatuan
                            ? `Harga Pasar Naik: +${formatRupiah(restockUnitPrice - restockModalItem.hargaPerSatuan)} (+${Math.round(((restockUnitPrice - restockModalItem.hargaPerSatuan) / restockModalItem.hargaPerSatuan) * 100)}%)`
                            : `Harga Pasar Turun: ${formatRupiah(restockUnitPrice - restockModalItem.hargaPerSatuan)} (${Math.round(((restockUnitPrice - restockModalItem.hargaPerSatuan) / restockModalItem.hargaPerSatuan) * 100)}%)`}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                        Fluktuasi Pasar
                      </span>
                    </div>

                    {/* Pricing Strategy Selector */}
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                        Solusi Penyesuaian Harga Master (HPP):
                      </span>

                      <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 transition">
                        <input
                          type="radio"
                          name="priceUpdateMode"
                          value="moving_average"
                          checked={priceUpdateMode === 'moving_average'}
                          onChange={() => setPriceUpdateMode('moving_average')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-[11px] leading-tight">
                          <span className="font-extrabold text-slate-900 block">
                            Rata-Rata Tertimbang (*Moving Average*) — Rekomendasi
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            Menggabungkan nilai stok lama ({formatNumber(restockModalItem.stokSaatIni)} {restockModalItem.satuan}) dan stok baru. Estimasi master HPP baru: <strong>{formatRupiah(Math.round(((restockModalItem.stokSaatIni * restockModalItem.hargaPerSatuan) + restockTotalCost) / (restockModalItem.stokSaatIni + restockAmount)))} / {restockModalItem.satuan}</strong>.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 transition">
                        <input
                          type="radio"
                          name="priceUpdateMode"
                          value="last_price"
                          checked={priceUpdateMode === 'last_price'}
                          onChange={() => setPriceUpdateMode('last_price')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-slate-800 block">
                            Update ke Harga Beli Terakhir (*Last Price*)
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            Master harga bahan baku langsung diubah menjadi <strong>{formatRupiah(restockUnitPrice)} / {restockModalItem.satuan}</strong>.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 transition">
                        <input
                          type="radio"
                          name="priceUpdateMode"
                          value="keep_old"
                          checked={priceUpdateMode === 'keep_old'}
                          onChange={() => setPriceUpdateMode('keep_old')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-slate-800 block">
                            Hanya Catat Kas (Jangan Ubah Master HPP)
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            Kas tetap terpotong sesuai nota riil, namun master harga bahan tetap dipertahankan pada <strong>{formatRupiah(restockModalItem.hargaPerSatuan)}</strong>.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Box */}
              <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Hasil Akumulasi Stok:</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatNumber(restockModalItem.stokSaatIni + restockAmount)} {restockModalItem.satuan}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-slate-900">
                  <span>Total Pengeluaran Kas Riil:</span>
                  <span className={restockSource === 'Marketplace' ? 'text-blue-700' : 'text-amber-800'}>
                    {formatRupiah(restockTotalCost)} ({restockSource === 'Marketplace' ? 'Kas Bank' : 'Kas Tunai'})
                  </span>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
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
