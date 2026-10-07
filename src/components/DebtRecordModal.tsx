import React, { useState } from 'react';
import {
  X, DollarSign, User, Calendar, BookOpen, AlertCircle,
  Check, Wallet
} from 'lucide-react';
import { formatRupiah, getTodayDateStr } from '../utils/formatters';

interface DebtRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordedBy: string;
  isOwner?: boolean;
  onSubmit: (data: {
    namaPelanggan: string;
    nominal: number;
    tanggal: string;
    catatan: string;
    potongKasLaci: boolean;
  }) => void;
}

export const DebtRecordModal: React.FC<DebtRecordModalProps> = ({
  isOpen,
  onClose,
  recordedBy,
  isOwner = false,
  onSubmit,
}) => {
  const todayStr = getTodayDateStr();
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [nominal, setNominal] = useState<number | ''>(15000);
  const [tanggal, setTanggal] = useState(todayStr);
  const [catatan, setCatatan] = useState('');
  const [potongKasLaci, setPotongKasLaci] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPelanggan.trim()) {
      alert('Mohon isi nama orang yang berhutang.');
      return;
    }
    const amount = Number(nominal) || 0;
    if (amount <= 0) {
      alert('Nominal hutang harus lebih dari Rp 0.');
      return;
    }

    onSubmit({
      namaPelanggan: namaPelanggan.trim(),
      nominal: amount,
      tanggal,
      catatan: catatan.trim(),
      potongKasLaci,
    });

    // Reset & close
    setNamaPelanggan('');
    setNominal(15000);
    setCatatan('');
    setPotongKasLaci(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/40 flex items-center justify-center text-white font-bold backdrop-blur-xs shadow-xs">
              <BookOpen className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full inline-block mb-0.5">
                Pencatatan Bon / Hutang
              </span>
              <h3 className="font-extrabold text-base leading-tight">
                Form Pengeluaran / Hutang
              </h3>
              <p className="text-[11px] text-amber-200">
                Pencatatan pelanggan berhutang atau kas keluar untuk pinjaman
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info Banner */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Pengingat Penagihan Otomatis</span>
            </div>
            <p className="text-amber-800">
              Data hutang yang dicatat di sini akan otomatis muncul sebagai <strong>pengingat penagihan</strong> di hari berikutnya saat karyawan login agar segera ditagih.
            </p>
          </div>

          {/* Nama Yang Hutang */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>Nama Yang Hutang (Pelanggan / Pihak Luar):</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mas Joko (Ojol), Pak RT Bambang, Bu Dewi..."
              value={namaPelanggan}
              onChange={e => setNamaPelanggan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-amber-600"
            />
          </div>

          {/* Jumlah Hutang */}
          <div>
            <label className="block text-slate-800 font-bold mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-700" />
              <span>Jumlah Hutang (Rp):</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2 text-slate-400 font-bold">Rp</span>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                placeholder="0"
                value={nominal}
                onChange={e => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-sm font-black text-slate-900 focus:outline-amber-600"
              />
            </div>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000, 15000, 20000, 25000, 50000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNominal(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                >
                  +{formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal & Dicatat Oleh */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tanggal Hutang:</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                disabled={!isOwner}
                className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                  isOwner
                    ? 'bg-white border-amber-300 text-slate-900 focus:outline-amber-600'
                    : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Dicatat Oleh:
              </label>
              <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 truncate">
                {recordedBy}
              </div>
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Rincian Minuman / Keterangan Hutang:
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: 2 cup Es Kopi Susu Aren, janji bayar besok siang saat narik orderan."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-amber-600"
            />
          </div>

          {/* Switch: Keluarkan Uang Kas Laci */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="potongKasLaci"
              checked={potongKasLaci}
              onChange={e => setPotongKasLaci(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="potongKasLaci" className="text-[11px] text-slate-700 cursor-pointer">
              <strong className="block text-slate-900">Uang Fisik Kas Laci Dikeluarkan (Pinjam Tunai)</strong>
              Centang jika uang tunai dari laci kasir benar-benar diambil dan diserahkan sebagai pinjaman. Jika hanya pesanan minuman belum bayar (bon), biarkan tidak dicentang.
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-slate-950 font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Simpan Catatan Hutang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
