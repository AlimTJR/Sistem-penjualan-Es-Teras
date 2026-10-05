import React, { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Package, ArrowRight,
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp,
  Sparkles, DollarSign, Clock, Check, Layers, Calculator
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ingredient } from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';

interface SafetyStockAlertBannerProps {
  ingredients: Ingredient[];
  onRestock?: (
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
  onNavigateToStock?: () => void;
}

export const SafetyStockAlertBanner: React.FC<SafetyStockAlertBannerProps> = ({
  ingredients,
  onRestock,
  onNavigateToStock,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Ingredient | null>(null);
  const [restockPackQty, setRestockPackQty] = useState<number>(1);
  const [restockPackIsi, setRestockPackIsi] = useState<number>(1000);
  const [restockPackPrice, setRestockPackPrice] = useState<number>(0);
  const [updateMasterPackSize, setUpdateMasterPackSize] = useState<boolean>(true);
  const [restockSource, setRestockSource] = useState<'Marketplace' | 'Langsung'>('Marketplace');

  // Filter ingredients below or equal to safety stock threshold
  const lowStockItems = ingredients.filter(i => i.stokSaatIni <= i.minStok);

  // Peringatan stok hanya akan muncul jika ada stok menipis saja, jika semuanya aman disembunyikan
  if (lowStockItems.length === 0) {
    return null;
  }

  // Count items with critical level (< 50% of safety stock)
  const criticalCount = lowStockItems.filter(i => i.stokSaatIni <= i.minStok * 0.5).length;

  const handleOpenQuickRestock = (item: Ingredient) => {
    setSelectedItemForRestock(item);
    const isi = item.isiPerPack || (item.satuan === 'gram' || item.satuan === 'ml' ? 1000 : 50);
    const deficit = Math.max(0, item.minStok - item.stokSaatIni);
    const packsNeeded = Math.max(1, Math.ceil(deficit / isi));
    const hgPack = item.hargaPerPack || Math.round(item.hargaPerSatuan * isi);

    setRestockPackQty(packsNeeded);
    setRestockPackIsi(isi);
    setRestockPackPrice(hgPack);
    setUpdateMasterPackSize(true);

    if (item.namaBahan.toLowerCase().includes('susu') || item.namaBahan.toLowerCase().includes('gula')) {
      setRestockSource('Langsung');
    } else {
      setRestockSource('Marketplace');
    }
  };

  const handleConfirmQuickRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || restockPackQty <= 0) return;

    const isi = restockPackIsi > 0 ? restockPackIsi : (selectedItemForRestock.isiPerPack || 1000);
    const additionalStock = restockPackQty * isi;
    const totalCost = Math.round(restockPackQty * restockPackPrice);
    const newUnitPrice = isi > 0 ? Math.round((restockPackPrice / isi) * 100) / 100 : selectedItemForRestock.hargaPerSatuan;

    if (onRestock) {
      onRestock(selectedItemForRestock.id, additionalStock, restockSource, {
        newUnitPrice,
        totalCost,
        priceUpdateMode: 'last_price',
        newIsiPerPack: updateMasterPackSize ? isi : undefined,
        newHargaPerPack: updateMasterPackSize ? restockPackPrice : undefined,
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#f59e0b'],
      });
    }

    setSelectedItemForRestock(null);
  };

