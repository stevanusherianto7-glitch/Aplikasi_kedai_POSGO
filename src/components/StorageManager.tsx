import * as React from "react";
import { Download, Upload, AlertTriangle, Save, RefreshCw, Trash2, ShieldCheck, Database } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function StorageManager({ onModalToggle }: { onModalToggle?: (isOpen: boolean) => void }) {
  const [isConfirmClearOpen, _setIsConfirmClearOpen] = React.useState(false);

  const setIsConfirmClearOpen = (val: boolean) => {
    _setIsConfirmClearOpen(val);
    if (onModalToggle) onModalToggle(val);
  };
  const fileInputRef = React.useRef<HTMLInputElement>(null);



  const handleExport = () => {
    alert("Data sekarang tersimpan di Supabase Cloud. Fitur backup lokal dinonaktifkan untuk keamanan data.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert("Sistem sekarang menggunakan Supabase Cloud. Silahkan gunakan fitur impor dari Dashboard Supabase.");
  };

  const handleClearAll = () => {
    alert("Fitur Factory Reset dinonaktifkan. Data Anda tersimpan aman di Supabase.");
    setIsConfirmClearOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-8 h-8 text-indigo-500" />
            Manajemen Penyimpanan & Backup
          </h2>
          <p className="text-slate-500 font-medium text-sm">Sistem telah dimigrasikan sepenuhnya ke Supabase Cloud Storage. Data tersimpan secara real-time dan aman.</p>
          <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1.5 rounded-full font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Cloud Synced & Secured
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Import Card */}
        <div className="glass-card p-8 rounded-[2rem] space-y-6 flex flex-col items-center justify-center text-center shadow-lg border-blue-100/50 relative overflow-hidden group">
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImport}
            title="Import Data JSON"
            aria-label="Import Data JSON"
          />
          <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-500 flex items-center justify-center -rotate-3 relative shadow-inner group-hover:rotate-0 transition-transform">
            <Upload className="w-10 h-10 rotate-3 group-hover:rotate-0 transition-transform" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Import / Restore</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">Pulihkan data dari file backup JSON sebelumnya. <span className="font-bold text-slate-700">Peringatan: Akan menimpa data yang ada saat ini!</span></p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3">
            <Upload className="w-4 h-4" /> Upload JSON
          </button>
        </div>

        {/* Factory Reset Card */}
        <div className="glass-card p-8 rounded-[2rem] space-y-6 flex flex-col items-center justify-center text-center shadow-lg border-rose-100/50">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-50 text-rose-500 flex items-center justify-center rotate-3 relative shadow-inner">
            <Trash2 className="w-10 h-10 -rotate-3" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Bersihkan Semua</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed px-4">Hapus total semua data operasional Anda dari browser ini selamanya. Lakukan backup terlebih dahulu!</p>
          </div>
          
          <Dialog open={isConfirmClearOpen} onOpenChange={setIsConfirmClearOpen}>
            <DialogTrigger render={<button title="Factory Reset" className="w-full h-14 bg-slate-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border-2 border-transparent hover:border-rose-100 active:scale-95 rounded-full font-black text-xs uppercase tracking-widest transition-all gap-3 flex items-center justify-center" />}>
                <AlertTriangle className="w-4 h-4" /> Factory Reset
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-3rem)] sm:max-w-md mx-auto rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="p-8 text-center bg-rose-600 text-white relative">
                <ShieldCheck className="w-16 h-16 opacity-20 absolute top-4 left-4" />
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                <DialogTitle className="text-2xl font-black text-white text-center">KONFIRMASI RESET!</DialogTitle>
                <DialogDescription className="text-rose-100 font-medium text-xs mt-2">
                  Apakah Anda 100% yakin ingin menghapus semua database? Hal ini tidak dapat diurungkan kembali kecuali Anda punya file backup.
                </DialogDescription>
              </div>
              <div className="p-6 bg-white space-y-4">
                <button 
                  onClick={handleClearAll} 
                  className="w-full h-14 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all flex items-center justify-center gap-3">
                  YA, HAPUS SEMUA DATA SEKARANG!
                </button>
                <button 
                  onClick={() => setIsConfirmClearOpen(false)} 
                  className="w-full h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 rounded-full font-black text-xs uppercase tracking-widest transition-all">
                  BATALKAN KEPUTUSAN
                </button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}
