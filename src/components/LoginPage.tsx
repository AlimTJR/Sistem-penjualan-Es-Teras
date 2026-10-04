import React, { useState } from 'react';
import {
  Coffee, Shield, User as UserIcon, Lock, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Smartphone, Clock
} from 'lucide-react';
import { User, UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { formatRupiah, getTodayDateStr, formatIndonesianDate } from '../utils/formatters';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('karyawan');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = getTodayDateStr();

  // Filter users by role and active status
  const roleUsers = users.filter(u => u.role === selectedRole && u.status === 'aktif');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const found = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.status === 'aktif'
    );

    if (!found) {
      setErrorMessage('Username tidak ditemukan atau akun dinonaktifkan.');
      return;
    }

    if (found.role !== selectedRole) {
      setErrorMessage(`Akun ${found.nama} terdaftar sebagai ${found.role.toUpperCase()}, bukan ${selectedRole.toUpperCase()}. Silakan ganti tab role.`);
      return;
    }

    // Passwords in demo data are '123' or accept matching credentials
    if (password && password !== '123' && found.password && password !== found.password) {
      setErrorMessage('Kata sandi salah. (Password demo: 123)');
      return;
    }

    onLoginSuccess(found);
  };

  const handleQuickLogin = (user: User) => {
    setErrorMessage(null);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-600/20 via-emerald-800/10 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with PWA and Date */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
            <Coffee className="w-4 h-4 text-emerald-950" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              KEDAI TERAS
            </span>
            <span className="text-[10px] text-emerald-300 font-medium">
              Sistem Operasional &amp; POS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-200/80 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatIndonesianDate(todayStr, true)}</span>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Card Brand Header */}
          <div className="bg-emerald-900 text-white p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 rounded-full bg-emerald-700/30 blur-xl" />
            <div className="relative z-10 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30 mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Portal Masuk Sistem Kedai
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Selamat Datang di Kedai Teras
              </h1>
              <p className="text-xs text-emerald-200">
                Pilih peran Anda untuk memulai operasional atau monitoring bisnis
              </p>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('karyawan');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-2xl transition flex items-center justify-center gap-2 ${
                selectedRole === 'karyawan'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-4 h-4 text-emerald-600" />
              <span>Karyawan / Barista</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('owner');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-2xl transition flex items-center justify-center gap-2 ${
                selectedRole === 'owner'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Owner / Pengelola</span>
            </button>
          </div>

          {/* Login Form Body */}
          <div className="p-6 space-y-5">
            {/* Quick 1-Tap Login Chips */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <span>Pilih Akun Cepat ({selectedRole.toUpperCase()})</span>
                <span className="text-[10px] text-emerald-600 font-semibold lowercase">1-tap login</span>
              </div>

              <div className="space-y-2">
                {roleUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        user.role === 'owner'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {user.nama.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-900">
                          {user.nama}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {user.role === 'karyawan' ? (
                            <span>
                              Tarif: <strong className="text-emerald-700">{formatRupiah(user.tarifHarian || 50000)}/hari</strong> + Bonus {formatRupiah(user.bonusPerCup)}/cup
                            </span>
                          ) : (
                            <span className="text-amber-800 font-medium">Hak Akses Penuh Manajemen &amp; Payroll</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                      <span>Masuk</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
                Atau Masuk Manual
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleManualLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Username:
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={selectedRole === 'karyawan' ? 'Contoh: budi, siti, rian' : 'Contoh: owner'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kata Sandi (Demo: 123):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan sandi..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-emerald-600 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Footer Card */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
            {selectedRole === 'karyawan' ? (
              <p>
                * Login karyawan langsung diarahkan ke form closing dan absensi otomatis harian. Tarif harian: <strong>Rp 50.000 / kehadiran</strong>.
              </p>
            ) : (
              <p>
                * Login owner mencakup grafik penjualan (Senin–Sabtu), kontrol stok, dan perhitungan payroll.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 py-3 text-center text-xs text-slate-500">
        Kedai Teras Street Food POS &amp; Management • Versi 1.1 Progressive Web App
      </footer>
    </div>
  );
};
