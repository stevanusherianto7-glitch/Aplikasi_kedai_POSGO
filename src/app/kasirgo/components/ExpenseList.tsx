import React from 'react';
import { ArrowDownCircle, Trash2 } from 'lucide-react';
import { ExpenseItem } from '../types';
import { formatIDR } from '@/lib/utils';
import { formatDate } from '../utils/formatters';

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDelete?: (id: string | number) => void;
  filterMonth?: string;
  viewMode?: 'harian' | 'bulanan';
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, filterMonth, viewMode }) => {
  const filtered = expenses.filter(e => {
    if (!filterMonth) return true;
    try {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return true;

      if (viewMode === 'harian') {
        const eDate = d.toISOString().substring(0, 10);
        const today = new Date().toISOString().substring(0, 10);
        return eDate === today;
      } else {
        // Mode Bulanan: Filter berdasarkan bulan yang dipilih (format YYYY-MM)
        const eMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return eMonth === filterMonth;
      }
    } catch (err) {
      return true;
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-lg">Riwayat Pengeluaran</h3>
        <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-500">{filtered.length} ITEM</span>
      </div>
      <div className="divide-y divide-slate-100">
        {filtered.map(e => (
          <div key={e.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <ArrowDownCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 uppercase text-xs">{e.description}</p>
                <p className="text-[10px] text-slate-400 font-bold">{formatDate(e.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-rose-600 text-sm">-{formatIDR(e.amount)}</span>
              <button onClick={() => onDelete && onDelete(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2" title="Hapus Pengeluaran" aria-label="Hapus Pengeluaran">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic text-sm">Belum ada catatan pengeluaran.</div>
        )}
      </div>
    </div>
  );
};