  return (
    <div className="space-y-3">
      {/* Primary Emergency Alert Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all relative overflow-hidden ${
        criticalCount > 0
          ? 'bg-gradient-to-r from-red-50 via-red-50/90 to-amber-50 border-red-300 shadow-red-100'
          : 'bg-gradient-to-r from-amber-50 via-amber-50/90 to-yellow-50 border-amber-300 shadow-amber-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Pulsing Visual Indicator */}
            <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
              }`}>
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  criticalCount > 0 ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-4 w-4 text-[9px] font-black text-white items-center justify-center ${
                  criticalCount > 0 ? 'bg-red-700' : 'bg-amber-700'
                }`}>
                  {lowStockItems.length}
                </span>
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`font-black text-base tracking-tight ${
                  criticalCount > 0 ? 'text-red-950' : 'text-amber-950'
                }`}>
                  PERINGATAN SAFETY STOCK: {lowStockItems.length} Bahan Baku Menipis!
                </h3>
                {criticalCount > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                    {criticalCount} Kritis Sangat Rendah
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 leading-relaxed ${
                criticalCount > 0 ? 'text-red-800' : 'text-amber-800'
              }`}>
                Stok bahan berada di bawah ambang batas aman (*Safety Stock*). Segera restock ke supplier agar racikan menu tidak habis di tengah shift.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Bahan'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {onNavigateToStock && (
              <button
                type="button"
                onClick={onNavigateToStock}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Kelola Stok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Detailed Low Stock Visual Cards (Expandable) */}
        {isExpanded && (
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {lowStockItems.map(item => {
              const isCritical = item.stokSaatIni <= item.minStok * 0.5;
              const ratioPercent = Math.min(100, Math.round((item.stokSaatIni / item.minStok) * 100));
              const deficit = Math.max(0, item.minStok - item.stokSaatIni);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl bg-white border transition shadow-2xs flex flex-col justify-between ${
                    isCritical
                      ? 'border-red-300 ring-1 ring-red-200'
                      : 'border-amber-300 ring-1 ring-amber-100'
                  }`}
                >
                  <div>
                    {/* Item Title & Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block line-clamp-1">
                          {item.namaBahan}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {item.id} • {formatRupiah(item.hargaPerSatuan)}/{item.satuan}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isCritical
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isCritical ? '🔴 Kritis' : '🟡 Menipis'}
                      </span>
                    </div>

                    {/* Stock Count Comparison */}
                    <div className="mt-2.5 flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Stok Saat Ini:</span>
                        <span className={`text-base font-black ${isCritical ? 'text-red-600' : 'text-amber-700'}`}>
                          {formatNumber(item.stokSaatIni)}
                          <span className="text-xs font-semibold text-slate-500 ml-1">{item.satuan}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Ambang Safety Stock:</span>
                        <span className="font-bold text-slate-700">
                          {formatNumber(item.minStok)} {item.satuan}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar (Ratio to Safety Stock) */}
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${ratioPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{ratioPercent}% dari batas aman</span>
                        <span className="font-bold text-red-600">
                          Defisit: -{formatNumber(deficit)} {item.satuan}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Restock Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 italic">
                      Perlu segera dipesan
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickRestock(item)}
                      className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>+ Restock Cepat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Restock Modal Dialog */}
      {selectedItemForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-emerald-950 font-bold">
                  <RefreshCw className="w-4 h-4 text-emerald-950" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Restock Cepat: {selectedItemForRestock.namaBahan}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Tambahkan pasokan baru langsung ke inventaris
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItemForRestock(null)}
                className="text-emerald-300 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmQuickRestock} className="p-5 space-y-4">
              {/* Pilihan Metode Pembelian Kas */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                  Sumber &amp; Metode Pembelian Kas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestockSource('Marketplace')}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      restockSource === 'Marketplace'
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-blue-950">Marketplace Online</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Bank</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Shopee / Tokopedia (Kas Bank)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestockSource('Langsung')}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      restockSource === 'Langsung'
                        ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-amber-950">Belanja Langsung</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Tunai</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Pasar / Toko Offline (Kas Tunai)
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Input Pembelian per Pack */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jumlah {selectedItemForRestock.satuanKemasan || 'Pack'} Dibeli:
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
                        {selectedItemForRestock.satuan}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Standar: {formatNumber(selectedItemForRestock.isiPerPack || 1000)} {selectedItemForRestock.satuan}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga per {selectedItemForRestock.satuanKemasan || 'Pack'} (Rp):
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
                      Master: {formatRupiah(selectedItemForRestock.hargaPerPack || Math.round(selectedItemForRestock.hargaPerSatuan * (selectedItemForRestock.isiPerPack || 1000)))}
                    </span>
                  </div>
                </div>

                {/* Kemasan Berbeda Terdeteksi */}
                {restockPackIsi !== (selectedItemForRestock.isiPerPack || 1000) && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-[11px] text-amber-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Kemasan Berbeda Terdeteksi: 1 pack kali ini = {formatNumber(restockPackIsi)} {selectedItemForRestock.satuan} (biasanya {formatNumber(selectedItemForRestock.isiPerPack || 1000)} {selectedItemForRestock.satuan})</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] text-amber-900 pt-0.5">
                      <input
                        type="checkbox"
                        checked={updateMasterPackSize}
                        onChange={e => setUpdateMasterPackSize(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Jadikan kemasan {formatNumber(restockPackIsi)} {selectedItemForRestock.satuan} ini sebagai ukuran standar master bahan baku</span>
                    </label>
                  </div>
                )}

                {/* Info jika harga pasar berubah */}
                {restockPackPrice !== (selectedItemForRestock.hargaPerPack || Math.round(selectedItemForRestock.hargaPerSatuan * (selectedItemForRestock.isiPerPack || 1000))) && restockPackIsi === (selectedItemForRestock.isiPerPack || 1000) && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-center justify-between">
                    <span className="font-bold">
                      {restockPackPrice > (selectedItemForRestock.hargaPerPack || 0) ? '▲ Harga Pasar Naik' : '▼ Harga Pasar Turun'}
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
                    {restockPackQty} pack × {formatNumber(restockPackIsi)} = <strong>+{formatNumber(restockPackQty * restockPackIsi)} {selectedItemForRestock.satuan}</strong>
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Harga per {selectedItemForRestock.satuan} (Hitung Otomatis):</span>
                  <span className="font-bold">
                    {formatRupiah(restockPackIsi > 0 ? restockPackPrice / restockPackIsi : 0)} / {selectedItemForRestock.satuan}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-emerald-200/80 font-extrabold text-sm text-slate-900">
                  <span>Total Pengeluaran Nota:</span>
                  <span className={restockSource === 'Marketplace' ? 'text-blue-700' : 'text-amber-800'}>
                    {formatRupiah(restockPackQty * restockPackPrice)} ({restockSource === 'Marketplace' ? 'Kas Bank' : 'Kas Tunai'})
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedItemForRestock(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi Tambah Stok</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
