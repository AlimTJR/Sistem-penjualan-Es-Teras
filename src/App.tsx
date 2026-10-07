import React, { useState, useEffect } from 'react';
import {
  Coffee, BarChart3, Layers, Package, UserCheck,
  CreditCard, FileText, Users, Database, Sparkles, CheckCircle2,
  Landmark, BellRing
} from 'lucide-react';
import {
  AppState, User, Closing, Menu, Ingredient, Recipe,
  Kasbon, Payroll, OperationalExpenseMaster, CashTransaction, MonthlyClosingReport,
  CustomerDebt
} from './types';
import {
  loadAppState, saveAppState, resetToDefaultState,
  deductIngredientsForClosing, calculateMenuHpp, addRecentUserId
} from './utils/storage';
import { getTodayDateStr } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { DebtCollectionReminderModal } from './components/DebtCollectionReminderModal';

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
import {
  testFirebaseConnection, syncStateToFirestore, initFirestoreRealtimeSync
} from './utils/firebase';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeView, setActiveView] = useState<'karyawan' | 'owner'>('karyawan');
  const [ownerTab, setOwnerTab] = useState<
    'dashboard' | 'monthly-report' | 'menus' | 'stock' | 'attendance' | 'kasbon' | 'payroll' | 'users'
  >('dashboard');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [showLoginDebtReminder, setShowLoginDebtReminder] = useState(false);

  const currentUser = state.currentUserId
    ? state.users.find(u => u.id === state.currentUserId) || null
    : null;

  // Centralized State Update + Real-Time Firebase Firestore Synchronization
  const updateAppState = (nextState: AppState, actionName: string = 'update') => {
    setState(nextState);
    saveAppState(nextState);
    syncStateToFirestore(nextState, actionName).catch(err => {
      console.warn('[Firebase] Background sync notice:', err);
    });
  };

  // Firebase connection and two-way real-time cloud listener (Firestore Snapshot Sync)
  useEffect(() => {
    let isSubscribed = true;

    testFirebaseConnection().then(connected => {
      if (isSubscribed) {
        setIsFirebaseOnline(connected);
      }
    });

    const unsubscribe = initFirestoreRealtimeSync((cloudState) => {
      if (!isSubscribed) return;
      console.log('[Firebase] Real-time state received from Firestore sync!');
      setState(prev => {
        const merged: AppState = {
          ...prev,
          ...cloudState,
          currentUserId: prev.currentUserId, // Keep active local session
        };
        saveAppState(merged);
        return merged;
      });
      setIsFirebaseOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
    }, state);

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

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
    addRecentUserId(user.id);
    const nextState = { ...state, currentUserId: user.id };
    setState(nextState);
    saveAppState(nextState);
    setActiveView(user.role === 'owner' ? 'owner' : 'karyawan');
    showToast(`Selamat datang, ${user.nama}! Berhasil masuk sebagai ${user.role.toUpperCase()}.`);

    // Next-day debt collection reminder for employees
    if (user.role === 'karyawan') {
      const today = getTodayDateStr();
      const hasUnpaidOldDebts = (state.customerDebts || []).some(
        d => d.status === 'Belum Lunas' && d.tanggal < today
      );
      if (hasUnpaidOldDebts) {
        setTimeout(() => {
          setShowLoginDebtReminder(true);
        }, 500);
      }
    }
  };

  const handleLogout = () => {
    const nextState = { ...state, currentUserId: null };
    setState(nextState);
    saveAppState(nextState);
    setShowLoginDebtReminder(false);
    showToast('Anda telah berhasil keluar dari sesi.');
  };

  const handleSelectUser = (user: User) => {
    const nextState = { ...state, currentUserId: user.id };
    setState(nextState);
    saveAppState(nextState);
    showToast(`Beralih akun ke: ${user.nama} (${user.role})`);
  };

  // Submit / Revise Closing Lapak & Backward Stock Deduction
  const handleSubmitClosing = (
    closingData: Omit<Closing, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    // REVISION MODE (Owner revising closing on any unlocked date)
    if (existingId) {
      const existingClosing = state.closings.find(c => c.id === existingId);
      const revisedClosing: Closing = {
        ...closingData,
        id: existingId,
        createdAt: existingClosing?.createdAt || new Date().toISOString(),
      };

      // 1. Restore previous stock deduction
      let updatedIngredients = [...state.ingredients];
      if (existingClosing) {
        for (const item of existingClosing.menuDetails) {
          if (item.qty <= 0) continue;
          const itemRecipes = state.recipes.filter(r => r.menuId === item.menuId);
          for (const r of itemRecipes) {
            const addBack = r.qtyPerCup * item.qty;
            const ingIdx = updatedIngredients.findIndex(i => i.id === r.ingredientId);
            if (ingIdx >= 0) {
              updatedIngredients[ingIdx] = {
                ...updatedIngredients[ingIdx],
                stokSaatIni: updatedIngredients[ingIdx].stokSaatIni + addBack,
              };
            }
          }
        }
      }

      // 2. Apply new deduction
      updatedIngredients = deductIngredientsForClosing(revisedClosing, state.recipes, updatedIngredients);

      // 3. Re-create / update cash transactions for this closing
      const cleanTxList = (state.cashTransactions || []).filter(tx => tx.referensiId !== existingId);
      const newTxList: CashTransaction[] = [
        {
          id: `CTX-CLS-${Date.now().toString().slice(-6)}`,
          tanggal: revisedClosing.tanggal,
          kategori: 'Penjualan Laci',
          tipe: 'Masuk',
          metode: 'Tunai',
          nominal: revisedClosing.totalPenjualan,
          keterangan: `Penjualan Kasir Lapak (${revisedClosing.totalCup} cup oleh ${revisedClosing.userName}) [Revisi]`,
          referensiId: revisedClosing.id,
          createdAt: new Date().toISOString(),
        },
      ];

      if (revisedClosing.totalPengeluaran > 0) {
        newTxList.push({
          id: `CTX-EXP-${Date.now().toString().slice(-6)}`,
          tanggal: revisedClosing.tanggal,
          kategori: 'Belanja Langsung',
          tipe: 'Keluar',
          metode: 'Tunai',
          nominal: revisedClosing.totalPengeluaran,
          keterangan: `Pengeluaran Cash Lapak Harian (${revisedClosing.pengeluaranCash.map(e => e.nama).join(', ')}) [Revisi]`,
          referensiId: revisedClosing.id,
          createdAt: new Date().toISOString(),
        });
      }

      if (revisedClosing.totalPembayaranHutang > 0) {
        newTxList.push({
          id: `CTX-IN-${Date.now().toString().slice(-6)}`,
          tanggal: revisedClosing.tanggal,
          kategori: 'Kas Masuk Lain',
          tipe: 'Masuk',
          metode: 'Tunai',
          nominal: revisedClosing.totalPembayaranHutang,
          keterangan: `Pemasukan Kas Lapak Lainnya (${revisedClosing.pembayaranHutang.map(h => h.sumber).join(', ')}) [Revisi]`,
          referensiId: revisedClosing.id,
          createdAt: new Date().toISOString(),
        });
      }

      // Merge customerDebts if any
      let updatedDebts = [...(state.customerDebts || [])];
      if (revisedClosing.customerDebts && revisedClosing.customerDebts.length > 0) {
        revisedClosing.customerDebts.forEach(debt => {
          if (!updatedDebts.some(d => d.id === debt.id)) {
            updatedDebts.push(debt);
          }
        });
      }

      const nextClosings = state.closings.map(c => c.id === existingId ? revisedClosing : c);
      const nextState: AppState = {
        ...state,
        closings: nextClosings,
        ingredients: updatedIngredients,
        cashTransactions: [...newTxList, ...cleanTxList],
        customerDebts: updatedDebts,
      };

      updateAppState(nextState, 'revise_closing');
      showToast(`Laporan closing tanggal ${revisedClosing.tanggal} berhasil direvisi oleh Owner! Data kas & stok sinkron realtime.`);
      return;
    }

    // NEW CLOSING MODE
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

    // Merge customer debts
    let updatedDebts = [...(state.customerDebts || [])];
    if (newClosing.customerDebts && newClosing.customerDebts.length > 0) {
      newClosing.customerDebts.forEach(d => {
        if (!updatedDebts.some(ex => ex.id === d.id)) {
          updatedDebts.push(d);
        }
      });
    }

    const nextState: AppState = {
      ...state,
      closings: [newClosing, ...state.closings],
      ingredients: updatedIngredients,
      cashTransactions: [...newTxList, ...(state.cashTransactions || [])],
      customerDebts: updatedDebts,
    };

    updateAppState(nextState, 'new_closing');
    showToast(`Closing lapak berhasil dikirim! Kas laci & stok bahan baku otomatis terupdate.`);
  };

  // Dedicated Employee Check-In Attendance with Daily Activity Report
  // NOTE: "absen kehadiran owner juga tidak berlaku"
  const handleCheckInAttendance = (tanggal: string, laporanKegiatan: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'owner') {
      showToast('Absensi kehadiran tidak berlaku untuk akun Owner.');
      return;
    }

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
    updateAppState(nextState, 'checkin_attendance');
    showToast(`Absensi Hadir berhasil dicatat! Laporan kegiatan Anda telah tersimpan.`);
  };

  // Add leave / izin request
  const handleAddIzin = (tanggal: string, keterangan: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'owner') {
      showToast('Pengajuan izin tidak berlaku untuk akun Owner.');
      return;
    }

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
    updateAppState(nextState, 'add_izin');
    showToast(`Pengajuan izin untuk tanggal ${tanggal} berhasil disimpan.`);
  };

  // Form Pengeluaran untuk Hutang & Catatan Bon Pelanggan
  const handleAddCustomerDebt = (data: {
    namaPelanggan: string;
    nominal: number;
    tanggal: string;
    catatan: string;
    potongKasLaci: boolean;
  }) => {
    const newDebt: CustomerDebt = {
      id: `DEBT-${data.tanggal.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      tanggal: data.tanggal,
      namaPelanggan: data.namaPelanggan,
      nominal: data.nominal,
      catatan: data.catatan,
      status: 'Belum Lunas',
      dicatatOleh: currentUser ? currentUser.nama : 'Kasir',
      createdAt: new Date().toISOString(),
    };

    let nextTxList = [...(state.cashTransactions || [])];
    if (data.potongKasLaci) {
      nextTxList = [
        {
          id: `CTX-DEBT-${Date.now().toString().slice(-6)}`,
          tanggal: data.tanggal,
          kategori: 'Kas Masuk Lain',
          tipe: 'Keluar',
          metode: 'Tunai',
          nominal: data.nominal,
          keterangan: `Kas Keluar untuk Pinjaman/Hutang: ${data.namaPelanggan} (${data.catatan})`,
          createdAt: new Date().toISOString(),
        },
        ...nextTxList,
      ];
    }

    const nextState: AppState = {
      ...state,
      customerDebts: [newDebt, ...(state.customerDebts || [])],
      cashTransactions: nextTxList,
    };
    updateAppState(nextState, 'add_debt');
    showToast(`Hutang sebesar Rp ${data.nominal.toLocaleString('id-ID')} atas nama ${data.namaPelanggan} berhasil dicatat.`);
  };

  // Pelunasan Hutang (Tandai Lunas & Masuk Kas Laci)
  const handleSettleDebt = (debtId: string) => {
    const debt = (state.customerDebts || []).find(d => d.id === debtId);
    if (!debt) return;

    const today = getTodayDateStr();
    const updatedDebts = (state.customerDebts || []).map(d =>
      d.id === debtId
        ? {
            ...d,
            status: 'Lunas' as const,
            tanggalLunas: today,
            dilunasiKe: currentUser ? currentUser.nama : 'Kasir',
          }
        : d
    );

    // Otomatis masukkan uang pelunasan ke Kas Masuk Lain (Tunai)
    const newCashInTx: CashTransaction = {
      id: `CTX-SETTLE-${Date.now().toString().slice(-6)}`,
      tanggal: today,
      kategori: 'Kas Masuk Lain',
      tipe: 'Masuk',
      metode: 'Tunai',
      nominal: debt.nominal,
      keterangan: `Pelunasan Hutang Bon oleh ${debt.namaPelanggan} (${debt.catatan || 'Lunas'})`,
      createdAt: new Date().toISOString(),
    };

    const nextState: AppState = {
      ...state,
      customerDebts: updatedDebts,
      cashTransactions: [newCashInTx, ...(state.cashTransactions || [])],
    };
    updateAppState(nextState, 'settle_debt');
    showToast(`Pelunasan hutang Rp ${debt.nominal.toLocaleString('id-ID')} dari ${debt.namaPelanggan} berhasil dicatat! Kas laci bertambah.`);
  };

  // Force Cloud Sync trigger
  const handleForceCloudSync = async () => {
    showToast('Menghubungkan & menyinkronkan data dengan Google Cloud Firestore...');
    try {
      await syncStateToFirestore(state, 'manual_force_sync');
      setIsFirebaseOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      showToast('Sinkronisasi Firestore Realtime Berhasil! Data di Localhost & AI Studio telah sinkron 100%.');
    } catch (err: any) {
      showToast('Gagal menyinkronkan: ' + (err?.message || 'Koneksi Firestore error'));
    }
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
    updateAppState(nextState, 'save_menu');
    showToast(`Menu ${menu.namaMenu} & resep HPP berhasil disimpan.`);
  };

  const handleToggleMenuStatus = (menuId: string) => {
    const nextMenus = state.menus.map(m =>
      m.id === menuId ? { ...m, status: m.status === 'aktif' ? ('nonaktif' as const) : ('aktif' as const) } : m
    );
    const nextState = { ...state, menus: nextMenus };
    updateAppState(nextState, 'toggle_menu');
  };

  const handleUpdateExpenseMaster = (items: OperationalExpenseMaster[]) => {
    const nextState = { ...state, expenseMaster: items };
    updateAppState(nextState, 'update_expense_master');
    showToast('Daftar master pengeluaran operasional & harga satuan berhasil diperbarui.');
  };

  // Stock Management
  const handleUpdateIngredient = (ingredient: Ingredient) => {
    const nextIngredients = state.ingredients.map(i =>
      i.id === ingredient.id ? ingredient : i
    );
    const nextState = { ...state, ingredients: nextIngredients };
    updateAppState(nextState, 'update_ingredient');
    showToast(`Bahan ${ingredient.namaBahan} berhasil diperbarui.`);
  };

  const handleAddIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    const newId = `ING-${Date.now().toString().slice(-4)}`;
    const nextIngredients = [...state.ingredients, { ...ingredient, id: newId }];
    const nextState = { ...state, ingredients: nextIngredients };
    updateAppState(nextState, 'add_ingredient');
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
      newIsiPerPack?: number;
      newHargaPerPack?: number;
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
        ? {
            ...i,
            stokSaatIni: i.stokSaatIni + additionalStock,
            hargaPerSatuan: finalUnitPrice,
            isiPerPack: options?.newIsiPerPack !== undefined && options.newIsiPerPack > 0 ? options.newIsiPerPack : i.isiPerPack,
            hargaPerPack: options?.newHargaPerPack !== undefined && options.newHargaPerPack > 0
              ? options.newHargaPerPack
              : (options?.newIsiPerPack ? Math.round(finalUnitPrice * options.newIsiPerPack) : (i.isiPerPack ? Math.round(finalUnitPrice * i.isiPerPack) : i.hargaPerPack)),
          }
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
    updateAppState(nextState, 'restock');
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
    updateAppState(nextState, 'save_monthly_report');
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
    updateAppState(nextState, 'add_cash_transaction');
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
    updateAppState(nextState, 'add_kasbon');
    showToast(`Kasbon sebesar Rp ${kasbon.nominal.toLocaleString('id-ID')} untuk ${kasbon.userName} berhasil dicatat.`);
  };

  const handleUpdateKasbonStatus = (id: string, status: Kasbon['status']) => {
    const nextKasbon = state.kasbon.map(k => k.id === id ? { ...k, status } : k);
    const nextState = { ...state, kasbon: nextKasbon };
    updateAppState(nextState, 'update_kasbon_status');
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
    updateAppState(nextState, 'generate_payroll');
    showToast(`Payroll periode ${monthYear} berhasil dikalkulasi untuk ${activeStaff.length} karyawan.`);
  };

  const handleUpdatePayrollStatus = (payrollId: string, status: Payroll['status']) => {
    const nextPayroll = state.payroll.map(p =>
      p.id === payrollId ? { ...p, status, tanggalBayar: new Date().toISOString().slice(0, 10) } : p
    );
    const nextState = { ...state, payroll: nextPayroll };
    updateAppState(nextState, 'update_payroll_status');
    showToast(`Status payroll berhasil diubah ke ${status}.`);
  };

  // User Management
  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const nextUsers = [...state.users, { ...user, id: newId }];
    const nextState = { ...state, users: nextUsers };
    updateAppState(nextState, 'add_user');
    showToast(`Akun pengguna ${user.nama} berhasil didaftarkan.`);
  };

  const handleUpdateUser = (user: User) => {
    const nextUsers = state.users.map(u => u.id === user.id ? user : u);
    const nextState = { ...state, users: nextUsers };
    updateAppState(nextState, 'update_user');
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
    updateAppState(nextState, 'toggle_user_status');
    showToast(`Status keaktifan karyawan diperbarui.`);
  };

  const handleResetData = () => {
    const resetState = resetToDefaultState();
    updateAppState(resetState, 'reset_data');
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
        isCloudConnected={isFirebaseOnline}
        lastSyncTime={lastSyncTime}
        onForceSync={handleForceCloudSync}
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
            customerDebtsList={state.customerDebts || []}
            menus={state.menus}
            expenseMaster={state.expenseMaster || []}
            onAddIzin={handleAddIzin}
            onCheckInAttendance={handleCheckInAttendance}
            onSubmitClosing={handleSubmitClosing}
            onAddCustomerDebt={handleAddCustomerDebt}
            onSettleDebt={handleSettleDebt}
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
                currentUser={currentUser}
                expenseMaster={state.expenseMaster || []}
                monthlyReports={state.monthlyReports || []}
                cashTransactions={state.cashTransactions || []}
                onRestock={handleRestock}
                onNavigateToStock={() => setOwnerTab('stock')}
                onNavigateToMonthlyReport={() => setOwnerTab('monthly-report')}
                onSubmitClosing={handleSubmitClosing}
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

      {/* Auto-Popup Pengingat Penagihan Hutang Kemarin saat Karyawan Login */}
      <DebtCollectionReminderModal
        isOpen={showLoginDebtReminder}
        onClose={() => setShowLoginDebtReminder(false)}
        unpaidDebts={(state.customerDebts || []).filter(
          d => d.status === 'Belum Lunas' && d.tanggal < getTodayDateStr()
        )}
        onSettleDebt={handleSettleDebt}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
