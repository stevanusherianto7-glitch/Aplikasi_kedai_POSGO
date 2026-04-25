import React from 'react';
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, FileText, Settings, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  activeTab: 'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan';
  setActiveTab: (tab: 'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan') => void;
  onBack?: () => void;
  onToggleSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onBack, onToggleSettings }) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* BARIS ATAS: Tombol Back, Judul, Gear */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onBack ? onBack() : window.history.back()}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              title="Kembali"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black flex items-center gap-1.5 group">
              <div className="relative">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter uppercase">KASIR</span>
              </div>
              <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-1 rounded-md tracking-[0.3em] ml-0.5 shadow-lg shadow-blue-500/20">GO</span>
            </h1>
          </div>

          <button
            onClick={onToggleSettings}
            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            title="Pengaturan Menu"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* BARIS BAWAH: 4 Kotak Menu */}
        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={() => setActiveTab('kasir')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-2 ${activeTab === 'kasir' ? 'bg-blue-50 text-blue-600 border-blue-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
          >
            <LayoutDashboard size={20} className="mb-1" /> 
            <span className="text-[10px] font-bold">Kasir</span>
          </button>

          <button 
            onClick={() => setActiveTab('pengeluaran')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-2 ${activeTab === 'pengeluaran' ? 'bg-rose-50 text-rose-600 border-rose-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
          >
            <ArrowDownCircle size={20} className="mb-1" /> 
            <span className="text-[10px] font-bold truncate w-full text-center tracking-tight">Expenses</span>
          </button>

          <button 
            onClick={() => setActiveTab('pemasukan')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-2 ${activeTab === 'pemasukan' ? 'bg-emerald-50 text-emerald-600 border-emerald-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
          >
            <ArrowUpCircle size={20} className="mb-1" /> 
            <span className="text-[10px] font-bold truncate w-full text-center tracking-tight">Incomes</span>
          </button>

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border-2 ${activeTab === 'laporan' ? 'bg-amber-50 text-amber-600 border-amber-600 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200'}`}
          >
            <FileText size={20} className="mb-1" /> 
            <span className="text-[10px] font-bold">Laporan</span>
          </button>
        </div>
      </div>
    </div>
  );
};