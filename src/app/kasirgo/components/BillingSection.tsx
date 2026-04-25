import React from 'react';
import { Trash2, Minus, Wallet, QrCode, CreditCard, X } from 'lucide-react';
import { CartItem } from '../types';
import { formatIDR } from '@/lib/utils';

interface BillingSectionProps {
  cart: CartItem[];
  totalAmount: number;
  paymentMethod: 'Tunai' | 'QRIS' | 'Debet';
  setPaymentMethod: (method: 'Tunai' | 'QRIS' | 'Debet') => void;
  cashReceivedDisplay: string;
  change: number;
  customerName: string;
  customerWA: string;
  setCart: (cart: CartItem[]) => void;
  setIsBillingOpen: (open: boolean) => void;
  setCashReceivedDisplay: (val: string) => void;
  setCashReceived: (val: number) => void;
  setCustomerName: (name: string) => void;
  setCustomerWA: (wa: string) => void;
  handleCheckout: () => void;
  removeFromCart: (id: string | number, isTakeAway: boolean) => void;
  formatInputNumber: (val: string) => string;
  parseInputNumber: (val: string) => number;
}

export const BillingSection: React.FC<BillingSectionProps> = (props) => {
  const {
    cart, totalAmount, paymentMethod, setPaymentMethod, cashReceivedDisplay, change,
    customerName, customerWA, setCart, setIsBillingOpen, setCashReceivedDisplay,
    setCashReceived, setCustomerName, setCustomerWA, handleCheckout, removeFromCart,
    formatInputNumber, parseInputNumber
  } = props;
  return (
    <div className="bg-white rounded-[2rem] shadow-2xl md:shadow-lg border border-slate-200 p-4 md:p-6 md:sticky md:top-4 h-full md:h-auto overflow-y-auto scrolling-touch touch-auto max-w-sm mx-auto w-full pb-8">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="font-bold flex items-center gap-2 text-base md:text-lg text-slate-800">Pembayaran</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setCart([])} className="text-rose-600 flex items-center gap-1 text-xs md:text-sm font-bold active:scale-95">
            <Trash2 size={14}/> RESET
          </button>
          <button onClick={() => setIsBillingOpen(false)} className="md:hidden text-slate-400 p-1" title="Tutup Pembayaran" aria-label="Tutup Pembayaran">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* MINI CART LIST */}
        {cart.length > 0 && (
          <div className="space-y-2 max-h-24 md:max-h-32 overflow-y-auto border-b border-slate-100 pb-2 md:pb-4 pr-1">
            {cart.map(item => (
              <div key={`${item.id}-${item.isTakeAway}`} className="flex flex-col border-b border-slate-50 pb-1 md:pb-2">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button onClick={() => removeFromCart(item.id, !!item.isTakeAway)} className="text-rose-500 p-1 shrink-0 active:scale-90 transition-transform" title="Hapus dari Keranjang" aria-label="Hapus dari Keranjang"><Minus size={12}/></button>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                    <span className="text-slate-400 text-[10px] md:text-[11px] font-medium">x{item.quantity}</span>
                    <div className="flex justify-between w-[70px] md:w-[90px] font-bold text-slate-700">
                      <span>Rp</span>
                      <span>{(Number(item?.price || 0) * Number(item?.quantity || 0)).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
                {item.note && (
                  <div className="flex items-center gap-1.5 ml-7 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                    <span className="text-[9px] md:text-[10px] text-blue-500 italic font-medium">{item.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100">
          <p className="text-[10px] md:text-xs text-blue-600 font-bold uppercase mb-0.5 md:mb-1">Total Bayar</p>
          <p className="text-lg md:text-xl font-black text-blue-700">{formatIDR(totalAmount)}</p>
        </div>

        <div className="space-y-2 md:space-y-3">
          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Metode Pembayaran</p>
          <div className="grid grid-cols-3 gap-1.5 md:gap-2">
            <button 
              onClick={() => setPaymentMethod('Tunai')}
              className={`min-h-[40px] md:min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold border transition-all active:scale-95 ${paymentMethod === 'Tunai' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'}`}
            >
              <Wallet size={16}/> TUNAI
            </button>
            <button 
              onClick={() => setPaymentMethod('QRIS')}
              className={`min-h-[40px] md:min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold border transition-all active:scale-95 ${paymentMethod === 'QRIS' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'}`}
            >
              <QrCode size={16}/> QRIS
            </button>
            <button 
              onClick={() => setPaymentMethod('Debet')}
              className={`min-h-[40px] md:min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-bold border transition-all active:scale-95 ${paymentMethod === 'Debet' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'}`}
            >
              <CreditCard size={16}/> DEBET
            </button>
          </div>
        </div>

        {paymentMethod === 'Tunai' && (
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Uang Tunai Diterima</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm md:text-base">Rp</span>
              <input 
                type="text"
                inputMode="numeric"
                className="w-full pl-8 md:pl-10 p-2 md:p-3 border border-slate-300 rounded-xl font-bold text-lg md:text-xl text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[40px] md:min-h-[50px]"
                placeholder="0"
                value={cashReceivedDisplay}
                onChange={(e) => {
                  const formatted = formatInputNumber(e.target.value);
                  setCashReceivedDisplay(formatted);
                  setCashReceived(parseInputNumber(formatted));
                }}
              />
            </div>
            <div className="flex flex-col bg-emerald-50 p-2 md:p-3 rounded-xl border border-emerald-100">
              <span className="text-[9px] md:text-[10px] text-emerald-600 font-bold uppercase mb-0 md:mb-0.5">Kembalian</span>
              <span className="text-lg md:text-xl font-black text-emerald-700">{formatIDR(change)}</span>
            </div>
          </div>
        )}

        <div className="space-y-1.5 md:space-y-2 pt-1 md:pt-2 border-t border-slate-100">
          <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Info Pelanggan (Opsional)</label>
          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
            <input 
              type="text"
              placeholder="Nama Pelanggan"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input 
              type="text"
              placeholder="Nomor WA"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs md:text-sm outline-none focus:border-blue-500"
              value={customerWA}
              onChange={(e) => setCustomerWA(e.target.value)}
            />
          </div>
        </div>

        <button 
          disabled={totalAmount === 0}
          onClick={handleCheckout}
          className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-3 md:py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-base md:text-lg active:scale-95 min-h-[48px] md:min-h-[56px]"
        >
          PROSES BAYAR
        </button>
      </div>
    </div>
  );
};
