type ModalsProps = {
  isCashModalOpen: boolean;
  setIsCashModalOpen: (isOpen: boolean) => void;
  tempCashInput: string;
  setTempCashInput: (val: string) => void;
  handleSaveInitialCash: () => void;
  
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (isOpen: boolean) => void;
  expenseDesc: string;
  setExpenseDesc: (desc: string) => void;
  expenseAmount: string;
  setExpenseAmount: (amount: string) => void;
  handleSaveExpense: () => void;
};

export function Modals({
  isCashModalOpen, setIsCashModalOpen, tempCashInput, setTempCashInput, handleSaveInitialCash,
  isExpenseModalOpen, setIsExpenseModalOpen, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, handleSaveExpense
}: ModalsProps) {
  return (
    <>
      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Catat Pengeluaran Petty Cash</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Contoh: Beli es batu, plastik..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Jumlah (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenseAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setExpenseAmount(val);
                  }}
                  className="w-full p-2 border rounded"
                  placeholder="Masukkan jumlah..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveExpense}
                disabled={!expenseDesc.trim() || !expenseAmount}
                className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Set Petty Cash</h3>
            <input
              type="text"
              inputMode="numeric"
              value={tempCashInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setTempCashInput(val);
              }}
              className="w-full p-2 border rounded mb-4"
              placeholder="Masukkan jumlah..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsCashModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveInitialCash}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
