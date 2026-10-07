import React, { useState, useEffect } from 'react';
import {
  X, Check, AlertCircle, Plus, Trash2, Coffee,
  Sparkles, DollarSign, ArrowUpRight, ArrowDownRight,
  ClipboardList, Calendar, ShieldAlert, User, Clock,
  HelpCircle, AlertTriangle, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Menu, Closing, ExpenseItem, CashInItem, User as UserType, OperationalExpenseMaster, CustomerDebt } from '../../types';
import { formatRupiah, formatNumber, formatIndonesianDate, getTodayDateStr } from '../../utils/formatters';

interface ClosingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  menus: Menu[];
  expenseMaster: OperationalExpenseMaster[];
  initialClosing?: Closing | null;
  onSubmitClosing: (closingData: Omit<Closing, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const ClosingFormModal: React.FC<ClosingFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  menus,
  expenseMaster,
  initialClosing,
  onSubmitClosing,
}) => {
  const todayStr = getTodayDateStr();
  const isOwner = currentUser.role === 'owner';

  // For owner: allow choosing/revising date. For employee: locked to today.
  const [closingDate, setClosingDate] = useState<string>(() => {
    return initialClosing?.tanggal || todayStr;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Quantities per menu item
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    menus.forEach(m => {
      initial[m.id] = 0;
    });
    if (initialClosing) {
      initialClosing.menuDetails.forEach(md => {
        initial[md.menuId] = md.qty;
      });
    }
    return initial;
  });

  // Default expenses with quantity & unit price from expenseMaster
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    if (initialClosing && initialClosing.pengeluaranCash) {
      return initialClosing.pengeluaranCash;
    }
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

  // Cash In / Pembayaran Hutang oleh pelanggan lama
  const [cashIns, setCashIns] = useState<CashInItem[]>(() => {
    return initialClosing?.pembayaranHutang || [];
  });

  // Hutang Pelanggan baru hari ini (Bon belum bayar)
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>(() => {
    return initialClosing?.customerDebts || [];
  });

  // Special lapak note
  const [catatanPeristiwa, setCatatanPeristiwa] = useState(() => {
    return initialClosing?.catatanPeristiwa || '';
  });

  // Re-sync if initialClosing changes
  useEffect(() => {
    if (initialClosing) {
      setClosingDate(initialClosing.tanggal);
      const newQty: Record<string, number> = {};
      menus.forEach(m => { newQty[m.id] = 0; });
      initialClosing.menuDetails.forEach(md => { newQty[md.menuId] = md.qty; });
      setQuantities(newQty);
      setExpenses(initialClosing.pengeluaranCash || []);
      setCashIns(initialClosing.pembayaranHutang || []);
      setCustomerDebts(initialClosing.customerDebts || []);
      setCatatanPeristiwa(initialClosing.catatanPeristiwa || '');
    } else {
      setClosingDate(todayStr);
    }
  }, [initialClosing]);

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
  const totalHutangBaru = customerDebts.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

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
          id: Date.now().toString() + Math.random().toString().slice(2, 5),
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
        id: 'EXP-CUSTOM', nama: 'Pengeluaran Lainnya', satuan: 'transaksi', hargaSatuan: 10000
      };
      setExpenses(prev => [
        ...prev,
        {
          id: Date.now().toString() + Math.random().toString().slice(2, 5),
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

  const handleAddCustomExpense = (presetName: string = 'Pengeluaran Baru', defaultNominal: number = 50000) => {
    setExpenses(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        masterId: 'EXP-CUSTOM',
        nama: presetName,
        jumlah: 1,
        satuan: 'transaksi',
        hargaSatuan: defaultNominal,
        nominal: defaultNominal,
        catatan: '',
      }
    ]);
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

  const handleExpensePriceChange = (id: string, newPrice: number) => {
    const price = Math.max(0, newPrice);
    setExpenses(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        hargaSatuan: price,
        nominal: item.jumlah * price,
      };
    }));
  };

  const handleExpenseNameChange = (id: string, newName: string) => {
    setExpenses(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        nama: newName,
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

  // Cash In handlers
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

  // Customer Debt handlers
  const handleAddCustomerDebt = () => {
    setCustomerDebts(prev => [
      ...prev,
      {
        id: `DEBT-${Date.now().toString().slice(-6)}`,
        tanggal: closingDate,
        namaPelanggan: '',
        nominal: 15000,
        catatan: '',
        status: 'Belum Lunas',
        dicatatOleh: currentUser.nama,
        createdAt: new Date().toISOString(),
      }
    ]);
  };

  const handleCustomerDebtChange = (id: string, field: keyof CustomerDebt, value: any) => {
    setCustomerDebts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleRemoveCustomerDebt = (id: string) => {
    setCustomerDebts(prev => prev.filter(d => d.id !== id));
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
      customerDebts: customerDebts.filter(d => d.nominal > 0 && d.namaPelanggan.trim() !== '').map(d => ({
        ...d,
        tanggal: closingDate,
        dicatatOleh: currentUser.nama,
      })),
      totalKas: totalKasNet,
      catatanPeristiwa: catatanPeristiwa.trim() || 'Operasional normal tanpa kendala.',
    };

    onSubmitClosing(payload, initialClosing?.id);

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
        <div className={`px-5 py-4 flex items-center justify-between text-white ${
          initialClosing ? 'bg-amber-900' : 'bg-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl font-bold ${
              initialClosing ? 'bg-amber-400 text-amber-950' : 'bg-amber-400 text-emerald-950'
            }`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {initialClosing ? 'Revisi Laporan Closing Lapak' : 'Form Closing Harian Lapak'}
                </h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isOwner ? 'bg-amber-300 text-amber-950' : 'bg-emerald-700 text-emerald-100'
                }`}>
                  {isOwner ? 'Mode Owner (Bebas Edit Tanggal)' : 'Shift Karyawan'}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Petugas: {currentUser.nama} ({currentUser.jabatan || (isOwner ? 'Owner' : 'Barista')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Closing Info Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Bonus Cup:</strong> Karyawan staf yang tercatat <strong>Hadir</strong> hari ini berhak mendapatkan bonus dari total {formatNumber(totalCup)} cup closing ini (Owner tidak mendapatkan bonus).
            </span>
          </div>
          <button
            type="button"
            onClick={handleQuickFillRealistic}
            className="text-[11px] underline text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer whitespace-nowrap ml-2"
            title="Isi otomatis contoh realistis 500+ cup"
          >
            Isi Contoh (500+ cup)
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Date & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Tanggal: BISA DIEDIT JIKA OWNER, TERKUNCI JIKA KARYAWAN */}
            <div>
              {isOwner ? (
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Tanggal Operasional (Bebas Revisi Tanggal oleh Owner):</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={closingDate}
                    onChange={e => setClosingDate(e.target.value)}
                    className="w-full bg-white border-2 border-amber-400 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-emerald-600 shadow-xs"
                  />
                  <span className="text-[10px] text-amber-800 font-semibold mt-1 block">
                    * Hak Akses Owner: Anda dapat memilih tanggal lampau untuk merevisi laporan jika ada kekeliruan.
                  </span>
                </div>
              ) : (
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
                      Terkunci Otomatis
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Karyawan hanya dapat mengisi closing pada tanggal aktif hari ini.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Input:
              </label>
              <div className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-xs">
                <User className="w-4 h-4 text-slate-500" />
                <span>{currentUser.nama} ({currentUser.role === 'owner' ? 'Owner Kedai' : (currentUser.jabatan || 'Barista')})</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Akun yang bertanggung jawab atas rekapan closing ini.
              </span>
            </div>
          </div>

          {/* Section 2: Input Penjualan Cup Minuman */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-emerald-600" />
                  1. Rekap Penjualan Cup Minuman
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan jumlah cup yang terjual hari ini per varian menu.
                </p>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {displayedMenus.map(menu => {
                const qty = quantities[menu.id] || 0;
                const subtotal = qty * menu.hargaJual;

                return (
                  <div
                    key={menu.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-2 ${
                      qty > 0
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Menu Info: Nama Menu Lengkap Tanpa Truncate */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0 border border-slate-200/60">
                          {menu.jenisCup}
                        </span>
                        <span className="font-extrabold text-xs sm:text-xs text-slate-900 leading-snug break-words flex-1">
                          {menu.namaMenu}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-600">
                          {formatRupiah(menu.hargaJual)} / cup
                        </span>
                        {qty > 0 && (
                          <span className="font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md text-[11px]">
                            • Sub: {formatRupiah(subtotal)} ({qty} cup)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Qty Stepper: Nyaman disentuh di mobile & rapih di desktop */}
                    <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(menu.id, qty - 10)}
                          className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 transition"
                          title="-10 cup"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(menu.id, qty - 1)}
                          className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 transition"
                          title="-1 cup"
                        >
                          -
                        </button>
                      </div>

                      <input
                        type="number"
                        min="0"
                        value={qty === 0 ? '' : qty}
                        placeholder="0"
                        onChange={e => handleQtyChange(menu.id, parseInt(e.target.value, 10) || 0)}
                        className="w-16 sm:w-14 bg-white border border-slate-300 rounded-xl py-1 text-center font-black text-xs sm:text-xs text-slate-900 focus:outline-emerald-600 shadow-2xs"
                      />

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(menu.id, qty + 1)}
                          className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 font-bold text-xs text-emerald-900 flex items-center justify-center cursor-pointer active:scale-95 transition"
                          title="+1 cup"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(menu.id, qty + 10)}
                          className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 font-bold text-xs text-emerald-900 flex items-center justify-center cursor-pointer active:scale-95 transition"
                          title="+10 cup"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Penjualan Summary Banner */}
            <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-900">Total Cup Terjual:</span>
                <span className="text-base font-black text-emerald-800">
                  {formatNumber(totalCup)} Cup
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-900">Total Omzet Penjualan (Kotor):</span>
                <span className="text-base font-black text-emerald-800">
                  {formatRupiah(totalPenjualan)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Pencatatan Pengeluaran Harian */}
          {/* USER REQUEST: Tombol tambah pengeluaran dan preset diletakkan DI BAWAH DAFTAR! */}
          <div>
            <div className="pb-2 border-b border-slate-200 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                2. Pengeluaran Operasional Harian (Bahan Lapak &amp; Utilitas Non-Bahan)
              </h3>
              <p className="text-xs text-slate-500">
                Catat belanja tunai kasir (es batu, galon, cup rusak) maupun biaya utilitas non-bahan (token listrik, air, WiFi, retribusi).
              </p>
            </div>

            {/* DAFTAR BARIS PENGELUARAN YANG SUDAH DITAMBAHKAN */}
            {expenses.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 rounded-2xl text-xs text-slate-400 mb-3">
                Belum ada baris pengeluaran. Silakan klik tombol preset atau tambah pengeluaran di bawah.
              </div>
            ) : (
              <div className="space-y-2.5 mb-3">
                {expenses.map((exp, idx) => {
                  const isUtility = exp.nama.toLowerCase().includes('listrik') ||
                                    exp.nama.toLowerCase().includes('air') ||
                                    exp.nama.toLowerCase().includes('wifi') ||
                                    exp.nama.toLowerCase().includes('internet') ||
                                    exp.nama.toLowerCase().includes('retribusi') ||
                                    exp.nama.toLowerCase().includes('sewa') ||
                                    exp.masterId === 'EXP-CUSTOM';

                  return (
                    <div
                      key={exp.id}
                      className="bg-slate-50/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-2.5 overflow-hidden shadow-2xs"
                    >
                      {/* Baris 1: Index, Kategori Badge, & Tombol Hapus */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs text-slate-400 font-bold shrink-0">{idx + 1}.</span>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isUtility
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {isUtility ? '⚡ Utilitas / Non-Bahan' : '🧊 Bahan Lapak'}
                          </span>

                          {exp.masterId === 'EXP-CUSTOM' && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 hidden xs:inline-block">
                              Kustom
                            </span>
                          )}
                        </div>

                        {/* Tombol Hapus di pojok kanan atas agar tidak berdesakan */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(exp.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/60 transition cursor-pointer text-xs shrink-0 font-bold active:scale-95"
                          title="Hapus baris pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">Hapus</span>
                        </button>
                      </div>

                      {/* Baris 2: Nama Pengeluaran (Dropdown Master atau Input Kustom Lebar Penuh) */}
                      <div className="w-full">
                        {exp.masterId === 'EXP-CUSTOM' ? (
                          <input
                            type="text"
                            value={exp.nama}
                            onChange={e => handleExpenseNameChange(exp.id, e.target.value)}
                            placeholder="Ketik nama pengeluaran (misal: Token Listrik Lapak, Beli Sabun, dll)..."
                            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-emerald-600 shadow-2xs"
                          />
                        ) : (
                          <select
                            value={exp.masterId || ''}
                            onChange={e => handleExpenseMasterChange(exp.id, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-emerald-600 shadow-2xs"
                          >
                            {expenseMaster.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.nama} ({formatRupiah(m.hargaSatuan)} / {m.satuan})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Baris 3: Perhitungan Biaya (Qty × @Rp = Subtotal) - Rapi di dalam card tanpa overflow */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {/* Qty */}
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-slate-500 font-bold">Qty:</label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={exp.jumlah === 0 ? '' : exp.jumlah}
                              placeholder="0"
                              onChange={e => handleExpenseQtyChange(exp.id, parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-extrabold text-center focus:outline-emerald-600"
                            />
                            <span className="text-[11px] text-slate-600 font-semibold">
                              {exp.satuan}
                            </span>
                          </div>

                          <span className="text-slate-300 font-bold text-xs">×</span>

                          {/* Harga Satuan */}
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-slate-500 font-bold">@Rp:</label>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={exp.hargaSatuan === 0 ? '' : exp.hargaSatuan}
                              placeholder="0"
                              onChange={e => handleExpensePriceChange(exp.id, parseFloat(e.target.value) || 0)}
                              className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-extrabold text-right focus:outline-emerald-600"
                              title="Tarif satuan pengeluaran"
                            />
                          </div>
                        </div>

                        {/* Subtotal Biaya */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 sm:hidden">Total Biaya:</span>
                          <div className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-black text-xs text-right whitespace-nowrap">
                            = {formatRupiah(exp.nominal)}
                          </div>
                        </div>
                      </div>

                      {/* Baris 4: Catatan / Keterangan barang */}
                      <input
                        type="text"
                        placeholder="Catatan tambahan (misal: Token listrik lapak via kasir, 3 sak es jam 14.00, dll)..."
                        value={exp.catatan || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setExpenses(prev => prev.map(item => item.id === exp.id ? { ...item, catatan: val } : item));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-600 focus:outline-emerald-600"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* TOMBOL TAMBAH PENGELUARAN & PRESET DITEMPATKAN DI BAWAH (SESUAI REQUEST) */}
            <div className="p-3 sm:p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 space-y-2.5 mb-3 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  Tambah Pengeluaran Baru:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddCustomExpense('Pengeluaran Kustom Lainnya', 20000)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition cursor-pointer"
                  >
                    + Kustom Bebas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddExpenseFromMaster()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer"
                  >
                    + Pilih Master
                  </button>
                </div>
              </div>

              {/* Preset Bahan Lapak */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-500 py-0.5">Bahan Lapak:</span>
                {expenseMaster.filter(m => m.nama.toLowerCase().includes('es')).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAddExpenseFromMaster(m, 3)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
                  >
                    + {m.nama} ({formatRupiah(m.hargaSatuan)}/{m.satuan})
                  </button>
                ))}
                {expenseMaster.filter(m => m.nama.toLowerCase().includes('galon')).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAddExpenseFromMaster(m, 1)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
                  >
                    + {m.nama} ({formatRupiah(m.hargaSatuan)}/{m.satuan})
                  </button>
                ))}
                {expenseMaster.filter(m => m.nama.toLowerCase().includes('cup rusak')).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAddExpenseFromMaster(m, 5)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    + Cup Rusak ({formatRupiah(m.hargaSatuan)}/{m.satuan})
                  </button>
                ))}
              </div>

              {/* Preset Utilitas Non-Bahan */}
              <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[10px] font-black text-amber-900 py-0.5 uppercase tracking-wider flex items-center gap-1">
                  ⚡ Utilitas Non-Bahan:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddCustomExpense('Token Listrik Lapak (PLN)', 50000)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                >
                  ⚡ Token Listrik 50rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomExpense('Token Listrik Lapak (PLN)', 100000)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                >
                  ⚡ Token Listrik 100rb
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomExpense('Tagihan Air Bersih / PDAM', 75000)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                >
                  💧 Bayar Air PDAM
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomExpense('Tagihan Internet & WiFi Lapak', 150000)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                >
                  📶 Bayar WiFi Lapak
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCustomExpense('Retribusi Kebersihan & Keamanan Lapak', 5000)}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                >
                  🧹 Retribusi Sampah 5rb
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddCustomExpense('Kas Keluar untuk Hutang / Kasbon', 25000);
                    handleAddCustomerDebt();
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-300 font-black transition cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3 text-purple-700" />
                  + Kas Keluar untuk Hutang
                </button>
              </div>
            </div>

            {/* Total Pengeluaran */}
            <div className="flex justify-between items-center text-xs font-bold text-red-700 px-3 py-1.5 bg-red-50/80 rounded-xl border border-red-200">
              <span>Total Pengeluaran Kas Lapak:</span>
              <span className="text-sm font-black">{formatRupiah(totalPengeluaran)}</span>
            </div>
          </div>

          {/* Section 4: Pencatatan Pemasukan Kas / Pembayaran Hutang Lama */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  3. Pemasukan Kas Tambahan / Pembayaran Hutang Lama
                </h3>
                <p className="text-xs text-slate-500">
                  Uang tunai masuk tambahan (pelanggan melunasi hutang/bon lama) yang dihitung ke kas laci hari ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCashIn}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
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
                {cashIns.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 overflow-hidden shadow-2xs"
                  >
                    <input
                      type="text"
                      placeholder="Sumber uang (misal: Cicilan bon Pak RT, Pelunasan Mas Joko)"
                      value={item.sumber}
                      onChange={e => {
                        const val = e.target.value;
                        setCashIns(prev => prev.map(c => c.id === item.id ? { ...c, sumber: val } : c));
                      }}
                      className="flex-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-emerald-600 shadow-2xs"
                    />
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0">
                      <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                        <span className="text-xs text-slate-500 font-bold">Rp:</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="Nominal"
                          value={item.nominal === 0 ? '' : item.nominal}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setCashIns(prev => prev.map(c => c.id === item.id ? { ...c, nominal: val } : c));
                          }}
                          className="w-full sm:w-28 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-black text-emerald-800 text-right focus:outline-emerald-600 shadow-2xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCashIn(item.id)}
                        className="p-1.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer shrink-0"
                        title="Hapus baris kas masuk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span>Total Kas Masuk Lain:</span>
                  <span className="text-sm font-black">{formatRupiah(totalPembayaranHutang)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: FITUR BARU - PENCATATAN HUTANG PELANGGAN HARI INI (BON BELUM BAYAR) */}
          <div className="bg-amber-50/60 p-4 rounded-3xl border border-amber-300 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  4. Pencatatan Hutang Pelanggan Hari Ini (Bon Belum Lunas)
                </h3>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Catat pelanggan yang mengambil minuman/bon tapi belum bayar hari ini. Sistem akan otomatis memunculkan <strong>pengingat penagihan</strong> di hari berikutnya saat karyawan login.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomerDebt}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Hutang Baru</span>
              </button>
            </div>

            {customerDebts.length === 0 ? (
              <div className="text-center py-3 bg-white/80 rounded-2xl text-xs text-amber-800/80 border border-amber-200">
                Tidak ada pelanggan yang berhutang / bon hari ini. Semua pesanan lunas.
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerDebts.map((debt, idx) => (
                  <div
                    key={debt.id}
                    className="p-3 sm:p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-2.5 overflow-hidden"
                  >
                    {/* Header baris: Index, Nama Yang Hutang & Tombol Hapus */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-amber-700 font-bold shrink-0">{idx + 1}.</span>
                        <input
                          type="text"
                          required
                          placeholder="Nama yang hutang (e.g. Mas Joko Ojol, Pak RT, Bu Dewi)..."
                          value={debt.namaPelanggan}
                          onChange={e => handleCustomerDebtChange(debt.id, 'namaPelanggan', e.target.value)}
                          className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-amber-600 shadow-2xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomerDebt(debt.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/60 transition cursor-pointer text-xs shrink-0 font-bold active:scale-95"
                        title="Hapus baris hutang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Hapus</span>
                      </button>
                    </div>

                    {/* Nominal Hutang Input */}
                    <div className="flex items-center justify-between sm:justify-start gap-2 bg-amber-50/60 p-2 rounded-xl border border-amber-200/80">
                      <span className="text-xs text-amber-950 font-bold">Nominal Hutang:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-500">Rp</span>
                        <input
                          type="number"
                          min="1000"
                          step="1000"
                          required
                          value={debt.nominal === 0 ? '' : debt.nominal}
                          placeholder="0"
                          onChange={e => handleCustomerDebtChange(debt.id, 'nominal', Number(e.target.value) || 0)}
                          className="w-32 bg-white border border-red-300 rounded-xl px-2.5 py-1 text-xs font-black text-red-600 text-right focus:outline-red-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Rincian minuman / alasan hutang */}
                    <input
                      type="text"
                      placeholder="Rincian minuman / alasan hutang (misal: 2 Cup Kopi Aren belum bayar, titip uang sore)"
                      value={debt.catatan}
                      onChange={e => handleCustomerDebtChange(debt.id, 'catatan', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-700 focus:outline-amber-600"
                    />
                  </div>
                ))}

                <div className="flex justify-between items-center text-xs font-bold text-amber-950 px-3 py-1.5 bg-amber-100 rounded-xl border border-amber-300">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Total Hutang Pelanggan Hari Ini:
                  </span>
                  <span className="text-sm font-black text-red-700">{formatRupiah(totalHutangBaru)}</span>
                </div>

                {/* Tombol Tambah Hutang di bagian bawah agar tidak perlu scroll ke atas */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomerDebt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Tambah Baris Hutang Lagi</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Catatan Kejadian / Peristiwa Lapak */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5. Catatan Peristiwa Lapak Hari Ini (Cuaca, Mesin, Insiden):
            </label>
            <textarea
              rows={2}
              value={catatanPeristiwa}
              onChange={e => setCatatanPeristiwa(e.target.value)}
              placeholder="Contoh: Mesin press sempat macet jam 15.00, cuaca hujan deras sore hari, stok sedotan tinggal 1 pack..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:outline-emerald-600"
            />
          </div>

          {/* Ringkasan Akhir Kas Bersih Laci */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Rekap Uang Fisik Kas Laci (Wajib Klop)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Formula: Penjualan + Bayar Hutang - Pengeluaran Cash
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Penjualan Cup:</span>
                <span className="font-bold text-white text-sm">+{formatRupiah(totalPenjualan)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kas In (Hutang Masuk):</span>
                <span className="font-bold text-emerald-400 text-sm">+{formatRupiah(totalPembayaranHutang)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pengeluaran Cash Lapak:</span>
                <span className="font-bold text-red-400 text-sm">-{formatRupiah(totalPengeluaran)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Uang Kas Bersih di Laci Lapak:</span>
                <span className="text-xl sm:text-2xl font-black text-amber-300">
                  {formatRupiah(totalKasNet)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Volume Closing:</span>
                <span className="text-base font-black text-white">{formatNumber(totalCup)} Cup</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-6 py-3 rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer ${
                initialClosing
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{initialClosing ? 'Simpan Revisi Laporan Closing' : 'Kirim Laporan Closing Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
