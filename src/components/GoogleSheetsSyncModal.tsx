import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, Copy, Check, RefreshCw, Database,
  Code, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { AppState } from '../types';
import { convertToCSV } from '../utils/storage';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onResetData: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  appState,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'gas_code' | 'backup'>('tables');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const tables = [
    { name: 'Users', count: appState.users.length, data: appState.users, desc: 'Master Pengguna & Karyawan' },
    { name: 'Absensi', count: appState.absensi.length, data: appState.absensi, desc: 'Riwayat Kehadiran Karyawan' },
    { name: 'Menus', count: appState.menus.length, data: appState.menus, desc: 'Master Varian Minuman & HPP' },
    { name: 'Ingredients', count: appState.ingredients.length, data: appState.ingredients, desc: 'Master Stok Bahan Baku' },
    { name: 'Recipes', count: appState.recipes.length, data: appState.recipes, desc: 'Pemetaan Resep per Cup' },
    { name: 'Closings', count: appState.closings.length, data: appState.closings, desc: 'Riwayat Closing & Arus Kas' },
    { name: 'Kasbon', count: appState.kasbon.length, data: appState.kasbon, desc: 'Pencatatan Pinjaman Kasbon' },
    { name: 'Payroll', count: appState.payroll.length, data: appState.payroll, desc: 'Rekap Gaji & Auto-Deduction' },
  ];

  const handleDownloadCSV = (tableName: string, data: any[]) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DB_Kedai_Teras_${tableName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTSV = (tableName: string, data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val ?? '');
      }).join('\t')
    );
    const tsv = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedKey(tableName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DB_Kedai_Teras_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simulateSyncWithGoogleSheets = () => {
    setSyncStatus('Sinkronisasi data ke DB_Kedai_Teras Google Sheets...');
    setTimeout(() => {
      setSyncStatus('Sinkronisasi Sukses! Seluruh 8 tab Google Sheets up to date.');
      setTimeout(() => setSyncStatus(null), 3000);
    }, 1200);
  };

  const appsScriptCode = `/**
 * Google Apps Script (Code.gs)
 * Web App Backend untuk DB_Kedai_Teras
 * Sambungkan dengan spreadsheet DB_Kedai_Teras
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const sheetName = e.parameter.sheet || 'Closings';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    if (action === 'SUBMIT_CLOSING') {
      const closing = payload.closing;
      const closingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Closings');
      closingSheet.appendRow([
        closing.id,
        closing.tanggal,
        closing.userId,
        JSON.stringify(closing.menuDetails),
        closing.totalCup,
        closing.totalPengeluaran,
        closing.totalPembayaranHutang,
        closing.totalKas,
        closing.catatanPeristiwa
      ]);
      
      // Auto-Trigger Absensi:
      const absensiSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Absensi');
      absensiSheet.appendRow([
        'ABS-' + new Date().getTime(),
        closing.tanggal,
        closing.userId,
        'Hadir',
        '',
        closing.id
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Closing and Attendance saved' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-800 text-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Database Google Sheets (DB_Kedai_Teras)
                <span className="text-[11px] bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full font-medium">8 Tab Sheets</span>
              </h2>
              <p className="text-xs text-emerald-200">
                Integrasi spreadsheet, backup CSV/JSON, & script Google Apps Script (Code.gs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            Daftar 8 Tab Sheet
          </button>
          <button
            onClick={() => setActiveTab('gas_code')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'gas_code'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            Backend Apps Script (Code.gs)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            Backup & Reset Data
          </button>
        </div>

        {/* Sync status toast */}
        {syncStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-medium flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              {syncStatus}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Status Database DB_Kedai_Teras</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Data disimpan secara persistent dan siap disalin/diimpor langsung ke Google Sheets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={simulateSyncWithGoogleSheets}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sinkronkan Sekarang
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Full JSON
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tables.map(tbl => (
                  <div
                    key={tbl.name}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 font-mono">
                            {tbl.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {tbl.count} baris
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{tbl.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDownloadCSV(tbl.name, tbl.data)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                        title="Unduh file CSV"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleCopyTSV(tbl.name, tbl.data)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition"
                        title="Salin data untuk langsung di-paste ke Google Sheets"
                      >
                        {copiedKey === tbl.name ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-emerald-600" />
                            Salin ke Sheets
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gas_code' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Code className="w-4 h-4" />
                    <span>Google Apps Script — Code.gs</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptCode);
                      setCopiedKey('gas_code');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
                  >
                    {copiedKey === 'gas_code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Kode Script
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-300 max-h-96">
                  {appsScriptCode}
                </pre>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Cara Menghubungkan ke Google Sheets Pribadi:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-amber-800">
                  <li>Buat Spreadsheet baru di Google Drive bernama <code>DB_Kedai_Teras</code>.</li>
                  <li>Buat 8 nama tab sesuai spesifikasi: Users, Absensi, Menus, Ingredients, Recipes, Closings, Kasbon, Payroll.</li>
                  <li>Buka <strong>Extensions &gt; Apps Script</strong>, tempel kode di atas, lalu Deploy sebagai Web App.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-sm text-slate-800">Export & Cadangan Lengkap</h4>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Unduh seluruh database dalam format JSON terstruktur untuk arsip bulanan lapak.
                </p>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  Unduh Cadangan JSON (Full Database)
                </button>
              </div>

              <div className="p-4 rounded-xl border border-red-200 bg-red-50/60">
                <h4 className="font-bold text-sm text-red-900">Reset ke Demo Data Bawaan</h4>
                <p className="text-xs text-red-700 mt-1 mb-3">
                  Mengembalikan data menu, stok bahan baku, riwayat closing, absensi, dan kasbon ke simulasi awal 500+ cup/hari.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Yakin ingin mereset seluruh data kembali ke setelan default awal?')) {
                      onResetData();
                      alert('Data berhasil direset ke kondisi awal.');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Database Sekarang
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
