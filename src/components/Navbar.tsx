import React, { useState } from 'react';
import {
  Coffee, Shield, User as UserIcon, ChevronDown,
  LogOut, Database, RefreshCw, Clock, CheckCircle2,
  Cloud
} from 'lucide-react';
import { User } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { formatIndonesianDate, getTodayDateStr } from '../utils/formatters';

interface NavbarProps {
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  onOpenSheetsModal: () => void;
  isCloudConnected?: boolean;
  lastSyncTime?: string;
  onForceSync?: () => void;
  activeView: 'karyawan' | 'owner';
  setActiveView: (view: 'karyawan' | 'owner') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  users,
  currentUser,
  onSelectUser,
  onLogout,
  onOpenSheetsModal,
  isCloudConnected = true,
  lastSyncTime,
  onForceSync,
  activeView,
  setActiveView,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const todayDate = getTodayDateStr();

  const activeEmployees = users.filter(u => u.status === 'aktif');

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 font-black shadow-inner shadow-amber-300">
            <Coffee className="w-5 h-5 text-emerald-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-none">
                KEDAI TERAS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-700/50">
                POS &amp; OPS
              </span>
            </div>
            <p className="text-[11px] text-emerald-300 hidden sm:block mt-0.5">
              Sistem Manajemen Operasional &amp; Closing Harian
            </p>
          </div>
        </div>

        {/* Center: Active Date */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-200 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-800/60">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatIndonesianDate(todayDate, true)}</span>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Firebase Cloud Live Status */}
          <button
            type="button"
            onClick={onForceSync}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition cursor-pointer ${
              isCloudConnected
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 hover:bg-emerald-950'
                : 'bg-amber-950/80 border-amber-500/70 text-amber-300 hover:bg-amber-950'
            }`}
            title="Klik untuk menyinkronkan data real-time dengan Google Cloud Firestore (Localhost & AI Studio)"
          >
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <Cloud className="w-3.5 h-3.5" />
            <span className="font-bold">
              {isCloudConnected ? 'Cloud Realtime' : 'Menghubungkan...'}
            </span>
            {lastSyncTime && (
              <span className="text-[10px] text-emerald-400/80 font-mono">
                • {lastSyncTime}
              </span>
            )}
          </button>

          {/* Google Sheets DB button */}
          <button
            onClick={onOpenSheetsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/70 transition shadow-xs"
            title="Database Google Sheets DB_Kedai_Teras"
          >
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">DB Sheets</span>
          </button>

          {/* Role Switcher if Owner */}
          {currentUser.role === 'owner' && (
            <div className="hidden sm:flex bg-emerald-950/60 p-0.5 rounded-xl border border-emerald-800">
              <button
                onClick={() => setActiveView('owner')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeView === 'owner'
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                Owner Portal
              </button>
              <button
                onClick={() => setActiveView('karyawan')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeView === 'karyawan'
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                Karyawan POS
              </button>
            </div>
          )}

          {/* User selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-750 text-white text-xs font-medium border border-emerald-700 transition"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-[11px] text-amber-300">
                {currentUser.nama.charAt(0)}
              </div>
              <div className="text-left hidden sm:block max-w-[120px] truncate">
                <span className="font-semibold block truncate leading-tight">{currentUser.nama}</span>
                <span className="text-[10px] text-emerald-300 capitalize block leading-tight">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-1">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Masuk Sebagai Pengguna
                  </p>
                  <p className="text-xs font-bold text-emerald-950 truncate mt-0.5">
                    {currentUser.nama} ({currentUser.role})
                  </p>
                </div>

                <div className="py-1">
                  <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Ganti Akun (RBAC Sim)
                  </p>
                  {activeEmployees.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setActiveView(u.role === 'owner' ? 'owner' : 'karyawan');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition ${
                        u.id === currentUser.id ? 'bg-emerald-50/70 font-semibold text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          u.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role === 'owner' ? 'OW' : 'KR'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{u.nama}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{u.jabatan || u.role}</div>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Halaman Login)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
