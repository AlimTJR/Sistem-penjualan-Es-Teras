import React, { useState } from 'react';
import {
  Calendar, CheckCircle2, AlertCircle, Clock, ChevronRight,
  TrendingUp, Award, DollarSign, Sparkles, FileText, UserCheck,
  Check, Edit3
} from 'lucide-react';
import { User, Absensi, Closing, Kasbon, Menu, OperationalExpenseMaster } from '../../types';
import {
  formatIndonesianDate, formatRupiah, formatNumber, getTodayDateStr,
  getMonthYearStr, getIndonesianDayName
} from '../../utils/formatters';
import { AttendanceDrawer } from './AttendanceDrawer';
import { AttendanceCheckInModal } from './AttendanceCheckInModal';
import { ClosingFormModal } from './ClosingFormModal';

interface EmployeeHomeProps {
  currentUser: User;
  absensiList: Absensi[];
  closingsList: Closing[];
  kasbonList: Kasbon[];
  menus: Menu[];
  expenseMaster: OperationalExpenseMaster[];
  onAddIzin: (tanggal: string, keterangan: string) => void;
  onCheckInAttendance: (tanggal: string, laporanKegiatan: string) => void;
  onSubmitClosing: (closingData: Omit<Closing, 'id' | 'createdAt'>) => void;
}

