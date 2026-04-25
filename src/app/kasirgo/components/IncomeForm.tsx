import React from 'react';
import { ArrowUpCircle } from 'lucide-react';

interface IncomeFormProps {
  newDailyIncome: { description: string; amount: string };
  setNewDailyIncome: (val: any) => void;
  onAdd: () => void;
  formatInputNumber: (val: string) => string;
  viewMode: 'harian' | 'bulanan';
  setViewMode: (mode: 'harian' | 'bulanan') => void;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  newDailyIncome, setNewDailyIncome, onAdd, formatInputNumber, viewMode, setViewMode
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
      {/* 1. JUDUL STAND ALONE */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
          <ArrowUpCircle size={20} />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">Catat Pemasukan</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Katalog Pendapatan</p>
        </div>
      </div>

      {/* 2. FILTER TAB DI BAWAH JUDUL */}
      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-full">
           <button
             onClick={() => setViewMode('harian')}
             className={`flex-1 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'harian' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
           >
             Harian
           </button>
           <button
             onClick={() => setViewMode('bulanan')}
             className={`flex-1 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'bulanan' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
           >
             Bulanan
           </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan</label>
          <input
            placeholder="Keterangan pemasukan..."
            className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={newDailyIncome.description}
            onChange={(e) => setNewDailyIncome({...newDailyIncome, description: e.target.value})}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
          <div className="relative">
             <input
              placeholder="0"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-base font-black text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={newDailyIncome.amount}
              onChange={(e) => setNewDailyIncome({...newDailyIncome, amount: formatInputNumber(e.target.value)})}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">RP</span>
          </div>
        </div>

        <button
          onClick={onAdd}
          className="w-full h-12 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 active:scale-95 transition-all mt-2"
        >
          Simpan Pemasukan
        </button>
      </div>
    </div>
  );
};
