import React, { useState, useEffect } from 'react';
import {
  Coffee, BarChart3, Layers, Package, UserCheck,
  CreditCard, FileText, Users, Database, Sparkles, CheckCircle2,
  Landmark
} from 'lucide-react';
import {
  AppState, User, Closing, Menu, Ingredient, Recipe,
  Kasbon, Payroll, OperationalExpenseMaster, CashTransaction, MonthlyClosingReport
} from './types';
import {
  loadAppState, saveAppState, resetToDefaultState,
  deductIngredientsForClosing, calculateMenuHpp
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';

// Views
import { EmployeeHome } from './components/EmployeeView/EmployeeHome';
import { OwnerDashboard } from './components/OwnerView/OwnerDashboard';
import { MonthlyReportAndCashReconciliation } from './components/OwnerView/MonthlyReportAndCashReconciliation';
import { MenuAndHppManagement } from './components/OwnerView/MenuAndHppManagement';
import { StockManagement } from './components/OwnerView/StockManagement';
import { AttendanceRecap } from './components/OwnerView/AttendanceRecap';
import { KasbonManagement } from './components/OwnerView/KasbonManagement';
import { PayrollManagement } from './components/OwnerView/PayrollManagement';
import { UserManagement } from './components/OwnerView/UserManagement';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeView, setActiveView] = useState<'karyawan' | 'owner'>('karyawan');
  const [ownerTab, setOwnerTab] = useState<
    'dashboard' | 'monthly-report' | 'menus' | 'stock' | 'attendance' | 'kasbon' | 'payroll' | 'users'
  >('dashboard');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUser = state.currentUserId
    ? state.users.find(u => u.id === state.currentUserId) || null
    : null;

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'owner') {
        setActiveView('owner');
      } else {
        setActiveView('karyawan');
      }
    }
  }, [currentUser?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLoginSuccess = (user: User) => {
    const nextState = { ...state, currentUserId: user.id };
    setState(nextState);
    saveAppState(nextState);
    setActiveView(user.role === 'owner' ? 'owner' : 'karyawan');
    showToast(`Selamat datang, ${user.nama}! Berhasil masuk sebagai ${user.role.toUpperCase()}.`);
  };

  const handleLogout = () => {
    const nextState = { ...state, currentUserId: null };
    setState(nextState);
    saveAppState(nextState);
    showToast('Anda telah berhasil keluar dari sesi.');
  };

  const handleSelectUser = (user: User) => {
    const nextState = { ...state, currentUserId: user.id };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Beralih akun ke: ${user.nama} (${user.role})`);
  };

  // Submit Closing Lapak & Backward Stock Deduction (closing does not force attendance trigger)
  const handleSubmitClosing = (closingData: Omit<Closing, 'id' | 'createdAt'>) => {
    const newClosingId = `CLS-${closingData.tanggal.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const newClosing: Closing = {
      ...closingData,
      id: newClosingId,
      createdAt: new Date().toISOString(),
    };

    // Backward inventory deduction based on recipes
    const updatedIngredients = deductIngredientsForClosing(newClosing, state.recipes, state.ingredients);

    // Create cash transactions automatically
    const newTxList: CashTransaction[] = [
      {
        id: `CTX-CLS-${Date.now().toString().slice(-6)}`,
        tanggal: newClosing.tanggal,
        kategori: 'Penjualan Laci',
        tipe: 'Masuk',
        metode: 'Tunai',
        nominal: newClosing.totalPenjualan,
        keterangan: `Penjualan Kasir Lapak (${newClosing.totalCup} cup terjual oleh ${newClosing.userName})`,
        referensiId: newClosing.id,
        createdAt: new Date().toISOString(),
      },
    ];

    if (newClosing.totalPengeluaran > 0) {
      newTxList.push({
        id: `CTX-EXP-${Date.now().toString().slice(-6)}`,
        tanggal: newClosing.tanggal,
        kategori: 'Belanja Langsung',
        tipe: 'Keluar',
        metode: 'Tunai',
        nominal: newClosing.totalPengeluaran,
        keterangan: `Pengeluaran Cash Lapak Harian (${newClosing.pengeluaranCash.map(e => e.nama).join(', ')})`,
        referensiId: newClosing.id,
        createdAt: new Date().toISOString(),
      });
    }

    if (newClosing.totalPembayaranHutang > 0) {
      newTxList.push({
        id: `CTX-IN-${Date.now().toString().slice(-6)}`,
        tanggal: newClosing.tanggal,
        kategori: 'Kas Masuk Lain',
        tipe: 'Masuk',
        metode: 'Tunai',
        nominal: newClosing.totalPembayaranHutang,
        keterangan: `Pemasukan Kas Lapak Lainnya (${newClosing.pembayaranHutang.map(h => h.sumber).join(', ')})`,
        referensiId: newClosing.id,
        createdAt: new Date().toISOString(),
      });
    }

    const nextState: AppState = {
      ...state,
      closings: [newClosing, ...state.closings],
      ingredients: updatedIngredients,
      cashTransactions: [...newTxList, ...(state.cashTransactions || [])],
    };

    setState(nextState);
    saveAppState(nextState);
    showToast(`Closing lapak berhasil dikirim! Kas laci & stok bahan baku otomatis terupdate.`);
  };

  // Dedicated Employee Check-In Attendance with Daily Activity Report
  const handleCheckInAttendance = (tanggal: string, laporanKegiatan: string) => {
    if (!currentUser) return;
    const existingIndex = state.absensi.findIndex(
      a => a.userId === currentUser.id && a.tanggal === tanggal
    );

    let updatedAbsensi = [...state.absensi];
    if (existingIndex >= 0) {
      updatedAbsensi[existingIndex] = {
        ...updatedAbsensi[existingIndex],
        statusHadir: 'Hadir',
        laporanKegiatan,
        timestamp: new Date().toISOString(),
      };
    } else {
      updatedAbsensi.push({
        id: `ABS-${Date.now()}`,
        tanggal,
        userId: currentUser.id,
        statusHadir: 'Hadir',
        laporanKegiatan,
        timestamp: new Date().toISOString(),
      });
    }

    const nextState: AppState = {
      ...state,
      absensi: updatedAbsensi,
    };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Absensi Hadir berhasil dicatat! Laporan kegiatan Anda telah tersimpan.`);
  };

  // Add leave / izin request
  const handleAddIzin = (tanggal: string, keterangan: string) => {
    if (!currentUser) return;
    const newAbsensi = {
      id: `ABS-${Date.now()}`,
      tanggal,
      userId: currentUser.id,
      statusHadir: 'Izin' as const,
      keteranganIzin: keterangan,
      timestamp: new Date().toISOString(),
    };

    const nextState: AppState = {
      ...state,
      absensi: [newAbsensi, ...state.absensi],
    };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Pengajuan izin untuk tanggal ${tanggal} berhasil disimpan.`);
  };

  // Menu Management
  const handleSaveMenu = (menu: Menu, menuRecipes: { ingredientId: string; qtyPerCup: number }[]) => {
    const existingIndex = state.menus.findIndex(m => m.id === menu.id);
    let updatedMenus = [...state.menus];
    if (existingIndex >= 0) {
      updatedMenus[existingIndex] = menu;
    } else {
      updatedMenus.push(menu);
    }

    // Update recipes mapping
    const otherRecipes = state.recipes.filter(r => r.menuId !== menu.id);
    const newRecipes: Recipe[] = menuRecipes.map((item, idx) => ({
      id: `RCP-${menu.id}-${idx + 1}`,
      menuId: menu.id,
      ingredientId: item.ingredientId,
      qtyPerCup: item.qtyPerCup,
    }));

    const nextState: AppState = {
      ...state,
      menus: updatedMenus,
      recipes: [...otherRecipes, ...newRecipes],
    };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Menu ${menu.namaMenu} & resep HPP berhasil disimpan.`);
  };

  const handleToggleMenuStatus = (menuId: string) => {
    const nextMenus = state.menus.map(m =>
      m.id === menuId ? { ...m, status: m.status === 'aktif' ? ('nonaktif' as const) : ('aktif' as const) } : m
    );
    const nextState = { ...state, menus: nextMenus };
    setState(nextState);
    saveAppState(nextState);
  };

  const handleUpdateExpenseMaster = (items: OperationalExpenseMaster[]) => {
    const nextState = { ...state, expenseMaster: items };
    setState(nextState);
    saveAppState(nextState);
    showToast('Daftar master pengeluaran operasional & harga satuan berhasil diperbarui.');
  };

  // Stock Management
  const handleUpdateIngredient = (ingredient: Ingredient) => {
    const nextIngredients = state.ingredients.map(i =>
      i.id === ingredient.id ? ingredient : i
    );
    const nextState = { ...state, ingredients: nextIngredients };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Bahan ${ingredient.namaBahan} berhasil diperbarui.`);
  };

  const handleAddIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    const newId = `ING-${Date.now().toString().slice(-4)}`;
    const nextIngredients = [...state.ingredients, { ...ingredient, id: newId }];
    const nextState = { ...state, ingredients: nextIngredients };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Bahan baku ${ingredient.namaBahan} berhasil ditambahkan.`);
  };

  const handleRestock = (
    ingredientId: string,
    additionalStock: number,
    source: 'Marketplace' | 'Langsung' = 'Marketplace',
    options?: {
      newUnitPrice?: number;
      totalCost?: number;
      priceUpdateMode?: 'moving_average' | 'last_price' | 'keep_old';
    }
  ) => {
    const item = state.ingredients.find(i => i.id === ingredientId);
    if (!item) return;

    const unitPrice = options?.newUnitPrice !== undefined && options.newUnitPrice > 0
      ? options.newUnitPrice
      : item.hargaPerSatuan;

    const realCost = options?.totalCost !== undefined && options.totalCost > 0
      ? options.totalCost
      : Math.round(additionalStock * unitPrice);

    const priceMode = options?.priceUpdateMode || 'moving_average';

    // Calculate final unit price for ingredient master
    let finalUnitPrice = item.hargaPerSatuan;
    if (priceMode === 'last_price') {
      finalUnitPrice = Math.round(unitPrice * 100) / 100;
    } else if (priceMode === 'moving_average') {
      const oldStock = Math.max(0, item.stokSaatIni);
      const totalNewStock = oldStock + additionalStock;
      if (totalNewStock > 0) {
        finalUnitPrice = Math.round(((oldStock * item.hargaPerSatuan) + realCost) / totalNewStock * 100) / 100;
      }
    }

    const nextIngredients = state.ingredients.map(i =>
      i.id === ingredientId
        ? { ...i, stokSaatIni: i.stokSaatIni + additionalStock, hargaPerSatuan: finalUnitPrice }
        : i
    );

    // Automatically recalculate HPP for all menus using this ingredient
    const nextMenus = state.menus.map(menu => {
      const usesIngredient = state.recipes.some(r => r.menuId === menu.id && r.ingredientId === ingredientId);
      if (usesIngredient) {
        return { ...menu, hpp: calculateMenuHpp(menu.id, state.recipes, nextIngredients) };
      }
      return menu;
    });

    const isMarketplace = source === 'Marketplace';

    // Create cash transaction for stock purchase with the exact real cost paid
    const newTx: CashTransaction = {
      id: `CTX-STK-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: isMarketplace ? 'Beli Marketplace' : 'Belanja Langsung',
      tipe: 'Keluar',
      metode: isMarketplace ? 'Bank' : 'Tunai',
      nominal: realCost,
      keterangan: `Restock ${item.namaBahan} (${additionalStock} ${item.satuan} @ Rp ${unitPrice.toLocaleString('id-ID')}) via ${isMarketplace ? 'Marketplace (Kas Bank)' : 'Belanja Langsung (Kas Tunai)'}`,
      createdAt: new Date().toISOString(),
    };

    const nextState = {
      ...state,
      ingredients: nextIngredients,
      menus: nextMenus,
      cashTransactions: [newTx, ...(state.cashTransactions || [])],
    };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Restock ${item.namaBahan} berhasil! Kas ${isMarketplace ? 'Bank' : 'Tunai'} terpotong Rp ${realCost.toLocaleString('id-ID')} & HPP menu disesuaikan.`);
  };

  // Monthly Report & Cash Reconciliation Handlers
  const handleSaveMonthlyReport = (report: MonthlyClosingReport) => {
    const existingIndex = (state.monthlyReports || []).findIndex(r => r.bulanTahun === report.bulanTahun);
    let updatedReports = [...(state.monthlyReports || [])];
    if (existingIndex >= 0) {
      updatedReports[existingIndex] = report;
    } else {
      updatedReports.push(report);
    }
    const nextState = { ...state, monthlyReports: updatedReports };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Laporan dan rekonsiliasi kas ${report.bulanTahun} (${report.status === 'Closed' ? 'Tutup Buku Selesai' : 'Tersimpan'}) berhasil diperbarui.`);
  };

  const handleAddCashTransaction = (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    const newTx: CashTransaction = {
      ...tx,
      id: `CTX-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    const nextState = {
      ...state,
      cashTransactions: [newTx, ...(state.cashTransactions || [])],
    };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Transaksi kas ${tx.kategori} sebesar Rp ${tx.nominal.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  // Kasbon Management
  const handleAddKasbon = (kasbon: Omit<Kasbon, 'id' | 'createdAt'>) => {
    const newKasbon: Kasbon = {
      ...kasbon,
      id: `KSB-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    const nextState = { ...state, kasbon: [newKasbon, ...state.kasbon] };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Kasbon sebesar Rp ${kasbon.nominal.toLocaleString('id-ID')} untuk ${kasbon.userName} berhasil dicatat.`);
  };

  const handleUpdateKasbonStatus = (id: string, status: Kasbon['status']) => {
    const nextKasbon = state.kasbon.map(k => k.id === id ? { ...k, status } : k);
    const nextState = { ...state, kasbon: nextKasbon };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Status kasbon diperbarui ke ${status}.`);
  };

  // Auto-Deduction Payroll Generation
  const handleGenerateMonthlyPayroll = (monthYear: string) => {
    const activeStaff = state.users.filter(u => u.role === 'karyawan' && u.status === 'aktif');
    const newPayrollList: Payroll[] = [];

    activeStaff.forEach(user => {
      // 1. Working days (Hadir) and dates attended in that month
      const userHadirDates = new Set(
        state.absensi
          .filter(a => a.userId === user.id && a.tanggal.startsWith(monthYear) && a.statusHadir === 'Hadir')
          .map(a => a.tanggal)
      );
      const totalHariKerja = userHadirDates.size;

      // 2. Total cups sold on dates where this employee was Hadir (all present staff earn bonus)
      let totalCup = 0;
      state.closings.forEach(c => {
        if (c.tanggal.startsWith(monthYear) && userHadirDates.has(c.tanggal)) {
          totalCup += c.totalCup;
        }
      });
      const totalBonus = totalCup * user.bonusPerCup;

      // 3. Total kasbon to deduct
      const userApprovedKasbon = state.kasbon.filter(
        k => k.userId === user.id && k.status === 'Disetujui'
      );
      const totalKasbon = userApprovedKasbon.reduce((acc, k) => acc + k.nominal, 0);

      // Daily wage formula: Gaji Pokok Harian = Total Hari Kerja Hadir × Tarif Harian (Rp 50.000)
      const tarifHarian = user.tarifHarian || 50000;
      const gajiPokok = totalHariKerja * tarifHarian;

      // Formula: GajiBersih (TakeHomePay) = (GajiPokok + TotalBonusCup) - TotalKasbon
      const gajiBersih = Math.max(0, (gajiPokok + totalBonus) - totalKasbon);

      newPayrollList.push({
        id: `PAY-${monthYear.replace(/-/g, '')}-${user.id}`,
        bulanTahun: monthYear,
        userId: user.id,
        userName: user.nama,
        tarifHarian,
        totalHariKerja,
        gajiPokok,
        totalCup,
        bonusPerCup: user.bonusPerCup,
        totalBonus,
        totalKasbon,
        gajiBersih,
        status: 'Draft',
      });
    });

    // Mark those kasbons as 'Dipotong Payroll'
    const updatedKasbon = state.kasbon.map(k => {
      if (k.status === 'Disetujui') {
        return { ...k, status: 'Dipotong Payroll' as const };
      }
      return k;
    });

    const otherPayroll = state.payroll.filter(p => p.bulanTahun !== monthYear);
    const nextState: AppState = {
      ...state,
      payroll: [...otherPayroll, ...newPayrollList],
      kasbon: updatedKasbon,
    };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Payroll periode ${monthYear} berhasil dikalkulasi untuk ${activeStaff.length} karyawan.`);
  };

  const handleUpdatePayrollStatus = (payrollId: string, status: Payroll['status']) => {
    const nextPayroll = state.payroll.map(p =>
      p.id === payrollId ? { ...p, status, tanggalBayar: new Date().toISOString().slice(0, 10) } : p
    );
    const nextState = { ...state, payroll: nextPayroll };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Status payroll berhasil diubah ke ${status}.`);
  };

  // User Management
  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const nextUsers = [...state.users, { ...user, id: newId }];
    const nextState = { ...state, users: nextUsers };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Akun pengguna ${user.nama} berhasil didaftarkan.`);
  };

  const handleUpdateUser = (user: User) => {
    const nextUsers = state.users.map(u => u.id === user.id ? user : u);
    const nextState = { ...state, users: nextUsers };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Data akun ${user.nama} berhasil disimpan.`);
  };

  const handleToggleUserStatus = (userId: string) => {
    const nextUsers = state.users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'aktif' ? ('nonaktif' as const) : ('aktif' as const);
        return { ...u, status: nextStatus };
      }
      return u;
    });
    const nextState = { ...state, users: nextUsers };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Status keaktifan karyawan diperbarui.`);
  };

  const handleResetData = () => {
    const resetState = resetToDefaultState();
    setState(resetState);
    showToast('Database berhasil direset ke data awal demo 500+ cup/hari.');
  };

  // If not logged in, show the dedicated Login page first
  if (!currentUser) {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-5 right-4 z-50 max-w-md bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
          </div>
        )}
        <LoginPage
          users={state.users}
          onLoginSuccess={handleLoginSuccess}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        users={state.users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
          </div>
        )}

        {/* View 1: Karyawan POS & Closing View */}
        {activeView === 'karyawan' && (
          <EmployeeHome
            currentUser={currentUser}
            absensiList={state.absensi}
            closingsList={state.closings}
            kasbonList={state.kasbon}
            menus={state.menus}
            expenseMaster={state.expenseMaster || []}
            onAddIzin={handleAddIzin}
            onCheckInAttendance={handleCheckInAttendance}
            onSubmitClosing={handleSubmitClosing}
          />
        )}

        {/* View 2: Owner Portal */}
        {activeView === 'owner' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Owner Tab Navigation */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setOwnerTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'dashboard'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard &amp; Penjualan</span>
              </button>

              <button
                onClick={() => setOwnerTab('monthly-report')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'monthly-report'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>Laporan Bulanan &amp; Kas</span>
              </button>

              <button
                onClick={() => setOwnerTab('menus')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'menus'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Kelola Menu &amp; HPP</span>
              </button>

              <button
                onClick={() => setOwnerTab('stock')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'stock'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Stok Bahan Baku</span>
              </button>

              <button
                onClick={() => setOwnerTab('attendance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'attendance'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Rekap Absensi Karyawan</span>
              </button>

              <button
                onClick={() => setOwnerTab('kasbon')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'kasbon'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Kasbon Karyawan</span>
              </button>

              <button
                onClick={() => setOwnerTab('payroll')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'payroll'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Payroll &amp; Slip Gaji</span>
              </button>

              <button
                onClick={() => setOwnerTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  ownerTab === 'users'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Kelola Karyawan (RBAC)</span>
              </button>
            </div>

            {/* Owner Tab Content */}
            {ownerTab === 'dashboard' && (
              <OwnerDashboard
                closings={state.closings}
                menus={state.menus}
                ingredients={state.ingredients}
                recipes={state.recipes}
                users={state.users}
                monthlyReports={state.monthlyReports || []}
                cashTransactions={state.cashTransactions || []}
                onRestock={handleRestock}
                onNavigateToStock={() => setOwnerTab('stock')}
                onNavigateToMonthlyReport={() => setOwnerTab('monthly-report')}
              />
            )}

            {ownerTab === 'monthly-report' && (
              <MonthlyReportAndCashReconciliation
                closings={state.closings}
                cashTransactions={state.cashTransactions || []}
                monthlyReports={state.monthlyReports || []}
                payroll={state.payroll}
                users={state.users}
                onSaveMonthlyReport={handleSaveMonthlyReport}
                onAddCashTransaction={handleAddCashTransaction}
              />
            )}

            {ownerTab === 'menus' && (
              <MenuAndHppManagement
                menus={state.menus}
                ingredients={state.ingredients}
                recipes={state.recipes}
                expenseMaster={state.expenseMaster || []}
                onSaveMenu={handleSaveMenu}
                onToggleMenuStatus={handleToggleMenuStatus}
                onUpdateExpenseMaster={handleUpdateExpenseMaster}
              />
            )}

            {ownerTab === 'stock' && (
              <StockManagement
                ingredients={state.ingredients}
                onUpdateIngredient={handleUpdateIngredient}
                onAddIngredient={handleAddIngredient}
                onRestock={handleRestock}
              />
            )}

            {ownerTab === 'attendance' && (
              <AttendanceRecap
                absensiList={state.absensi}
                users={state.users}
              />
            )}

            {ownerTab === 'kasbon' && (
              <KasbonManagement
                kasbonList={state.kasbon}
                users={state.users}
                onAddKasbon={handleAddKasbon}
                onUpdateKasbonStatus={handleUpdateKasbonStatus}
              />
            )}

            {ownerTab === 'payroll' && (
              <PayrollManagement
                payrollList={state.payroll}
                users={state.users}
                closings={state.closings}
                kasbonList={state.kasbon}
                absensiList={state.absensi}
                onGenerateMonthlyPayroll={handleGenerateMonthlyPayroll}
                onUpdatePayrollStatus={handleUpdatePayrollStatus}
              />
            )}

            {ownerTab === 'users' && (
              <UserManagement
                users={state.users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onToggleUserStatus={handleToggleUserStatus}
              />
            )}
          </div>
        )}
      </main>

      {/* Google Sheets Sync & Backup Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        appState={state}
        onResetData={handleResetData}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
