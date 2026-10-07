import React, { useState } from 'react';
import {
  TrendingUp, DollarSign, Coffee, Calendar, ShieldCheck,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Eye, EyeOff,
  Sparkles, Filter, CheckCircle2, ChevronRight, X,
  Landmark, Wallet, Lock, Unlock, ArrowRight, Edit3, Plus
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Chart } from 'react-chartjs-2';
import { Closing, Menu, Ingredient, Recipe, User, MonthlyClosingReport, CashTransaction, OperationalExpenseMaster } from '../../types';
import {
  formatRupiah, formatNumber, formatIndonesianDate,
  getIndonesianDayName, isSunday
} from '../../utils/formatters';
import { WeeklyCupTrendChart } from './WeeklyCupTrendChart';
import { SafetyStockAlertBanner } from './SafetyStockAlertBanner';
import { ClosingFormModal } from '../EmployeeView/ClosingFormModal';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface OwnerDashboardProps {
  closings: Closing[];
  menus: Menu[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  users: User[];
  currentUser?: User | null;
  expenseMaster?: OperationalExpenseMaster[];
  monthlyReports?: MonthlyClosingReport[];
  cashTransactions?: CashTransaction[];
  onRestock?: (
    ingredientId: string,
    additionalStock: number,
    source?: 'Marketplace' | 'Langsung',
    options?: {
      newUnitPrice?: number;
      totalCost?: number;
      priceUpdateMode?: 'moving_average' | 'last_price' | 'keep_old';
    }
  ) => void;
  onNavigateToStock?: () => void;
  onNavigateToMonthlyReport?: () => void;
  onSubmitClosing?: (closingData: Omit<Closing, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  closings,
  menus,
  ingredients,
  recipes,
  users,
  currentUser,
  expenseMaster = [],
  monthlyReports = [],
  cashTransactions = [],
  onRestock,
  onNavigateToStock,
  onNavigateToMonthlyReport,
  onSubmitClosing,
}) => {
  const [selectedClosing, setSelectedClosing] = useState<Closing | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent'>('all');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingToRevise, setClosingToRevise] = useState<Closing | null>(null);

  // Fitur Sembunyikan / Sensor Nominal Omzet Penjualan dan Saldo Kas Tunai & Bank (Privasi Owner)
  const [hideNominal, setHideNominal] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hide_owner_nominal') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideNominal = () => {
    setHideNominal(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hide_owner_nominal', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const maskRupiah = (val: number) => {
    if (hideNominal) {
      return 'Rp ••••••••';
    }
    return formatRupiah(val);
  };

  // Filter out any potential Sunday recordings (as per brief: jam operasional Senin-Sabtu, Minggu Libur)
  // Ensure X-axis excludes Sundays
  const operationalClosings = closings
    .filter(c => !isSunday(c.tanggal))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const displayedClosings = timeFilter === 'recent'
    ? operationalClosings.slice(-7)
    : operationalClosings;

  // Aggregate Metrics
  const totalOmzet = displayedClosings.reduce((acc, c) => acc + c.totalPenjualan, 0);
  const totalCupSold = displayedClosings.reduce((acc, c) => acc + c.totalCup, 0);
  const totalOperationalDays = displayedClosings.length;
  const avgCupPerDay = totalOperationalDays > 0 ? Math.round(totalCupSold / totalOperationalDays) : 0;

  const totalPengeluaran = displayedClosings.reduce((acc, c) => acc + c.totalPengeluaran, 0);
  const totalBayarHutang = displayedClosings.reduce((acc, c) => acc + c.totalPembayaranHutang, 0);
  const totalKasNet = displayedClosings.reduce((acc, c) => acc + c.totalKas, 0);

  // Calculate HPP and Profit
  let totalEstimatedHpp = 0;
  displayedClosings.forEach(c => {
    c.menuDetails.forEach(item => {
      totalEstimatedHpp += (item.hpp || 0) * item.qty;
    });
  });
  const grossProfit = totalOmzet - totalEstimatedHpp;
  const profitMarginPercent = totalOmzet > 0 ? Math.round((grossProfit / totalOmzet) * 100) : 0;

  // Stock alerts
  const lowStockIngredients = ingredients.filter(i => i.stokSaatIni <= i.minStok);

  // Top Selling Drink breakdown
  const menuSalesMap: Record<string, { name: string; qty: number; revenue: number; category: string }> = {};
  displayedClosings.forEach(c => {
    c.menuDetails.forEach(item => {
      if (!menuSalesMap[item.menuId]) {
        menuSalesMap[item.menuId] = {
          name: item.namaMenu,
          qty: 0,
          revenue: 0,
          category: menus.find(m => m.id === item.menuId)?.kategori || 'Lainnya',
        };
      }
      menuSalesMap[item.menuId].qty += item.qty;
      menuSalesMap[item.menuId].revenue += item.subtotal;
    });
  });

  const sortedTopMenus = Object.values(menuSalesMap).sort((a, b) => b.qty - a.qty);

  // Prepare Chart.js Data (excluding Sundays)
  const chartLabels = displayedClosings.map(c => {
    const day = getIndonesianDayName(c.tanggal);
    const dateParts = c.tanggal.split('-');
    return `${day}, ${dateParts[2]}/${dateParts[1]}`;
  });

  const salesTrendData = {
    labels: chartLabels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Omzet Penjualan (Rp)',
        data: displayedClosings.map(c => c.totalPenjualan),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
        borderWidth: 3,
        pointBackgroundColor: '#059669',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        type: 'bar' as const,
        label: 'Volume Terjual (Cup)',
        data: displayedClosings.map(c => c.totalCup),
        backgroundColor: 'rgba(245, 158, 11, 0.75)',
        hoverBackgroundColor: '#f59e0b',
        borderRadius: 6,
        yAxisID: 'y1',
        barThickness: 18,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 11,
            family: 'system-ui, sans-serif',
            weight: 600,
          },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Omzet')) {
              return hideNominal ? `${label}: Rp ••••••••` : `${label}: ${formatRupiah(value)}`;
            }
            return `${label}: ${formatNumber(value)} cup`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 500 } },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Omzet Penjualan (Rp)',
          font: { size: 10, weight: 600 },
          color: '#059669',
        },
        ticks: {
          callback: function (val: any) {
            if (hideNominal) return '••••';
            return 'Rp ' + (val / 1000000).toFixed(1) + ' jt';
          },
          font: { size: 10 },
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Volume (Cup)',
          font: { size: 10, weight: 600 },
          color: '#d97706',
        },
        ticks: {
          font: { size: 10 },
          stepSize: 100,
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Sistem Notifikasi Visual Safety Stock Bahan Baku - Ditempatkan di PALING ATAS jika ada stok menipis */}
      <SafetyStockAlertBanner
        ingredients={ingredients}
        onRestock={onRestock}
        onNavigateToStock={onNavigateToStock}
      />

      {/* Top Banner with Operational Status & Sunday Filter explanation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Jadwal Operasional: Senin – Sabtu (Minggu Libur)
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Sumbu-X Auto-Exclude Minggu
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Dashboard Kinerja &amp; Arus Kas Kedai Teras
          </h2>
          <p className="text-xs text-slate-500">
            Grafik penjualan harian otomatis mengecualikan hari libur Minggu sehingga tren rata-rata cup tidak terdistorsi.
          </p>
        </div>

        {/* Actions & Filter: Tombol +Input Closing Dihilangkan Agar Tidak Penuh, Ditambah Tombol Privasi Sembunyikan Nilai */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          {/* Tombol Privasi Sembunyikan / Sensor Nominal Omzet & Saldo Kas */}
          <button
            type="button"
            onClick={toggleHideNominal}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
              hideNominal
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={hideNominal ? 'Tampilkan nilai omzet dan saldo kas' : 'Sembunyikan nilai omzet dan saldo kas untuk privasi'}
          >
            {hideNominal ? (
              <>
                <EyeOff className="w-4 h-4 text-amber-800" />
                <span>Nominal Disembunyikan</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Sembunyikan Nilai</span>
              </>
            )}
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeFilter('recent')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'recent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari Kerja Terakhir
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Riwayat
            </button>
          </div>
        </div>
      </div>

      {/* Keadaan Kas Bulanan & Status Tutup Buku Widget */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Landmark className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Pembukuan Bulanan ({monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1].bulanTahun : '2026-10'})
              </span>
              {monthlyReports.length > 0 && monthlyReports[monthlyReports.length - 1].status === 'Closed' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-600">
                  <Lock className="w-3 h-3 text-emerald-300" />
                  Tutup Buku Closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  <Unlock className="w-3 h-3 text-amber-300" />
                  Buku Berjalan (Open)
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">
              Pemisahan Kas Tunai Lapak &amp; Kas Bank Marketplace
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Belanja langsung offline memotong kas tunai, restock marketplace Shopee/Tokopedia memotong kas bank.
            </p>
          </div>
        </div>

        {/* Cash Balance Pills (Dilengkapi Fitur Sembunyikan / Sensor Saldo) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            <div>
              <span className="text-[10px] font-bold text-amber-300 block flex items-center gap-1">
                <Wallet className="w-3 h-3 text-amber-300" />
                Kas Tunai (Laci):
              </span>
              <span className="text-sm font-extrabold text-white tracking-tight">
                {maskRupiah(monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1].saldoFisikTunai || 3120000 : 3120000)}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleHideNominal}
              className="p-1 rounded-lg text-amber-300/80 hover:text-white hover:bg-white/10 transition cursor-pointer ml-0.5"
              title={hideNominal ? 'Tampilkan saldo kas' : 'Sembunyikan saldo kas'}
            >
              {hideNominal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
            <div>
              <span className="text-[10px] font-bold text-blue-300 block flex items-center gap-1">
                <Landmark className="w-3 h-3 text-blue-300" />
                Kas Bank (BCA):
              </span>
              <span className="text-sm font-extrabold text-white tracking-tight">
                {maskRupiah(monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1].saldoNyataBank || 17650000 : 17650000)}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleHideNominal}
              className="p-1 rounded-lg text-blue-300/80 hover:text-white hover:bg-white/10 transition cursor-pointer ml-0.5"
              title={hideNominal ? 'Tampilkan saldo bank' : 'Sembunyikan saldo bank'}
            >
              {hideNominal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {onNavigateToMonthlyReport && (
            <button
              type="button"
              onClick={onNavigateToMonthlyReport}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
            >
              <span>Laporan &amp; Tutup Buku</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet (Dilengkapi Tombol & Fitur Sembunyikan Nilai) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Omzet Penjualan
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleHideNominal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title={hideNominal ? 'Tampilkan omzet' : 'Sembunyikan omzet'}
              >
                {hideNominal ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
              </button>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {maskRupiah(totalOmzet)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>
                Laba Kotor: {hideNominal ? 'Rp ••••••••' : `${formatRupiah(grossProfit)} (${profitMarginPercent}%)`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Volume & Rata-rata Cup / Hari Kerja */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rata-Rata Cup / Hari
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-slate-900">
                {formatNumber(avgCupPerDay)}
              </div>
              <span className="text-xs font-bold text-slate-500">Cup / Hari Kerja</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Total: <strong>{formatNumber(totalCupSold)} Cup</strong> ({totalOperationalDays} hari kerja)
            </div>
          </div>
        </div>

        {/* Card 3: Arus Kas Masuk Tambahan & Biaya */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kas Masuk &amp; Beban Harian
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Pengeluaran Lapak:</span>
              <span className="font-bold text-red-600">
                {hideNominal ? 'Rp ••••••••' : `-${formatRupiah(totalPengeluaran)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Bayar Hutang (Kas In):</span>
              <span className="font-bold text-emerald-600">
                {hideNominal ? 'Rp ••••••••' : `+${formatRupiah(totalBayarHutang)}`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-800">
              <span>Total Kas Bersih:</span>
              <span className="text-emerald-700">{maskRupiah(totalKasNet)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Status Bahan Baku & Alert (Enhanced with Safety Stock Visual Highlighting) */}
        <div className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between transition-all ${
          lowStockIngredients.length > 0
            ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
            : 'bg-white border border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Safety Stock Bahan Baku
            </span>
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              lowStockIngredients.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {lowStockIngredients.length > 0 ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-amber-900">
                    {lowStockIngredients.length} Bahan
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Di Bawah Batas
                  </span>
                </div>
                <span className="text-[11px] text-amber-800 line-clamp-1 mt-1 font-medium">
                  {lowStockIngredients.map(i => i.namaBahan).join(', ')}
                </span>
                {onNavigateToStock && (
                  <button
                    type="button"
                    onClick={onNavigateToStock}
                    className="text-[10px] text-amber-900 font-bold underline mt-1.5 inline-block hover:text-amber-950 cursor-pointer"
                  >
                    Buka Rincian Stok →
                  </button>
                )}
              </div>
            ) : (
              <div>
                <span className="text-base font-black text-emerald-800 block">
                  Semua Stok Aman
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Biji kopi, teh, susu &amp; cup mencukupi safety stock.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualisasi Recharts: Perbandingan Cup Harian 1 Minggu Terakhir */}
      <WeeklyCupTrendChart closings={closings} hideNominal={hideNominal} />

      {/* Main Interactive Chart (Senin - Sabtu Only) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Grafik Tren Penjualan &amp; Volume Harian (Senin–Sabtu)
            </h3>
            <p className="text-xs text-slate-500">
              * Hari Minggu otomatis dihilangkan dari sumbu tanggal agar grafik analisis tidak anjlok ke angka Rp0.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              Omzet (Garis Hijau)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              Cup Terjual (Batang Amber)
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <Chart type="bar" data={salesTrendData as any} options={chartOptions as any} />
        </div>
      </div>

      {/* Two columns: Top Menu & Riwayat Closing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Varian Minuman (1 col) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col">
          <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Varian Menu Terlaris</span>
            <span className="text-[11px] text-slate-400 font-normal">Berdasarkan Volume</span>
          </h3>

          <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-96">
            {sortedTopMenus.map((item, idx) => {
              const sharePercent = totalCupSold > 0 ? Math.round((item.qty / totalCupSold) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {item.name}
                    </span>
                    <span className="font-bold text-emerald-800">
                      {formatNumber(item.qty)} cup ({sharePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, sharePercent * 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Riwayat Closing & Catatan Lapak (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Log Closing &amp; Catatan Peristiwa Lapak
              </h3>
              <p className="text-xs text-slate-500">
                Data absensi auto-trigger &amp; laporan harian karyawan.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {displayedClosings.length} Closing Tercatat
            </span>
          </div>

          <div className="mt-3 space-y-2.5 overflow-y-auto max-h-96">
            {displayedClosings.slice().reverse().map(c => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {formatIndonesianDate(c.tanggal, true)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Oleh: {c.userName}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic">
                    "{c.catatanPeristiwa}"
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-700">
                      {formatNumber(c.totalCup)} Cup
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Net Kas: {formatRupiah(c.totalKas)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setClosingToRevise(c);
                        setIsClosingModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 transition cursor-pointer"
                      title="Revisi Laporan Closing Ini (Owner Mode: Bebas Edit Tanggal/Penjualan/Pengeluaran)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedClosing(c)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 transition cursor-pointer"
                      title="Lihat rincian closing"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Detail Closing */}
      {selectedClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Rincian Closing #{selectedClosing.id}
                </h3>
                <p className="text-xs text-emerald-200">
                  {formatIndonesianDate(selectedClosing.tanggal, true)} • Petugas: {selectedClosing.userName}
                </p>
              </div>
              <button
                onClick={() => setSelectedClosing(null)}
                className="text-emerald-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Penjualan Minuman ({selectedClosing.totalCup} cup):</h4>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                  {selectedClosing.menuDetails.map(m => (
                    <div key={m.menuId} className="flex justify-between text-slate-700">
                      <span>{m.namaMenu} ({m.qty} cup @ {formatRupiah(m.hargaJual)})</span>
                      <span className="font-bold">{formatRupiah(m.subtotal)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-emerald-900 text-sm">
                    <span>Total Penjualan:</span>
                    <span>{formatRupiah(selectedClosing.totalPenjualan)}</span>
                  </div>
                </div>
              </div>

              {selectedClosing.pengeluaranCash.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Pengeluaran Operasional Lapak:</h4>
                  <div className="bg-red-50/50 rounded-xl p-3 border border-red-200 space-y-1">
                    {selectedClosing.pengeluaranCash.map(e => (
                      <div key={e.id} className="flex justify-between text-red-900">
                        <span>{e.nama} {e.catatan ? `(${e.catatan})` : ''}</span>
                        <span className="font-bold">-{formatRupiah(e.nominal)}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-red-200 flex justify-between font-bold text-red-700">
                      <span>Total Biaya:</span>
                      <span>-{formatRupiah(selectedClosing.totalPengeluaran)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedClosing.pembayaranHutang.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Pemasukan Kas Tambahan / Bayar Hutang:</h4>
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-200 space-y-1">
                    {selectedClosing.pembayaranHutang.map(c => (
                      <div key={c.id} className="flex justify-between text-emerald-900">
                        <span>{c.sumber} {c.catatan ? `(${c.catatan})` : ''}</span>
                        <span className="font-bold">+{formatRupiah(c.nominal)}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-emerald-700">
                      <span>Total Kas Masuk Lain:</span>
                      <span>+{formatRupiah(selectedClosing.totalPembayaranHutang)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center text-sm font-bold">
                <span>Total Kas Fisik Bersih (Net Cash):</span>
                <span className="text-amber-300 text-base">{formatRupiah(selectedClosing.totalKas)}</span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Catatan Peristiwa Lapak:</h4>
                <p className="bg-slate-100 p-3 rounded-xl text-slate-700 italic">
                  "{selectedClosing.catatanPeristiwa}"
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const toEdit = selectedClosing;
                  setSelectedClosing(null);
                  setClosingToRevise(toEdit);
                  setIsClosingModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Revisi Laporan Closing Ini (Ubah Tanggal/Data)</span>
              </button>

              <button
                onClick={() => setSelectedClosing(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input & Revisi Closing Lapak oleh Owner */}
      {isClosingModalOpen && currentUser && (
        <ClosingFormModal
          isOpen={isClosingModalOpen}
          onClose={() => {
            setIsClosingModalOpen(false);
            setClosingToRevise(null);
          }}
          currentUser={currentUser}
          menus={menus}
          expenseMaster={expenseMaster}
          initialClosing={closingToRevise}
          onSubmitClosing={(payload, existingId) => {
            if (onSubmitClosing) {
              onSubmitClosing(payload, existingId || closingToRevise?.id);
            }
            setIsClosingModalOpen(false);
            setClosingToRevise(null);
          }}
        />
      )}
    </div>
  );
};
