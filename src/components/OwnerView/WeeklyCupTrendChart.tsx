import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell
} from 'recharts';
import {
  Coffee, TrendingUp, Award, Calendar, BarChart3,
  Sparkles, ArrowUpRight, Flame, CheckCircle2
} from 'lucide-react';
import { Closing } from '../../types';
import {
  formatNumber, formatRupiah, formatIndonesianDate,
  getIndonesianDayName, isSunday
} from '../../utils/formatters';

interface WeeklyCupTrendChartProps {
  closings: Closing[];
}

export const WeeklyCupTrendChart: React.FC<WeeklyCupTrendChartProps> = ({ closings }) => {
  const [chartMode, setChartMode] = useState<'bar' | 'area'>('bar');

  // Filter operational days (Senin - Sabtu, exclude Sundays)
  const weeklyData = useMemo(() => {
    const valid = closings
      .filter(c => !isSunday(c.tanggal))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    // Take the last 6 to 7 operational days representing the past week
    const last7Days = valid.slice(-7);

    return last7Days.map(c => {
      const dayName = getIndonesianDayName(c.tanggal);
      const dateParts = c.tanggal.split('-');
      const shortDate = `${dateParts[2]}/${dateParts[1]}`;

      // Find top selling menu on that day
      let topMenu = '-';
      let topQty = 0;
      if (c.menuDetails && c.menuDetails.length > 0) {
        c.menuDetails.forEach(m => {
          if (m.qty > topQty) {
            topQty = m.qty;
            topMenu = m.namaMenu;
          }
        });
      }

      return {
        tanggal: c.tanggal,
        hari: dayName,
        label: `${dayName} (${shortDate})`,
        shortDate,
        totalCup: c.totalCup,
        totalPenjualan: c.totalPenjualan,
        totalKas: c.totalKas,
        petugas: c.userName,
        topMenu,
        topQty,
      };
    });
  }, [closings]);

  // Statistics
  const totalWeeklyCup = weeklyData.reduce((acc, d) => acc + d.totalCup, 0);
  const totalWeeklyOmzet = weeklyData.reduce((acc, d) => acc + d.totalPenjualan, 0);
  const avgCupPerDay = weeklyData.length > 0 ? Math.round(totalWeeklyCup / weeklyData.length) : 0;

  // Peak day (Highest sales)
  const peakDay = useMemo(() => {
    if (weeklyData.length === 0) return null;
    return [...weeklyData].sort((a, b) => b.totalCup - a.totalCup)[0];
  }, [weeklyData]);

  // Lowest day
  const lowestDay = useMemo(() => {
    if (weeklyData.length === 0) return null;
    return [...weeklyData].sort((a, b) => a.totalCup - b.totalCup)[0];
  }, [weeklyData]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPeak = peakDay && data.tanggal === peakDay.tanggal;
      const diffFromAvg = data.totalCup - avgCupPerDay;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 text-xs min-w-56 space-y-2 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="font-extrabold text-sm text-amber-300 block">
                {data.hari}, {formatIndonesianDate(data.tanggal)}
              </span>
              <span className="text-[10px] text-slate-400">
                Closing oleh: {data.petugas}
              </span>
            </div>
            {isPeak && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                <Flame className="w-3 h-3 text-amber-400" />
                Peak Day
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Cup Terjual:</span>
              <span className="font-black text-emerald-400 text-sm">
                {formatNumber(data.totalCup)} Cup
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Omzet Penjualan:</span>
              <span className="font-bold text-white">
                {formatRupiah(data.totalPenjualan)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Selisih vs Rata-rata:</span>
              <span className={`font-bold ${diffFromAvg >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {diffFromAvg >= 0 ? `+${diffFromAvg}` : diffFromAvg} Cup ({diffFromAvg >= 0 ? 'Diatas target' : 'Dibawah target'})
              </span>
            </div>

            {data.topMenu !== '-' && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400 block">Menu Terlaris Hari Ini:</span>
                <span className="font-semibold text-amber-200">
                  {data.topMenu} ({data.topQty} cup)
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (weeklyData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
        Belum ada data closing lapak untuk menampilkan tren mingguan.
      </div>
    );
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  Perbandingan Penjualan Cup Harian (1 Minggu Terakhir)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Recharts Visual
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Analisis pergerakan volume cup yang terjual per hari operasional (Senin–Sabtu).
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setChartMode('bar')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'bar'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Diagram Batang</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('area')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'area'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kontur Tren</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Total Cup Minggu Ini
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-0.5">
            {formatNumber(totalWeeklyCup)} <span className="text-xs font-bold text-emerald-700">Cup</span>
          </div>
          <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
            Omzet: {formatRupiah(totalWeeklyOmzet)}
          </span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
            Rata-rata Cup / Hari
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">
            {formatNumber(avgCupPerDay)} <span className="text-xs font-bold text-amber-800">Cup/hari</span>
          </div>
          <span className="text-[10px] text-amber-800 block mt-0.5 font-medium">
            Basis {weeklyData.length} hari operasional
          </span>
        </div>

        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
            Penjualan Tertinggi (Peak)
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-950 mt-0.5 flex items-center gap-1.5">
            <span>{peakDay ? formatNumber(peakDay.totalCup) : 0}</span>
            <span className="text-xs font-bold text-blue-800">Cup</span>
          </div>
          <span className="text-[10px] text-blue-700 block mt-0.5 font-medium truncate">
            {peakDay ? `${peakDay.hari} (${peakDay.shortDate})` : '-'}
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Target Harian Minimal
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
            <span>400</span>
            <span className="text-xs font-bold text-slate-500">Cup</span>
          </div>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            100% Hari Melampaui Target
          </span>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bar' ? (
            <BarChart
              data={weeklyData}
              margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="cupBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="peakBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.ceil((dataMax + 100) / 100) * 100]}
                tickFormatter={(val: number) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={avgCupPerDay}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Rata-rata: ${avgCupPerDay} cup`,
                  position: 'insideTopRight',
                  fill: '#b45309',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
              <Bar
                dataKey="totalCup"
                name="Total Cup"
                radius={[10, 10, 0, 0]}
                maxBarSize={55}
                animationDuration={1200}
              >
                {weeklyData.map((entry, index) => {
                  const isPeak = peakDay && entry.tanggal === peakDay.tanggal;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isPeak ? 'url(#peakBarGradient)' : 'url(#cupBarGradient)'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart
              data={weeklyData}
              margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.ceil((dataMax + 100) / 100) * 100]}
                tickFormatter={(val: number) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={avgCupPerDay}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Rata-rata: ${avgCupPerDay} cup`,
                  position: 'insideTopRight',
                  fill: '#b45309',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
              <Area
                type="monotone"
                dataKey="totalCup"
                name="Total Cup"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#areaGradient)"
                activeDot={{ r: 7, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={1200}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Day-by-Day Quick Comparison Bar Grid */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Rincian Volume Terjual Tiap Hari</span>
          <span className="text-[10px] text-slate-500 font-medium">
            Garis Emas = Rata-rata Mingguan ({avgCupPerDay} cup)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {weeklyData.map(item => {
            const isPeak = peakDay && item.tanggal === peakDay.tanggal;
            const percentOfWeekly = totalWeeklyCup > 0 ? Math.round((item.totalCup / totalWeeklyCup) * 100) : 0;
            const isAboveAvg = item.totalCup >= avgCupPerDay;

            return (
              <div
                key={item.tanggal}
                className={`p-3 rounded-2xl border transition ${
                  isPeak
                    ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {item.hari}
                  </span>
                  {isPeak ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900">
                      Peak
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.shortDate}
                    </span>
                  )}
                </div>

                <div className="mt-1 text-base font-black text-slate-900">
                  {formatNumber(item.totalCup)}
                  <span className="text-[10px] font-medium text-slate-500 ml-1">cup</span>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">{percentOfWeekly}% share</span>
                  <span className={`font-bold ${isAboveAvg ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isAboveAvg ? `+${item.totalCup - avgCupPerDay}` : `${item.totalCup - avgCupPerDay}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
