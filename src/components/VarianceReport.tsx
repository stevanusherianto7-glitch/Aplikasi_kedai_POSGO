import * as React from "react";
import {
  FileBarChart,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import { Ingredient } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VarianceReportProps {
  ingredients: Ingredient[];
}

export const VarianceReport: React.FC<VarianceReportProps> = ({ ingredients }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Variansi</h2>
          <p className="text-slate-500 font-medium text-xs">Selisih Stok Fisik vs Sistem</p>
        </div>
        <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1">
          Auto-Generated
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Item Selisih</p>
          <p className="text-lg font-black text-rose-500">0 Items</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estimasi Kerugian</p>
          <p className="text-lg font-black text-slate-900">{formatCurrency(0)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {ingredients.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tidak ada data bahan</p>
          </div>
        ) : (
          ingredients.map(ing => {
            // Mocking variance for UI demonstration if needed,
            // but usually calculated from (physicalStock - systemStock)
            const variance = 0;
            const isWarning = variance < 0;

            return (
              <div
                key={ing.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm"
              >
                {/* Baris 1: Nama Bahan & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center",
                      isWarning ? "bg-rose-50" : "bg-emerald-50"
                    )}>
                      {isWarning ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                      {ing.name.toUpperCase()}
                    </h3>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[8px] font-black px-1.5 h-4 border-none uppercase",
                    isWarning ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {isWarning ? "Selisih" : "Akurat"}
                  </Badge>
                </div>

                {/* Baris 2: Stok Sistem, Stok Fisik, Variansi */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-6 sm:gap-12">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sistem</p>
                      <p className="text-[11px] font-black text-slate-900">
                        {ing.stockQuantity} {ing.useUnit}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fisik</p>
                      <p className="text-[11px] font-black text-slate-900">
                        {ing.stockQuantity} {ing.useUnit}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selisih</p>
                      <p className={cn("text-[11px] font-black", variance < 0 ? "text-rose-500" : "text-emerald-500")}>
                        {variance} {ing.useUnit}
                      </p>
                    </div>
                  </div>

                  <button className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl" aria-label={`Info Selisih ${ing.name}`}>
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
