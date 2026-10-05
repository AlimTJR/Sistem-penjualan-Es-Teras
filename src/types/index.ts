// Type definitions for Sistem Manajemen Operasional & POS Kedai Teras
// Based on Project Brief v1.1

export type UserRole = 'owner' | 'karyawan';
export type UserStatus = 'aktif' | 'nonaktif';
export type AttendanceStatus = 'Hadir' | 'Izin';
export type KasbonStatus = 'Pending' | 'Disetujui' | 'Lunas' | 'Dipotong Payroll';
export type PayrollStatus = 'Draft' | 'Dibayar';

export interface User {
  id: string;
  nama: string;
  username: string;
  password?: string;
  role: UserRole;
  tarifHarian: number; // Tarif harian per hari kerja (default Rp 50.000)
  gajiPokok?: number; // Akumulasi / estimasi bulanan
  bonusPerCup: number; // e.g. 200 per cup
  status: UserStatus;
  noHp?: string;
  jabatan?: string;
}

export interface Absensi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  userId: string;
  statusHadir: AttendanceStatus;
  laporanKegiatan?: string; // Deskripsi kegiatan harian karyawan (e.g. Selesai membersihkan teras & alat press cup)
  keteranganIzin?: string;
  closingIdRef?: string;
  timestamp?: string;
}

export interface Menu {
  id: string;
  namaMenu: string;
  kategori: 'Teh' | 'Kopi' | 'Susu' | 'Yakult' | 'Lainnya';
  jenisCup: '16oz' | '22oz';
  hargaJual: number;
  hpp: number;
  status: 'aktif' | 'nonaktif';
  gambar?: string;
  deskripsi?: string;
}

export interface Ingredient {
  id: string;
  namaBahan: string;
  satuan: 'gram' | 'ml' | 'pcs' | 'bal' | 'kg' | 'lembar';
  stokSaatIni: number;
  minStok: number;
  hargaPerSatuan: number; // Rupiah per unit
}

export interface Recipe {
  id: string;
  menuId: string;
  ingredientId: string;
  qtyPerCup: number;
}

export interface ClosingMenuDetail {
  menuId: string;
  namaMenu: string;
  jenisCup: '16oz' | '22oz';
  hargaJual: number;
  hpp: number;
  qty: number;
  subtotal: number;
}

export interface OperationalExpenseMaster {
  id: string;
  nama: string;
  satuan: string; // e.g. sak, galon, pcs, pack
  hargaSatuan: number; // Configurable by Owner in HPP / Dashboard
}

export interface ExpenseItem {
  id: string;
  masterId?: string;
  nama: string;
  jumlah: number; // Input by employee (e.g. 3 sak, 5 pcs cup rusak)
  satuan: string; // e.g. sak, galon, pcs
  hargaSatuan: number; // Set by Owner (e.g. 15.000, 500)
  nominal: number; // Automatically calculated: jumlah * hargaSatuan
  catatan?: string;
}

export interface CashInItem {
  id: string;
  sumber: string;
  nominal: number;
  catatan?: string;
}

export interface Closing {
  id: string;
  tanggal: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  menuDetails: ClosingMenuDetail[];
  totalCup: number;
  totalPenjualan: number;
  pengeluaranCash: ExpenseItem[];
  totalPengeluaran: number;
  pembayaranHutang: CashInItem[]; // Pemasukan kas / bayar hutang dari pihak luar
  totalPembayaranHutang: number;
  totalKas: number; // Total Kas = Penjualan + Pembayaran Hutang - Pengeluaran Cash
  catatanPeristiwa: string; // Catatan penting lapak (cuaca, mesin, stok)
  createdAt: string;
}

export interface Kasbon {
  id: string;
  tanggal: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  nominal: number;
  status: KasbonStatus;
  catatan: string;
  createdAt: string;
}

export interface Payroll {
  id: string;
  bulanTahun: string; // YYYY-MM
  userId: string;
  userName: string;
  tarifHarian: number; // e.g. Rp 50.000 / hari
  totalHariKerja: number;
  gajiPokok: number; // totalHariKerja * tarifHarian
  totalCup: number;
  bonusPerCup: number;
  totalBonus: number;
  totalKasbon: number;
  gajiBersih: number; // (GajiPokok + TotalBonus) - TotalKasbon
  status: PayrollStatus;
  tanggalBayar?: string;
}

export type PaymentChannel = 'Tunai' | 'Bank';
export type TutupBukuStatus = 'Open' | 'Closed';

export type CashTransactionCategory =
  | 'Penjualan Laci'
  | 'Setor Bank'
  | 'Belanja Langsung'
  | 'Beli Marketplace'
  | 'Gaji Karyawan'
  | 'Kas Masuk Lain'
  | 'Saldo Awal'
  | 'Penyesuaian';

export interface CashTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kategori: CashTransactionCategory;
  tipe: 'Masuk' | 'Keluar' | 'Transfer';
  metode: PaymentChannel; // Tunai (Lapak) vs Bank (Rekening)
  nominal: number;
  keterangan: string;
  referensiId?: string;
  createdAt: string;
}

export interface MonthlyClosingReport {
  id: string;
  bulanTahun: string; // YYYY-MM (e.g. '2026-09', '2026-10')
  status: TutupBukuStatus; // 'Open' | 'Closed'
  tanggalTutup?: string; // YYYY-MM-DD HH:mm
  ditutupOleh?: string;

  // Saldo Awal
  saldoAwalTunai: number;
  saldoAwalBank: number;

  // Realitas Cek Kas (Rekonsiliasi Fisik & Bank)
  saldoFisikTunai: number;
  saldoNyataBank: number;
  selisihTunai: number; // saldoFisikTunai - saldoAkhirBukuTunai (0 = Sesuai)
  selisihBank: number;  // saldoNyataBank - saldoAkhirBukuBank (0 = Sesuai)
  statusRekonsiliasi: 'Sesuai' | 'Selisih' | 'Belum Dicek';
  catatanRekonsiliasi?: string;
}

export interface AppState {
  users: User[];
  absensi: Absensi[];
  menus: Menu[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  expenseMaster: OperationalExpenseMaster[];
  closings: Closing[];
  kasbon: Kasbon[];
  payroll: Payroll[];
  cashTransactions: CashTransaction[];
  monthlyReports: MonthlyClosingReport[];
  currentUserId: string | null; // null represents the Login Page
}
