import React, { useState } from 'react';
import {
  Calendar, CheckCircle2, AlertTriangle, UserCheck,
  Search, Filter, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { Absensi, User } from '../../types';
import {
  formatIndonesianDate, getMonthYearStr, getIndonesianDayName,
  isSunday, getTodayDateStr
} from '../../utils/formatters';

interface AttendanceRecapProps {
  absensiList: Absensi[];
  users: User[];
}

export const AttendanceRecap: React.FC<AttendanceRecapProps> = ({
  absensiList,
  users,
}) => {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('Semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  const employees = users.filter(u => u.role === 'karyawan');
  const employeeIds = new Set(employees.map(u => u.id));

  const filteredAbsensi = absensiList.filter(a => {
    // Owner attendance does not count
    if (!employeeIds.has(a.userId)) return false;
    const matchUser = selectedUserFilter === 'Semua' ? true : a.userId === selectedUserFilter;
    const matchMonth = a.tanggal.startsWith(selectedMonth);
    return matchUser && matchMonth;
  }).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  // Attendance stats for selected month
  const totalHadir = filteredAbsensi.filter(a => a.statusHadir === 'Hadir').length;
  const totalIzin = filteredAbsensi.filter(a => a.statusHadir === 'Izin').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Absensi &amp; Rekap Hari Kerja
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Rekap Kehadiran Seluruh Karyawan
          </h2>
          <p className="text-xs text-slate-500">
            Absensi status <strong>Hadir</strong> tercatat secara mandiri melalui tombol absensi &amp; formulir laporan kegiatan harian.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-xs"
          >
            <option value="2026-10">Oktober 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Kehadiran (Hadir)
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>{totalHadir} Hari Kerja</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Terverifikasi melalui absensi &amp; laporan harian
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Pengajuan Izin / Sakit
          </span>
          <div className="text-2xl font-black text-amber-600 mt-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>{totalIzin} Hari</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Dilengkapi surat / keterangan izin
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Karyawan Aktif Terdata
          </span>
          <div className="text-2xl font-black text-slate-800 mt-2 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <span>{employees.filter(e => e.status === 'aktif').length} Orang</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Siap rotasi shift closing harian
          </span>
        </div>
      </div>

      {/* Filter by Employee */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedUserFilter('Semua')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedUserFilter === 'Semua'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Karyawan
        </button>
        {employees.map(u => (
          <button
            key={u.id}
            onClick={() => setSelectedUserFilter(u.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedUserFilter === u.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {u.nama} {u.status === 'nonaktif' ? '(Resign)' : ''}
          </button>
        ))}
      </div>

      {/* Attendance Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Tanggal &amp; Hari</th>
                <th className="px-5 py-3">Nama Karyawan</th>
                <th className="px-5 py-3 text-center">Status Kehadiran</th>
                <th className="px-5 py-3">Laporan Kegiatan Harian / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAbsensi.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    Tidak ada catatan absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredAbsensi.map(a => {
                  const user = users.find(u => u.id === a.userId);
                  const isSun = isSunday(a.tanggal);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        <div>{formatIndonesianDate(a.tanggal, true)}</div>
                        {isSun && (
                          <span className="text-[10px] text-amber-600 font-normal">
                            (Hari Minggu - Jadwal Libur Lapak)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{user?.nama || a.userId}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{user?.jabatan || 'Barista'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          a.statusHadir === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {a.statusHadir}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {a.laporanKegiatan ? (
                          <div>
                            <span className="text-slate-800 font-medium">"{a.laporanKegiatan}"</span>
                            {a.timestamp && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Dicatat: {new Date(a.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </div>
                            )}
                          </div>
                        ) : a.keteranganIzin ? (
                          <span className="text-[11px] text-amber-900 italic">
                            "{a.keteranganIzin}"
                          </span>
                        ) : a.closingIdRef ? (
                          <span className="text-[11px] text-slate-500">
                            Closing #{a.closingIdRef}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
