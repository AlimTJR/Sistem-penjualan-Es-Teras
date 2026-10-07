import React, { useState } from 'react';
import {
  Calendar, CheckCircle2, AlertCircle, Clock, ChevronRight,
  TrendingUp, Award, DollarSign, Sparkles, FileText, UserCheck,
  Check, Edit3, BellRing, BookOpen, Plus, ShieldAlert
} from 'lucide-react';
import { User, Absensi, Closing, Kasbon, Menu, OperationalExpenseMaster, CustomerDebt } from '../../types';
import {
  formatIndonesianDate, formatRupiah, formatNumber, getTodayDateStr,
  getMonthYearStr, getIndonesianDayName
} from '../../utils/formatters';
import { AttendanceDrawer } from './AttendanceDrawer';
import { AttendanceCheckInModal } from './AttendanceCheckInModal';
import { ClosingFormModal } from './ClosingFormModal';
import { DebtCollectionReminderModal } from '../DebtCollectionReminderModal';
import { DebtRecordModal } from '../DebtRecordModal';

interface EmployeeHomeProps {
  currentUser: User;
  absensiList: Absensi[];
  closingsList: Closing[];
  kasbonList: Kasbon[];
  customerDebtsList?: CustomerDebt[];
  menus: Menu[];
  expenseMaster: OperationalExpenseMaster[];
  onAddIzin: (tanggal: string, keterangan: string) => void;
  onCheckInAttendance: (tanggal: string, laporanKegiatan: string) => void;
  onSubmitClosing: (closingData: Omit<Closing, 'id' | 'createdAt'>, existingId?: string) => void;
  onAddCustomerDebt?: (data: {
    namaPelanggan: string;
    nominal: number;
    tanggal: string;
    catatan: string;
    potongKasLaci: boolean;
  }) => void;
  onSettleDebt?: (debtId: string) => void;
}

