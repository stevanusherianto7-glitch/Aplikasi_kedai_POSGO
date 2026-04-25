import { RefObject } from 'react';
import { CartItem } from '../types';
import { formatPrice, getCurrentFormattedDate } from '../utils/format';

type CartSectionProps = {
  cart: CartItem[];
  total: number;
  paymentMethod: 'Tunai' | 'QRIS';
  setPaymentMethod: (method: 'Tunai' | 'QRIS') => void;
  cashAmount: number;
  setCashAmount: (amount: number) => void;
  change: number;
  cartRef: RefObject<HTMLDivElement | null>;
  handleSavePDF: () => void;
  completeTransaction: () => void;
};

export function CartSection({
  cart,
  total,
  paymentMethod,
  setPaymentMethod,
  cashAmount,
  setCashAmount,
  change,
  cartRef,
  handleSavePDF,
  completeTransaction
}: CartSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 print:hidden">Ringkasan Pesanan</h2>
      <div ref={cartRef} id="printable-receipt" className="thermal-receipt border border-[#e2e8f0] p-4 rounded bg-[#f8fafc] text-[#0f172a] print:border-none print:bg-[#ffffff] print:p-0 print:w-[57mm] print:text-[#000000] print:text-[10px] print:leading-tight overflow-hidden">
        <style type="text/css">
          {`
            /* Simulasi Font B Printer Thermal (Kecil & Rapat) untuk tampilan layar */
            .thermal-receipt {
              font-family: 'FontB', 'Font B', 'Terminal', 'Courier New', Courier, monospace !important;
              letter-spacing: -0.5px !important;
              font-stretch: condensed !important;
            }
            @page { size: 57mm auto; margin: 0; }
            @media print {
              body { width: 57mm; margin: 0; padding: 0; background: white; }
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { 
                visibility: visible; 
                font-family: 'FontB', 'Font B', 'Terminal', 'Courier New', Courier, monospace !important;
                letter-spacing: -0.5px !important;
                font-stretch: condensed !important;
              }
              #printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 57mm;
                margin: 0;
                padding: 2mm;
              }
            }
          `}
        </style>
        
        {/* Print Header */}
        <div className="hidden print:block text-center mb-3 pt-2">
          <h2 className="font-bold text-[11px]">WARUNG BANG KASIR</h2>
          <p className="text-[10px] mt-1">Jl. Contoh Alamat No. 123</p>
          <p className="text-[10px]">Kota, Provinsi 12345</p>
          <div className="border-b border-dashed border-[#000000] my-2"></div>
          <div className="flex justify-between text-[10px] text-left">
            <span>{getCurrentFormattedDate()}</span>
            <span>Kasir: Admin</span>
          </div>
          <div className="border-b border-dashed border-[#000000] mt-2"></div>
        </div>

        {cart.length === 0 ? (
          <p className="text-[#64748b] print:hidden">Pesanan kosong.</p>
        ) : (
          <>
            <div className="space-y-3 print:space-y-1 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-1">
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold print:font-normal truncate">{item.name}</div>
                    <div className="text-sm text-[#64748b] print:text-[#000000] print:text-[10px] whitespace-nowrap">
                      {item.quantity} x {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="font-semibold print:font-normal text-right shrink-0 ml-2 whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e2e8f0] print:border-dashed print:border-[#000000] pt-2 font-bold text-base print:text-[11px] flex justify-between gap-1">
              <span>TOTAL BAYAR:</span>
              <span className="shrink-0 whitespace-nowrap">{formatPrice(total)}</span>
            </div>
            
            <div className="mt-2 pt-2 border-t border-[#e2e8f0] print:border-dashed print:border-[#000000] text-sm print:text-[10px] space-y-1">
              <div className="flex justify-between gap-1">
                <span>{paymentMethod === 'Tunai' ? 'Tunai' : `Bayar (${paymentMethod})`}:</span>
                <span className="shrink-0 whitespace-nowrap">
                  {paymentMethod === 'Tunai' ? formatPrice(cashAmount) : formatPrice(total)}
                </span>
              </div>
              {paymentMethod === 'Tunai' && (
                <div className="flex justify-between gap-1">
                  <span>Uang Kembalian:</span>
                  <span className="shrink-0 whitespace-nowrap">{formatPrice(change)}</span>
                </div>
              )}
            </div>
            
            {/* Print Footer */}
            <div className="hidden print:block mt-4 pb-4 text-center text-[10px]">
              <div className="border-t border-dashed border-[#000000] mb-2"></div>
              <p>Terima Kasih Atas Pembelian Anda,</p>
              <p>Kami tunggu kembali kedatangannya</p>
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 space-y-4 print:hidden">
          <button onClick={handleSavePDF} className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Laporan Closing</button>
          <button onClick={() => window.print()} className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Cetak Bill</button>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'Tunai' | 'QRIS')} className="w-full p-2 border rounded">
            <option value="Tunai">Tunai</option>
            <option value="QRIS">QRIS</option>
          </select>
          
          {paymentMethod === 'Tunai' && (
            <input
              type="number"
              placeholder="Jumlah Uang Tunai"
              onChange={(e) => setCashAmount(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          )}
          
          {paymentMethod === 'Tunai' && cashAmount >= total && (
            <p className="font-semibold text-emerald-600">Uang Kembalian: {formatPrice(change)}</p>
          )}
          
          <button 
            onClick={completeTransaction}
            className="w-full p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Selesai Transaksi
          </button>
        </div>
      )}
    </div>
  );
}
