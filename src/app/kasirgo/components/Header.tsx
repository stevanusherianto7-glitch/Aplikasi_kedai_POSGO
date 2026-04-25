import { formatPrice } from '../utils/format';

type HeaderProps = {
  currentPettyCash: number;
  onOpenCashModal: () => void;
  onOpenExpenseModal: () => void;
};

export function Header({ currentPettyCash, onOpenCashModal, onOpenExpenseModal }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
      <h1 className="text-3xl font-bold text-slate-800">Bang Kasir POS</h1>
      <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-lg">
        <div className="text-sm">
          <span className="text-slate-500 block text-xs">Petty Cash (Sisa)</span>
          <span className={`font-semibold ${currentPettyCash < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {formatPrice(currentPettyCash)}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onOpenCashModal}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Set Petty Cash
          </button>
          <button 
            onClick={onOpenExpenseModal}
            className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded hover:bg-rose-700 transition-colors"
          >
            Catat Pengeluaran
          </button>
        </div>
      </div>
    </div>
  );
}