export const EmployeeHome: React.FC<EmployeeHomeProps> = ({
  currentUser,
  absensiList,
  closingsList,
  kasbonList,
  menus,
  expenseMaster,
  onAddIzin,
  onCheckInAttendance,
  onSubmitClosing,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  const todayStr = getTodayDateStr();
  const currentMonth = getMonthYearStr(todayStr);

  // Check today's attendance record
  const todayAbsensi = absensiList.find(
    a => a.userId === currentUser.id && a.tanggal === todayStr
  );
  const isPresentToday = todayAbsensi?.statusHadir === 'Hadir';

  // Check today's closing
  const todayClosing = closingsList.find(
    c => c.tanggal === todayStr
  );

  // Working days completed by this employee in current month
  const monthlyAbsensi = absensiList.filter(
    a => a.userId === currentUser.id && a.tanggal.startsWith(currentMonth)
  );

  const totalHariKerja = monthlyAbsensi.filter(a => a.statusHadir === 'Hadir').length;
  const totalIzin = monthlyAbsensi.filter(a => a.statusHadir === 'Izin').length;

  // Daily wage rate (Rp 50.000 / hari kerja)
  const tarifHarian = currentUser.tarifHarian || 50000;
  const gajiPokokTerkumpul = totalHariKerja * tarifHarian;

  // Cup Bonus Rule:
  // "jika tercatat hadir maka karyawan tersebut berhak mendapatkan bonus untuk penjualan jumlah cup hari itu, bukan yang mengerjakan closing saja"
  const hadirDatesThisMonth = new Set(
    monthlyAbsensi.filter(a => a.statusHadir === 'Hadir').map(a => a.tanggal)
  );

  let totalCupsEligible = 0;
  closingsList.forEach(c => {
    if (c.tanggal.startsWith(currentMonth) && hadirDatesThisMonth.has(c.tanggal)) {
      totalCupsEligible += c.totalCup;
    }
  });

  const bonusAccrued = totalCupsEligible * currentUser.bonusPerCup;

  // Kasbon balance pending
  const userKasbonPending = kasbonList
    .filter(k => k.userId === currentUser.id && (k.status === 'Disetujui' || k.status === 'Pending'))
    .reduce((acc, k) => acc + k.nominal, 0);

  const estimasiTakeHomePay = Math.max(0, gajiPokokTerkumpul + bonusAccrued - userKasbonPending);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Date & Shift Welcome Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-emerald-700/30 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{formatIndonesianDate(todayStr, true)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Selamat Bertugas, {currentUser.nama}!
            </h1>
            <p className="text-xs text-emerald-200 mt-0.5">
              {currentUser.jabatan || 'Barista Lapak Kedai Teras'} • Tarif Harian: <strong>{formatRupiah(tarifHarian)} / Hadir</strong>
            </p>
          </div>

          {/* Today's Status Badge */}
          <div className="self-start sm:self-auto">
            {isPresentToday ? (
              <div className="flex items-center gap-2 bg-emerald-700/90 border border-emerald-400 px-3.5 py-2 rounded-2xl text-xs font-bold text-white shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Absensi Hadir Hari Ini Tercatat</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/50 px-3.5 py-2 rounded-2xl text-xs font-semibold text-amber-200">
                <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Shift Berjalan • Belum Absen Hadir</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Primary Operational Action Cards: 1. Tombol Khusus Absen & 2. Closing Lapak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACTION 1: Tombol Khusus Absen Karyawan (Brief requirement: dedicated button opening dialog with date and daily activity report) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                Absensi Karyawan
              </span>
              {isPresentToday && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Sudah Hadir
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {isPresentToday ? 'Kehadiran Hari Ini Aktif' : 'Absen Kehadiran & Laporan Harian'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Klik untuk membuka dialog absensi, isi laporan aktivitas harian (pembersihan lapak, cuci mesin press, dll.), dan dapatkan hak bonus penjualan cup hari ini.
            </p>

            {isPresentToday && todayAbsensi?.laporanKegiatan && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 italic">
                "{todayAbsensi.laporanKegiatan}"
              </div>
            )}
          </div>

          <button
            onClick={() => setAttendanceModalOpen(true)}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
              isPresentToday
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
            }`}
          >
            {isPresentToday ? (
              <>
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <span>Lihat / Perbarui Laporan Kegiatan Hari Ini</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Absen Masuk &amp; Kirim Laporan Harian</span>
              </>
            )}
          </button>
        </div>

        {/* ACTION 2: Closing Lapak (Malam Hari) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Closing Lapak
              </span>
              {todayClosing && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Closing Selesai ({todayClosing.totalCup} cup)
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Form Closing Lapak &amp; Hitung Kas
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input rincian varian menu terjual, pengeluaran es &amp; galon, kas masuk bayar hutang, dan pengurangan stok bahan baku otomatis.
            </p>
          </div>

          <button
            onClick={() => setClosingModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Mulai Closing Harian</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Widget Ringkasan Hari Kerja (Clickable Drawer) & Gaji Projection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Widget Ringkasan Hari Kerja */}
        <div
          onClick={() => setDrawerOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setDrawerOpen(true)}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Widget Rekap Absensi
              </span>
              <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                Buka Riwayat
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <div className="text-3xl font-black text-emerald-950">
                {totalHariKerja}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Hari Kerja Hadir Bulan Ini
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {totalHariKerja} Hadir ({formatRupiah(gajiPokokTerkumpul)})
              </span>
              {totalIzin > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  {totalIzin} Izin
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Klik kartu ini untuk melihat riwayat laporan kegiatan &amp; pengajuan izin.</span>
          </div>
        </div>

        {/* Projection Bonus & Gaji Card (Tarif Harian Rp 50.000 + Hak Bonus Seluruh Cup Hari Hadir) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estimasi Gaji &amp; Insentif (Harian)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                Tarif: {formatRupiah(tarifHarian)} / Hari
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Gaji Pokok Harian:</span>
                <span className="text-lg font-extrabold text-slate-800">
                  {formatRupiah(gajiPokokTerkumpul)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({totalHariKerja} hari × {formatRupiah(tarifHarian)})
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Bonus Penjualan Cup:</span>
                <span className="text-lg font-extrabold text-emerald-600">
                  +{formatRupiah(bonusAccrued)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({formatNumber(totalCupsEligible)} cup @ {formatRupiah(currentUser.bonusPerCup)})
                </span>
              </div>
            </div>

            {userKasbonPending > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-red-600 font-medium">
                <span>Kasbon Aktif (Pemotongan):</span>
                <span>-{formatRupiah(userKasbonPending)}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 block">Estimasi Take-Home Pay:</span>
              <span className="text-[10px] text-slate-400">(Gaji Harian + Bonus Cup Hadir) - Kasbon</span>
            </div>
            <span className="text-base font-black text-emerald-800">
              {formatRupiah(estimasiTakeHomePay)}
            </span>
          </div>
        </div>
      </div>

      {/* Riwayat Closing Terakhir Lapak */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Riwayat Closing Terakhir Lapak
          </h3>
          <span className="text-[11px] text-slate-500">
            Bonus dihitung dari semua cup pada hari Anda hadir
          </span>
        </div>

        {closingsList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Belum ada data closing tercatat.
          </div>
        ) : (
          <div className="space-y-2.5">
            {closingsList.slice(0, 3).map(c => {
              const attendedOnThisDay = hadirDatesThisMonth.has(c.tanggal);

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {formatIndonesianDate(c.tanggal)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Petugas Closing: {c.userName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      "{c.catatanPeristiwa}"
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-700 block">
                        {formatNumber(c.totalCup)} Cup
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Kas: {formatRupiah(c.totalKas)}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      attendedOnThisDay ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {attendedOnThisDay ? '+Dapat Bonus' : 'Tidak Hadir'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AttendanceCheckInModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        currentUser={currentUser}
        existingAbsensi={todayAbsensi}
        onSubmitAttendance={onCheckInAttendance}
      />

      <AttendanceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentUser={currentUser}
        absensiList={absensiList}
        onAddIzin={onAddIzin}
      />

      <ClosingFormModal
        isOpen={closingModalOpen}
        onClose={() => setClosingModalOpen(false)}
        currentUser={currentUser}
        menus={menus}
        expenseMaster={expenseMaster}
        onSubmitClosing={onSubmitClosing}
      />
    </div>
  );
};
