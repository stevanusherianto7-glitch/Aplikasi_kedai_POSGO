import * as React from "react";
import { 
  Plus, 
  Trash2,
  Wallet,
  Calculator,
  TrendingDown
} from "lucide-react";
import { Expense } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { PriceInput } from "./PriceInput";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PettyCashManagerProps {
  expenses: Expense[];
  pettyCash: number;
  setPettyCash: (val: number | ((prev: number) => number)) => void;
  isAddingExpense: boolean;
  setIsAddingExpense: (val: boolean) => void;
  newExpense: Partial<Expense>;
  setNewExpense: (val: Partial<Expense>) => void;
  handleAddExpense: () => void;
}

export const PettyCashManager: React.FC<PettyCashManagerProps> = ({
  expenses,
  pettyCash,
  setPettyCash,
  isAddingExpense,
  setIsAddingExpense,
  newExpense,
  setNewExpense,
  handleAddExpense
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Petty Cash</h2>
          <p className="text-slate-500 font-medium text-xs">Dana Operasional Harian</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" className="h-10 px-4 gap-1.5 border-slate-200 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-wider" />}>
              <Plus className="w-3.5 h-3.5" />
              Top Up
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md mx-auto rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="p-6 bg-primary">
                <DialogTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  Top Up Saldo
                </DialogTitle>
              </div>
              <div className="p-6 space-y-4 bg-white">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Jumlah Top Up</label>
                  <PriceInput 
                    value={0}
                    onChange={(val) => {
                      if (val > 0) {
                        setPettyCash(prev => prev + val);
                      }
                    }}
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <Button onClick={() => {}} className="w-full h-12 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  Simpan Saldo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
            <DialogTrigger render={<Button className="h-10 px-4 gap-1.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20" />}>
              <TrendingDown className="w-3.5 h-3.5" />
              Catat Biaya
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md mx-auto rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="p-6 bg-primary">
                <DialogTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  Pengeluaran Baru
                </DialogTitle>
              </div>
              <div className="p-6 space-y-5 bg-white">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Deskripsi</label>
                  <Input 
                    placeholder="Contoh: Beli Gas / Parkir"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-900 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Jumlah (Rp)</label>
                  <PriceInput 
                    value={newExpense.amount || 0}
                    onChange={(val) => setNewExpense({...newExpense, amount: val})}
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kategori</label>
                  <select 
                    id="expense-category-select"
                    className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                    aria-label="Kategori Pengeluaran"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Bahan Baku">Bahan Baku (Urgent)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <Button variant="ghost" onClick={() => setIsAddingExpense(false)} className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Batal</Button>
                <Button onClick={handleAddExpense} className="flex-1 h-12 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Simpan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Card className="border-none shadow-none bg-primary text-white rounded-2xl overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none text-[8px] font-black uppercase tracking-[0.2em]">Active Balance</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Saldo Petty Cash</p>
                <h2 className="text-3xl font-black tracking-tight">{formatCurrency(pettyCash)}</h2>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center gap-3">
                <Calculator className="w-4 h-4 text-white/60 shrink-0" />
                <p className="text-[9px] text-white/60 font-black uppercase tracking-wider leading-relaxed">
                  Gunakan saldo ini untuk operasional harian kasir.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">Log Pengeluaran</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expenses.length} Transaksi</p>
          </div>

          <div className="flex flex-col gap-3">
            {expenses.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum Ada Pengeluaran</p>
              </div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm">
                  {/* Baris 1: Deskripsi & Kategori */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">
                      {exp.description.toUpperCase()}
                    </h3>
                    <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-primary/20 text-primary uppercase">
                      {exp.category}
                    </Badge>
                  </div>

                  {/* Baris 2: Amount, Tanggal, Ikon Delete */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-8">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nominal</p>
                        <p className="text-[11px] font-black text-rose-500">
                          {formatCurrency(exp.amount)}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                        <p className="text-[11px] font-black text-slate-600">
                          {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
