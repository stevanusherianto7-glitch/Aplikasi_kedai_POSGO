import React from 'react';
import { ArrowDownCircle } from 'lucide-react';

interface ExpenseFormProps {
  newExpense: { description: string; amount: string };
  setNewExpense: (val: any) => void;
  onAdd: () => void;
  formatInputNumber: (val: string) => string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  newExpense, setNewExpense, onAdd, formatInputNumber
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
          <ArrowDownCircle size={20} />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">Catat Pengeluaran</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Operasional Kedai</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan</label>
          <input
            placeholder="Contoh: Beli Gas, Listrik..."
            className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
            value={newExpense.description}
            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
          <div className="relative">
             <input
              placeholder="0"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-base font-black text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({...newExpense, amount: formatInputNumber(e.target.value)})}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">RP</span>
          </div>
        </div>

        <button
          onClick={onAdd}
          className="w-full h-12 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-100 active:scale-95 transition-all mt-2"
        >
          Simpan Pengeluaran
        </button>
      </div>
    </div>
  );
};
