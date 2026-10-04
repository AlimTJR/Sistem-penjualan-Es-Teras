import React, { useState } from 'react';
import {
  X, Calendar, CheckCircle2, AlertTriangle, PlusCircle,
  Clock, Check, UserCheck
} from 'lucide-react';
import { Absensi, User } from '../../types';
import { formatIndonesianDate, getTodayDateStr } from '../../utils/formatters';

interface AttendanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  absensiList: Absensi[];
  onAddIzin: (tanggal: string, keterangan: string) => void;
}

export const AttendanceDrawer: React.FC<AttendanceDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  absensiList,
  onAddIzin,
}) => {
  const [showIzinForm, setShowIzinForm] = useState(false);
  const [izinDate, setIzinDate] = useState(getTodayDateStr());
  const [keterangan, setKeterangan] = useState('');

  if (!isOpen) return null;

  // Filter records for this user
  const userAbsensi = absensiList
    .filter(a => a.userId === currentUser.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const totalHadir = userAbsensi.filter(a => a.statusHadir === 'Hadir').length;
  const totalIzin = userAbsensi.filter(a => a.statusHadir === 'Izin').length;

  const handleSubmitIzin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan alasan izin / tidak masuk.');
      return;
    }
    onAddIzin(izinDate, keterangan);
    setKeterangan('');
    setShowIzinForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-800 text-emerald-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Riwayat Absensi &amp; Izin</h2>
              <p className="text-xs text-emerald-300">
                {currentUser.nama} • {totalHadir} Hari Kerja Tercatat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Pill */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Hadir (Closing)</div>
              <div className="text-lg font-bold text-emerald-900">{totalHadir} Hari</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Izin / Sakit</div>
              <div className="text-lg font-bold text-amber-900">{totalIzin} Hari</div>
            </div>
          </div>
        </div>

        {/* Izin Form Accordion */}
        <div className="p-4 border-b border-slate-100">
          {!showIzinForm ? (
            <button
              onClick={() => setShowIzinForm(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Ajukan Surat Izin / Tidak Masuk Kerja
            </button>
          ) : (
            <form onSubmit={handleSubmitIzin} className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs space-y-3">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>Form Pengajuan Izin</span>
                <button
                  type="button"
                  onClick={() => setShowIzinForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tanggal Izin:</label>
                <input
                  type="date"
                  value={izinDate}
                  onChange={e => setIzinDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Keterangan / Alasan:</label>
                <textarea
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  placeholder="Contoh: Sakit demam, urusan keluarga mendadak..."
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-emerald-600"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowIzinForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Attendance List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Riwayat Kehadiran Bulan Ini
          </div>

          {userAbsensi.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Belum ada riwayat absensi tercatat.
            </div>
          ) : (
            userAbsensi.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.statusHadir === 'Hadir'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.statusHadir === 'Hadir' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {formatIndonesianDate(item.tanggal)}
                    </div>
                    {item.statusHadir === 'Hadir' && item.laporanKegiatan && (
                      <div className="text-[11px] text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{item.laporanKegiatan}"
                      </div>
                    )}
                    {item.statusHadir === 'Hadir' && !item.laporanKegiatan && item.closingIdRef && (
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <span>Closing #{item.closingIdRef}</span>
                      </div>
                    )}
                    {item.statusHadir === 'Izin' && item.keteranganIzin && (
                      <p className="text-[11px] text-amber-800 italic mt-0.5">
                        "{item.keteranganIzin}"
                      </p>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  item.statusHadir === 'Hadir'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.statusHadir}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-[11px] text-slate-500 text-center">
            * Absensi status <strong>Hadir</strong> tercatat secara otomatis saat Anda menyelesaikan formulir closing harian lapak.
          </p>
        </div>
      </div>
    </div>
  );
};
