import * as React from "react";
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Receipt,
  Trash2,
  ChevronRight
} from "lucide-react";
import { Transaction } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface HistoryManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const HistoryManager: React.FC<HistoryManagerProps> = ({
  transactions,
  setTransactions
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-slate-500 font-medium text-xs">Lacak aktivitas penjualan & pembayaran</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Input 
            placeholder="Cari ID transaksi..." 
            className="h-10 pl-10 rounded-xl border-slate-200 bg-white text-slate-900 font-bold text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="flex gap-2">
          <select className="flex-1 h-10 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            <option>Semua Metode</option>
            <option>Tunai</option>
            <option>QRIS</option>
          </select>
          <button className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {transactions.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Receipt className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Belum Ada Transaksi</p>
          </div>
        ) : (
          transactions.map(t => (
            <div
              key={t.id}
              className="group bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm active:scale-[0.98] transition-all"
            >
              {/* Baris 1: Order ID & Payment Method */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                    #{t.orderNumber || t.id.slice(0, 8).toUpperCase()}
                  </h3>
                </div>
                <Badge className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-1.5 h-4 border-none",
                  t.paymentMethod === 'Tunai' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                )}>
                  {t.paymentMethod}
                </Badge>
              </div>

              {/* Baris 2: Total Price, Qty, Time, Detail Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-8">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</p>
                    <p className="text-[11px] font-black text-emerald-600">
                      {formatCurrency(t.totalPrice)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                    <p className="text-[11px] font-black text-slate-600">
                      {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
