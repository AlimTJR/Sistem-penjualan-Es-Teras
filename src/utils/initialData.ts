import { User, Menu, Ingredient, Recipe, Closing, Kasbon, Absensi, Payroll, OperationalExpenseMaster, CashTransaction, MonthlyClosingReport } from '../types';

export const initialUsers: User[] = [
  {
    id: 'USR-01',
    nama: 'Hendra Wijaya',
    username: 'owner',
    password: '123',
    role: 'owner',
    tarifHarian: 0,
    gajiPokok: 0,
    bonusPerCup: 0,
    status: 'aktif',
    noHp: '081234567890',
    jabatan: 'Owner / Pengelola Kedai',
  },
  {
    id: 'USR-02',
    nama: 'Budi Santoso',
    username: 'budi',
    password: '123',
    role: 'karyawan',
    tarifHarian: 50000, // Rp 50.000 / hari kerja Hadir
    gajiPokok: 1250000,
    bonusPerCup: 250,
    status: 'aktif',
    noHp: '081398765432',
    jabatan: 'Head Barista & Closing Lead',
  },
  {
    id: 'USR-03',
    nama: 'Siti Rahma',
    username: 'siti',
    password: '123',
    role: 'karyawan',
    tarifHarian: 50000, // Rp 50.000 / hari kerja Hadir
    gajiPokok: 1200000,
    bonusPerCup: 200,
    status: 'aktif',
    noHp: '085712344321',
    jabatan: 'Barista Lapak',
  },
  {
    id: 'USR-04',
    nama: 'Rian Pratama',
    username: 'rian',
    password: '123',
    role: 'karyawan',
    tarifHarian: 50000, // Rp 50.000 / hari kerja Hadir
    gajiPokok: 1200000,
    bonusPerCup: 200,
    status: 'aktif',
    noHp: '087811223344',
    jabatan: 'Crew Operasional',
  },
  {
    id: 'USR-05',
    nama: 'Dewi Lestari',
    username: 'dewi',
    password: '123',
    role: 'karyawan',
    tarifHarian: 50000,
    gajiPokok: 1000000,
    bonusPerCup: 200,
    status: 'nonaktif', // Resigned employee (soft delete preserved for audit)
    noHp: '089988776655',
    jabatan: 'Mantan Barista (Resign Sept 2026)',
  },
];

export const initialIngredients: Ingredient[] = [
  { id: 'ING-01', namaBahan: 'Daun Teh Racik Teras', satuan: 'gram', satuanKemasan: 'pack', isiPerPack: 1000, hargaPerPack: 70000, stokSaatIni: 14500, minStok: 5000, hargaPerSatuan: 70 }, // Rp 70.000 / 1.000g = Rp 70/g
  { id: 'ING-02', namaBahan: 'Biji Kopi House Blend', satuan: 'gram', satuanKemasan: 'pack', isiPerPack: 1000, hargaPerPack: 140000, stokSaatIni: 8200, minStok: 3000, hargaPerSatuan: 140 }, // Rp 140.000 / 1.000g = Rp 140/g
  { id: 'ING-03', namaBahan: 'Susu UHT Segar', satuan: 'ml', satuanKemasan: 'dus (1 Liter)', isiPerPack: 1000, hargaPerPack: 18000, stokSaatIni: 45000, minStok: 15000, hargaPerSatuan: 18 }, // Rp 18.000 / 1.000ml = Rp 18/ml
  { id: 'ING-04', namaBahan: 'Gula Aren Cair Asli', satuan: 'ml', satuanKemasan: 'jerigen (5L)', isiPerPack: 5000, hargaPerPack: 225000, stokSaatIni: 18500, minStok: 6000, hargaPerSatuan: 45 }, // Rp 225.000 / 5.000ml = Rp 45/ml
  { id: 'ING-05', namaBahan: 'Sirup Buah (Lemon/Lychee/Berry)', satuan: 'ml', satuanKemasan: 'botol (2L)', isiPerPack: 2000, hargaPerPack: 110000, stokSaatIni: 12000, minStok: 4000, hargaPerSatuan: 55 }, // Rp 110.000 / 2.000ml = Rp 55/ml
  { id: 'ING-06', namaBahan: 'Yakult Original', satuan: 'pcs', satuanKemasan: 'pack (5 btl)', isiPerPack: 5, hargaPerPack: 11000, stokSaatIni: 45, minStok: 100, hargaPerSatuan: 2200 }, // Rp 11.000 / 5 btl = Rp 2.200/btl (Kritis: 45 btl)
  { id: 'ING-07', namaBahan: 'Cup Plastik 16oz Custom Sablon', satuan: 'pcs', satuanKemasan: 'slop (50 pcs)', isiPerPack: 50, hargaPerPack: 21000, stokSaatIni: 2850, minStok: 1000, hargaPerSatuan: 420 }, // Rp 21.000 / 50 pcs = Rp 420/pcs
  { id: 'ING-08', namaBahan: 'Cup Plastik 22oz Custom Sablon', satuan: 'pcs', satuanKemasan: 'slop (50 pcs)', isiPerPack: 50, hargaPerPack: 27500, stokSaatIni: 650, minStok: 800, hargaPerSatuan: 550 }, // Rp 27.500 / 50 pcs = Rp 550/pcs (Waspada: 650 pcs)
  { id: 'ING-09', namaBahan: 'Lid Sealer Roll Logo Kedai', satuan: 'lembar', satuanKemasan: 'roll (1.200 lembar)', isiPerPack: 1200, hargaPerPack: 78000, stokSaatIni: 4800, minStok: 1500, hargaPerSatuan: 65 }, // Rp 78.000 / 1.200 lembar = Rp 65/lembar
  { id: 'ING-10', namaBahan: 'Sedotan Steril Lancip', satuan: 'pcs', satuanKemasan: 'pack (100 pcs)', isiPerPack: 100, hargaPerPack: 5000, stokSaatIni: 5200, minStok: 1500, hargaPerSatuan: 50 }, // Rp 5.000 / 100 pcs = Rp 50/pcs
  { id: 'ING-11', namaBahan: 'Gula Pasir Kristal', satuan: 'gram', satuanKemasan: 'kantong (1 kg)', isiPerPack: 1000, hargaPerPack: 17500, stokSaatIni: 22000, minStok: 8000, hargaPerSatuan: 17.5 }, // Rp 17.500 / kantong 1.000g = Rp 17.5/g
  { id: 'ING-12', namaBahan: 'Susu Kental Manis', satuan: 'gram', satuanKemasan: 'kaleng (500g)', isiPerPack: 500, hargaPerPack: 15000, stokSaatIni: 6500, minStok: 2500, hargaPerSatuan: 30 }, // Rp 15.000 / 500g = Rp 30/g
];

