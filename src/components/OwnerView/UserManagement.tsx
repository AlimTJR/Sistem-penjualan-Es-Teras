import React, { useState } from 'react';
import {
  Users, UserPlus, Shield, UserCheck, UserX,
  Edit2, Check, X, Phone, DollarSign
} from 'lucide-react';
import { User } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onToggleUserStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    nama: '',
    username: '',
    password: '123',
    role: 'karyawan',
    tarifHarian: 50000,
    gajiPokok: 1250000,
    bonusPerCup: 200,
    status: 'aktif',
    noHp: '',
    jabatan: 'Barista Lapak',
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      nama: '',
      username: '',
      password: '123',
      role: 'karyawan',
      tarifHarian: 50000,
      gajiPokok: 1250000,
      bonusPerCup: 200,
      status: 'aktif',
      noHp: '',
      jabatan: 'Barista Lapak',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      username: user.username,
      password: user.password || '123',
      role: user.role,
      tarifHarian: user.tarifHarian || 50000,
      gajiPokok: user.gajiPokok || 1250000,
      bonusPerCup: user.bonusPerCup,
      status: user.status,
      noHp: user.noHp || '',
      jabatan: user.jabatan || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.username.trim()) return;

    const validatedBonus = formData.role === 'karyawan' ? Math.max(25, formData.bonusPerCup || 25) : 0;
    const validatedTarif = formData.role === 'karyawan' ? (formData.tarifHarian || 50000) : 0;

    const payload = {
      ...formData,
      bonusPerCup: validatedBonus,
      tarifHarian: validatedTarif,
    };

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        ...payload,
      });
    } else {
      onAddUser(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              RBAC &amp; Soft Delete Karyawan
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Manajemen Akun Pengguna &amp; Karyawan
          </h2>
          <p className="text-xs text-slate-500">
            Karyawan yang resign dapat dinonaktifkan (Soft Delete) tanpa menghapus histori gaji dan absensi lampau.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan Baru</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const isOwner = u.role === 'owner';
          const isActive = u.status === 'aktif';

          return (
            <div
              key={u.id}
              className={`p-5 rounded-3xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                isActive ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 bg-slate-50/70 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                      isOwner ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.nama.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {u.nama}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        @{u.username} • {u.jabatan || u.role}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isActive ? 'Aktif' : 'Nonaktif (Resign)'}
                  </span>
                </div>

                {/* Salary Info if Karyawan */}
                {!isOwner ? (
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tarif Harian:</span>
                      <span className="font-extrabold text-emerald-800">
                        {formatRupiah(u.tarifHarian || 50000)} / hari kerja
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Bonus Per Cup:</span>
                      <span className="font-bold text-emerald-700">+{formatRupiah(u.bonusPerCup)} / cup</span>
                    </div>
                    {u.noHp && (
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                        <span>WhatsApp / HP:</span>
                        <span className="font-mono">{u.noHp}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-amber-50/70 rounded-2xl border border-amber-100 text-xs text-amber-900">
                    <span className="font-bold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-700" />
                      Hak Akses Penuh Owner
                    </span>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Akses dashboard finansial, audit HPP, manajemen resep, dan approval kasbon.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {!isOwner ? (
                  <button
                    onClick={() => onToggleUserStatus(u.id)}
                    className={`text-[11px] font-semibold transition ${
                      isActive ? 'text-red-600 hover:text-red-700' : 'text-emerald-700 hover:text-emerald-800'
                    }`}
                  >
                    {isActive ? 'Nonaktifkan (Resign)' : 'Aktifkan Kembali'}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">Akun Utama</span>
                )}

                <button
                  onClick={() => handleOpenEdit(u)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Akun
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingUser ? `Edit Karyawan: ${editingUser.nama}` : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-xs text-emerald-200">
                  Konfigurasi akun, gaji pokok, dan insentif bonus per cup.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Misal: Dimas Anggara"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Username Login:</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    placeholder="dimas"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kata Sandi Akun:</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Default: 123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Default: 123</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role / Peran:</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                  >
                    <option value="karyawan">Karyawan (POS & Closing)</option>
                    <option value="owner">Owner (Akses Penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tarif Gaji Harian (Rp):</label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={formData.tarifHarian}
                    onChange={e => setFormData({ ...formData, tarifHarian: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Default: Rp 50.000 / hari kehadiran</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bonus Per Cup (Rp):</label>
                  <input
                    type="number"
                    min="25"
                    step="25"
                    required
                    value={formData.bonusPerCup}
                    onChange={e => setFormData({ ...formData, bonusPerCup: Math.max(25, Number(e.target.value) || 25) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Setting minimal: Rp 25 / cup</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jabatan:</label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Barista / Kasir"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Status Keaktifan (Soft Delete):</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600 font-medium"
                >
                  <option value="aktif">Aktif Bekerja</option>
                  <option value="nonaktif">Nonaktif (Resign / Tidak Aktif)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
