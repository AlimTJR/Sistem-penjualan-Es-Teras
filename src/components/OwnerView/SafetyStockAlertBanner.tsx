import React, { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Package, ArrowRight,
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp,
  Sparkles, DollarSign, Clock, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ingredient } from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';

interface SafetyStockAlertBannerProps {
  ingredients: Ingredient[];
  onRestock?: (ingredientId: string, additionalStock: number) => void;
  onNavigateToStock?: () => void;
}

export const SafetyStockAlertBanner: React.FC<SafetyStockAlertBannerProps> = ({
  ingredients,
  onRestock,
  onNavigateToStock,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState<number>(100);

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
    // Recommend restock amount: deficit + 1x safety buffer
    const deficit = Math.max(0, item.minStok - item.stokSaatIni);
    const recommended = deficit > 0 ? deficit + item.minStok : item.minStok;
    setRestockQty(recommended);
  };

  const handleConfirmQuickRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || restockQty <= 0) return;

    if (onRestock) {
      onRestock(selectedItemForRestock.id, restockQty);
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
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Stok Saat Ini:</span>
                  <span className="font-bold text-red-600">
                    {formatNumber(selectedItemForRestock.stokSaatIni)} {selectedItemForRestock.satuan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batas Safety Stock:</span>
                  <span className="font-bold text-slate-700">
                    {formatNumber(selectedItemForRestock.minStok)} {selectedItemForRestock.satuan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Satuan Bahan:</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(selectedItemForRestock.hargaPerSatuan)} / {selectedItemForRestock.satuan}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Jumlah Tambahan Restock ({selectedItemForRestock.satuan}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={e => setRestockQty(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:bg-white focus:outline-emerald-600"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    {selectedItemForRestock.satuan}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Estimasi stok baru: <strong>{formatNumber(selectedItemForRestock.stokSaatIni + restockQty)} {selectedItemForRestock.satuan}</strong> (Status: Aman)
                </span>
              </div>

              {/* Estimated purchase cost */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Estimasi Biaya Pembelian:</span>
                <span className="font-black text-emerald-900 text-sm">
                  {formatRupiah(restockQty * selectedItemForRestock.hargaPerSatuan)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedItemForRestock(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