export const EmployeeHome: React.FC<EmployeeHomeProps> = ({
  currentUser,
  absensiList,
  closingsList,
  kasbonList,
  customerDebtsList = [],
  menus,
  expenseMaster,
  onAddIzin,
  onCheckInAttendance,
  onSubmitClosing,
  onAddCustomerDebt,
  onSettleDebt,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [debtRecordModalOpen, setDebtRecordModalOpen] = useState(false);
  const [debtReminderModalOpen, setDebtReminderModalOpen] = useState(false);

  const todayStr = getTodayDateStr();
  const currentMonth = getMonthYearStr(todayStr);
  const isOwner = currentUser.role === 'owner';

  // Check today's attendance record
  const todayAbsensi = absensiList.find(
    a => a.userId === currentUser.id && a.tanggal === todayStr
  );
  const isPresentToday = todayAbsensi?.statusHadir === 'Hadir';

  // Check today's closing
  const todayClosing = closingsList.find(
    c => c.tanggal === todayStr
  );

  // Unpaid debts from yesterday / previous days for reminder
  const unpaidYesterdayDebts = customerDebtsList.filter(
    d => d.status === 'Belum Lunas' && d.tanggal < todayStr
  );
  const totalUnpaidNominal = unpaidYesterdayDebts.reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);

  // Working days completed by this employee in current month
  // NOTE: Owner does NOT count attendance days, does NOT receive bonus or employee wage
  const monthlyAbsensi = absensiList.filter(
    a => a.userId === currentUser.id && a.tanggal.startsWith(currentMonth)
  );

  const totalHariKerja = isOwner ? 0 : monthlyAbsensi.filter(a => a.statusHadir === 'Hadir').length;
  const totalIzin = isOwner ? 0 : monthlyAbsensi.filter(a => a.statusHadir === 'Izin').length;

  // Daily wage rate (Rp 50.000 / hari kerja) - NOT applicable to owner
  const tarifHarian = isOwner ? 0 : (currentUser.tarifHarian || 50000);
  const gajiPokokTerkumpul = totalHariKerja * tarifHarian;

  // Cup Bonus Rule:
  // "Owner tidak mendapatkan bonus, absen kehadiran owner juga tidak berlaku"
  const hadirDatesThisMonth = new Set(
    monthlyAbsensi.filter(a => a.statusHadir === 'Hadir').map(a => a.tanggal)
  );

  let totalCupsEligible = 0;
  if (!isOwner) {
    closingsList.forEach(c => {
      if (c.tanggal.startsWith(currentMonth) && hadirDatesThisMonth.has(c.tanggal)) {
        totalCupsEligible += c.totalCup;
      }
    });
  }

  const bonusAccrued = isOwner ? 0 : (totalCupsEligible * (currentUser.bonusPerCup || 0));

  // Kasbon balance pending
  const userKasbonPending = isOwner ? 0 : kasbonList
    .filter(k => k.userId === currentUser.id && (k.status === 'Disetujui' || k.status === 'Pending'))
    .reduce((acc, k) => acc + k.nominal, 0);

  const estimasiTakeHomePay = isOwner ? 0 : Math.max(0, gajiPokokTerkumpul + bonusAccrued - userKasbonPending);

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

      {/* Unpaid Debts Reminder Banner from Yesterday / Previous Days */}
      {unpaidYesterdayDebts.length > 0 && !isOwner && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0 animate-bounce">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  Pengingat Penagihan Hari Ini
                </span>
                <span className="text-[11px] font-bold bg-amber-200 text-amber-950 px-2 py-0.2 rounded-full">
                  {unpaidYesterdayDebts.length} Bon Belum Lunas
                </span>
              </div>
              <p className="text-sm font-black mt-0.5">
                Ada total {formatRupiah(totalUnpaidNominal)} hutang dari hari sebelumnya yang harus ditagih!
              </p>
              <p className="text-[11px] text-amber-100">
                Hubungi atau tagih pelanggan saat datang ke lapak, lalu tekan tombol "Lunas" untuk mencatat kas masuk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDebtReminderModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs shadow-md shrink-0 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Lihat Daftar Penagihan ({unpaidYesterdayDebts.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Operational Action Cards: 1. Absen, 2. Closing Lapak, 3. Catat Hutang/Kas Keluar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ACTION 1: Tombol Khusus Absen Karyawan (Khusus Karyawan, Owner tidak wajib absen) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                Absensi Karyawan
              </span>
              {isOwner ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Owner: Bebas Absen
                </span>
              ) : isPresentToday ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Sudah Hadir
                </span>
              ) : null}
            </div>

            <h2 className="text-base font-black text-slate-900">
              {isOwner ? 'Absensi (Khusus Staf Karyawan)' : isPresentToday ? 'Kehadiran Hari Ini Aktif' : 'Absen Kehadiran & Laporan Harian'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isOwner
                ? 'Akun Owner tidak memiliki kewajiban absensi kehadiran dan tidak mendapatkan bonus cup.'
                : 'Klik untuk mengisi laporan aktivitas harian (pembersihan lapak, cuci mesin press) dan mendapatkan hak bonus cup hari ini.'}
            </p>

            {!isOwner && isPresentToday && todayAbsensi?.laporanKegiatan && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 italic">
                "{todayAbsensi.laporanKegiatan}"
              </div>
            )}
          </div>

          {!isOwner ? (
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
                isPresentToday
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
              }`}
            >
              {isPresentToday ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <span>Lihat / Edit Laporan Hari Ini</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Absen Masuk &amp; Laporan Harian</span>
                </>
              )}
            </button>
          ) : (
            <div className="py-2.5 px-3 rounded-2xl bg-slate-100 text-slate-500 font-bold text-center text-xs">
              Absensi Tidak Berlaku untuk Owner
            </div>
          )}
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
                  Selesai ({todayClosing.totalCup} cup)
                </span>
              )}
            </div>

            <h2 className="text-base font-black text-slate-900">
              Form Closing Lapak &amp; Kas
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input varian menu terjual, pengeluaran bahan &amp; utilitas, catat bon hutang baru, dan kurangi stok otomatis.
            </p>
          </div>

          <button
            onClick={() => setClosingModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Mulai Closing Harian</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ACTION 3: FITUR BARU - Form Pengeluaran untuk Hutang / Bon */}
        <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-black">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                Bon &amp; Hutang
              </span>
              {unpaidYesterdayDebts.length > 0 && (
                <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                  {unpaidYesterdayDebts.length} Tagihan
                </span>
              )}
            </div>

            <h2 className="text-base font-black text-slate-900">
              Catat Hutang / Kas Keluar
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Form cepat untuk mencatat pelanggan yang hutang minuman / pinjaman kas laci agar diingatkan untuk ditagih besok.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDebtRecordModalOpen(true)}
              className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Catat Hutang</span>
            </button>
            <button
              onClick={() => setDebtReminderModalOpen(true)}
              className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-700" />
              <span>Daftar ({customerDebtsList.filter(d => d.status === 'Belum Lunas').length})</span>
            </button>
          </div>
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

      {/* Form Catat Hutang / Kas Keluar Hutang Baru */}
      <DebtRecordModal
        isOpen={debtRecordModalOpen}
        onClose={() => setDebtRecordModalOpen(false)}
        recordedBy={currentUser.nama}
        isOwner={isOwner}
        onSubmit={(data) => {
          if (onAddCustomerDebt) {
            onAddCustomerDebt(data);
          }
        }}
      />

      {/* Pengingat Penagihan Hutang Kemarin / Hari Sebelumnya */}
      <DebtCollectionReminderModal
        isOpen={debtReminderModalOpen}
        onClose={() => setDebtReminderModalOpen(false)}
        unpaidDebts={customerDebtsList.filter(d => d.status === 'Belum Lunas')}
        onSettleDebt={(debtId) => {
          if (onSettleDebt) {
            onSettleDebt(debtId);
          }
        }}
      />
    </div>
  );
};
