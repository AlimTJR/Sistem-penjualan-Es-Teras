import React, { useState } from 'react';
import {
  Coffee, Plus, Edit2, Trash2, Check, X,
  Calculator, Percent, Sparkles, Layers, ArrowRight,
  DollarSign, Package, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { Menu, Ingredient, Recipe, OperationalExpenseMaster } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { calculateMenuHpp } from '../../utils/storage';

interface MenuAndHppManagementProps {
  menus: Menu[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  expenseMaster: OperationalExpenseMaster[];
  onSaveMenu: (menu: Menu, menuRecipes: { ingredientId: string; qtyPerCup: number }[]) => void;
  onToggleMenuStatus: (menuId: string) => void;
  onUpdateExpenseMaster: (items: OperationalExpenseMaster[]) => void;
}

export const MenuAndHppManagement: React.FC<MenuAndHppManagementProps> = ({
  menus,
  ingredients,
  recipes,
  expenseMaster,
  onSaveMenu,
  onToggleMenuStatus,
  onUpdateExpenseMaster,
}) => {
  const [activeTab, setActiveTab] = useState<'menus' | 'expense_master'>('menus');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Expense Master Edit Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseItem, setEditingExpenseItem] = useState<OperationalExpenseMaster | null>(null);
  const [expenseFormData, setExpenseFormData] = useState<OperationalExpenseMaster>({
    id: '',
    nama: '',
    satuan: 'pcs',
    hargaSatuan: 500,
  });

  // Form State for Menu
  const [formData, setFormData] = useState<{
    id: string;
    namaMenu: string;
    kategori: 'Teh' | 'Kopi' | 'Susu' | 'Yakult' | 'Lainnya';
    jenisCup: '16oz' | '22oz';
    hargaJual: number;
    deskripsi: string;
    status: 'aktif' | 'nonaktif';
  }>({
    id: '',
    namaMenu: '',
    kategori: 'Kopi',
    jenisCup: '16oz',
    hargaJual: 10000,
    deskripsi: '',
    status: 'aktif',
  });

  // Recipe items in form
  const [formRecipeItems, setFormRecipeItems] = useState<{ ingredientId: string; qtyPerCup: number }[]>([]);

  const categories = ['Semua', 'Teh', 'Kopi', 'Susu', 'Yakult'];

  const filteredMenus = selectedCategory === 'Semua'
    ? menus
    : menus.filter(m => m.kategori === selectedCategory);

  // Calculate live HPP from current recipe items
  const liveCalculatedHpp = formRecipeItems.reduce((acc, item) => {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (!ing) return acc;
    return acc + (item.qtyPerCup * ing.hargaPerSatuan);
  }, 0);

  const profitPerCup = formData.hargaJual - liveCalculatedHpp;
  const marginPercent = formData.hargaJual > 0 ? Math.round((profitPerCup / formData.hargaJual) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setFormData({
      id: `MN-${Date.now().toString().slice(-4)}`,
      namaMenu: '',
      kategori: 'Kopi',
      jenisCup: '16oz',
      hargaJual: 10000,
      deskripsi: '',
      status: 'aktif',
    });
    const cup16 = ingredients.find(i => i.namaBahan.includes('16oz'))?.id;
    const straw = ingredients.find(i => i.namaBahan.includes('Sedotan'))?.id;
    const lid = ingredients.find(i => i.namaBahan.includes('Lid'))?.id;
    const defaultItems: { ingredientId: string; qtyPerCup: number }[] = [];
    if (cup16) defaultItems.push({ ingredientId: cup16, qtyPerCup: 1 });
    if (lid) defaultItems.push({ ingredientId: lid, qtyPerCup: 1 });
    if (straw) defaultItems.push({ ingredientId: straw, qtyPerCup: 1 });
    setFormRecipeItems(defaultItems);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      id: menu.id,
      namaMenu: menu.namaMenu,
      kategori: menu.kategori,
      jenisCup: menu.jenisCup,
      hargaJual: menu.hargaJual,
      deskripsi: menu.deskripsi || '',
      status: menu.status,
    });

    const currentRecipes = recipes
      .filter(r => r.menuId === menu.id)
      .map(r => ({ ingredientId: r.ingredientId, qtyPerCup: r.qtyPerCup }));

    setFormRecipeItems(currentRecipes);
    setIsModalOpen(true);
  };

  const handleAddRecipeIngredient = () => {
    if (ingredients.length === 0) return;
    setFormRecipeItems(prev => [
      ...prev,
      { ingredientId: ingredients[0].id, qtyPerCup: 1 }
    ]);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setFormRecipeItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecipeChange = (index: number, field: 'ingredientId' | 'qtyPerCup', value: any) => {
    setFormRecipeItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        [field]: field === 'qtyPerCup' ? Math.max(0.1, Number(value) || 0) : value,
      };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaMenu.trim()) {
      alert('Nama menu tidak boleh kosong.');
      return;
    }

    const menuToSave: Menu = {
      id: formData.id,
      namaMenu: formData.namaMenu,
      kategori: formData.kategori,
      jenisCup: formData.jenisCup,
      hargaJual: Number(formData.hargaJual) || 0,
      hpp: Math.round(liveCalculatedHpp),
      status: formData.status,
      deskripsi: formData.deskripsi,
    };

    onSaveMenu(menuToSave, formRecipeItems);
    setIsModalOpen(false);
  };

  // Operational Expense Master Handlers
  const handleOpenAddExpense = () => {
    setEditingExpenseItem(null);
    setExpenseFormData({
      id: `EXP-M-${Date.now().toString().slice(-4)}`,
      nama: '',
      satuan: 'pcs',
      hargaSatuan: 1000,
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (item: OperationalExpenseMaster) => {
    setEditingExpenseItem(item);
    setExpenseFormData({ ...item });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpenseMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.nama.trim()) return;

    let updated: OperationalExpenseMaster[];
    if (editingExpenseItem) {
      updated = expenseMaster.map(m => m.id === editingExpenseItem.id ? expenseFormData : m);
    } else {
      updated = [...expenseMaster, expenseFormData];
    }
    onUpdateExpenseMaster(updated);
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpenseMaster = (id: string) => {
    if (confirm('Hapus item pengeluaran ini dari master?')) {
      const updated = expenseMaster.filter(m => m.id !== id);
      onUpdateExpenseMaster(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Master Varian, Resep HPP &amp; Beban Lapak
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Kelola Menu Minuman &amp; Biaya Operasional (HPP)
          </h2>
          <p className="text-xs text-slate-500">
            Atur resep per cup dan harga satuan beban pengeluaran (Es batu, galon, cup rusak) untuk closing otomatis karyawan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'menus' ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Varian Menu Baru</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddExpense}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item Pengeluaran Master</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher: Menus vs Master Harga Satuan Pengeluaran */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('menus')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'menus'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4 text-emerald-600" />
          <span>Varian Menu &amp; Resep HPP ({menus.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expense_master')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'expense_master'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-600" />
          <span>Master Harga Satuan Pengeluaran ({expenseMaster.length})</span>
        </button>
      </div>

      {/* TAB 1: MENUS & HPP */}
      {activeTab === 'menus' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenus.map(menu => {
              const menuRecipes = recipes.filter(r => r.menuId === menu.id);
              const computedHpp = calculateMenuHpp(menu.id, recipes, ingredients) || menu.hpp;
              const profit = menu.hargaJual - computedHpp;
              const margin = menu.hargaJual > 0 ? Math.round((profit / menu.hargaJual) * 100) : 0;

              return (
                <div
                  key={menu.id}
                  className={`p-4 rounded-3xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                    menu.status === 'aktif' ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                          {menu.kategori} • {menu.jenisCup}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                          {menu.namaMenu}
                        </h3>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        menu.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {menu.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {menu.deskripsi || 'Varian minuman racikan Kedai Teras.'}
                    </p>

                    {/* Financial Pill */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Harga Jual:</span>
                        <span className="font-bold text-slate-900">{formatRupiah(menu.hargaJual)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-slate-400" />
                          HPP Bahan Resep:
                        </span>
                        <span className="font-bold text-amber-700">{formatRupiah(computedHpp)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-emerald-700 font-bold">
                        <span>Laba / Margin:</span>
                        <span>+{formatRupiah(profit)} ({margin}%)</span>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{menuRecipes.length} Bahan Baku Terkoneksi</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onToggleMenuStatus(menu.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {menu.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(menu)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit &amp; Resep HPP
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MASTER HARGA SATUAN PENGELUARAN (PENGATURAN OWNER UNTUK CLOSING) */}
      {activeTab === 'expense_master' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-emerald-950">
                Kontrol Harga Satuan Pengeluaran Lapak oleh Owner
              </h3>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Daftar harga satuan di bawah ini digunakan secara otomatis pada Form Closing Karyawan. Karyawan hanya perlu menginput <strong>jumlah barang</strong> (misal: 3 sak es, 1 galon, atau 5 pcs cup rusak), dan total biaya akan dihitung otomatis oleh sistem tanpa karyawan mengetik nominal manual.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Nama Pengeluaran / Beban</th>
                    <th className="px-5 py-3">Satuan Barang</th>
                    <th className="px-5 py-3 text-right">Harga Satuan (Diatur Owner)</th>
                    <th className="px-5 py-3 text-center">Status Preset Closing</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseMaster.map(item => {
                    const isCupRusak = item.nama.toLowerCase().includes('cup rusak');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            {isCupRusak ? (
                              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span>{item.nama}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block pl-6">
                            ID: {item.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {item.satuan}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm">
                          {formatRupiah(item.hargaSatuan)} <span className="text-[10px] text-slate-400 font-normal">/{item.satuan}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            isCupRusak
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isCupRusak ? 'Preset Cup Rusak Lapak' : 'Tersedia di Closing'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditExpense(item)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            Ubah Tarif Satuan
                          </button>
                          <button
                            onClick={() => handleDeleteExpenseMaster(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit / Add Expense Master */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingExpenseItem ? `Ubah Tarif: ${editingExpenseItem.nama}` : 'Tambah Item Beban Pengeluaran'}
                </h3>
                <p className="text-xs text-emerald-200">
                  Harga satuan ini menjadi rujukan otomatis closing karyawan.
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseMaster} className="p-5 space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nama Barang / Beban Pengeluaran:
                </label>
                <input
                  type="text"
                  required
                  value={expenseFormData.nama}
                  onChange={e => setExpenseFormData({ ...expenseFormData, nama: e.target.value })}
                  placeholder="Misal: Cup Rusak / Gagal Press"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Satuan Barang:
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseFormData.satuan}
                    onChange={e => setExpenseFormData({ ...expenseFormData, satuan: e.target.value })}
                    placeholder="sak / galon / pcs"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Harga Satuan (Rp):
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={expenseFormData.hargaSatuan}
                    onChange={e => setExpenseFormData({ ...expenseFormData, hargaSatuan: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                Contoh saat closing: Jika karyawan mengisi jumlah <strong>5 {expenseFormData.satuan || 'pcs'}</strong>, sistem otomatis mencatat pengeluaran sebesar <strong>{formatRupiah(5 * expenseFormData.hargaSatuan)}</strong>.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Tarif Satuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add Menu & Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingMenu ? `Edit Menu & Resep: ${editingMenu.namaMenu}` : 'Tambah Varian Minuman Baru'}
                </h3>
                <p className="text-xs text-emerald-200">
                  Kalkulasi HPP otomatis terhubung dengan bahan baku.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Nama Menu Minuman:</label>
                  <input
                    type="text"
                    required
                    value={formData.namaMenu}
                    onChange={e => setFormData({ ...formData, namaMenu: e.target.value })}
                    placeholder="Contoh: Es Teh Lemon Jumbo 22oz"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategori:</label>
                  <select
                    value={formData.kategori}
                    onChange={e => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                  >
                    <option value="Teh">Teh</option>
                    <option value="Kopi">Kopi</option>
                    <option value="Susu">Susu</option>
                    <option value="Yakult">Yakult</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jenis Cup / Ukuran:</label>
                  <select
                    value={formData.jenisCup}
                    onChange={e => setFormData({ ...formData, jenisCup: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                  >
                    <option value="16oz">16oz (Standard)</option>
                    <option value="22oz">22oz (Jumbo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.hargaJual}
                    onChange={e => setFormData({ ...formData, hargaJual: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status Penjualan:</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                  >
                    <option value="aktif">Aktif (Tampil di Closing)</option>
                    <option value="nonaktif">Nonaktif (Sembunyikan)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Deskripsi Singkat:</label>
                  <input
                    type="text"
                    value={formData.deskripsi}
                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Contoh: Racikan teh dengan aroma buah segar dan manis seimbang"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Recipe Mapping Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-700" />
                      Komposisi Resep Per Cup (Bahan Baku)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bahan di bawah ini otomatis dikurangi dari stok lapak saat closing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecipeIngredient}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Bahan
                  </button>
                </div>

                <div className="space-y-2 mt-3">
                  {formRecipeItems.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const cost = ing ? ing.hargaPerSatuan * item.qtyPerCup : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <select
                          value={item.ingredientId}
                          onChange={e => handleRecipeChange(idx, 'ingredientId', e.target.value)}
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-emerald-600"
                        >
                          {ingredients.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.namaBahan} ({formatRupiah(i.hargaPerSatuan)}/{i.satuan})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 w-28">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.qtyPerCup}
                            onChange={e => handleRecipeChange(idx, 'qtyPerCup', e.target.value)}
                            className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 text-center font-bold"
                          />
                          <span className="text-[11px] text-slate-500 font-medium">
                            {ing?.satuan || 'satuan'}
                          </span>
                        </div>

                        <div className="w-24 text-right font-bold text-slate-700">
                          {formatRupiah(cost)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeIngredient(idx)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live HPP & Profit Calculator Card */}
              <div className="bg-emerald-950 text-white p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  Hasil Kalkulator HPP &amp; Margin Resep
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-800 text-center">
                  <div>
                    <span className="text-[10px] text-emerald-300 block">Harga Jual:</span>
                    <span className="font-extrabold text-white text-sm">{formatRupiah(formData.hargaJual)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 block">HPP Bahan / Cup:</span>
                    <span className="font-extrabold text-amber-300 text-sm">{formatRupiah(liveCalculatedHpp)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300 block">Laba Kotor:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      +{formatRupiah(profitPerCup)} ({marginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Menu &amp; Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
