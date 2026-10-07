import React from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Check, X,
  User, DollarSign, Calendar, Sparkles, ChevronRight, BellRing
} from 'lucide-react';
import { CustomerDebt } from '../types';
import { formatRupiah, formatIndonesianDate } from '../utils/formatters';

interface DebtCollectionReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  unpaidDebts: CustomerDebt[];
  onSettleDebt: (debtId: string) => void;
}

export const DebtCollectionReminderModal: React.FC<DebtCollectionReminderModalProps> = ({
  isOpen,
  onClose,
  unpaidDebts,
  onSettleDebt,
}) => {
  if (!isOpen || unpaidDebts.length === 0) return null;

  const totalNominal = unpaidDebts.reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold backdrop-blur-xs shadow-xs animate-bounce">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full mb-0.5">
                Peringatan Operasional Lapak
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Pengingat Penagihan Hutang Kemarin
              </h2>
              <p className="text-[11px] text-amber-100 mt-0.5">
                Ada pelanggan yang belum melunasi bon dari hari sebelumnya
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Summary Box */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-900 block">
                Total Hutang Belum Ditagih:
              </span>
              <span className="text-lg font-black text-amber-950">
                {formatRupiah(totalNominal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-full border border-amber-300">
                {unpaidDebts.length} Pelanggan Menunggak
              </span>
              <span className="text-[10px] text-amber-800 block mt-0.5 font-medium">
                Wajib ditagih hari ini
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Segera hubungi atau tagih saat pelanggan datang ke lapak. Tekan tombol <strong>"Pelanggan Sudah Bayar"</strong> begitu uang diterima agar uang langsung masuk ke pencatatan kas harian.
          </p>

          {/* List of Debts */}
          <div className="space-y-2.5">
            {unpaidDebts.map(debt => (
              <div
                key={debt.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                      {debt.namaPelanggan.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {debt.namaPelanggan}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatIndonesianDate(debt.tanggal, true)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-red-600 block">
                      {formatRupiah(debt.nominal)}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                      Belum Lunas
                    </span>
                  </div>
                </div>

                {debt.catatan && (
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] text-slate-700">
                    <span className="text-slate-400 font-bold block text-[10px]">Rincian Pesanan:</span>
                    <span>{debt.catatan}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Dicatat oleh: <strong>{debt.dicatatOleh || 'Kasir'}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => onSettleDebt(debt.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-[11px] shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pelanggan Sudah Bayar (Lunas)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[10px] text-slate-400 font-medium">
            * Pelunasan akan otomatis menambah penerimaan kas lapak
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Ingatkan Nanti
          </button>
        </div>
      </div>
    </div>
  );
};
