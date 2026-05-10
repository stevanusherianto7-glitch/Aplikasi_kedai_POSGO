import * as React from 'react';
import { BluetoothPrintService } from '../services/bluetoothPrintService';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { RefreshCw, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction } from '../types';

export function PrinterSettings({ theme = 'light', currentTransaction }: { theme?: 'light' | 'dark', currentTransaction?: Transaction }) {
  const [devices, setDevices] = React.useState<any[]>([]);
  const [isScanning, setIsScanning] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState<string | null>(
    localStorage.getItem('printer_address')
  );

  const scanDevices = async () => {
    setIsScanning(true);
    try {
      const list = await BluetoothPrintService.listDevices();
      const updatedList = list || [];
      
      // Fallback: Jika tidak ada perangkat (misal di emulator), tambahkan mock RPP02N untuk testing
      if (updatedList.length === 0) {
        updatedList.push({
          name: 'RPP02N',
          address: '00:11:22:33:44:55'
        });
      }
      
      setDevices(updatedList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const selectPrinter = (address: string) => {
    localStorage.setItem('printer_address', address);
    setSelectedAddress(address);
    alert('Printer berhasil dipilih!');
  };

  const testPrint = async (type: string = 'customer') => {
    if (!selectedAddress) {
      alert('Pilih printer terlebih dahulu!');
      return;
    }
    
    const dummyTransaction: any = {
      id: 'TEST-PRINT',
      date: new Date().toISOString(),
      totalPrice: 10000,
      items: [
        { name: 'TEST ITEM PRINT', quantity: 1, price: 10000 }
      ]
    };
    
    // Prioritaskan transaksi yang aktif jika ada
    const transactionToPrint = currentTransaction || dummyTransaction;
    
    // Modifikasi data berdasarkan tipe struk
    let dataToPrint = { ...transactionToPrint };
    if (type === 'kitchen') {
      dataToPrint.isKitchen = true;
      // Kosongkan harga untuk dapur
      dataToPrint.items = dataToPrint.items.map((item: any) => ({ ...item, price: 0 }));
    } else if (type === 'closing') {
      dataToPrint.isClosing = true;
    }
    
    const success = await BluetoothPrintService.printReceipt(dataToPrint, selectedAddress);
    if (!success) {
      alert('Gagal mencetak. Pastikan printer menyala dan terhubung.');
    }
  };

  React.useEffect(() => {
    scanDevices();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pengaturan Printer</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Bluetooth Thermal Printer</p>
      </div>

      <Card className={cn(
        "p-6 border shadow-sm rounded-3xl space-y-6",
        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-100"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Daftar Perangkat</p>
              <p className="text-[10px] font-medium text-slate-400">Pilih printer untuk struk otomatis</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={scanDevices}
            disabled={isScanning}
            className="rounded-xl"
          >
            <RefreshCw className={cn("w-4 h-4", isScanning && "animate-spin")} />
          </Button>
        </div>

        <div className="space-y-2">
          {devices.length === 0 && !isScanning && (
            <div className="py-12 text-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada perangkat ditemukan</p>
              <p className="text-[8px] text-slate-400 mt-1">Pastikan Bluetooth HP aktif dan printer dalam mode pairing</p>
            </div>
          )}

          {devices.map((dev) => (
            <button
              key={dev.address}
              onClick={() => selectPrinter(dev.address)}
              className={cn(
                "w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98]",
                selectedAddress === dev.address
                  ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/5"
                  : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-blue-500/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  selectedAddress === dev.address ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"
                )}>
                  <Printer className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{dev.name || 'Unknown Device'}</p>
                  <p className="text-[8px] font-mono text-slate-400">{dev.address}</p>
                </div>
              </div>
              {selectedAddress === dev.address && (
                <Badge className="bg-blue-500 text-white text-[8px] rounded-lg">Terpilih</Badge>
              )}
            </button>
          ))}
        </div>

        {selectedAddress && (
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
             <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Printer Aktif</span>
             </div>
             {currentTransaction ? (
               <div className="grid grid-cols-1 gap-2">
                 <Button 
                   onClick={() => testPrint('customer')}
                   className="w-full size-xl bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                   Print Struk Customer
                 </Button>
                 <Button 
                   onClick={() => testPrint('kitchen')}
                   className="w-full size-xl bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                   Print Order Dapur (Kitchen)
                 </Button>
                 <Button 
                   onClick={() => testPrint('closing')}
                   className="w-full h-12 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                   Print Laporan Closing
                 </Button>
               </div>
             ) : (
               <Button 
                 onClick={() => testPrint('customer')}
                 className="w-full h-12 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
               >
                 Test Print Struk
               </Button>
             )}
          </div>
        )}
      </Card>

      <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2">
        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Informasi</p>
        <p className="text-[9px] leading-relaxed text-slate-500 font-medium">
          Aplikasi akan otomatis mencetak struk setiap kali Anda menyelesaikan transaksi di KasirGo jika printer sudah terpilih di sini. Gunakan kertas thermal 58mm atau 80mm.
        </p>
      </div>
    </div>
  );
}
