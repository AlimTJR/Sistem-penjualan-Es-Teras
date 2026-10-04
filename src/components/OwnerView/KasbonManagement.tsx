import React, { useState } from 'react';
import {
  CreditCard, Plus, CheckCircle2, Clock, AlertCircle,
  XCircle, Check, DollarSign, UserCheck
} from 'lucide-react';
import { Kasbon, User } from '../../types';
import { formatRupiah, formatIndonesianDate, getTodayDateStr } from '../../utils/formatters';

interface KasbonManagementProps {
  kasbonList: Kasbon[];
  users: User[];
  onAddKasbon: (kasbon: Omit<Kasbon, 'id' | 'createdAt'>) => void;
  onUpdateKasbonStatus: (id: string, status: Kasbon['status']) => void;
}

export const KasbonManagement: React.FC<KasbonManagementProps> = ({
  kasbonList,
  users,
  onAddKasbon,
  onUpdateKasbonStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>(
    users.find(u => u.role === 'karyawan' && u.status === 'aktif')?.id || ''
  );
  const [tanggal, setTanggal] = useState(getTodayDateStr());
  const [nominal, setNominal] = useState<number>(100000);
  const [catatan, setCatatan] = useState('');

  const activeEmployees = users.filter(u => u.role === 'karyawan');

  const filtered = kasbonList.filter(k => {
    if (filterStatus === 'Semua') return true;
    return k.status === filterStatus;
  });

  const totalKasbonAktif = kasbonList
    .filter(k => k.status === 'Disetujui' || k.status === 'Pending')
    .reduce((acc, k) => acc + k.nominal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (!user || nominal <= 0) return;

    onAddKasbon({
      tanggal,
      userId: user.id,
      userName: user.nama,
      nominal,
      status: 'Disetujui',
      catatan: catatan.trim() || 'Pinjaman kasbon lapak',
    });

    setIsModalOpen(false);
    setNominal(100000);
    setCatatan('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Modul Kasbon &amp; Auto-Deduction
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Pencatatan Pinjaman Kasbon Karyawan
          </h2>
          <p className="text-xs text-slate-500">
            Total kasbon yang disetujui akan otomatis dipotong pada perhitungan payroll gaji bulanan.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Kasbon Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Kasbon Belum Lunas
          </span>
          <div className="text-2xl font-black text-red-600 mt-2">
            {formatRupiah(totalKasbonAktif)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Siap dipotong otomatis di payroll
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Permintaan Pending Persetujuan
          </span>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {kasbonList.filter(k => k.status === 'Pending').length} Pengajuan
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Menunggu verifikasi owner
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Riwayat Kasbon Lunas / Dipotong
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {kasbonList.filter(k => k.status === 'Lunas' || k.status === 'Dipotong Payroll').length} Selesai
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Sudah terpotong pada payroll lalu
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['Semua', 'Pending', 'Disetujui', 'Dipotong Payroll', 'Lunas'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Tanggal Pinjam</th>
                <th className="px-5 py-3">Nama Karyawan</th>
                <th className="px-5 py-3 text-right">Nominal Kasbon</th>
                <th className="px-5 py-3">Catatan / Keperluan</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada catatan kasbon pada filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {formatIndonesianDate(k.tanggal)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {k.userName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-red-600">
                      {formatRupiah(k.nominal)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {k.catatan || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        k.status === 'Disetujui'
                          ? 'bg-blue-100 text-blue-800'
                          : k.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {k.status === 'Pending' && (
                        <button
                          onClick={() => onUpdateKasbonStatus(k.id, 'Disetujui')}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Setujui
                        </button>
                      )}
                      {k.status === 'Disetujui' && (
                        <button
                          onClick={() => onUpdateKasbonStatus(k.id, 'Lunas')}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Tandai Lunas
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

      {/* Modal Add Kasbon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Catat Pinjaman Kasbon Karyawan</h3>
                <p className="text-xs text-emerald-200">
                  Otomatis terpotong saat tutup buku payroll.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pilih Karyawan:</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-emerald-600"
                >
                  {activeEmployees.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nama} ({u.jabatan || 'Barista'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tanggal Kasbon:</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nominal Pinjaman (Rp):</label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  required
                  value={nominal}
                  onChange={e => setNominal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Keperluan / Catatan:</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Misal: Perbaikan motor, keperluan berobat keluarga..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
