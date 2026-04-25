import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Info, Clock, Calendar, Coffee } from "lucide-react";

interface ShiftCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftCheatSheet: React.FC<ShiftCheatSheetProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-4rem)] sm:max-w-md mx-auto rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="p-8 bg-slate-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-sm font-black text-white uppercase tracking-widest">Shift Reference</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            Panduan Jam Kerja & Kode Shift
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase">Shift Pagi (P)</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-tight">08:00 - 16:00 (8 JAM)</p>
                <p className="text-[9px] text-slate-400 mt-1 italic">Fokus: Persiapan & Pelayanan Pagi</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase">Shift Middle (M)</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-tight">12:00 - 20:00 (8 JAM)</p>
                <p className="text-[9px] text-slate-400 mt-1 italic">Fokus: Peak Hour & Transisi</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase">Libur (L)</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-tight">OFF DUTY</p>
                <p className="text-[9px] text-slate-400 mt-1 italic">Istirahat Mingguan Terjadwal</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
               <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Catatan Penting</span>
            </div>
            <ul className="space-y-2">
              <li className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                Datang 15 menit sebelum shift dimulai.
              </li>
              <li className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                Gunakan seragam lengkap dan rapi.
              </li>
              <li className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                Serah terima (handover) wajib dilakukan.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
          >
            MENGERTI
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
