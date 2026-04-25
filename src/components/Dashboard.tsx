import * as React from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  ArrowRight,
  FileDown,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ingredient, Transaction, Expense, Recipe } from "../types";
import { formatCurrency } from "@/lib/utils";
import { Logo } from "./Logo";
import { SalesSync } from "./SalesSync";

interface DashboardProps {
  transactions: Transaction[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  expenses: Expense[];
  pettyCash: number;
  handleBackup: () => void;
  handleRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleClosing: () => void;
  onTabChange: (tab: string) => void;
  onProcessTransaction: (transaction: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  recipes,
  ingredients,
  expenses,
  pettyCash,
  handleRestore,
  handleClosing,
  onTabChange,
  onProcessTransaction
}) => {
  const [isSalesSyncOpen, setIsSalesSyncOpen] = React.useState(false);

  const totalSales = transactions.reduce((acc, t) => acc + t.totalPrice, 0);
  const totalHpp = transactions.reduce((acc, t) => acc + (t.totalHpp || 0), 0);
  const grossProfit = totalSales - totalHpp;
  const lowStockCount = ingredients.filter(i => i.stockQuantity <= i.lowStockThreshold).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Logo size={32} className="brightness-0 invert" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic">
              PosGO<span className="text-emerald-500 not-italic ml-1">57</span> System
            </h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Inventory Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Removed: Input Penjualan Button */}
          
          <Button 
            variant="outline"
            onClick={handleClosing}
            className="h-12 w-12 border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all"
          >
            <FileText className="w-5 h-5 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="premium-card group bg-slate-900 border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Total Revenue</p>
              <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{formatCurrency(totalSales)}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Omset Penjualan</span>
                <span className="text-[10px] font-bold text-emerald-400/70">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card group bg-white md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Stok</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{lowStockCount}</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Menipis</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="text-right">
                  <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Habis</p>
                  <p className="text-xl font-black text-rose-500 leading-none">{ingredients.filter(i => i.stockQuantity <= 0).length}</p>
                </div>
                <div className="w-px h-8 bg-slate-100 mx-2" />
                <div className="text-right">
                  <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Tipis</p>
                  <p className="text-xl font-black text-orange-500 leading-none">{ingredients.filter(i => i.stockQuantity > 0 && i.stockQuantity <= i.lowStockThreshold).length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-slate-900 tracking-tighter italic uppercase">WAREHOUSE<span className="text-emerald-500 not-italic ml-1">STATUS</span></h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ketersediaan bahan baku</p>
          </div>
          <Button variant="ghost" onClick={() => onTabChange('bahan')} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 rounded-lg h-8">
            Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lowStockCount === 0 ? (
            <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">SEMUA AMAN!</h4>
                <p className="text-slate-400 text-[10px] font-bold max-w-xs mx-auto">Semua bahan baku tersedia di atas batas minimum stok.</p>
              </div>
            </div>
          ) : (
            ingredients.filter(i => i.stockQuantity <= i.lowStockThreshold).map(ing => (
              <Card key={ing.id} className="premium-card bg-white">
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">{ing.name}</h3>
                      <div className="inline-flex items-center px-2 py-0.5 bg-slate-50 rounded text-[8px] font-black text-slate-400 uppercase tracking-wider">
                        {ing.category}
                      </div>
                    </div>
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Stok Saat Ini</p>
                        <p className="text-lg font-black text-rose-500 tracking-tighter leading-none">
                          {ing.stockQuantity} <span className="text-[10px] font-bold text-slate-400 ml-0.5">{ing.useUnit}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Min: {ing.lowStockThreshold} {ing.useUnit}</p>
                      </div>
                    </div>
                    
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        ref={(el) => {
                          if (el) {
                            const width = Math.min(100, (ing.stockQuantity / (ing.lowStockThreshold || 1)) * 100);
                            el.style.setProperty('width', `${width}%`);
                          }
                        }}
                        className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <SalesSync 
        isOpen={isSalesSyncOpen}
        onClose={() => setIsSalesSyncOpen(false)}
        recipes={recipes}
        ingredients={ingredients}
        onProcessTransaction={onProcessTransaction}
      />
    </div>
  );
};
