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
      newIsiPerPack?: number;
      newHargaPerPack?: number;
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

  // Restock modal (selalu per pack / kemasan, dengan isi per pack fleksibel)
  const [restockModalItem, setRestockModalItem] = useState<Ingredient | null>(null);
  const [restockPackQty, setRestockPackQty] = useState<number>(1);
  const [restockPackIsi, setRestockPackIsi] = useState<number>(1000);
  const [restockPackPrice, setRestockPackPrice] = useState<number>(0);
  const [updateMasterPackSize, setUpdateMasterPackSize] = useState<boolean>(true);
  const [restockSource, setRestockSource] = useState<'Marketplace' | 'Langsung'>('Marketplace');

  // Edit/Add modal
  const [editModalItem, setEditModalItem] = useState<Ingredient | null>(null);
  const [isNewIngredient, setIsNewIngredient] = useState(false);
  const [formIngredient, setFormIngredient] = useState<Omit<Ingredient, 'id'>>({
    namaBahan: '',
    hargaPerPack: 17500,
    isiPerPack: 1000,
    satuan: 'gram',
    satuanKemasan: 'pack/kantong',
    stokSaatIni: 22000,
    minStok: 8000,
    hargaPerSatuan: 17.5,
  });

  const filtered = ingredients.filter(i => {
    const matchesSearch = i.namaBahan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLow = filterLowOnly ? i.stokSaatIni <= i.minStok : true;
    return matchesSearch && matchesLow;
  });

  const lowStockCount = ingredients.filter(i => i.stokSaatIni <= i.minStok).length;

  const handleOpenRestock = (item: Ingredient) => {
    setRestockModalItem(item);
    const isi = item.isiPerPack || (item.satuan === 'gram' || item.satuan === 'ml' ? 1000 : 50);
    const hgPack = item.hargaPerPack || Math.round(item.hargaPerSatuan * isi);
    
    // Default restock jumlah pack yang dibutuhkan untuk menutupi batas min
    const deficit = Math.max(0, item.minStok - item.stokSaatIni);
    const packsNeeded = Math.max(1, Math.ceil(deficit / isi));

    setRestockPackQty(packsNeeded);
    setRestockPackIsi(isi);
    setRestockPackPrice(hgPack);
    setUpdateMasterPackSize(true);

    // Default Marketplace untuk bahan packaging/daun kering, Langsung untuk bahan segar
    if (item.namaBahan.toLowerCase().includes('susu') || item.namaBahan.toLowerCase().includes('gula')) {
      setRestockSource('Langsung');
    } else {
      setRestockSource('Marketplace');
    }
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem || restockPackQty <= 0) return;
    const isi = restockPackIsi > 0 ? restockPackIsi : (restockModalItem.isiPerPack || 1000);
    const additionalStock = restockPackQty * isi;
    const totalCost = Math.round(restockPackQty * restockPackPrice);
    const newUnitPrice = isi > 0 ? Math.round((restockPackPrice / isi) * 100) / 100 : restockModalItem.hargaPerSatuan;

    onRestock(restockModalItem.id, additionalStock, restockSource, {
      newUnitPrice,
      totalCost,
      priceUpdateMode: 'last_price',
      newIsiPerPack: updateMasterPackSize ? isi : undefined,
      newHargaPerPack: updateMasterPackSize ? restockPackPrice : undefined,
    });
    setRestockModalItem(null);
  };

  const handleOpenAdd = () => {
    setIsNewIngredient(true);
    setEditModalItem(null);
    setFormIngredient({
      namaBahan: '',
      hargaPerPack: 17500,
      isiPerPack: 1000,
      satuan: 'gram',
      satuanKemasan: 'pack/kantong',
      stokSaatIni: 5000,
      minStok: 2000,
      hargaPerSatuan: 17.5,
    });
  };

  const handleOpenEdit = (item: Ingredient) => {
    setIsNewIngredient(false);
    setEditModalItem(item);
    const isi = item.isiPerPack || (item.satuan === 'gram' || item.satuan === 'ml' ? 1000 : 50);
    const hargaPack = item.hargaPerPack || Math.round(item.hargaPerSatuan * isi);
    setFormIngredient({
      namaBahan: item.namaBahan,
      hargaPerPack: hargaPack,
      isiPerPack: isi,
      satuan: item.satuan,
      satuanKemasan: item.satuanKemasan || 'pack/kantong',
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
                <th className="px-5 py-3.5">Nama Bahan Baku</th>
                <th className="px-4 py-3.5">Kemasan &amp; Netto</th>
                <th className="px-4 py-3.5 text-right">Harga Beli / Pack</th>
                <th className="px-4 py-3.5 text-right">HPP Racik Satuan</th>
                <th className="px-4 py-3.5 text-right">Stok Saat Ini</th>
                <th className="px-4 py-3.5 text-right">Batas Min</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const isLow = item.stokSaatIni <= item.minStok;
                const percentage = Math.min(100, Math.round((item.stokSaatIni / (item.minStok * 2)) * 100));
                const isi = item.isiPerPack || (item.satuan === 'gram' || item.satuan === 'ml' ? 1000 : 50);
                const kemasan = item.satuanKemasan || 'pack';
                const hgPack = item.hargaPerPack || Math.round(item.hargaPerSatuan * isi);
                const packStock = (item.stokSaatIni / isi).toFixed(1);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      <div>{item.namaBahan}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {item.id}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <span className="font-semibold block text-slate-800">
                        1 {kemasan}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        = {formatNumber(isi)} {item.satuan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-800">
                      {formatRupiah(hgPack)}
                      <span className="text-[10px] font-normal text-slate-400 block">/{kemasan}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-black text-emerald-800 text-xs block">
                        {formatRupiah(item.hargaPerSatuan)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 block">
                        per {item.satuan} (Auto)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                      <div className="text-xs">{formatNumber(item.stokSaatIni)} <span className="font-normal text-slate-500">{item.satuan}</span></div>
                      <div className="text-[10px] text-slate-400 font-medium">≈ {packStock} {kemasan}</div>
                      <div className="w-20 ml-auto bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 font-medium text-xs">
                      <div>{formatNumber(item.minStok)} {item.satuan}</div>
                      <div className="text-[10px] text-slate-400">({(item.minStok / isi).toFixed(1)} {kemasan})</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenRestock(item)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                      >
                        + Restock
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Edit Master Bahan & Kemasan"
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

      {/* Restock Modal (Selalu per pack / kemasan) */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Restock: {restockModalItem.namaBahan}</h3>
                <p className="text-xs text-emerald-200">
                  Stok saat ini: {formatNumber(restockModalItem.stokSaatIni)} {restockModalItem.satuan} (≈ {(restockModalItem.stokSaatIni / (restockModalItem.isiPerPack || 1)).toFixed(1)} {restockModalItem.satuanKemasan || 'pack'})
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
                      Shopee / Tokopedia (Memotong <strong>Kas Bank</strong>)
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
                      Pasar / Toko Grosir (Memotong <strong>Kas Tunai Laci</strong>)
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Input Pembelian per Pack */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jumlah {restockModalItem.satuanKemasan || 'Pack'} Dibeli:
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={restockPackQty}
                      onChange={e => setRestockPackQty(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Isi per Pack Kali Ini:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={restockPackIsi}
                        onChange={e => setRestockPackIsi(Math.max(1, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-emerald-600"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">
                        {restockModalItem.satuan}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Standar: {formatNumber(restockModalItem.isiPerPack || 1000)} {restockModalItem.satuan}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga per {restockModalItem.satuanKemasan || 'Pack'} (Rp):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={restockPackPrice}
                      onChange={e => setRestockPackPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-emerald-600"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Master: {formatRupiah(restockModalItem.hargaPerPack || Math.round(restockModalItem.hargaPerSatuan * (restockModalItem.isiPerPack || 1000)))}
                    </span>
                  </div>
                </div>

                {/* Kemasan Berbeda Terdeteksi (Misal beli teh 500g sedangkan standar 1000g) */}
                {restockPackIsi !== (restockModalItem.isiPerPack || 1000) && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-[11px] text-amber-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Kemasan Berbeda Terdeteksi: 1 pack kali ini = {formatNumber(restockPackIsi)} {restockModalItem.satuan} (biasanya {formatNumber(restockModalItem.isiPerPack || 1000)} {restockModalItem.satuan})</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] text-amber-900 pt-0.5">
                      <input
                        type="checkbox"
                        checked={updateMasterPackSize}
                        onChange={e => setUpdateMasterPackSize(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Jadikan kemasan {formatNumber(restockPackIsi)} {restockModalItem.satuan} ini sebagai ukuran standar master bahan baku untuk belanja berikutnya</span>
                    </label>
                  </div>
                )}

                {/* Info jika harga pasar berubah */}
                {restockPackPrice !== (restockModalItem.hargaPerPack || Math.round(restockModalItem.hargaPerSatuan * (restockModalItem.isiPerPack || 1000))) && restockPackIsi === (restockModalItem.isiPerPack || 1000) && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-center justify-between">
                    <span className="font-bold">
                      {restockPackPrice > (restockModalItem.hargaPerPack || 0) ? '▲ Harga Pasar Naik' : '▼ Harga Pasar Turun'}
                    </span>
                    <span className="text-amber-800">
                      Otomatis disesuaikan ke nota belanja baru
                    </span>
                  </div>
                )}
              </div>

              {/* Ringkasan Jelas */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-emerald-950">
                  <span>Stok Masuk Otomatis:</span>
                  <span className="font-extrabold">
                    {restockPackQty} pack × {formatNumber(restockPackIsi)} = <strong>+{formatNumber(restockPackQty * restockPackIsi)} {restockModalItem.satuan}</strong>
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Harga per {restockModalItem.satuan} (Hitung Otomatis):</span>
                  <span className="font-bold">
                    {formatRupiah(restockPackIsi > 0 ? restockPackPrice / restockPackIsi : 0)} / {restockModalItem.satuan}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-emerald-200/80 font-extrabold text-sm text-slate-900">
                  <span>Total Pengeluaran Nota:</span>
                  <span className={restockSource === 'Marketplace' ? 'text-blue-700' : 'text-amber-800'}>
                    {formatRupiah(restockPackQty * restockPackPrice)} ({restockSource === 'Marketplace' ? 'Kas Bank' : 'Kas Tunai'})
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition cursor-pointer"
                >
                  Konfirmasi Belanja Restock
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
                {isNewIngredient ? 'Tambah Bahan Baku Baru' : `Edit Bahan: ${editModalItem?.namaBahan}`}
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

            <form onSubmit={handleSaveIngredient} className="p-5 space-y-3.5">
              {/* 1. Nama Bahan Baku */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  1. Nama Bahan Baku:
                </label>
                <input
                  type="text"
                  required
                  value={formIngredient.namaBahan}
                  onChange={e => setFormIngredient({ ...formIngredient, namaBahan: e.target.value })}
                  placeholder="Contoh: Gula Pasir Kristal, Daun Teh, Susu UHT"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-emerald-600"
                />
              </div>

              {/* 2. Harga Satuan (Beli per Pack / Kantong) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    2. Harga Satuan (Harga Beli per {formIngredient.satuanKemasan || 'Pack/Kantong'}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formIngredient.hargaPerPack || 0}
                    onChange={e => {
                      const hgPack = Math.max(0, Number(e.target.value) || 0);
                      const netto = formIngredient.isiPerPack || 1;
                      setFormIngredient(prev => ({
                        ...prev,
                        hargaPerPack: hgPack,
                        hargaPerSatuan: netto > 0 ? Math.round((hgPack / netto) * 100) / 100 : 0,
                      }));
                    }}
                    placeholder="Contoh: 17500"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-extrabold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Harga beli per kemasan sesuai nota / faktur belanja Anda
                  </span>
                </div>

                {/* 3. Isi / Netto per Pack & Satuan Racik */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      3. Isi per {formIngredient.satuanKemasan || 'Pack'}:
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={formIngredient.isiPerPack || 1000}
                      onChange={e => {
                        const netto = Math.max(1, Number(e.target.value) || 0);
                        const hgPack = formIngredient.hargaPerPack || 0;
                        setFormIngredient(prev => ({
                          ...prev,
                          isiPerPack: netto,
                          hargaPerSatuan: netto > 0 ? Math.round((hgPack / netto) * 100) / 100 : 0,
                        }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Misal: 1000 (untuk 1 kg / 1L)
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                      Satuan Racik:
                    </label>
                    <select
                      value={formIngredient.satuan}
                      onChange={e => {
                        const newSatuan = e.target.value as any;
                        setFormIngredient(prev => ({ ...prev, satuan: newSatuan }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-emerald-600"
                    >
                      <option value="gram">gram (gula, kopi, teh, bubuk)</option>
                      <option value="ml">ml (susu, sirup, gula aren)</option>
                      <option value="pcs">pcs (cup, yakult, sedotan)</option>
                      <option value="lembar">lembar (lid sealer)</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>

                {/* Jenis Kemasan */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[10px]">
                    Sebutan Kemasan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={formIngredient.satuanKemasan || 'pack/kantong'}
                    onChange={e => setFormIngredient({ ...formIngredient, satuanKemasan: e.target.value })}
                    placeholder="pack, kantong, dus, botol, slop, karung"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* Automatic Calculation Highlight: Harga per Gram/Satuan */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>Harga Satuan Terhitung Otomatis:</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 mt-0.5 block">
                    {formatRupiah(formIngredient.hargaPerPack || 0)} ÷ {formatNumber(formIngredient.isiPerPack || 1)} {formIngredient.satuan}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-900 block">
                    {formatRupiah(formIngredient.hargaPerSatuan)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    per {formIngredient.satuan} (HPP Otomatis)
                  </span>
                </div>
              </div>

              {/* Stok Saat Ini & Min Stok */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Stok Saat Ini ({formIngredient.satuanKemasan || 'Pack'}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={Number(((formIngredient.stokSaatIni || 0) / (formIngredient.isiPerPack || 1)).toFixed(2))}
                    onChange={e => {
                      const packs = Math.max(0, Number(e.target.value) || 0);
                      setFormIngredient({
                        ...formIngredient,
                        stokSaatIni: Math.round(packs * (formIngredient.isiPerPack || 1)),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    = {formatNumber(formIngredient.stokSaatIni)} {formIngredient.satuan}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    Batas Min Peringatan ({formIngredient.satuanKemasan || 'Pack'}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={Number(((formIngredient.minStok || 0) / (formIngredient.isiPerPack || 1)).toFixed(2))}
                    onChange={e => {
                      const packs = Math.max(0, Number(e.target.value) || 0);
                      setFormIngredient({
                        ...formIngredient,
                        minStok: Math.round(packs * (formIngredient.isiPerPack || 1)),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    = {formatNumber(formIngredient.minStok)} {formIngredient.satuan}
                  </span>
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
