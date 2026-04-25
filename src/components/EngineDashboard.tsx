import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  RefreshCw,
  AlertTriangle,
  Activity,
  DollarSign,
  Sun,
  Moon,
  Database
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Ingredient, Transaction, Recipe } from '../types';
import { ERP_ENGINE } from '../services/erpEngine';

interface EngineDashboardProps {
  transactions: Transaction[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  onTabChange: (tab: string) => void;
  onProcessTransaction: (transaction: Transaction) => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  isSyncing?: boolean;
}

export function EngineDashboard({ 
  transactions, 
  ingredients, 
  recipes, 
  onTabChange, 
  theme = 'dark', 
  toggleTheme,
  isSyncing = false
}: EngineDashboardProps) {
  
  const today = new Date().toLocaleDateString('id-ID');
  const todayTransactions = transactions.filter(t => new Date(t.date).toLocaleDateString('id-ID') === today);
  
  const totalSales = todayTransactions.reduce((acc, t) => acc + t.totalPrice, 0);
  const totalHpp = todayTransactions.reduce((acc, t) => acc + (t.totalHpp || 0), 0);
  const grossProfit = totalSales - totalHpp;
  
  const lowStockItems = ERP_ENGINE.getLowStockAlerts(ingredients);

  const erpStats = [
    {
      label: '[STOK_BAHAN]',
      value: `${lowStockItems.length} Menipis`,
      sub: 'Ketersediaan',
      icon: AlertTriangle,
      color: lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-400',
      bg: 'bg-amber-500/10'
    },
    {
      label: '[LABA_RUGI]',
      value: formatCurrency(grossProfit),
      sub: 'Hari Ini (Gross)',
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: '[SYNC_DATA]',
      value: isSyncing ? 'Syncing...' : 'Aktif',
      sub: 'Real-time Hub',
      icon: Activity,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  const menuCards = [
    {
      id: 'kasir',
      title: 'KASIRGO',
      subtitle: 'Input Penjualan & Transaksi',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      textColor: 'text-white',
      action: () => onTabChange('kasirgo')
    },
    {
      id: 'restaurant-assets',
      title: 'RESTAURANT ASSETS',
      subtitle: 'Manajemen Aset & Peralatan',
      icon: Package,
      color: 'bg-blue-600',
      textColor: 'text-white',
      action: () => onTabChange('restaurant-assets')
    },
    {
      id: 'stok-hpp',
      title: 'STOK & HPP',
      subtitle: 'Manajemen Stok & Harga Pokok Penjualan',
      icon: Database,
      color: 'bg-emerald-500',
      textColor: 'text-white',
      action: () => onTabChange('bahan')
    }
  ];

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-primary selection:text-primary-foreground pb-32 transition-colors duration-500",
      theme === 'dark' ? "bg-[#0a0a0c]" : "bg-[var(--background)]"
    )}>
      {/* Header */}
      <header className={cn(
        "px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b rounded-b-[3rem]",
        theme === 'dark' ? "bg-[#0a0a0c]/80 border-white/5 shadow-2xl shadow-black/40" : "bg-white/80 border-slate-200 shadow-sm"
      )}>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary block leading-tight mb-1">Resto ERP Engine</span>
          <h1 className={cn(
            "text-xs font-black tracking-[0.1em] uppercase leading-none",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            POSGO<span className="text-primary ml-1">57</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] font-black text-primary uppercase tracking-widest">Syncing</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"
            )}
            title="Reload App"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing ? "animate-spin text-primary" : "text-slate-400")} />
          </button>
          <button
            type="button" 
            onClick={toggleTheme}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm"
            )}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-400" /> : <Sun className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* ERP Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {erpStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-3 rounded-2xl border flex flex-col items-center justify-center text-center space-y-1.5 transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm hover:border-white/10 hover:shadow-xl",
                theme === 'dark' ? "bg-[#161421] border-white/5" : "bg-white border-slate-100"
              )}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-1", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">{stat.label}</span>
              <span className={cn("text-[10px] font-black leading-none", theme === 'dark' ? "text-white" : "text-slate-900")}>{stat.value}</span>
              <span className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter">{stat.sub}</span>
            </motion.div>
          ))}
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
          <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 mb-2">Operational Hub</h2>
          <div className="grid grid-cols-1 gap-4">
            {menuCards.map((card, idx) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                onClick={card.action}
                className={cn(
                  "group relative w-full p-6 rounded-[2rem] border transition-all duration-300 active:scale-[0.98] overflow-hidden shadow-sm text-left hover:bg-white/[0.03] hover:backdrop-blur-md hover:border-white/10 hover:shadow-2xl",
                  theme === 'dark' ? "bg-[#161421] border-white/5" : "bg-white border-slate-100"
                )}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <h3 className={cn(
                      "text-sm font-black tracking-tight",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                      {card.title}
                    </h3>
                    <p className={cn(
                      "text-[8px] font-black uppercase tracking-[0.2em] opacity-60",
                      theme === 'dark' ? "text-slate-400" : "text-slate-500"
                    )}>
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500",
                    card.color,
                    card.textColor
                  )}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                
                {/* Subtle Decorative Gradient */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

