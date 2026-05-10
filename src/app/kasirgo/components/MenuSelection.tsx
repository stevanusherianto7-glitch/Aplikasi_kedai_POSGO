import React, { useState } from 'react';
import { Utensils, ShoppingBag, Plus, Minus, X } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { formatIDR } from '@/lib/utils';
import { getSupabasePublicUrl, getPlaceholderUrl } from '../lib/supabaseStorage';

interface MenuSelectionProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem, isTakeAway: boolean) => void;
  removeFromCart: (id: string | number, isTakeAway: boolean) => void;
  updateCartNote: (id: string | number, isTakeAway: boolean, note: string) => void;
  setIsBillingOpen: (open: boolean) => void;
}

export const MenuSelection: React.FC<MenuSelectionProps> = ({
  menuItems, cart, addToCart, removeFromCart, updateCartNote
}) => {
  const [flippedItemId, setFlippedItemId] = useState<string | number | null>(null);

  // Function to get proper image URL with encoding
  const getImageUrl = (url: string | null | undefined) => {
    return getSupabasePublicUrl(url);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {menuItems.map(item => {
        const dineInItem = cart.find(c => c.id === item.id && !c.isTakeAway);
        const takeAwayItem = cart.find(c => c.id === item.id && c.isTakeAway);
        const dineInQty = dineInItem?.quantity || 0;
        const takeAwayQty = takeAwayItem?.quantity || 0;
        const hasInCart = dineInQty > 0 || takeAwayQty > 0;
        const isFlipped = flippedItemId === item.id;

        if (!isFlipped) {
          return (
            <div 
              key={item.id}
              onClick={() => setFlippedItemId(item.id)}
              className="cursor-pointer group bg-white rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 flex flex-col justify-between min-h-[175px] relative hover:shadow-xl hover:border-blue-400/50 hover:-translate-y-2 active:scale-95 overflow-hidden"
            >
              {item.image_url ? (
                <img
                  src={getImageUrl(item.image_url)}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to placeholder with Supabase helper
                    const fallbackUrl = getPlaceholderUrl();
                    e.currentTarget.src = fallbackUrl;
                    console.warn(`Gagal memuat gambar untuk menu: ${item.name}, URL: ${getImageUrl(item.image_url)}`);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <Utensils size={32} className="text-slate-300" />
                </div>
              )}
              {/* Subtle overlay with gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-widest mb-0.5">{item.category}</p>
                <p className="font-bold text-white leading-tight mb-0.5 text-sm line-clamp-2">{item.name}</p>
                <p className="text-emerald-400 font-black text-xs">{formatIDR(item.price)}</p>
              </div>
            </div>
          );
        }

        // Layer 2 (Flipped/Detail View)
        return (
          <div 
            key={item.id}
            className={`group bg-white p-5 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col justify-between min-h-[175px] relative hover:shadow-xl hover:border-blue-400/50 hover:-translate-y-2 active:scale-95 ${hasInCart ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100'}`}
          >
            {/* Back Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setFlippedItemId(null);
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              title="Kembali ke Foto"
              aria-label="Kembali ke Foto"
            >
              <X size={12} className="text-slate-600" />
            </button>

            <div className="mb-3">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{item.category}</p>
              <p className="font-black text-slate-900 leading-tight mb-1 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">{item.name}</p>
              <p className="text-blue-600 font-black text-xs">{formatIDR(item.price)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <div className="flex flex-col gap-1">
                {dineInQty > 0 && (
                  <input 
                    type="text"
                    placeholder="Catatan..."
                    className="w-full p-1 border border-emerald-200 rounded text-[9px] outline-none focus:border-emerald-400 bg-emerald-50/30"
                    value={dineInItem?.note || ''}
                    onChange={(e) => updateCartNote(item.id, false, e.target.value)}
                  />
                )}
                {dineInQty > 0 ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 rounded-lg p-1 border border-emerald-100">
                    <button 
                      onClick={() => removeFromCart(item.id, false)}
                      className="p-0.5 hover:bg-emerald-100 rounded transition-colors"
                      title="Kurangi Dine In"
                      aria-label="Kurangi Dine In"
                    >
                      <Minus size={10}/>
                    </button>
                    <span className="text-[10px] font-black">{dineInQty}</span>
                    <button 
                      onClick={() => addToCart(item, false)} 
                      className="p-0.5 hover:bg-emerald-100 rounded transition-colors"
                      title="Tambah Dine In"
                      aria-label="Tambah Dine In"
                    >
                      <Plus size={10}/>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item, false)}
                    className="w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex flex-col items-center justify-center"
                  >
                    <Utensils size={10} className="mb-0.5" /> Dine In
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {takeAwayQty > 0 && (
                  <input 
                    type="text"
                    placeholder="Catatan..."
                    className="w-full p-1 border border-orange-200 rounded text-[9px] outline-none focus:border-orange-400 bg-orange-50/30"
                    value={takeAwayItem?.note || ''}
                    onChange={(e) => updateCartNote(item.id, true, e.target.value)}
                  />
                )}
                {takeAwayQty > 0 ? (
                  <div className="flex items-center justify-between bg-orange-50 text-orange-700 rounded-lg p-1 border border-orange-100">
                    <button 
                      onClick={() => removeFromCart(item.id, true)}
                      className="p-0.5 hover:bg-orange-100 rounded transition-colors"
                      title="Kurangi Take Away"
                      aria-label="Kurangi Take Away"
                    >
                      <Minus size={10}/>
                    </button>
                    <span className="text-[10px] font-black">{takeAwayQty}</span>
                    <button 
                      onClick={() => addToCart(item, true)} 
                      className="p-0.5 hover:bg-orange-100 rounded transition-colors"
                      title="Tambah Take Away"
                      aria-label="Tambah Take Away"
                    >
                      <Plus size={10}/>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item, true)}
                    className="w-full py-1.5 rounded-lg bg-orange-50 text-orange-600 text-[8px] font-bold uppercase hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex flex-col items-center justify-center"
                  >
                    <ShoppingBag size={10} className="mb-0.5" /> Take Away
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {menuItems.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-400">
          <p>Belum ada menu. Klik ikon gerigi untuk menambah menu.</p>
        </div>
      )}
    </div>
  );
};
