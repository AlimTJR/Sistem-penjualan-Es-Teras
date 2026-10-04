import React, { useState } from 'react';
import {
  FileText, Calculator, Printer, CheckCircle2, DollarSign,
  Download, ArrowDownRight, Award, UserCheck, X
} from 'lucide-react';
import { Payroll, User, Closing, Kasbon, Absensi } from '../../types';
import {
  formatRupiah, formatNumber, formatIndonesianDate,
  getTodayDateStr, getMonthYearStr
} from '../../utils/formatters';

interface PayrollManagementProps {
  payrollList: Payroll[];
  users: User[];
  closings: Closing[];
  kasbonList: Kasbon[];
  absensiList: Absensi[];
  onGenerateMonthlyPayroll: (monthYear: string) => void;
  onUpdatePayrollStatus: (payrollId: string, status: Payroll['status']) => void;
}

export const PayrollManagement: React.FC<PayrollManagementProps> = ({
  payrollList,
  users,
  closings,
  kasbonList,
  absensiList,
  onGenerateMonthlyPayroll,
  onUpdatePayrollStatus,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null);

  const months = ['2026-10', '2026-09', '2026-08'];

  const filteredPayroll = payrollList.filter(p => p.bulanTahun === selectedMonth);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Standardisasi Gaji &amp; Auto-Deduction
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Rekapitulasi Payroll &amp; Slip Gaji Karyawan
          </h2>
          <p className="text-xs text-slate-500">
            Rumus Resmi: <code>GajiBersih = (GajiPokok + TotalBonusCup) - TotalKasbon</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-xs"
          >
            {months.map(m => (
              <option key={m} value={m}>Bulan: {m}</option>
            ))}
          </select>

          <button
            onClick={() => onGenerateMonthlyPayroll(selectedMonth)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Calculator className="w-4 h-4" />
            <span>Generate Payroll Bulan Ini</span>
          </button>
        </div>
      </div>

      {/* Formula Explanation Banner */}
      <div className="bg-emerald-950 text-white p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400 text-emerald-950 font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Formula Standar Gaji Harian Kedai Teras</div>
            <div className="text-emerald-300 text-[11px] mt-0.5 font-mono">
              TakeHomePay = (HariKerjaHadir × TarifHarian[Rp 50.000] + TotalBonusCup) - TotalKasbon
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] text-emerald-200">
          Tarif harian Rp 50.000 / hari kerja hadir + bonus per cup closing.
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Nama Karyawan</th>
                <th className="px-5 py-3 text-center">Hari Kerja</th>
                <th className="px-5 py-3 text-right">Tarif Harian</th>
                <th className="px-5 py-3 text-right">Gaji Pokok Harian</th>
                <th className="px-5 py-3 text-right">Bonus Cup</th>
                <th className="px-5 py-3 text-right">Potongan Kasbon</th>
                <th className="px-5 py-3 text-right">Gaji Bersih (THP)</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Belum ada rekapan gaji di-generate untuk periode {selectedMonth}.
                    <br />
                    <button
                      onClick={() => onGenerateMonthlyPayroll(selectedMonth)}
                      className="mt-2 text-emerald-600 font-bold underline hover:text-emerald-700"
                    >
                      Klik di sini untuk kalkulasi otomatis sekarang
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPayroll.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      <div>{p.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {p.userId}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                      {p.totalHariKerja} Hari
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                      {formatRupiah(p.tarifHarian || 50000)}/hr
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                      {formatRupiah(p.gajiPokok)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                      <div>+{formatRupiah(p.totalBonus)}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatNumber(p.totalCup)} cup @ {formatRupiah(p.bonusPerCup)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-red-600">
                      -{formatRupiah(p.totalKasbon)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm">
                      {formatRupiah(p.gajiBersih)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        p.status === 'Dibayar'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSlip(p)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                      >
                        Slip Gaji
                      </button>
                      {p.status === 'Draft' && (
                        <button
                          onClick={() => onUpdatePayrollStatus(p.id, 'Dibayar')}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Gaji Digital Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between print:hidden">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Slip Gaji Karyawan Kedai Teras
              </h3>
              <button
                onClick={() => setSelectedSlip(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Paper */}
            <div className="p-6 space-y-5 bg-white print:p-8">
              {/* Slip Header */}
              <div className="text-center pb-4 border-b-2 border-emerald-900">
                <h2 className="text-lg font-black text-emerald-950 tracking-wider">
                  KEDAI TERAS STREET BEVERAGE
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  SLIP GAJI &amp; INSENTIF PENJUALAN BULANAN
                </p>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Periode: {selectedSlip.bulanTahun} • No. Ref: {selectedSlip.id}
                </div>
              </div>

              {/* Employee info */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Nama Karyawan:</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedSlip.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Kehadiran (Hadir):</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedSlip.totalHariKerja} Hari Kerja</span>
                </div>
              </div>

              {/* Details table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-100">
                  Rincian Penerimaan (Pemasukan)
                </div>

                <div className="flex justify-between text-slate-700">
                  <div>
                    <span>1. Gaji Pokok Harian</span>
                    <span className="text-[10px] text-slate-400 block">
                      {selectedSlip.totalHariKerja} Hari Kerja × {formatRupiah(selectedSlip.tarifHarian || 50000)} / hari
                    </span>
                  </div>
                  <span className="font-bold">{formatRupiah(selectedSlip.gajiPokok)}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <div>
                    <span>2. Bonus Penjualan Cup ({formatNumber(selectedSlip.totalCup)} cup)</span>
                    <span className="text-[10px] text-slate-400 block">
                      @{formatRupiah(selectedSlip.bonusPerCup)} / cup terjual
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700">+{formatRupiah(selectedSlip.totalBonus)}</span>
                </div>

                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider pt-3 pb-1 border-b border-slate-100">
                  Rincian Pemotongan (Deduction)
                </div>

                <div className="flex justify-between text-red-700">
                  <span>1. Pelunasan Kasbon Karyawan</span>
                  <span className="font-bold">-{formatRupiah(selectedSlip.totalKasbon)}</span>
                </div>
              </div>

              {/* Grand Total Take Home Pay */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Gaji Bersih Diterima (Take-Home Pay):
                  </span>
                  <div className="text-xl font-black text-emerald-950 mt-0.5">
                    {formatRupiah(selectedSlip.gajiBersih)}
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white">
                  {selectedSlip.status}
                </span>
              </div>

              {/* Signature / Validation */}
              <div className="grid grid-cols-2 pt-6 text-center text-[10px] text-slate-500">
                <div>
                  <p>Diterima Oleh,</p>
                  <div className="h-12" />
                  <p className="font-bold text-slate-800 underline">{selectedSlip.userName}</p>
                </div>
                <div>
                  <p>Disetujui Oleh,</p>
                  <div className="h-12" />
                  <p className="font-bold text-slate-800 underline">Hendra Wijaya (Owner)</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between print:hidden">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintSlip}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