export const initialMenus: Menu[] = [
  {
    id: 'MN-01',
    namaMenu: 'Es Teh Original Teras 16oz',
    kategori: 'Teh',
    jenisCup: '16oz',
    hargaJual: 4000,
    hpp: 1100,
    status: 'aktif',
    deskripsi: 'Teh melati racikan khas Kedai Teras dengan aroma wangi dan sepet mantap.',
  },
  {
    id: 'MN-02',
    namaMenu: 'Es Teh Original Teras Jumbo 22oz',
    kategori: 'Teh',
    jenisCup: '22oz',
    hargaJual: 5000,
    hpp: 1450,
    status: 'aktif',
    deskripsi: 'Porsi puas 22oz racikan teh khas lapak.',
  },
  {
    id: 'MN-03',
    namaMenu: 'Es Teh Lemon Segar 16oz',
    kategori: 'Teh',
    jenisCup: '16oz',
    hargaJual: 7000,
    hpp: 2150,
    status: 'aktif',
    deskripsi: 'Perpaduan teh dingin pekat dengan sirup lemon segar alami.',
  },
  {
    id: 'MN-04',
    namaMenu: 'Es Teh Lychee Teras 22oz',
    kategori: 'Teh',
    jenisCup: '22oz',
    hargaJual: 9000,
    hpp: 2650,
    status: 'aktif',
    deskripsi: 'Teh wangi dengan sirup leci dan aroma manis menyegarkan.',
  },
  {
    id: 'MN-05',
    namaMenu: 'Kopi Susu Gula Aren Teras 16oz',
    kategori: 'Kopi',
    jenisCup: '16oz',
    hargaJual: 10000,
    hpp: 3850,
    status: 'aktif',
    deskripsi: 'Menu terlaris! Espresso house blend, susu creamy, dan gula aren organik.',
  },
  {
    id: 'MN-06',
    namaMenu: 'Kopi Susu Aren Jumbo 22oz',
    kategori: 'Kopi',
    jenisCup: '22oz',
    hargaJual: 13000,
    hpp: 4950,
    status: 'aktif',
    deskripsi: 'Porsi besar kopi susu aren untuk teman nongkrong seharian.',
  },
  {
    id: 'MN-07',
    namaMenu: 'Kopi Gula Kelapa 16oz',
    kategori: 'Kopi',
    jenisCup: '16oz',
    hargaJual: 11000,
    hpp: 4100,
    status: 'aktif',
    deskripsi: 'Kopi susu berpadu rasa gurih manis gula kelapa khas nusantara.',
  },
  {
    id: 'MN-08',
    namaMenu: 'Susu Karamel Manis 16oz',
    kategori: 'Susu',
    jenisCup: '16oz',
    hargaJual: 10000,
    hpp: 3450,
    status: 'aktif',
    deskripsi: 'Susu segar UHT berpadu saus karamel lezat, cocok untuk non-kopi.',
  },
  {
    id: 'MN-09',
    namaMenu: 'Susu Coklat Teras 16oz',
    kategori: 'Susu',
    jenisCup: '16oz',
    hargaJual: 10000,
    hpp: 3550,
    status: 'aktif',
    deskripsi: 'Susu kental gurih dengan bubuk kakao pekat kaya rasa.',
  },
  {
    id: 'MN-10',
    namaMenu: 'Yakult Lemon Berry 16oz',
    kategori: 'Yakult',
    jenisCup: '16oz',
    hargaJual: 11000,
    hpp: 4200,
    status: 'aktif',
    deskripsi: 'Sensasi probiotik Yakult dingin dipadukan buah berry asam manis.',
  },
  {
    id: 'MN-11',
    namaMenu: 'Yakult Mango Splash 16oz',
    kategori: 'Yakult',
    jenisCup: '16oz',
    hargaJual: 11000,
    hpp: 4200,
    status: 'aktif',
    deskripsi: 'Yakult segar berpadu sari mangga harum tropis.',
  },
];

