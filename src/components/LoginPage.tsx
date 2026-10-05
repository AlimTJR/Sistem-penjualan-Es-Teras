import React, { useState, useEffect } from 'react';
import {
  Coffee, Shield, User as UserIcon, Lock, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Clock, Eye, EyeOff,
  History, ArrowLeft, X, KeyRound, UserCheck
} from 'lucide-react';
import { User } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { formatIndonesianDate, getTodayDateStr } from '../utils/formatters';
import { getRecentUserIds, addRecentUserId, removeRecentUserId } from '../utils/storage';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'form' | 'quick-unlock'>('form');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRecentUser, setSelectedRecentUser] = useState<User | null>(null);
  const [recentUserIds, setRecentUserIds] = useState<string[]>([]);

  const todayStr = getTodayDateStr();

  // Load recent users on mount
  useEffect(() => {
    const ids = getRecentUserIds();
    setRecentUserIds(ids);
  }, []);

  // Filter valid active recent users
  const recentUsers = recentUserIds
    .map(id => users.find(u => u.id === id && u.status === 'aktif'))
    .filter((u): u is User => u !== undefined);

  // Auto-select mode: if there is at least one recent user, we can still default to form
  // but show quick selector chips right above or toggle between them.
  const handleSelectRecentAccount = (user: User) => {
    setSelectedRecentUser(user);
    setUsername(user.username);
    setPassword('');
    setErrorMessage(null);
    setMode('quick-unlock');
  };

  const handleSwitchToFullForm = () => {
    setMode('form');
    setSelectedRecentUser(null);
    setPassword('');
    setErrorMessage(null);
  };

  const handleRemoveRecent = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    removeRecentUserId(userId);
    const updated = recentUserIds.filter(id => id !== userId);
    setRecentUserIds(updated);
    if (selectedRecentUser?.id === userId) {
      handleSwitchToFullForm();
    }
  };

  // Submit standard form (Username + Password)
  const handleFullFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage('Harap masukkan username Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Harap masukkan kata sandi.');
      return;
    }

    const found = users.find(
      u => u.username.toLowerCase() === cleanUsername && u.status === 'aktif'
    );

    if (!found) {
      setErrorMessage('Username tidak ditemukan atau akun sedang dinonaktifkan.');
      return;
    }

    const expectedPassword = found.password || '123';
    if (password !== expectedPassword && password !== '123') {
      setErrorMessage('Kata sandi salah. Silakan periksa kembali. (Default demo: 123)');
      return;
    }

    addRecentUserId(found.id);
    onLoginSuccess(found);
  };

  // Submit quick unlock (Password only for selected recent user)
  const handleQuickUnlockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedRecentUser) {
      handleSwitchToFullForm();
      return;
    }

    if (!password) {
      setErrorMessage('Harap masukkan kata sandi untuk akun ini.');
      return;
    }

    const expectedPassword = selectedRecentUser.password || '123';
    if (password !== expectedPassword && password !== '123') {
      setErrorMessage('Kata sandi salah. Silakan periksa kembali. (Default demo: 123)');
      return;
    }

    addRecentUserId(selectedRecentUser.id);
    onLoginSuccess(selectedRecentUser);
  };

  // Demo auto-fill helper
  const handleDemoFill = (demoUsername: string) => {
    const user = users.find(u => u.username.toLowerCase() === demoUsername.toLowerCase());
    if (user) {
      setUsername(user.username);
      setPassword(user.password || '123');
      setErrorMessage(null);
    }
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
              Sistem Operasional &amp; POS Lapak
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
                {mode === 'quick-unlock' && selectedRecentUser
                  ? `Halo, ${selectedRecentUser.nama}!`
                  : 'Selamat Datang'}
              </h1>
              <p className="text-xs text-emerald-200">
                {mode === 'quick-unlock' && selectedRecentUser
                  ? 'Masukkan kata sandi untuk melanjutkan sesi Anda'
                  : 'Masuk dengan username dan kata sandi akun Anda'}
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5">

            {/* ERROR ALERT */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* MODE 1: QUICK UNLOCK (HANYA MENGISI PASSWORD) */}
            {mode === 'quick-unlock' && selectedRecentUser ? (
              <form onSubmit={handleQuickUnlockLogin} className="space-y-4 text-xs">
                {/* Selected User Badge Card */}
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                      selectedRecentUser.role === 'owner'
                        ? 'bg-amber-400 text-emerald-950'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {selectedRecentUser.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 leading-tight">
                        {selectedRecentUser.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-600 font-semibold">@{selectedRecentUser.username}</span>
                        <span>•</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                          selectedRecentUser.role === 'owner'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {selectedRecentUser.role === 'owner' ? 'Owner / Pengelola' : (selectedRecentUser.jabatan || 'Barista')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwitchToFullForm}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                    title="Ganti akun"
                  >
                    Ganti
                  </button>
                </div>

                {/* Password only field */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Kata Sandi untuk {selectedRecentUser.nama}:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Password demo bawaan: <strong className="text-slate-600 font-mono">123</strong>
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Masuk sebagai {selectedRecentUser.nama.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchToFullForm}
                    className="w-full py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded-xl transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Masuk Menggunakan Username Lain</span>
                  </button>
                </div>
              </form>
            ) : (
              /* MODE 2: FORM LOGIN LENGKAP (USERNAME + PASSWORD) */
              <div className="space-y-5">
                
                {/* SECTION: AKUN YANG PERNAH LOGIN (JIKA ADA) */}
                {recentUsers.length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-emerald-600" />
                        Pernah Masuk di Perangkat Ini (Login Cepat):
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Tinggal isi sandi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recentUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectRecentAccount(user)}
                          className="relative p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition text-left cursor-pointer group flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-6">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              user.role === 'owner'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {user.nama.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-800 group-hover:text-emerald-900 truncate leading-tight">
                                {user.nama}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                                @{user.username} • {user.role === 'owner' ? 'Owner' : 'Barista'}
                              </p>
                            </div>
                          </div>

                          {/* Delete from recent button */}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveRecent(e, user.id)}
                            className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 rounded-md hover:bg-slate-100 transition cursor-pointer"
                            title="Hapus dari daftar cepat perangkat ini"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MAIN FORM: USERNAME & PASSWORD */}
                <form onSubmit={handleFullFormLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Username:
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={username}
                        onChange={e => {
                          setUsername(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="Contoh: owner, budi, siti, rian"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-bold">
                        Kata Sandi:
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Default Demo: <strong className="font-mono text-slate-600">123</strong>
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="Ketik kata sandi akun..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* DEMO ACCOUNTS HELPER PILLS */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-amber-500" />
                      Bantuan Akun Demo (Klik untuk Isi Otomatis)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDemoFill('owner')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3 text-amber-600" />
                      <span>Owner: <strong>owner</strong> / 123</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDemoFill('budi')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Coffee className="w-3 h-3 text-emerald-600" />
                      <span>Barista: <strong>budi</strong> / 123</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDemoFill('siti')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Coffee className="w-3 h-3 text-emerald-600" />
                      <span>Barista: <strong>siti</strong> / 123</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer Card */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
            <p>
              * Sistem mendeteksi hak akses (Owner atau Karyawan) secara otomatis sesuai akun yang Anda gunakan.
            </p>
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
