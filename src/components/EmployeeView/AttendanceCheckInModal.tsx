import React, { useState } from 'react';
import {
  Calendar, CheckCircle2, Clock, X, FileText,
  Sparkles, Check, Coffee, UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Absensi } from '../../types';
import { formatIndonesianDate, getTodayDateStr } from '../../utils/formatters';

interface AttendanceCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  existingAbsensi?: Absensi;
  onSubmitAttendance: (tanggal: string, laporanKegiatan: string) => void;
}

export const AttendanceCheckInModal: React.FC<AttendanceCheckInModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  existingAbsensi,
  onSubmitAttendance,
}) => {
  const todayStr = getTodayDateStr();
  const [laporanKegiatan, setLaporanKegiatan] = useState(
    existingAbsensi?.laporanKegiatan || ''
  );

  if (!isOpen) return null;

  const quickPresets = [
    'Selesai membersihkan bagian depan teras dan membersihkan alat press cup.',
    'Menyiapkan racikan teh, es batu kristal, dan menata stok cup 16oz/22oz.',
    'Menjaga kasir shift siang, restock gula aren, dan sanitasi meja saji.',
    'Membersihkan mesin cup sealer, membersihkan lapak, dan operasional closing.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laporanKegiatan.trim()) {
      alert('Mohon tuliskan laporan kegiatan harian Anda sebelum absen.');
      return;
    }

    onSubmitAttendance(todayStr, laporanKegiatan.trim());

    // Celebrate attendance
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#f59e0b'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-emerald-950 font-bold">
              <UserCheck className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Form Absensi &amp; Laporan Harian</h2>
              <p className="text-xs text-emerald-200">
                Pencatatan Kehadiran Karyawan Kedai Teras
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
          {/* Active Day & Date Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Hari &amp; Tanggal Absensi:
            </span>
            <div className="flex items-center justify-between">
              <div className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>{formatIndonesianDate(todayStr, true)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-800 font-semibold bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shift Hari Ini</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 pt-1">
              Petugas: <strong>{currentUser.nama}</strong> ({currentUser.jabatan || 'Barista'}) • Tarif Harian: <strong>Rp 50.000 / Hadir</strong>
            </div>
          </div>

          {/* Rule Information Banner */}
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-[11px] text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Hak Bonus Penjualan Cup Hari Ini</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Dengan mencatat kehadiran <strong>Hadir</strong> hari ini, Anda berhak mendapatkan bonus insentif dari seluruh total cup yang terjual pada tanggal ini, terlepas dari siapa yang bertugas closing.
            </p>
          </div>

          {/* Laporan Harian Textarea */}
          <div className="space-y-1.5">
            <label className="block text-slate-800 font-bold text-xs">
              Laporan Kegiatan Harian:
            </label>
            <p className="text-[11px] text-slate-500">
              Tuliskan deskripsi pekerjaan atau aktivitas operasional yang Anda selesaikan hari ini.
            </p>
            <textarea
              required
              rows={4}
              value={laporanKegiatan}
              onChange={e => setLaporanKegiatan(e.target.value)}
              placeholder="Misalkan: Selesai membersihkan bagian depan teras dan membersihkan alat press cup, menyiapkan sedotan dan stok es batu..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium leading-relaxed"
            />
          </div>

          {/* Quick presets helper */}
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
              Pilihan Contoh Laporan Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLaporanKegiatan(preset)}
                  className="text-[10px] text-left px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 transition"
                >
                  + {preset.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Tutup
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                {existingAbsensi ? 'Perbarui Laporan & Konfirmasi Hadir' : 'Kirim Laporan & Absen Hadir'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
