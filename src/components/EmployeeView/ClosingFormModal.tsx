import React, { useState } from 'react';
import {
  X, Check, AlertCircle, Plus, Trash2, Coffee,
  Sparkles, DollarSign, ArrowUpRight, ArrowDownRight,
  ClipboardList, Calendar, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Menu, Closing, ExpenseItem, CashInItem, User, OperationalExpenseMaster } from '../../types';
import { formatRupiah, formatNumber, formatIndonesianDate, getTodayDateStr } from '../../utils/formatters';

interface ClosingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  menus: Menu[];
  expenseMaster: OperationalExpenseMaster[];
  onSubmitClosing: (closingData: Omit<Closing, 'id' | 'createdAt'>) => void;
}

export const ClosingFormModal: React.FC<ClosingFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  menus,
  expenseMaster,
  onSubmitClosing,
}) => {
  // Date is locked to today's active operational date (cannot be altered by employee)
  const todayStr = getTodayDateStr();
  const closingDate = todayStr;

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Quantities per menu item
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    menus.forEach(m => {
      initial[m.id] = 0;
    });
    return initial;
  });

  // Default expenses with quantity & unit price from expenseMaster
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const defaultEs = expenseMaster.find(m => m.nama.toLowerCase().includes('es')) || {
      id: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', satuan: 'sak', hargaSatuan: 15000
    };
    const defaultGalon = expenseMaster.find(m => m.nama.toLowerCase().includes('galon')) || {
      id: 'EXP-M-02', nama: 'Air Galon Mineral', satuan: 'galon', hargaSatuan: 20000
    };
    return [
      {
        id: '1',
        masterId: defaultEs.id,
        nama: defaultEs.nama,
        jumlah: 3,
        satuan: defaultEs.satuan,
        hargaSatuan: defaultEs.hargaSatuan,
        nominal: 3 * defaultEs.hargaSatuan,
        catatan: 'Supplier es langganan',
      },
      {
        id: '2',
        masterId: defaultGalon.id,
        nama: defaultGalon.nama,
        jumlah: 1,
        satuan: defaultGalon.satuan,
        hargaSatuan: defaultGalon.hargaSatuan,
        nominal: 1 * defaultGalon.hargaSatuan,
        catatan: 'Depot galon',
      },
    ];
  });

  // Cash In / Pembayaran Hutang
  const [cashIns, setCashIns] = useState<CashInItem[]>([]);

  // Special lapak note
  const [catatanPeristiwa, setCatatanPeristiwa] = useState('');

  if (!isOpen) return null;

  // Filter active menus
  const activeMenus = menus.filter(m => m.status === 'aktif');
  const categories = ['Semua', 'Teh', 'Kopi', 'Susu', 'Yakult'];

  const displayedMenus = selectedCategory === 'Semua'
    ? activeMenus
    : activeMenus.filter(m => m.kategori === selectedCategory);

  // Totals calculations
  let totalCup = 0;
  let totalPenjualan = 0;
  let totalHpp = 0;

  const menuDetails = activeMenus.map(m => {
    const qty = quantities[m.id] || 0;
    const subtotal = qty * m.hargaJual;
    const hppSubtotal = qty * m.hpp;
    totalCup += qty;
    totalPenjualan += subtotal;
    totalHpp += hppSubtotal;
    return {
      menuId: m.id,
      namaMenu: m.namaMenu,
      jenisCup: m.jenisCup,
      hargaJual: m.hargaJual,
      hpp: m.hpp,
      qty,
      subtotal,
    };
  });

  const totalPengeluaran = expenses.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const totalPembayaranHutang = cashIns.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const totalKasNet = totalPenjualan + totalPembayaranHutang - totalPengeluaran;

  const handleQtyChange = (menuId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [menuId]: Math.max(0, val),
    }));
  };

  // Add expense based on master template
  const handleAddExpenseFromMaster = (masterItem?: OperationalExpenseMaster, defaultQty: number = 1) => {
    if (masterItem) {
      setExpenses(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          masterId: masterItem.id,
          nama: masterItem.nama,
          jumlah: defaultQty,
          satuan: masterItem.satuan,
          hargaSatuan: masterItem.hargaSatuan,
          nominal: defaultQty * masterItem.hargaSatuan,
          catatan: masterItem.nama.includes('Cup Rusak') ? 'Gagal press / bocor' : '',
        }
      ]);
    } else {
      const defaultM = expenseMaster[0] || {
        id: 'EXP-CUSTOM', nama: 'Pengeluaran Lainnya', satuan: 'pcs', hargaSatuan: 10000
      };
      setExpenses(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          masterId: defaultM.id,
          nama: defaultM.nama,
          jumlah: 1,
          satuan: defaultM.satuan,
          hargaSatuan: defaultM.hargaSatuan,
          nominal: 1 * defaultM.hargaSatuan,
          catatan: '',
        }
      ]);
    }
  };

  const handleExpenseQtyChange = (id: string, newQty: number) => {
    const qty = Math.max(0, newQty);
    setExpenses(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        jumlah: qty,
        nominal: qty * item.hargaSatuan,
      };
    }));
  };

  const handleExpenseMasterChange = (id: string, masterId: string) => {
    const master = expenseMaster.find(m => m.id === masterId);
    if (!master) return;
    setExpenses(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        masterId: master.id,
        nama: master.nama,
        satuan: master.satuan,
        hargaSatuan: master.hargaSatuan,
        nominal: item.jumlah * master.hargaSatuan,
      };
    }));
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddCashIn = () => {
    setCashIns(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sumber: '',
        nominal: 0,
        catatan: '',
      }
    ]);
  };

  const handleRemoveCashIn = (id: string) => {
    setCashIns(prev => prev.filter(c => c.id !== id));
  };

  // Quick fill sample for fast demo testing
  const handleQuickFillRealistic = () => {
    const realistic: Record<string, number> = {
      'MN-01': 195, // Es Teh 16oz
      'MN-02': 115, // Es Teh 22oz
      'MN-03': 35,  // Es Teh Lemon
      'MN-04': 25,  // Es Teh Lychee
      'MN-05': 130, // Kopi Susu Aren 16oz
      'MN-06': 42,  // Kopi Susu Aren 22oz
      'MN-08': 28,  // Susu Karamel
      'MN-10': 35,  // Yakult Lemon Berry
    };
    setQuantities(prev => ({ ...prev, ...realistic }));
    setCatatanPeristiwa('Lapak ramai lancar, cuaca cerah, mesin press beroperasi tanpa kendala.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalCup <= 0) {
      alert('Mohon masukkan minimal 1 cup penjualan menu sebelum closing.');
      return;
    }

    const payload = {
      tanggal: closingDate,
      userId: currentUser.id,
      userName: currentUser.nama,
      menuDetails: menuDetails.filter(m => m.qty > 0),
      totalCup,
      totalPenjualan,
      pengeluaranCash: expenses.filter(e => e.nominal > 0 && e.nama.trim() !== ''),
      totalPengeluaran,
      pembayaranHutang: cashIns.filter(c => c.nominal > 0 && c.sumber.trim() !== ''),
      totalPembayaranHutang,
      totalKas: totalKasNet,
      catatanPeristiwa: catatanPeristiwa.trim() || 'Operasional normal tanpa kendala.',
    };

    onSubmitClosing(payload);

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#059669', '#10b981', '#f59e0b', '#3b82f6'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-emerald-950 font-bold">
              <ClipboardList className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Form Closing Harian Lapak</h2>
                <span className="text-[10px] font-bold bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-full">
                  Tutup Kas &amp; Stok
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Petugas Closing: {currentUser.nama} ({currentUser.jabatan || 'Barista'})
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

        {/* Closing Info Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Hak Bonus Cup:</strong> Seluruh karyawan yang tercatat <strong>Hadir</strong> hari ini berhak mendapatkan bonus dari total {formatNumber(totalCup)} cup closing ini.
            </span>
          </div>
          <button
            type="button"
            onClick={handleQuickFillRealistic}
            className="text-[11px] underline text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
            title="Isi otomatis contoh realistis 500+ cup"
          >
            Isi Contoh (500+ cup)
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Date & Metadata (TANGGAL TERKUNCI OTOMATIS SESUAI HARI TERSEBUT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Closing (Terkunci Sesuai Hari Ini):
              </label>
              <div className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 flex items-center justify-between shadow-xs">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  {formatIndonesianDate(closingDate, true)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Otomatis Terkunci
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tanggal diatur sistem mengikuti hari aktif operasional lapak.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Closing (Shift Karyawan):
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.nama} (Bonus: ${formatRupiah(currentUser.bonusPerCup)}/cup)`}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-semibold cursor-not-allowed"
              />
              <span className="text-[10px] text-emerald-600 mt-1 block font-medium">
                Gaji harian Rp 50.000 + bonus cup terakumulasi saat absen hadir.
              </span>
            </div>
          </div>

          {/* Section 2: Input Rincian Menu Terjual */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-emerald-700" />
                  1. Rincian Menu Terjual Hari Ini
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan jumlah cup laku per menu varian.
                </p>
              </div>

              {/* Category selector */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedMenus.map(menu => {
                const qty = quantities[menu.id] || 0;
                return (
                  <div
                    key={menu.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      qty > 0
                        ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {menu.namaMenu}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {menu.jenisCup}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatRupiah(menu.hargaJual)} / cup
                      </div>
                      {qty > 0 && (
                        <div className="text-[11px] font-bold text-emerald-700 mt-1">
                          Subtotal: {formatRupiah(qty * menu.hargaJual)}
                        </div>
                      )}
                    </div>

                    {/* Manual Input Cup */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={e => handleQtyChange(menu.id, parseInt(e.target.value) || 0)}
                          className="w-24 text-right pr-9 pl-3 py-1.5 font-black text-sm bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-slate-900 shadow-2xs"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
                          cup
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtotal Cup Pill */}
            <div className="mt-3 p-3 bg-emerald-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-200 font-medium">Total Terjual (Semua Varian):</span>
                <div className="text-lg font-extrabold">{formatNumber(totalCup)} Cup</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-200 font-medium">Total Omzet Penjualan:</span>
                <div className="text-lg font-extrabold text-amber-300">{formatRupiah(totalPenjualan)}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Pencatatan Pengeluaran Harian (JUMLAH BARANG × HARGA SATUAN DARI OWNER) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  2. Pengeluaran Operasional Harian (Jumlah × Harga Satuan)
                </h3>
                <p className="text-xs text-slate-500">
                  Harga satuan diatur owner di menu HPP. Karyawan cukup memasukkan jumlah barang.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddExpenseFromMaster()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pengeluaran
              </button>
            </div>

            {/* Quick preset buttons: Termasuk Cup Rusak, Menghilangkan Kresek/Plastik */}
            <div className="flex flex-wrap gap-1.5 mb-3 items-center">
              <span className="text-[11px] text-slate-400 py-0.5 font-semibold">Pilih Preset Cepat:</span>

              {/* Preset Es Batu */}
              {expenseMaster.filter(m => m.nama.toLowerCase().includes('es')).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAddExpenseFromMaster(m, 3)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
                >
                  + {m.nama} ({formatRupiah(m.hargaSatuan)}/{m.satuan})
                </button>
              ))}

              {/* Preset Air Galon */}
              {expenseMaster.filter(m => m.nama.toLowerCase().includes('galon')).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAddExpenseFromMaster(m, 1)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
                >
                  + {m.nama} ({formatRupiah(m.hargaSatuan)}/{m.satuan})
                </button>
              ))}

              {/* PRESET BARU: Cup Rusak / Gagal Press */}
              {expenseMaster.filter(m => m.nama.toLowerCase().includes('cup rusak')).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAddExpenseFromMaster(m, 5)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  + Cup Rusak / Pecah ({formatRupiah(m.hargaSatuan)}/{m.satuan})
                </button>
              ))}
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 rounded-2xl text-xs text-slate-400">
                Tidak ada pengeluaran operasional hari ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.map((exp, idx) => (
                  <div key={exp.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-slate-400 font-bold w-4">{idx + 1}.</span>

                        {/* Select item from master list */}
                        <select
                          value={exp.masterId || ''}
                          onChange={e => handleExpenseMasterChange(exp.id, e.target.value)}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-emerald-600"
                        >
                          {expenseMaster.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.nama} ({formatRupiah(m.hargaSatuan)} / {m.satuan})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Inputs: Jumlah barang, Harga Satuan (Locked from Owner), Subtotal Otomatis */}
                      <div className="flex items-center gap-2 justify-end">
                        {/* Jumlah */}
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-500 font-semibold">Qty:</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={exp.jumlah === 0 ? '' : exp.jumlah}
                            placeholder="0"
                            onChange={e => handleExpenseQtyChange(exp.id, parseFloat(e.target.value) || 0)}
                            className="w-16 bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs text-slate-800 font-extrabold text-center focus:outline-emerald-600"
                          />
                          <span className="text-[10px] text-slate-500 font-medium">
                            {exp.satuan}
                          </span>
                        </div>

                        {/* Perkalian */}
                        <span className="text-slate-400 text-xs">×</span>

                        {/* Harga Satuan */}
                        <div className="text-right">
                          <span className="text-[11px] text-slate-600 font-medium">
                            {formatRupiah(exp.hargaSatuan)}
                          </span>
                        </div>

                        {/* Subtotal Otomatis */}
                        <div className="w-28 text-right font-black text-red-600 text-xs">
                          = {formatRupiah(exp.nominal)}
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(exp.id)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-100 transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Catatan / Keterangan barang (misal: cup rusak karena mesin press seret) */}
                    <input
                      type="text"
                      placeholder="Catatan tambahan (misal: 3 cup pecah karena bibir cup tidak pas, beli 3 sak es jam 14.00)"
                      value={exp.catatan || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setExpenses(prev => prev.map(item => item.id === exp.id ? { ...item, catatan: val } : item));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1 text-[11px] text-slate-600 focus:outline-emerald-600"
                    />
                  </div>
                ))}

                <div className="flex justify-between items-center text-xs font-bold text-red-700 px-3 py-1 bg-red-50/70 rounded-xl border border-red-100">
                  <span>Total Pengeluaran Kas (Dihitung Otomatis):</span>
                  <span className="text-sm font-black">{formatRupiah(totalPengeluaran)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Pencatatan Pemasukan Kas / Pembayaran Hutang */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  3. Pemasukan Kas Tambahan / Pembayaran Hutang
                </h3>
                <p className="text-xs text-slate-500">
                  Uang masuk tambahan (pelanggan bayar hutang/bon lama) yang dihitung ke kas harian.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCashIn}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Kas Masuk
              </button>
            </div>

            {cashIns.length === 0 ? (
              <div className="text-center py-3 bg-slate-50 rounded-2xl text-xs text-slate-400">
                Tidak ada pembayaran hutang / pemasukan lain hari ini.
              </div>
            ) : (
              <div className="space-y-2">
                {cashIns.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-200">
                    <span className="text-xs text-emerald-700 font-bold w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Sumber (misal: Pelunasan Bu Sri / Warung Sebelah)"
                      value={item.sumber}
                      onChange={e => {
                        const val = e.target.value;
                        setCashIns(prev => prev.map(c => c.id === item.id ? { ...c, sumber: val } : c));
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-emerald-600"
                      required
                    />
                    <div className="w-36 relative">
                      <span className="absolute left-2.5 top-1 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={item.nominal === 0 ? '' : item.nominal}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setCashIns(prev => prev.map(c => c.id === item.id ? { ...c, nominal: val } : c));
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-2 py-1 text-xs text-slate-800 font-bold text-right focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCashIn(item.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-100 transition"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 px-3 py-1">
                  <span>Total Kas Masuk Lainnya:</span>
                  <span>+{formatRupiah(totalPembayaranHutang)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Catatan Peristiwa Penting */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              4. Catatan Peristiwa Penting di Lapak Hari Ini
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Contoh: Cuaca hujan deras, kendala mesin sealer/press, stok cup hampir habis, ada pesanan borongan.
            </p>
            <textarea
              rows={2}
              value={catatanPeristiwa}
              onChange={e => setCatatanPeristiwa(e.target.value)}
              placeholder="Tuliskan peristiwa khusus hari ini untuk catatan laporan owner..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Section 6: Summary Net Cash Card */}
          <div className="bg-slate-900 text-white p-4 rounded-3xl space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rekapitulasi Arus Kas Lapak Hari Ini
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Penjualan Minuman:</span>
                <span className="font-bold text-emerald-400">{formatRupiah(totalPenjualan)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Bayar Hutang / Kas In:</span>
                <span className="font-bold text-emerald-400">+{formatRupiah(totalPembayaranHutang)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Pengeluaran Operasional:</span>
                <span className="font-bold text-red-400">-{formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-300 font-semibold">Total Kas Bersih Diserahkan (Net Cash):</div>
                <div className="text-xl font-black text-amber-300">{formatRupiah(totalKasNet)}</div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                Bonus Insentif: <br />
                <span className="font-bold text-white">
                  {formatNumber(totalCup)} cup (Aktif untuk seluruh staf yang hadir)
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Kirim Closing &amp; Potong Stok Resep</span>
          </button>
        </div>
      </div>
    </div>
  );
};
