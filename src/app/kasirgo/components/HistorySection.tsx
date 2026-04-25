import { ExpenseItem, Transaction } from '../types';
import { formatIDR } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

type HistorySectionProps = {
  history: Transaction[];
  expenses: ExpenseItem[];
  onVoidTransaction: (id: number) => void;
};

export function HistorySection({ history, expenses, onVoidTransaction }: HistorySectionProps) {
  return (
    <div className="mt-12 grid md:grid-cols-2 gap-8 print:hidden">
      <div>
        <h2 className="text-2xl font-bold mb-4">Riwayat Transaksi</h2>
        <div className="grid gap-4">
          {history.length === 0 ? (
            <p className="text-slate-500">Belum ada transaksi.</p>
          ) : (
            history.map((tx) => (
              <div key={tx.id} className="p-4 border rounded shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-semibold">{tx.date} - {tx.paymentMethod}</p>
                  <p>Total: {formatIDR(tx.total)}</p>
                  <ul className="text-sm text-slate-600">
                    {tx.items.map((item) => (
                      <li key={item.id}>{item.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => onVoidTransaction(String(tx.id))}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                  title="Void Transaksi"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Riwayat Pengeluaran</h2>
        <div className="grid gap-4">
          {expenses.length === 0 ? (
            <p className="text-slate-500">Belum ada pengeluaran.</p>
          ) : (
            expenses.map((exp) => (
              <div key={exp.id} className="p-4 border rounded shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-semibold">{exp.description}</p>
                  <p className="text-xs text-slate-500">{exp.date}</p>
                </div>
                <p className="font-bold text-rose-600">-{formatIDR(exp.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