export const initialExpenseMaster: OperationalExpenseMaster[] = [
  { id: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', satuan: 'sak', hargaSatuan: 15000 },
  { id: 'EXP-M-02', nama: 'Air Galon Mineral', satuan: 'galon', hargaSatuan: 20000 },
  { id: 'EXP-M-03', nama: 'Cup Rusak / Gagal Sealer', satuan: 'pcs', hargaSatuan: 500 }, // Preset cup rusak
  { id: 'EXP-M-04', nama: 'Token Listrik Lapak (PLN)', satuan: 'voucher', hargaSatuan: 50000 },
  { id: 'EXP-M-05', nama: 'Tagihan Air Bersih / PDAM', satuan: 'bulan', hargaSatuan: 75000 },
  { id: 'EXP-M-06', nama: 'Tagihan Internet WiFi Lapak', satuan: 'bulan', hargaSatuan: 250000 },
  { id: 'EXP-M-07', nama: 'Retribusi Kebersihan & Keamanan Lapak', satuan: 'hari', hargaSatuan: 5000 },
  { id: 'EXP-M-08', nama: 'Sabun Cuci & Spons Lapak', satuan: 'paket', hargaSatuan: 12000 },
  { id: 'EXP-M-09', nama: 'Gas Portabel / Korek Lapak', satuan: 'kaleng', hargaSatuan: 22000 },
];

export const initialRecipes: Recipe[] = [
  // Es Teh 16oz
  { id: 'RCP-01', menuId: 'MN-01', ingredientId: 'ING-01', qtyPerCup: 10 }, // 10g teh
  { id: 'RCP-02', menuId: 'MN-01', ingredientId: 'ING-11', qtyPerCup: 18 }, // 18g gula
  { id: 'RCP-03', menuId: 'MN-01', ingredientId: 'ING-07', qtyPerCup: 1 },  // Cup 16oz
  { id: 'RCP-04', menuId: 'MN-01', ingredientId: 'ING-09', qtyPerCup: 1 },  // Lid
  { id: 'RCP-05', menuId: 'MN-01', ingredientId: 'ING-10', qtyPerCup: 1 },  // Straw

  // Es Teh 22oz
  { id: 'RCP-06', menuId: 'MN-02', ingredientId: 'ING-01', qtyPerCup: 14 },
  { id: 'RCP-07', menuId: 'MN-02', ingredientId: 'ING-11', qtyPerCup: 24 },
  { id: 'RCP-08', menuId: 'MN-02', ingredientId: 'ING-08', qtyPerCup: 1 },  // Cup 22oz
  { id: 'RCP-09', menuId: 'MN-02', ingredientId: 'ING-09', qtyPerCup: 1 },
  { id: 'RCP-10', menuId: 'MN-02', ingredientId: 'ING-10', qtyPerCup: 1 },

  // Kopi Susu Aren 16oz
  { id: 'RCP-11', menuId: 'MN-05', ingredientId: 'ING-02', qtyPerCup: 16 }, // 16g kopi
  { id: 'RCP-12', menuId: 'MN-05', ingredientId: 'ING-03', qtyPerCup: 110 }, // 110ml susu
  { id: 'RCP-13', menuId: 'MN-05', ingredientId: 'ING-04', qtyPerCup: 25 }, // 25ml aren
  { id: 'RCP-14', menuId: 'MN-05', ingredientId: 'ING-07', qtyPerCup: 1 },
  { id: 'RCP-15', menuId: 'MN-05', ingredientId: 'ING-09', qtyPerCup: 1 },
  { id: 'RCP-16', menuId: 'MN-05', ingredientId: 'ING-10', qtyPerCup: 1 },

  // Yakult Lemon Berry 16oz
  { id: 'RCP-17', menuId: 'MN-10', ingredientId: 'ING-06', qtyPerCup: 1 }, // 1 botol yakult
  { id: 'RCP-18', menuId: 'MN-10', ingredientId: 'ING-05', qtyPerCup: 30 }, // 30ml sirup
  { id: 'RCP-19', menuId: 'MN-10', ingredientId: 'ING-07', qtyPerCup: 1 },
  { id: 'RCP-20', menuId: 'MN-10', ingredientId: 'ING-09', qtyPerCup: 1 },
  { id: 'RCP-21', menuId: 'MN-10', ingredientId: 'ING-10', qtyPerCup: 1 },
];

// Helper to seed realistic closings (Senin-Sabtu only, Minggu Libur)
export function generateSeedClosings(): Closing[] {
  const closings: Closing[] = [
    {
      id: 'CLS-20260928',
      tanggal: '2026-09-28', // Senin
      userId: 'USR-02',
      userName: 'Budi Santoso',
      totalCup: 524,
      totalPenjualan: 3680000,
      menuDetails: [
        { menuId: 'MN-01', namaMenu: 'Es Teh Original Teras 16oz', jenisCup: '16oz', hargaJual: 4000, hpp: 1100, qty: 195, subtotal: 780000 },
        { menuId: 'MN-02', namaMenu: 'Es Teh Original Teras Jumbo 22oz', jenisCup: '22oz', hargaJual: 5000, hpp: 1450, qty: 110, subtotal: 550000 },
        { menuId: 'MN-05', namaMenu: 'Kopi Susu Gula Aren Teras 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3850, qty: 135, subtotal: 1350000 },
        { menuId: 'MN-06', namaMenu: 'Kopi Susu Aren Jumbo 22oz', jenisCup: '22oz', hargaJual: 13000, hpp: 4950, qty: 44, subtotal: 572000 },
        { menuId: 'MN-10', namaMenu: 'Yakult Lemon Berry 16oz', jenisCup: '16oz', hargaJual: 11000, hpp: 4200, qty: 40, subtotal: 440000 },
      ],
      pengeluaranCash: [
        { id: 'EXP-01', masterId: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', jumlah: 3, satuan: 'sak', hargaSatuan: 15000, nominal: 45000, catatan: 'Supplier es langganan' },
        { id: 'EXP-02', masterId: 'EXP-M-02', nama: 'Air Galon Mineral', jumlah: 2, satuan: 'galon', hargaSatuan: 20000, nominal: 40000, catatan: 'Depot langganan' },
      ],
      totalPengeluaran: 85000,
      pembayaranHutang: [
        { id: 'CIN-01', sumber: 'Pelunasan Warung Nasi Bu Sri', nominal: 65000, catatan: 'Bayar hutang pesanan minggu lalu' }
      ],
      totalPembayaranHutang: 65000,
      totalKas: 3680000 + 65000 - 85000, // 3.660.000
      catatanPeristiwa: 'Awal pekan ramai, jam istirahat kantor antre panjang. Mesin sealer berjalan lancar.',
      createdAt: '2026-09-28T21:30:00Z',
    },
    {
      id: 'CLS-20260929',
      tanggal: '2026-09-29', // Selasa
      userId: 'USR-03',
      userName: 'Siti Rahma',
      totalCup: 492,
      totalPenjualan: 3420000,
      menuDetails: [
        { menuId: 'MN-01', namaMenu: 'Es Teh Original Teras 16oz', jenisCup: '16oz', hargaJual: 4000, hpp: 1100, qty: 180, subtotal: 720000 },
        { menuId: 'MN-02', namaMenu: 'Es Teh Original Teras Jumbo 22oz', jenisCup: '22oz', hargaJual: 5000, hpp: 1450, qty: 105, subtotal: 525000 },
        { menuId: 'MN-05', namaMenu: 'Kopi Susu Gula Aren Teras 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3850, qty: 128, subtotal: 1280000 },
        { menuId: 'MN-08', namaMenu: 'Susu Karamel Manis 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3450, qty: 45, subtotal: 450000 },
        { menuId: 'MN-10', namaMenu: 'Yakult Lemon Berry 16oz', jenisCup: '16oz', hargaJual: 11000, hpp: 4200, qty: 34, subtotal: 374000 },
      ],
      pengeluaranCash: [
        { id: 'EXP-03', masterId: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', jumlah: 3, satuan: 'sak', hargaSatuan: 15000, nominal: 45000 },
        { id: 'EXP-04', masterId: 'EXP-M-02', nama: 'Air Galon Mineral', jumlah: 2, satuan: 'galon', hargaSatuan: 17500, nominal: 35000, catatan: 'Depot isi ulang' },
      ],
      totalPengeluaran: 80000,
      pembayaranHutang: [],
      totalPembayaranHutang: 0,
      totalKas: 3420000 - 80000,
      catatanPeristiwa: 'Siang hari panas terik, pesanan es teh jumbo meningkat.',
      createdAt: '2026-09-29T21:40:00Z',
    },
    {
      id: 'CLS-20260930',
      tanggal: '2026-09-30', // Rabu
      userId: 'USR-02',
      userName: 'Budi Santoso',
      totalCup: 540,
      totalPenjualan: 3810000,
      menuDetails: [
        { menuId: 'MN-01', namaMenu: 'Es Teh Original Teras 16oz', jenisCup: '16oz', hargaJual: 4000, hpp: 1100, qty: 200, subtotal: 800000 },
        { menuId: 'MN-02', namaMenu: 'Es Teh Original Teras Jumbo 22oz', jenisCup: '22oz', hargaJual: 5000, hpp: 1450, qty: 120, subtotal: 600000 },
        { menuId: 'MN-05', namaMenu: 'Kopi Susu Gula Aren Teras 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3850, qty: 140, subtotal: 1400000 },
        { menuId: 'MN-06', namaMenu: 'Kopi Susu Aren Jumbo 22oz', jenisCup: '22oz', hargaJual: 13000, hpp: 4950, qty: 45, subtotal: 585000 },
        { menuId: 'MN-11', namaMenu: 'Yakult Mango Splash 16oz', jenisCup: '16oz', hargaJual: 11000, hpp: 4200, qty: 35, subtotal: 385000 },
      ],
      pengeluaranCash: [
        { id: 'EXP-05', masterId: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', jumlah: 4, satuan: 'sak', hargaSatuan: 15000, nominal: 60000 },
        { id: 'EXP-06', masterId: 'EXP-M-02', nama: 'Air Galon Mineral', jumlah: 2, satuan: 'galon', hargaSatuan: 20000, nominal: 40000 },
      ],
      totalPengeluaran: 100000,
      pembayaranHutang: [
        { id: 'CIN-02', sumber: 'Cicilan Bon Pak RT (Acara Kerja Bakti)', nominal: 100000 }
      ],
      totalPembayaranHutang: 100000,
      totalKas: 3810000 + 100000 - 100000,
      catatanPeristiwa: 'Akhir bulan ramai pesanan take-away ojek online.',
      createdAt: '2026-09-30T21:45:00Z',
    },
    {
      id: 'CLS-20261001',
      tanggal: '2026-10-01', // Kamis
      userId: 'USR-04',
      userName: 'Rian Pratama',
      totalCup: 510,
      totalPenjualan: 3590000,
      menuDetails: [
        { menuId: 'MN-01', namaMenu: 'Es Teh Original Teras 16oz', jenisCup: '16oz', hargaJual: 4000, hpp: 1100, qty: 185, subtotal: 740000 },
        { menuId: 'MN-02', namaMenu: 'Es Teh Original Teras Jumbo 22oz', jenisCup: '22oz', hargaJual: 5000, hpp: 1450, qty: 115, subtotal: 575000 },
        { menuId: 'MN-05', namaMenu: 'Kopi Susu Gula Aren Teras 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3850, qty: 130, subtotal: 1300000 },
        { menuId: 'MN-03', namaMenu: 'Es Teh Lemon Segar 16oz', jenisCup: '16oz', hargaJual: 7000, hpp: 2150, qty: 45, subtotal: 315000 },
        { menuId: 'MN-10', namaMenu: 'Yakult Lemon Berry 16oz', jenisCup: '16oz', hargaJual: 11000, hpp: 4200, qty: 35, subtotal: 385000 },
      ],
      pengeluaranCash: [
        { id: 'EXP-07', masterId: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', jumlah: 3, satuan: 'sak', hargaSatuan: 15000, nominal: 45000 },
        { id: 'EXP-08', masterId: 'EXP-M-04', nama: 'Sabun Cuci & Spons Lapak', jumlah: 1, satuan: 'paket', hargaSatuan: 22000, nominal: 22000 },
      ],
      totalPengeluaran: 67000,
      pembayaranHutang: [],
      totalPembayaranHutang: 0,
      totalKas: 3590000 - 67000,
      catatanPeristiwa: 'Mesin press sempat seret sekitar jam 15.00, sudah dibersihkan dan kembali normal.',
      createdAt: '2026-10-01T21:35:00Z',
    },
    {
      id: 'CLS-20261002',
      tanggal: '2026-10-02', // Jumat
      userId: 'USR-03',
      userName: 'Siti Rahma',
      totalCup: 565,
      totalPenjualan: 4020000,
      menuDetails: [
        { menuId: 'MN-01', namaMenu: 'Es Teh Original Teras 16oz', jenisCup: '16oz', hargaJual: 4000, hpp: 1100, qty: 210, subtotal: 840000 },
        { menuId: 'MN-02', namaMenu: 'Es Teh Original Teras Jumbo 22oz', jenisCup: '22oz', hargaJual: 5000, hpp: 1450, qty: 125, subtotal: 625000 },
        { menuId: 'MN-05', namaMenu: 'Kopi Susu Gula Aren Teras 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3850, qty: 145, subtotal: 1450000 },
        { menuId: 'MN-06', namaMenu: 'Kopi Susu Aren Jumbo 22oz', jenisCup: '22oz', hargaJual: 13000, hpp: 4950, qty: 45, subtotal: 585000 },
        { menuId: 'MN-10', namaMenu: 'Yakult Lemon Berry 16oz', jenisCup: '16oz', hargaJual: 11000, hpp: 4200, qty: 40, subtotal: 440000 },
      ],
      pengeluaranCash: [
        { id: 'EXP-09', masterId: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', jumlah: 4, satuan: 'sak', hargaSatuan: 15000, nominal: 60000 },
        { id: 'EXP-10', masterId: 'EXP-M-02', nama: 'Air Galon Mineral', jumlah: 2, satuan: 'galon', hargaSatuan: 20000, nominal: 40000 },
      ],
      totalPengeluaran: 100000,
      pembayaranHutang: [
        { id: 'CIN-03', sumber: 'Pelunasan Hutang Mas Joko Ojol', nominal: 45000, catatan: 'Pelunasan titip beli' }
      ],
      totalPembayaranHutang: 45000,
      totalKas: 4020000 + 45000 - 100000,
      catatanPeristiwa: 'Jumat berkah, penjualan melonjak drastis setelah ibadah sholat Jumat.',
      createdAt: '2026-10-02T22:00:00Z',
    },
    {
      id: 'CLS-20261003',
      tanggal: '2026-10-03', // Sabtu
      userId: 'USR-02',
      userName: 'Budi Santoso',
      totalCup: 580,
      totalPenjualan: 4180000,
      menuDetails: [
        { menuId: 'MN-01', namaMenu: 'Es Teh Original Teras 16oz', jenisCup: '16oz', hargaJual: 4000, hpp: 1100, qty: 220, subtotal: 880000 },
        { menuId: 'MN-02', namaMenu: 'Es Teh Original Teras Jumbo 22oz', jenisCup: '22oz', hargaJual: 5000, hpp: 1450, qty: 130, subtotal: 650000 },
        { menuId: 'MN-05', namaMenu: 'Kopi Susu Gula Aren Teras 16oz', jenisCup: '16oz', hargaJual: 10000, hpp: 3850, qty: 150, subtotal: 1500000 },
        { menuId: 'MN-06', namaMenu: 'Kopi Susu Aren Jumbo 22oz', jenisCup: '22oz', hargaJual: 13000, hpp: 4950, qty: 45, subtotal: 585000 },
        { menuId: 'MN-11', namaMenu: 'Yakult Mango Splash 16oz', jenisCup: '16oz', hargaJual: 11000, hpp: 4200, qty: 35, subtotal: 385000 },
      ],
      pengeluaranCash: [
        { id: 'EXP-11', masterId: 'EXP-M-01', nama: 'Es Batu Kristal Higienis', jumlah: 4, satuan: 'sak', hargaSatuan: 15000, nominal: 60000 },
        { id: 'EXP-12', masterId: 'EXP-M-03', nama: 'Cup Rusak / Gagal Sealer', jumlah: 30, satuan: 'pcs', hargaSatuan: 500, nominal: 15000, catatan: 'Gagal press' },
      ],
      totalPengeluaran: 75000,
      pembayaranHutang: [],
      totalPembayaranHutang: 0,
      totalKas: 4180000 - 75000,
      catatanPeristiwa: 'Malam minggu sangat padat pesanan, stok cup aman.',
      createdAt: '2026-10-03T22:15:00Z',
    },
    // Note: 2026-10-04 is Sunday (Minggu Libur - no closing!)
  ];
  return closings;
}

export const initialAbsensi: Absensi[] = [
  { id: 'ABS-01', tanggal: '2026-09-28', userId: 'USR-02', statusHadir: 'Hadir', closingIdRef: 'CLS-20260928' },
  { id: 'ABS-02', tanggal: '2026-09-28', userId: 'USR-03', statusHadir: 'Hadir' },
  { id: 'ABS-03', tanggal: '2026-09-28', userId: 'USR-04', statusHadir: 'Hadir' },

  { id: 'ABS-04', tanggal: '2026-09-29', userId: 'USR-02', statusHadir: 'Hadir' },
  { id: 'ABS-05', tanggal: '2026-09-29', userId: 'USR-03', statusHadir: 'Hadir', closingIdRef: 'CLS-20260929' },
  { id: 'ABS-06', tanggal: '2026-09-29', userId: 'USR-04', statusHadir: 'Izin', keteranganIzin: 'Izin urusan keluarga mendadak di kampung' },

  { id: 'ABS-07', tanggal: '2026-09-30', userId: 'USR-02', statusHadir: 'Hadir', closingIdRef: 'CLS-20260930' },
  { id: 'ABS-08', tanggal: '2026-09-30', userId: 'USR-03', statusHadir: 'Hadir' },
  { id: 'ABS-09', tanggal: '2026-09-30', userId: 'USR-04', statusHadir: 'Hadir' },

  { id: 'ABS-10', tanggal: '2026-10-01', userId: 'USR-02', statusHadir: 'Hadir' },
  { id: 'ABS-11', tanggal: '2026-10-01', userId: 'USR-03', statusHadir: 'Hadir' },
  { id: 'ABS-12', tanggal: '2026-10-01', userId: 'USR-04', statusHadir: 'Hadir', closingIdRef: 'CLS-20261001' },

  { id: 'ABS-13', tanggal: '2026-10-02', userId: 'USR-02', statusHadir: 'Hadir' },
  { id: 'ABS-14', tanggal: '2026-10-02', userId: 'USR-03', statusHadir: 'Hadir', closingIdRef: 'CLS-20261002' },
  { id: 'ABS-15', tanggal: '2026-10-02', userId: 'USR-04', statusHadir: 'Hadir' },

  { id: 'ABS-16', tanggal: '2026-10-03', userId: 'USR-02', statusHadir: 'Hadir', closingIdRef: 'CLS-20261003' },
  { id: 'ABS-17', tanggal: '2026-10-03', userId: 'USR-03', statusHadir: 'Hadir' },
  { id: 'ABS-18', tanggal: '2026-10-03', userId: 'USR-04', statusHadir: 'Hadir' },
];

export const initialKasbon: Kasbon[] = [
  {
    id: 'KSB-01',
    tanggal: '2026-09-25',
    userId: 'USR-02',
    userName: 'Budi Santoso',
    nominal: 300000,
    status: 'Disetujui',
    catatan: 'Servis motor bulanan',
    createdAt: '2026-09-25T10:00:00Z',
  },
  {
    id: 'KSB-02',
    tanggal: '2026-09-29',
    userId: 'USR-04',
    userName: 'Rian Pratama',
    nominal: 200000,
    status: 'Disetujui',
    catatan: 'Keperluan mendadak keluarga',
    createdAt: '2026-09-29T11:00:00Z',
  },
  {
    id: 'KSB-03',
    tanggal: '2026-10-02',
    userId: 'USR-03',
    userName: 'Siti Rahma',
    nominal: 150000,
    status: 'Pending',
    catatan: 'Beli obat dan vitamin',
    createdAt: '2026-10-02T14:30:00Z',
  },
];

export const initialPayroll: Payroll[] = [
  {
    id: 'PAY-202609-02',
    bulanTahun: '2026-09',
    userId: 'USR-02',
    userName: 'Budi Santoso',
    tarifHarian: 50000,
    totalHariKerja: 25,
    gajiPokok: 25 * 50000, // Rp 1.250.000
    totalCup: 4850,
    bonusPerCup: 250,
    totalBonus: 1212500,
    totalKasbon: 300000,
    gajiBersih: (25 * 50000 + 1212500) - 300000, // 2.162.500
    status: 'Dibayar',
    tanggalBayar: '2026-10-01',
  },
  {
    id: 'PAY-202609-03',
    bulanTahun: '2026-09',
    userId: 'USR-03',
    userName: 'Siti Rahma',
    tarifHarian: 50000,
    totalHariKerja: 24,
    gajiPokok: 24 * 50000, // Rp 1.200.000
    totalCup: 4420,
    bonusPerCup: 200,
    totalBonus: 884000,
    totalKasbon: 100000,
    gajiBersih: (24 * 50000 + 884000) - 100000, // 1.984.000
    status: 'Dibayar',
    tanggalBayar: '2026-10-01',
  },
];

export const initialCashTransactions: CashTransaction[] = [
  // --- September 2026 ---
  {
    id: 'CTX-202609-01',
    tanggal: '2026-09-01',
    kategori: 'Saldo Awal',
    tipe: 'Masuk',
    metode: 'Tunai',
    nominal: 1500000,
    keterangan: 'Modal Kas Awal Tunai Laci Lapak September',
    createdAt: '2026-09-01T07:00:00Z',
  },
  {
    id: 'CTX-202609-02',
    tanggal: '2026-09-01',
    kategori: 'Saldo Awal',
    tipe: 'Masuk',
    metode: 'Bank',
    nominal: 8000000,
    keterangan: 'Saldo Rekening Operasional Bank BCA Awal September',
    createdAt: '2026-09-01T07:00:00Z',
  },
  {
    id: 'CTX-202609-03',
    tanggal: '2026-09-05',
    kategori: 'Beli Marketplace',
    tipe: 'Keluar',
    metode: 'Bank',
    nominal: 1850000,
    keterangan: 'Beli 3 Karton Cup Sablon 16oz & 22oz di Shopee Grosir (BCA)',
    createdAt: '2026-09-05T11:20:00Z',
  },
  {
    id: 'CTX-202609-04',
    tanggal: '2026-09-10',
    kategori: 'Setor Bank',
    tipe: 'Transfer',
    metode: 'Tunai',
    nominal: 6000000,
    keterangan: 'Setor Tunai Hasil Omzet Lapak Minggu 1 ke Bank BCA',
    createdAt: '2026-09-10T16:00:00Z',
  },
  {
    id: 'CTX-202609-05',
    tanggal: '2026-09-15',
    kategori: 'Beli Marketplace',
    tipe: 'Keluar',
    metode: 'Bank',
    nominal: 950000,
    keterangan: 'Beli Daun Teh Racik & Sirup Buah di Tokopedia Official (BCA)',
    createdAt: '2026-09-15T09:30:00Z',
  },
  {
    id: 'CTX-202609-06',
    tanggal: '2026-09-20',
    kategori: 'Belanja Langsung',
    tipe: 'Keluar',
    metode: 'Tunai',
    nominal: 350000,
    keterangan: 'Belanja Langsung Susu Segar & Gula di Pasar Induk (Tunai)',
    createdAt: '2026-09-20T10:15:00Z',
  },
  {
    id: 'CTX-202609-UT-01',
    tanggal: '2026-09-21',
    kategori: 'Operasional & Utilitas',
    tipe: 'Keluar',
    metode: 'Tunai',
    nominal: 100000,
    keterangan: 'Token Listrik Lapak (PLN): Pembelian token listrik laci kasir',
    createdAt: '2026-09-21T11:00:00Z',
  },
  {
    id: 'CTX-202609-UT-02',
    tanggal: '2026-09-22',
    kategori: 'Operasional & Utilitas',
    tipe: 'Keluar',
    metode: 'Bank',
    nominal: 250000,
    keterangan: 'Tagihan Internet & WiFi Lapak: Pembayaran paket internet bulanan (BCA)',
    createdAt: '2026-09-22T14:30:00Z',
  },
  {
    id: 'CTX-202609-07',
    tanggal: '2026-09-25',
    kategori: 'Setor Bank',
    tipe: 'Transfer',
    metode: 'Tunai',
    nominal: 7000000,
    keterangan: 'Setor Tunai Hasil Omzet Lapak Minggu 3 ke Bank BCA',
    createdAt: '2026-09-25T15:45:00Z',
  },

  // --- Oktober 2026 ---
  {
    id: 'CTX-202610-01',
    tanggal: '2026-10-01',
    kategori: 'Saldo Awal',
    tipe: 'Masuk',
    metode: 'Tunai',
    nominal: 2450000,
    keterangan: 'Saldo Awal Kas Tunai (Bawaan Tutup Buku September)',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'CTX-202610-02',
    tanggal: '2026-10-01',
    kategori: 'Saldo Awal',
    tipe: 'Masuk',
    metode: 'Bank',
    nominal: 18250000,
    keterangan: 'Saldo Awal Rekening Bank (Bawaan Tutup Buku September)',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'CTX-202610-03',
    tanggal: '2026-10-01',
    kategori: 'Gaji Karyawan',
    tipe: 'Keluar',
    metode: 'Bank',
    nominal: 4146500,
    keterangan: 'Transfer Gaji & Bonus Karyawan Periode September (Budi & Siti)',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'CTX-202610-04',
    tanggal: '2026-10-02',
    kategori: 'Beli Marketplace',
    tipe: 'Keluar',
    metode: 'Bank',
    nominal: 1200000,
    keterangan: 'Beli Lid Sealer Sablon & Sedotan di Shopee (BCA)',
    createdAt: '2026-10-02T13:10:00Z',
  },
  {
    id: 'CTX-202610-UT-01',
    tanggal: '2026-10-02',
    kategori: 'Operasional & Utilitas',
    tipe: 'Keluar',
    metode: 'Tunai',
    nominal: 100000,
    keterangan: 'Token Listrik Lapak (PLN): Beli voucher token 100rb di kasir',
    createdAt: '2026-10-02T15:00:00Z',
  },
  {
    id: 'CTX-202610-05',
    tanggal: '2026-10-03',
    kategori: 'Belanja Langsung',
    tipe: 'Keluar',
    metode: 'Tunai',
    nominal: 280000,
    keterangan: 'Belanja Langsung Galon Air & Gula Pasir di Agen Offline (Tunai)',
    createdAt: '2026-10-03T16:00:00Z',
  },
  {
    id: 'CTX-202610-UT-02',
    tanggal: '2026-10-04',
    kategori: 'Operasional & Utilitas',
    tipe: 'Keluar',
    metode: 'Bank',
    nominal: 250000,
    keterangan: 'Tagihan Internet & WiFi Lapak: Tagihan Indihome lapak Oktober (BCA)',
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'CTX-202610-UT-03',
    tanggal: '2026-10-05',
    kategori: 'Operasional & Utilitas',
    tipe: 'Keluar',
    metode: 'Tunai',
    nominal: 75000,
    keterangan: 'Tagihan Air Bersih / PDAM: Tagihan air laci lapak',
    createdAt: '2026-10-05T11:30:00Z',
  },
];

export const initialMonthlyReports: MonthlyClosingReport[] = [
  {
    id: 'MCR-2026-09',
    bulanTahun: '2026-09',
    status: 'Closed',
    tanggalTutup: '2026-09-30 22:30',
    ditutupOleh: 'Hendra Wijaya (Owner)',
    saldoAwalTunai: 1500000,
    saldoAwalBank: 8000000,
    saldoFisikTunai: 2450000,
    saldoNyataBank: 18250000,
    selisihTunai: 0,
    selisihBank: 0,
    statusRekonsiliasi: 'Sesuai',
    catatanRekonsiliasi: 'Tutup buku September klop 100%. Saldo fisik uang laci dan rekening koran BCA sesuai buku kas.',
  },
  {
    id: 'MCR-2026-10',
    bulanTahun: '2026-10',
    status: 'Open',
    saldoAwalTunai: 2450000,
    saldoAwalBank: 18250000,
    saldoFisikTunai: 3120000,
    saldoNyataBank: 17650000,
    selisihTunai: 0,
    selisihBank: 0,
    statusRekonsiliasi: 'Belum Dicek',
    catatanRekonsiliasi: 'Buku kas berjalan bulan Oktober 2026.',
  },
];
