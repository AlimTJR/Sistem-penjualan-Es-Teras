import React, { useState, useMemo } from 'react';
import {
  Calendar, DollarSign, Landmark, Wallet, CheckCircle2,
  AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw,
  FileSpreadsheet, Printer, Lock, Unlock, ArrowRightLeft,
  Search, Filter, ChevronDown, Sparkles, Building, ShoppingCart,
  Store, Check, X, Info, Zap, Droplets, Wifi, Home, Receipt, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Closing, MonthlyClosingReport, CashTransaction, User,
  PaymentChannel, CashTransactionCategory, Payroll
} from '../../types';
import {
  formatRupiah, formatNumber, formatIndonesianDate,
  getIndonesianMonthName
} from '../../utils/formatters';

interface MonthlyReportAndCashReconciliationProps {
  closings: Closing[];
  cashTransactions: CashTransaction[];
  monthlyReports: MonthlyClosingReport[];
  payroll: Payroll[];
  users: User[];
  onSaveMonthlyReport: (report: MonthlyClosingReport) => void;
  onAddCashTransaction: (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
}

export const MonthlyReportAndCashReconciliation: React.FC<MonthlyReportAndCashReconciliationProps> = ({
  closings,
  cashTransactions,
  monthlyReports,
  payroll,
  users,
  onSaveMonthlyReport,
  onAddCashTransaction,
}) => {
  // Available months derived from closings and cash transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    closings.forEach(c => monthsSet.add(c.tanggal.slice(0, 7)));
    cashTransactions.forEach(t => monthsSet.add(t.tanggal.slice(0, 7)));
    monthlyReports.forEach(r => monthsSet.add(r.bulanTahun));

    // Ensure current month is present
    monthsSet.add('2026-09');
    monthsSet.add('2026-10');

    return Array.from(monthsSet).sort().reverse();
  }, [closings, cashTransactions, monthlyReports]);

  // Selected Month (default to October 2026 or latest)
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '2026-10');

  // Filter for transactions table
  const [filterAccount, setFilterAccount] = useState<'all' | 'Tunai' | 'Bank'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Non-material operational expense modal state
  const [expenseForm, setExpenseForm] = useState({
    tanggal: `${selectedMonth}-05`,
    subKategori: 'Token Listrik (PLN)',
    nominal: 50000,
    metode: 'Bank' as PaymentChannel,
    keterangan: '',
  });

  // Deposit Form State (Setor Tunai ke Bank)
  const [depositForm, setDepositForm] = useState({
    tanggal: `${selectedMonth}-03`,
    nominal: 5000000,
    bankTujuan: 'Bank BCA Operasional (No. Rek 123-456-7890)',
    keterangan: 'Setoran tunai omzet lapak ke rekening bank',
  });

  // Current Month's Report Record
  const currentReport = useMemo(() => {
    const existing = monthlyReports.find(r => r.bulanTahun === selectedMonth);
    if (existing) return existing;

    // Default template if report has not been initiated yet
    return {
      id: `MCR-${selectedMonth}`,
      bulanTahun: selectedMonth,
      status: 'Open' as const,
      saldoAwalTunai: 2450000,
      saldoAwalBank: 18250000,
      saldoFisikTunai: 0,
      saldoNyataBank: 0,
      selisihTunai: 0,
      selisihBank: 0,
      statusRekonsiliasi: 'Belum Dicek' as const,
      catatanRekonsiliasi: '',
    };
  }, [monthlyReports, selectedMonth]);

  // Filter closings for selected month
  const monthClosings = useMemo(() => {
    return closings.filter(c => c.tanggal.startsWith(selectedMonth));
  }, [closings, selectedMonth]);

  // Filter cash transactions for selected month
  const monthTransactions = useMemo(() => {
    return cashTransactions
      .filter(t => t.tanggal.startsWith(selectedMonth))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [cashTransactions, selectedMonth]);

  // Reconcile Form State
  const [reconcileForm, setReconcileForm] = useState({
    saldoFisikTunai: currentReport.saldoFisikTunai || 0,
    saldoNyataBank: currentReport.saldoNyataBank || 0,
    catatan: currentReport.catatanRekonsiliasi || '',
  });

  // Calculations for Selected Month:
  // 1. Total Penjualan Lapak (Omzet Kas Tunai dari Closing)
  const totalOmzetLapak = monthClosings.reduce((sum, c) => sum + c.totalPenjualan, 0);

  // 2. Total Pengeluaran Cash Lapak Harian (Belanja Langsung Offline Kasir)
  const totalPengeluaranLapakCash = monthClosings.reduce((sum, c) => sum + c.totalPengeluaran, 0);

  // 3. Total Kas Masuk Lain di Lapak (Bayar Hutang dsb)
  const totalKasMasukLain = monthClosings.reduce((sum, c) => sum + c.totalPembayaranHutang, 0);

  // 4. Kas Masuk / Keluar dari Cash Transactions Table
  const extraTransactions = useMemo(() => {
    let depositToBank = 0;
    let marketplaceBank = 0;
    let belanjaLangsungTunai = 0;
    let operasionalUtilitasTunai = 0;
    let operasionalUtilitasBank = 0;
    let gajiKaryawan = 0;
    let kasMasukLainBank = 0;
    let kasMasukLainTunai = 0;

    monthTransactions.forEach(t => {
      if (t.kategori === 'Setor Bank') {
        depositToBank += t.nominal;
      } else if (t.kategori === 'Beli Marketplace' && t.metode === 'Bank') {
        marketplaceBank += t.nominal;
      } else if (t.kategori === 'Belanja Langsung' && t.metode === 'Tunai') {
        belanjaLangsungTunai += t.nominal;
      } else if (t.kategori === 'Operasional & Utilitas') {
        if (t.metode === 'Tunai') {
          operasionalUtilitasTunai += t.nominal;
        } else {
          operasionalUtilitasBank += t.nominal;
        }
      } else if (t.kategori === 'Gaji Karyawan') {
        gajiKaryawan += t.nominal;
      } else if (t.tipe === 'Masuk' && t.kategori !== 'Saldo Awal') {
        if (t.metode === 'Bank') {
          kasMasukLainBank += t.nominal;
        } else {
          kasMasukLainTunai += t.nominal;
        }
      } else if (t.tipe === 'Keluar') {
        if (t.metode === 'Tunai') {
          operasionalUtilitasTunai += t.nominal;
        } else {
          operasionalUtilitasBank += t.nominal;
        }
      }
    });

    return {
      depositToBank,
      marketplaceBank,
      belanjaLangsungTunai,
      operasionalUtilitasTunai,
      operasionalUtilitasBank,
      totalOperasionalUtilitas: operasionalUtilitasTunai + operasionalUtilitasBank,
      gajiKaryawan,
      kasMasukLainBank,
      kasMasukLainTunai,
    };
  }, [monthTransactions]);

  // 5. Total HPP
  const totalHpp = useMemo(() => {
    let sum = 0;
    monthClosings.forEach(c => {
      c.menuDetails.forEach(m => {
        sum += (m.hpp || 0) * m.qty;
      });
    });
    return sum;
  }, [monthClosings]);

  // 6. Running Book Balances (Saldo Akhir Buku Sistem)
  // Kas Tunai: Saldo Awal + Omzet + Kas In Lapak + Kas Masuk Lain Tunai - Pengeluaran Lapak Cash - Belanja Langsung Offline - Beban Utilitas Tunai - Setor ke Bank
  const totalPemasukanTunaiBuku = totalOmzetLapak + totalKasMasukLain + extraTransactions.kasMasukLainTunai;
  const totalPengeluaranTunaiBuku = totalPengeluaranLapakCash + extraTransactions.belanjaLangsungTunai + extraTransactions.operasionalUtilitasTunai + extraTransactions.depositToBank;
  const saldoAkhirBukuTunai = currentReport.saldoAwalTunai + totalPemasukanTunaiBuku - totalPengeluaranTunaiBuku;

  // Kas Bank: Saldo Awal + Setoran Tunai dari Lapak + Kas Masuk Lain Bank - Pembelian Marketplace - Beban Utilitas Bank - Gaji Karyawan
  const totalPemasukanBankBuku = extraTransactions.depositToBank + extraTransactions.kasMasukLainBank;
  const totalPengeluaranBankBuku = extraTransactions.marketplaceBank + extraTransactions.operasionalUtilitasBank + extraTransactions.gajiKaryawan;
  const saldoAkhirBukuBank = currentReport.saldoAwalBank + totalPemasukanBankBuku - totalPengeluaranBankBuku;

  // Total Kas Bersih Buku
  const totalSaldoBuku = saldoAkhirBukuTunai + saldoAkhirBukuBank;

  // Variances (Selisih)
  const selisihTunai = currentReport.saldoFisikTunai > 0
    ? currentReport.saldoFisikTunai - saldoAkhirBukuTunai
    : 0;

  const selisihBank = currentReport.saldoNyataBank > 0
    ? currentReport.saldoNyataBank - saldoAkhirBukuBank
    : 0;

  const isReconciled = currentReport.statusRekonsiliasi === 'Sesuai' || (selisihTunai === 0 && selisihBank === 0 && currentReport.saldoFisikTunai > 0);

  // Month Display Name
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = getIndonesianMonthName(parseInt(monthStr, 10));

  // Handle Submit Setor Tunai ke Bank
  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositForm.nominal <= 0) return;

    // Record Setor Bank transaction
    onAddCashTransaction({
      tanggal: depositForm.tanggal,
      kategori: 'Setor Bank',
      tipe: 'Transfer',
      metode: 'Tunai',
      nominal: depositForm.nominal,
      keterangan: `Setor Kas Tunai ke ${depositForm.bankTujuan} (${depositForm.keterangan})`,
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });

    setShowDepositModal(false);
  };

  // Handle Submit Pengeluaran Utilitas & Operasional (Listrik, Air, WiFi, dll.)
  const handleConfirmExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.nominal <= 0) return;

    onAddCashTransaction({
      tanggal: expenseForm.tanggal,
      kategori: 'Operasional & Utilitas',
      tipe: 'Keluar',
      metode: expenseForm.metode,
      nominal: expenseForm.nominal,
      keterangan: `${expenseForm.subKategori}: ${expenseForm.keterangan ? expenseForm.keterangan : 'Beban Operasional Non-Bahan Lapak'}`,
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });

    setShowExpenseModal(false);
  };

  // Handle Save Reconciliation & Tutup Buku
  const handleSaveReconciliation = (newStatus?: 'Open' | 'Closed') => {
    const updatedSelisihTunai = reconcileForm.saldoFisikTunai - saldoAkhirBukuTunai;
    const updatedSelisihBank = reconcileForm.saldoNyataBank - saldoAkhirBukuBank;
    const isMatch = updatedSelisihTunai === 0 && updatedSelisihBank === 0;

    const updated: MonthlyClosingReport = {
      ...currentReport,
      saldoFisikTunai: reconcileForm.saldoFisikTunai,
      saldoNyataBank: reconcileForm.saldoNyataBank,
      selisihTunai: updatedSelisihTunai,
      selisihBank: updatedSelisihBank,
      statusRekonsiliasi: isMatch ? 'Sesuai' : 'Selisih',
      status: newStatus || currentReport.status,
      tanggalTutup: newStatus === 'Closed' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : currentReport.tanggalTutup,
      ditutupOleh: newStatus === 'Closed' ? 'Owner Kedai Teras' : currentReport.ditutupOleh,
      catatanRekonsiliasi: reconcileForm.catatan,
    };

    onSaveMonthlyReport(updated);

    if (isMatch || newStatus === 'Closed') {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
      });
    }

    setShowReconcileModal(false);
  };

  // Filtered transactions for the table
  const filteredTransactions = monthTransactions.filter(t => {
    const matchesAccount = filterAccount === 'all' || t.metode === filterAccount;
    const matchesSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.kategori.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAccount && matchesSearch;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Tanggal', 'Kategori', 'Akun Kas', 'Tipe', 'Nominal', 'Keterangan'];
    const rows = monthTransactions.map(t => [
      t.id,
      t.tanggal,
      t.kategori,
      t.metode === 'Tunai' ? 'Kas Tunai (Lapak)' : 'Kas Bank',
      t.tipe,
      t.nominal,
      `"${t.keterangan.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Kas_${selectedMonth}_Kedai_Teras.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser print
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Monthly Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <Landmark className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Laporan Bulanan &amp; Rekonsiliasi Kas
                </h2>
                {currentReport.status === 'Closed' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    Tutup Buku Selesai
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    <Unlock className="w-3 h-3 text-amber-700" />
                    Buku Berjalan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan kas ganda (*Kas Tunai Lapak* &amp; *Kas Bank Marketplace*) serta audit rekonsiliasi tutup buku bulanan.
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Picker Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
                const r = monthlyReports.find(rep => rep.bulanTahun === e.target.value);
                if (r) {
                  setReconcileForm({
                    saldoFisikTunai: r.saldoFisikTunai,
                    saldoNyataBank: r.saldoNyataBank,
                    catatan: r.catatanRekonsiliasi || '',
                  });
                }
              }}
              className="bg-slate-100 border border-slate-300 font-extrabold text-xs text-slate-800 px-3.5 py-2.5 rounded-2xl focus:outline-emerald-600 cursor-pointer pr-8"
            >
              {availableMonths.map(m => {
                const [y, mon] = m.split('-');
                const name = getIndonesianMonthName(parseInt(mon, 10));
                const rep = monthlyReports.find(r => r.bulanTahun === m);
                const isClosed = rep?.status === 'Closed';
                return (
                  <option key={m} value={m}>
                    {name} {y} {isClosed ? '(Closed ✓)' : '(Open)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Catat Beban Operasional / Utilitas Non-Bahan Button */}
          <button
            type="button"
            onClick={() => {
              setExpenseForm(prev => ({
                ...prev,
                tanggal: `${selectedMonth}-05`,
              }));
              setShowExpenseModal(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
            <span>+ Catat Listrik/Air/Utilitas</span>
          </button>

          {/* Setor Tunai Button */}
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Setor Tunai ke Bank</span>
          </button>

          {/* Cek Rekonsiliasi & Tutup Buku Button */}
          <button
            type="button"
            onClick={() => setShowReconcileModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Cek Rekonsiliasi Kas</span>
          </button>

          {/* Export / Print */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportCsv}
              title="Ekspor Format Excel / CSV"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            </button>
            <button
              type="button"
              onClick={handlePrintReport}
              title="Cetak Laporan Bulanan"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual-Account Cash Position & Audit Grid (Tunai vs Bank) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account 1: KAS TUNAI (Laci Lapak / Uang Fisik) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Kas Tunai (Laci Lapak)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Uang Fisik Kasir &amp; Pembelanjaan Langsung
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Offline Cash
              </span>
            </div>

            {/* Breakdown */}
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Saldo Awal Bulan:</span>
                <span className="font-bold text-slate-700">{formatRupiah(currentReport.saldoAwalTunai)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Omzet Penjualan (In):</span>
                <span className="font-bold text-emerald-600">+{formatRupiah(totalPemasukanTunaiBuku)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Beban Langsung Lapak (Out):</span>
                <span className="font-bold text-red-500">-{formatRupiah(totalPengeluaranLapakCash + extraTransactions.belanjaLangsungTunai)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Utilitas Non-Bahan (Tunai):</span>
                <span className="font-bold text-amber-700">-{formatRupiah(extraTransactions.operasionalUtilitasTunai)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Disetor ke Bank (Transfer):</span>
                <span className="font-bold text-blue-600">-{formatRupiah(extraTransactions.depositToBank)}</span>
              </div>

              {/* Saldo Akhir Sistem (Buku) */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Akhir Buku
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {formatRupiah(saldoAkhirBukuTunai)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Fisik di Laci</span>
                  <span className="text-sm font-bold text-slate-700">
                    {currentReport.saldoFisikTunai > 0 ? formatRupiah(currentReport.saldoFisikTunai) : 'Belum dihitung'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Result Pill */}
          <div className={`mt-4 p-3 rounded-2xl border text-xs flex items-center justify-between ${
            currentReport.saldoFisikTunai === 0
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : selisihTunai === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : selisihTunai > 0
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <span className="font-bold flex items-center gap-1.5">
              {currentReport.saldoFisikTunai === 0 ? (
                <Info className="w-4 h-4 text-slate-400" />
              ) : selisihTunai === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              {currentReport.saldoFisikTunai === 0
                ? 'Belum Cek Fisik'
                : selisihTunai === 0
                ? 'Kas Fisik Sesuai (Klop)'
                : selisihTunai > 0
                ? `Selisih Lebih: +${formatRupiah(selisihTunai)}`
                : `Selisih Kurang: ${formatRupiah(selisihTunai)}`}
            </span>

            <button
              type="button"
              onClick={() => setShowReconcileModal(true)}
              className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer"
            >
              Input Opname
            </button>
          </div>
        </div>

        {/* Account 2: KAS BANK (Rekening Operasional / Marketplace) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none -z-0" />

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Kas Bank (Rekening)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    BCA Operasional &amp; Pembelian Marketplace
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Online / Bank
              </span>
            </div>

            {/* Breakdown */}
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Saldo Awal Bulan:</span>
                <span className="font-bold text-slate-700">{formatRupiah(currentReport.saldoAwalBank)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Setoran Masuk dari Lapak (In):</span>
                <span className="font-bold text-emerald-600">+{formatRupiah(extraTransactions.depositToBank)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Beli Bahan Marketplace (Out):</span>
                <span className="font-bold text-red-500">-{formatRupiah(extraTransactions.marketplaceBank)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Utilitas Non-Bahan (Bank):</span>
                <span className="font-bold text-amber-700">-{formatRupiah(extraTransactions.operasionalUtilitasBank)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Transfer Gaji Karyawan (Out):</span>
                <span className="font-bold text-red-500">-{formatRupiah(extraTransactions.gajiKaryawan)}</span>
              </div>

              {/* Saldo Akhir Sistem (Buku) */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Akhir Buku Bank
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {formatRupiah(saldoAkhirBukuBank)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Saldo m-Banking</span>
                  <span className="text-sm font-bold text-slate-700">
                    {currentReport.saldoNyataBank > 0 ? formatRupiah(currentReport.saldoNyataBank) : 'Belum dicek'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Result Pill */}
          <div className={`mt-4 p-3 rounded-2xl border text-xs flex items-center justify-between ${
            currentReport.saldoNyataBank === 0
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : selisihBank === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : selisihBank > 0
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <span className="font-bold flex items-center gap-1.5">
              {currentReport.saldoNyataBank === 0 ? (
                <Info className="w-4 h-4 text-slate-400" />
              ) : selisihBank === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              {currentReport.saldoNyataBank === 0
                ? 'Belum Cek Bank'
                : selisihBank === 0
                ? 'Saldo Rekening Sesuai'
                : selisihBank > 0
                ? `Selisih Lebih: +${formatRupiah(selisihBank)}`
                : `Selisih Kurang: ${formatRupiah(selisihBank)}`}
            </span>

            <button
              type="button"
              onClick={() => setShowReconcileModal(true)}
              className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer"
            >
              Input Mutasi
            </button>
          </div>
        </div>

        {/* Account 3: TOTAL KAS LIKUID & RINGKASAN LABA RUGI */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Total Posisi Kas Bersih
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200">
                {monthName} {yearStr}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-300">
                {formatRupiah(totalSaldoBuku)}
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Gabungan Kas Tunai Laci ({formatRupiah(saldoAkhirBukuTunai)}) + Saldo Bank ({formatRupiah(saldoAkhirBukuBank)})
              </p>
            </div>

            {/* Quick Profit & Loss Snippet */}
            <div className="mt-4 pt-3 border-t border-emerald-800/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-emerald-200">
                <span>Omzet Penjualan Lapak:</span>
                <span className="font-bold text-white">{formatRupiah(totalOmzetLapak)}</span>
              </div>
              <div className="flex justify-between text-emerald-200">
                <span>Estimasi HPP Terpakai:</span>
                <span className="font-bold text-amber-300">-{formatRupiah(totalHpp)}</span>
              </div>
              <div className="flex justify-between text-emerald-200">
                <span>Belanja Bahan Lapak &amp; Online:</span>
                <span className="font-bold text-red-300">-{formatRupiah(totalPengeluaranLapakCash + extraTransactions.belanjaLangsungTunai + extraTransactions.marketplaceBank)}</span>
              </div>
              <div className="flex justify-between text-emerald-200">
                <span>Beban Utilitas &amp; Non-Bahan:</span>
                <span className="font-bold text-amber-300">-{formatRupiah(extraTransactions.totalOperasionalUtilitas)}</span>
              </div>
              <div className="flex justify-between text-emerald-200">
                <span>Gaji &amp; Bonus Karyawan:</span>
                <span className="font-bold text-red-300">-{formatRupiah(extraTransactions.gajiKaryawan)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-emerald-800 font-extrabold text-sm text-white">
                <span>Laba Operasional Bersih:</span>
                <span className="text-emerald-400">
                  {formatRupiah(totalOmzetLapak - totalHpp - (totalPengeluaranLapakCash + extraTransactions.belanjaLangsungTunai + extraTransactions.marketplaceBank + extraTransactions.totalOperasionalUtilitas + extraTransactions.gajiKaryawan))}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-800/60 flex items-center justify-between">
            <span className="text-[11px] text-emerald-200">
              Status Tutup Buku:
            </span>
            {currentReport.status === 'Closed' ? (
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Terkunci ({currentReport.tanggalTutup?.slice(0, 10)})
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowReconcileModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Tutup Buku Sekarang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Laporan Laba Rugi Format Excel / UMKM */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              Rekap Laba Rugi &amp; Arus Kas Bulanan ({monthName} {yearStr})
            </h3>
            <p className="text-xs text-slate-500">
              Ringkasan kinerja keuangan toko sesuai format pembukuan bulanan UMKM.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Hari Kerja Tercatat:</span>
            <span className="text-sm font-extrabold text-slate-800 ml-1.5">
              {monthClosings.length} Hari Operasional
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Pendapatan & HPP */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600 block pb-1 border-b border-slate-200">
              1. Pendapatan &amp; Laba Kotor
            </span>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Penjualan Minuman ({monthClosings.reduce((s, c) => s + c.totalCup, 0)} Cup):</span>
              <span className="font-bold text-slate-900">{formatRupiah(totalOmzetLapak)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Harga Pokok Penjualan (HPP Racikan):</span>
              <span className="font-bold text-red-600">-{formatRupiah(totalHpp)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-emerald-800">
              <span>Laba Kotor (Gross Profit):</span>
              <span>{formatRupiah(totalOmzetLapak - totalHpp)}</span>
            </div>
          </div>

          {/* Beban Pengeluaran */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600 block pb-1 border-b border-slate-200">
              2. Beban Operasional &amp; Pembelian
            </span>
            <div className="flex justify-between">
              <span className="text-slate-600">Belanja Langsung Offline (Kas Tunai):</span>
              <span className="font-bold text-slate-800">{formatRupiah(totalPengeluaranLapakCash + extraTransactions.belanjaLangsungTunai)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Beli Bahan Marketplace (Kas Bank):</span>
              <span className="font-bold text-slate-800">{formatRupiah(extraTransactions.marketplaceBank)}</span>
            </div>
            <div className="flex justify-between bg-amber-50/80 p-1.5 rounded-xl border border-amber-200/70 -mx-1 text-amber-950">
              <span className="flex items-center gap-1 font-bold text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Utilitas Non-Bahan (Listrik, Air, WiFi, dll.):
              </span>
              <span className="font-black text-amber-900">{formatRupiah(extraTransactions.totalOperasionalUtilitas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Beban Gaji &amp; Bonus Karyawan:</span>
              <span className="font-bold text-slate-800">{formatRupiah(extraTransactions.gajiKaryawan)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
              <span>Total Beban Operasional:</span>
              <span className="text-red-700">
                {formatRupiah(totalPengeluaranLapakCash + extraTransactions.belanjaLangsungTunai + extraTransactions.marketplaceBank + extraTransactions.totalOperasionalUtilitas + extraTransactions.gajiKaryawan)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Excel-Style Cashbook Table (Format Buku Kas Bulanan) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-emerald-700" />
              Buku Mutasi Kas &amp; Bank Bulan {monthName} {yearStr}
            </h3>
            <p className="text-xs text-slate-500">
              Rincian seluruh arus kas masuk, pengeluaran langsung tunai, dan pembayaran belanja marketplace via bank.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi / ket..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl font-bold">
              <button
                type="button"
                onClick={() => setFilterAccount('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterAccount === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterAccount('Tunai')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterAccount === 'Tunai' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kas Tunai
              </button>
              <button
                type="button"
                onClick={() => setFilterAccount('Bank')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterAccount === 'Bank' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kas Bank
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori &amp; Keterangan</th>
                <th className="py-3 px-4">Akun Kas</th>
                <th className="py-3 px-4 text-center">Tipe</th>
                <th className="py-3 px-4 text-right">Kas Masuk (In)</th>
                <th className="py-3 px-4 text-right">Kas Keluar (Out)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi kas pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isIn = tx.tipe === 'Masuk';
                  const isTransfer = tx.tipe === 'Transfer';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {formatIndonesianDate(tx.tanggal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {tx.keterangan}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx.kategori} • Ref: {tx.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.metode === 'Tunai' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Wallet className="w-3 h-3 text-amber-700" />
                            Kas Tunai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            <Landmark className="w-3 h-3 text-blue-700" />
                            Kas Bank (BCA)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isTransfer ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                            Setor Bank
                          </span>
                        ) : isIn ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Masuk
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            Keluar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                        {isIn ? `+${formatRupiah(tx.nominal)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-red-600 whitespace-nowrap">
                        {!isIn ? `-${formatRupiah(tx.nominal)}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Setor Tunai ke Bank */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-700 text-white">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Setor Kas Tunai ke Bank</h3>
                  <p className="text-[11px] text-blue-200">
                    Memindahkan uang fisik kasir lapak ke rekening operasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="text-blue-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDeposit} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                <span className="font-bold block">Saldo Kas Tunai Saat Ini:</span>
                <span className="text-base font-black text-amber-950">
                  {formatRupiah(saldoAkhirBukuTunai)}
                </span>
                <span className="text-[10px] text-amber-800 block mt-0.5">
                  * Pastikan jumlah yang disetor tidak melebihi uang tunai fisik yang ada di laci.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tanggal Setor:</label>
                <input
                  type="date"
                  required
                  value={depositForm.tanggal}
                  onChange={e => setDepositForm(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nominal Setoran (Rp):</label>
                <input
                  type="number"
                  min="10000"
                  max={saldoAkhirBukuTunai > 0 ? saldoAkhirBukuTunai * 2 : 50000000}
                  required
                  value={depositForm.nominal}
                  onChange={e => setDepositForm(prev => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Rekening Bank Tujuan:</label>
                <input
                  type="text"
                  required
                  value={depositForm.bankTujuan}
                  onChange={e => setDepositForm(prev => ({ ...prev, bankTujuan: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Keterangan / Catatan:</label>
                <input
                  type="text"
                  value={depositForm.keterangan}
                  onChange={e => setDepositForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="e.g. Setor tunai omzet minggu 1 via CRM BCA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Konfirmasi Setor Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Cek Rekonsiliasi & Tutup Buku */}
      {showReconcileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-700 text-white">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Cek Rekonsiliasi Kas &amp; Tutup Buku ({monthName} {yearStr})
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Bandingkan saldo catatan buku sistem dengan uang nyata di laci dan rekening bank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReconcileModal(false)}
                className="text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Box 1: Cek Kas Tunai */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-amber-700" />
                    1. Rekonsiliasi Kas Tunai Lapak (Uang Fisik)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Buku: {formatRupiah(saldoAkhirBukuTunai)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Hitung Uang Fisik di Laci / Brankas (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reconcileForm.saldoFisikTunai}
                    onChange={e => setReconcileForm(prev => ({ ...prev, saldoFisikTunai: Number(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                {/* Diff Calculation */}
                {reconcileForm.saldoFisikTunai > 0 && (
                  <div className="text-[11px] flex justify-between font-bold">
                    <span>Hasil Selisih Fisik vs Buku:</span>
                    <span className={reconcileForm.saldoFisikTunai - saldoAkhirBukuTunai === 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {reconcileForm.saldoFisikTunai - saldoAkhirBukuTunai === 0
                        ? '✅ Sesuai (Rp 0)'
                        : reconcileForm.saldoFisikTunai - saldoAkhirBukuTunai > 0
                        ? `Selisih Lebih +${formatRupiah(reconcileForm.saldoFisikTunai - saldoAkhirBukuTunai)}`
                        : `Selisih Kurang ${formatRupiah(reconcileForm.saldoFisikTunai - saldoAkhirBukuTunai)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Box 2: Cek Kas Bank */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-blue-700" />
                    2. Rekonsiliasi Kas Bank (Rekening Koran / m-Banking)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Buku: {formatRupiah(saldoAkhirBukuBank)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Saldo Rekening Bank Tertera di m-Banking (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reconcileForm.saldoNyataBank}
                    onChange={e => setReconcileForm(prev => ({ ...prev, saldoNyataBank: Number(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                {/* Diff Calculation */}
                {reconcileForm.saldoNyataBank > 0 && (
                  <div className="text-[11px] flex justify-between font-bold">
                    <span>Hasil Selisih Mutasi Bank vs Buku:</span>
                    <span className={reconcileForm.saldoNyataBank - saldoAkhirBukuBank === 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {reconcileForm.saldoNyataBank - saldoAkhirBukuBank === 0
                        ? '✅ Sesuai (Rp 0)'
                        : reconcileForm.saldoNyataBank - saldoAkhirBukuBank > 0
                        ? `Selisih Lebih +${formatRupiah(reconcileForm.saldoNyataBank - saldoAkhirBukuBank)}`
                        : `Selisih Kurang ${formatRupiah(reconcileForm.saldoNyataBank - saldoAkhirBukuBank)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Catatan Berita Acara Rekonsiliasi Kas:
                </label>
                <textarea
                  rows={2}
                  value={reconcileForm.catatan}
                  onChange={e => setReconcileForm(prev => ({ ...prev, catatan: e.target.value }))}
                  placeholder="e.g. Kas fisik di laci dan rekening BCA sesuai, tidak ada selisih."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveReconciliation('Open')}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition"
                  >
                    Simpan Hasil Cek
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveReconciliation('Closed')}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Kunci &amp; Tutup Buku</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Catat Pengeluaran Utilitas & Non-Bahan Baku */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                  <Zap className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Catat Beban Utilitas &amp; Non-Bahan</h3>
                  <p className="text-[11px] text-amber-200">
                    Pengeluaran di luar bahan baku (Token Listrik, Air PDAM, WiFi, Retribusi, dsb.)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-amber-200 hover:text-white text-base font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmExpense} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Category Quick Chips */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Pilih Kategori Beban Non-Bahan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {[
                    { label: 'Token Listrik (PLN)', icon: '⚡' },
                    { label: 'Tagihan Air PDAM', icon: '💧' },
                    { label: 'Tagihan WiFi / Internet', icon: '📶' },
                    { label: 'Retribusi & Kebersihan', icon: '🧹' },
                    { label: 'Sewa Lahan / Lapak', icon: '🏪' },
                    { label: 'Servis & Perawatan Mesin', icon: '🔧' },
                    { label: 'Perlengkapan Lapak', icon: '📦' },
                    { label: 'Lainnya (Non-Bahan)', icon: '📝' },
                  ].map(cat => {
                    const isSelected = expenseForm.subKategori === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setExpenseForm(prev => ({ ...prev, subKategori: cat.label }))}
                        className={`p-2 rounded-xl border text-left text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={expenseForm.subKategori}
                  onChange={e => setExpenseForm(prev => ({ ...prev, subKategori: e.target.value }))}
                  placeholder="Ketik nama subkategori jika ingin kustom..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-emerald-600"
                />
              </div>

              {/* Tanggal & Akun Kas Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tanggal Transaksi:
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.tanggal}
                    onChange={e => setExpenseForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Metode / Akun Pembayaran:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpenseForm(prev => ({ ...prev, metode: 'Tunai' }))}
                      className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        expenseForm.metode === 'Tunai'
                          ? 'bg-amber-100 border-amber-400 text-amber-950 ring-1 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5 text-amber-700" />
                      <span>Kas Tunai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpenseForm(prev => ({ ...prev, metode: 'Bank' }))}
                      className={`py-2 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        expenseForm.metode === 'Bank'
                          ? 'bg-blue-100 border-blue-400 text-blue-950 ring-1 ring-blue-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5 text-blue-700" />
                      <span>Kas Bank</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Nominal & Quick Chips */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nominal Pembayaran (Rp):
                </label>
                <div className="relative mb-2">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={expenseForm.nominal}
                    onChange={e => setExpenseForm(prev => ({ ...prev, nominal: Number(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-sm font-black text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 py-0.5 font-semibold">Pilih Cepat:</span>
                  {[20000, 50000, 75000, 100000, 150000, 200000, 250000, 500000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setExpenseForm(prev => ({ ...prev, nominal: val }))}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 font-bold border border-slate-200 transition cursor-pointer"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Keterangan / Nomor Bukti / Catatan Tambahan:
                </label>
                <input
                  type="text"
                  value={expenseForm.keterangan}
                  onChange={e => setExpenseForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="e.g. Pembelian token listrik no meter 14234..., paket WiFi Indihome Okt 2026, iuran keamanan RT"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Simpan Beban Utilitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple BookOpenIcon wrapper
function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
