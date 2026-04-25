/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus, Minus, ShoppingCart, Printer, FileText,
  Trash2, Wallet, QrCode, History, Utensils, ShoppingBag,
  Settings, X, Save, LayoutDashboard, Receipt,
  ArrowUpCircle, ArrowDownCircle, Coins, CreditCard, TrendingUp,
  ChevronLeft, ChevronRight, Download, Pencil, ChevronDown, Check, FileDown
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MenuSelection } from './components/MenuSelection';
import { BillingSection } from './components/BillingSection';
import { ExpenseForm } from './components/ExpenseForm';
import { IncomeForm } from './components/IncomeForm';
import { ExpenseList } from './components/ExpenseList';
import { IncomeList } from './components/IncomeList';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import './kasirgo.css';

// --- UTILS ---
import { formatIDR, formatCurrency, formatNumber, parseNumber, generateId, cn } from '../../lib/utils';
import { formatDate } from './utils/formatters';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatTransactionNumber = (date: Date | string | undefined, orderNum: number | undefined) => {
  if (!date || orderNum === undefined) return '00000000';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '00000000';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const bill = orderNum.toString().padStart(4, '0');
    return `${day}${month}${bill}`;
  } catch (e) {
    return '00000000';
  }
};

// --- TYPES ---
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  isTakeAway?: boolean;
}

interface KasirGoPageProps {
  recipes?: any[];
  transactions?: any[];
  expenses?: any[];
  dailyIncomes?: any[];
  pettyCash?: number;
  onProcessTransaction?: (tx: any) => Promise<any>;
  onAddExpense?: (exp: any) => Promise<void>;
  onDeleteExpense?: (id: string) => Promise<void>;
  onAddDailyIncome?: (inc: any) => Promise<void>;
  onDeleteDailyIncome?: (id: string) => Promise<void>;
  onAddRecipe?: (recipe: any) => Promise<any>;
  onUpdateRecipe?: (recipe: any) => Promise<void>;
  onDeleteRecipe?: (id: string) => Promise<void>;
  onVoidTransaction?: (id: string) => Promise<void>;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

export default function KasirGoPage(props: KasirGoPageProps) {
  try {
    return <KasirGoContent {...props} />;
  } catch (e: any) {
    console.error("KasirGo Root Error:", e);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <X size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-800 uppercase">Modul Kasir Bermasalah</h1>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">{e.message || 'Terjadi kesalahan internal pada komponen KasirGo.'}</p>
          <button onClick={() => window.location.reload()} className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Muat Ulang Aplikasi</button>
        </div>
      </div>
    );
  }
}

function KasirGoContent({
  recipes = [],
  transactions = [],
  expenses = [],
  dailyIncomes = [],
  pettyCash = 0,
  onProcessTransaction,
  onAddExpense,
  onDeleteExpense,
  onAddDailyIncome,
  onDeleteDailyIncome,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onVoidTransaction,
  onBack,
  theme = 'dark',
  onModalToggle
}: KasirGoPageProps & { onModalToggle?: (isOpen: boolean) => void }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan'>('kasir');
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
  const [pengeluaranSubTab, setPengeluaranSubTab] = useState<'harian' | 'bulanan'>('harian');
  const [pemasukanSubTab, setPemasukanSubTab] = useState<'harian' | 'bulanan'>('harian');

  // State
  const menuItems = useMemo(() => {
    return (recipes || []).map(r => ({
      id: String(r?.id || ''),
      name: String(r?.name || 'Tanpa Nama'),
      price: Number(r?.roundedSellingPrice ?? r?.sellingPrice ?? 0),
      category: String(r?.category || 'Makanan')
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [voidedTransactions, setVoidedTransactions] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debet'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cashReceivedDisplay, setCashReceivedDisplay] = useState<string>('');
  const [showReceipt, _setShowReceipt] = useState(false);
  const [isBillingOpen, _setIsBillingOpen] = useState(false);
  const [isSettingsOpen, _setIsSettingsOpen] = useState(false);

  const setShowReceipt = (val: boolean) => {
    _setShowReceipt(val);
    if (onModalToggle) onModalToggle(val || isBillingOpen || isSettingsOpen);
  };

  const setIsBillingOpen = (val: boolean) => {
    _setIsBillingOpen(val);
    if (onModalToggle) onModalToggle(val || showReceipt || isSettingsOpen);
  };

  const setIsSettingsOpen = (val: boolean) => {
    _setIsSettingsOpen(val);
    if (onModalToggle) onModalToggle(val || showReceipt || isBillingOpen);
  };

  // Form States
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Makanan' });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [newDailyIncome, setNewDailyIncome] = useState({ description: '', amount: '' });

  // Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [customerWA, setCustomerWA] = useState('');

  // Order Counter State
  const [currentOrderNumber, setCurrentOrderNumber] = useState<number | null>(null);
  const [searchHistory, setSearchHistory] = useState('');
  const [voidSearch, setVoidSearch] = useState('');

  // Get next order number based on existing transactions
  const nextOrderNumber = useMemo(() => {
    if (!transactions || transactions.length === 0) return 1;
    const maxOrder = Math.max(...transactions.map(t => Number(t.orderNumber) || 0));
    return maxOrder + 1;
  }, [transactions]);

  // Editing existing menu state
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editMenuData, setEditMenuData] = useState({ name: '', price: '', category: 'Makanan' });

  // Calculations
  const totalAmount = (cart || []).reduce((sum, item) => sum + (Number(item?.price || 0) * (Number(item?.quantity || 0))), 0);
  const change = cashReceived > totalAmount ? cashReceived - totalAmount : 0;

  const totalIncome = (transactions || []).reduce((sum, t) => sum + (Number(t?.totalPrice || t?.total || 0)), 0);
  const totalProfit = totalIncome * 0.5; // Margin profit 50%
  const totalExpense = (expenses || []).reduce((sum, e) => sum + (Number(e?.amount || 0)), 0);
  const totalParkingIncome = (dailyIncomes || []).reduce((sum, i) => sum + (Number(i?.amount || 0)), 0);
  const currentBalance = (Number(pettyCash) || 0) + totalIncome + totalParkingIncome - totalExpense;

  // Perhitungan Detail untuk Laporan Closing
  const itemsSold = useMemo(() => {
    const map: Record<string, number> = {};
    (transactions || []).forEach(t => {
      if (!t || !t.items || !Array.isArray(t.items)) return;
      t.items.forEach((item: any) => {
        if (!item || !item.name) return;
        map[item.name] = (map[item.name] || 0) + (Number(item.quantity) || 0);
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const incomeByMethod = useMemo(() => {
    const methods = { QRIS: 0, Debet: 0, Tunai: 0 };
    (transactions || []).forEach(t => {
      if (!t) return;
      const amount = Number(t.totalPrice || t.total || 0);
      const method = t.paymentMethod || 'Tunai';
      if (method === 'QRIS') methods.QRIS += amount;
      else if (method === 'Debet') methods.Debet += amount;
      else methods.Tunai += amount;
    });
    return methods;
  }, [transactions]);

  // --- FILTER BULAN UNTUK LAPORAN ---
  const isSameMonth = (date: Date | string | undefined, filterMonth: string) => {
    if (!date) return false;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return false;
      const filter = new Date(filterMonth + '-01');
      return d.getMonth() === filter.getMonth() && d.getFullYear() === filter.getFullYear();
    } catch (e) {
      return false;
    }
  };

  const filteredTransactions = useMemo(() =>
    (transactions || []).filter(t => isSameMonth(t.timestamp || t.date, filterMonth)),
    [transactions, filterMonth]
  );

  const formatInputNumber = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num === '' ? '' : Number(num).toLocaleString('id-ID').replace(/,/g, '.');
  };

  const parseInputNumber = (val: string) => parseNumber(val);

  const handleCheckout = async () => {
    if (totalAmount === 0) return;
    const orderNum = nextOrderNumber;

    const transactionData: any = {
      id: generateId(),
      orderNumber: orderNum,
      customerName,
      customerWA,
      totalPrice: totalAmount,
      items: cart.map(item => ({
        recipeId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      paymentMethod,
      timestamp: new Date()
    };

    if (onProcessTransaction) {
      await onProcessTransaction(transactionData);
    }

    setCurrentOrderNumber(orderNum);
    setShowReceipt(true);
  };

  const handleVoidTransaction = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan (void) transaksi ini?')) return;

    const txToVoid = (transactions || []).find(t => t.id === id);
    if (txToVoid) {
      setVoidedTransactions([txToVoid, ...voidedTransactions]);
      if (onVoidTransaction) {
        await onVoidTransaction(id);
      }
    }
  };

  const handleManualVoid = async () => {
    if (!voidSearch) return;
    const txToVoid = (transactions || []).find(t => formatTransactionNumber(t.timestamp || t.date, t.orderNumber) === voidSearch);
    if (txToVoid) {
      if (!confirm(`Konfirmasi pembatalan transaksi #${voidSearch}?`)) return;
      await handleVoidTransaction(txToVoid.id);
      setVoidSearch('');
    } else {
      alert('Nomor transaksi tidak ditemukan.');
    }
  };

  const handleEditMenu = (recipe: any) => {
    setEditingRecipeId(recipe.id);
    setEditMenuData({
      name: recipe.name,
      price: formatInputNumber(String(recipe.roundedSellingPrice || recipe.sellingPrice)),
      category: recipe.category || 'Makanan'
    });
  };

  const handleSaveEditMenu = async () => {
    if (!editingRecipeId || !editMenuData.name || !editMenuData.price) return;
    const priceNum = parseInputNumber(editMenuData.price);
    const targetRecipe = (recipes || []).find(r => r.id === editingRecipeId);
    if (!targetRecipe) return;

    const updatedRecipe = {
      ...targetRecipe,
      name: editMenuData.name,
      category: editMenuData.category,
      sellingPrice: priceNum,
      roundedSellingPrice: priceNum
    };

    if (onUpdateRecipe) {
      await onUpdateRecipe(updatedRecipe);
      alert('Menu berhasil diperbarui!');
      setEditingRecipeId(null);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Hapus menu ini dari katalog?')) return;
    if (onDeleteRecipe) {
      await onDeleteRecipe(id);
      alert('Menu telah dihapus.');
    }
  };

  const handleAddExpenseLocal = async () => {
    if (newExpense.description && newExpense.amount) {
      const amount = Number(parseInputNumber(newExpense.amount));
      const expense = {
        id: generateId(),
        description: newExpense.description,
        amount,
        category: 'Operasional' as any,
        date: new Date().toISOString()
      };
      if (onAddExpense) await onAddExpense(expense);
      setNewExpense({ description: '', amount: '' });
    }
  };

  const handleAddDailyIncomeLocal = async () => {
    if (newDailyIncome.description && newDailyIncome.amount) {
      const amount = Number(parseInputNumber(newDailyIncome.amount));
      const income = {
        id: generateId(),
        description: newDailyIncome.description,
        amount,
        date: new Date().toISOString()
      };
      if (onAddDailyIncome) await onAddDailyIncome(income);
      setNewDailyIncome({ description: '', amount: '' });
    }
  };

  // Logika Penjumlahan
  const addToCart = (menuItem: any, isTakeAway: boolean = false) => {
    setCart(prev => {
      const existing = (prev || []).find(item => item.id === menuItem.id && !!item.isTakeAway === isTakeAway);
      if (existing) {
        return prev.map(item =>
          (item.id === menuItem.id && !!item.isTakeAway === isTakeAway) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...(prev || []), { ...menuItem, quantity: 1, isTakeAway }];
    });
  };

  const removeFromCart = (id: string | number, isTakeAway: boolean = false) => {
    const idStr = String(id);
    setCart(prev => {
      const existing = (prev || []).find(item => String(item.id) === idStr && !!item.isTakeAway === isTakeAway);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          (String(item.id) === idStr && !!item.isTakeAway === isTakeAway) ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return (prev || []).filter(item => !(String(item.id) === idStr && !!item.isTakeAway === isTakeAway));
    });
  };

  const updateCartNote = (id: string | number, isTakeAway: boolean, note: string) => {
    const idStr = String(id);
    setCart(prev => (prev || []).map(item =>
      (String(item.id) === idStr && !!item.isTakeAway === isTakeAway) ? { ...item, note } : item
    ));
  };

  const resetOrder = () => {
    setCart([]);
    setCashReceived(0);
    setCashReceivedDisplay('');
    setShowReceipt(false);
    setIsBillingOpen(false);
    setCustomerName('');
    setCustomerWA('');
    setCurrentOrderNumber(null);
  };

  const handlePrint = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      // Small delay to ensure rendering
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [58, (canvas.height * 58) / canvas.width]);
      pdf.addImage(imgData, 'PNG', 0, 0, 58, (canvas.height * 58) / canvas.width);

      if (Capacitor.isNativePlatform()) {
        const base64 = pdf.output('datauristring').split(',')[1];
        await Filesystem.writeFile({
          path: `${filename}_${Date.now()}.pdf`,
          data: base64,
          directory: Directory.Documents
        });
        alert(`Berhasil! PDF tersimpan di folder Documents.`);
      } else {
        pdf.save(`${filename}.pdf`);
      }
    } catch (e) {
      console.error("Print Error:", e);
      alert("Gagal mencetak struk.");
    }
  };

  return (
    <div className={cn(
      "h-[100dvh] flex flex-col transition-colors duration-500",
      "bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#dbeafe]"
    )}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onBack={onBack} onToggleSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 overflow-hidden relative bg-transparent">
        <AnimatePresence mode="wait">
          {activeTab === 'kasir' && (
            <motion.div
              key="kasir"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col md:flex-row"
            >
              <div className="flex-1 h-full overflow-y-auto no-scrollbar pb-32 md:pb-6 px-6 pt-6">
                <MenuSelection
                  menuItems={menuItems}
                  cart={cart}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart as any}
                  updateCartNote={updateCartNote as any}
                  setIsBillingOpen={setIsBillingOpen}
                />
              </div>

              {/* MOBILE TRIGGER: PROSES BAYAR */}
              <div className="md:hidden fixed bottom-24 left-6 right-6 z-30">
                 <button
                  onClick={() => setIsBillingOpen(true)}
                  className="w-full h-16 bg-blue-600/40 backdrop-blur-xl border border-white/20 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-between px-8 active:scale-95 transition-all"
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black text-[10px]">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Keranjang</span>
                    </div>
                    <span className="text-sm font-black">{formatIDR(totalAmount)}</span>
                 </button>
              </div>

              <div className={cn(
                "fixed inset-0 z-40 md:relative md:inset-auto md:w-96 md:h-full md:flex transition-transform duration-500 ease-in-out bg-white/40 backdrop-blur-xl",
                isBillingOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
              )}>
                <BillingSection
                  cart={cart}
                  totalAmount={totalAmount}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cashReceivedDisplay={cashReceivedDisplay}
                  change={change}
                  customerName={customerName}
                  customerWA={customerWA}
                  setCart={setCart as any}
                  setIsBillingOpen={setIsBillingOpen}
                  setCashReceivedDisplay={setCashReceivedDisplay}
                  setCashReceived={setCashReceived}
                  setCustomerName={setCustomerName}
                  setCustomerWA={setCustomerWA}
                  handleCheckout={handleCheckout}
                  removeFromCart={removeFromCart as any}
                  formatInputNumber={formatInputNumber}
                  parseInputNumber={parseInputNumber}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'pengeluaran' && (
            <motion.div
              key="pengeluaran"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-6 space-y-6 pb-32"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <ExpenseForm
                  newExpense={newExpense}
                  setNewExpense={setNewExpense}
                  onAdd={handleAddExpenseLocal}
                  formatInputNumber={formatInputNumber}
                  viewMode={pengeluaranSubTab}
                  setViewMode={setPengeluaranSubTab}
                />

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <ExpenseList
                    expenses={expenses || []}
                    onDelete={onDeleteExpense}
                    filterMonth={filterMonth}
                    viewMode={pengeluaranSubTab}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pemasukan' && (
            <motion.div
              key="pemasukan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-6 space-y-6 pb-32"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <IncomeForm
                  newDailyIncome={newDailyIncome}
                  setNewDailyIncome={setNewDailyIncome}
                  onAdd={handleAddDailyIncomeLocal}
                  formatInputNumber={formatInputNumber}
                  viewMode={pemasukanSubTab}
                  setViewMode={setPemasukanSubTab}
                />

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <IncomeList
                    incomes={dailyIncomes || []}
                    onDelete={onDeleteDailyIncome}
                    filterMonth={filterMonth}
                    viewMode={pemasukanSubTab}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'laporan' && (
            <motion.div
              key="laporan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full overflow-y-auto p-6 pb-32"
            >
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <LayoutDashboard size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-black text-sm tracking-tight text-slate-800 uppercase">Riwayat Transaksi</h3>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pusat Data & Rekapitulasi</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="flex-1 md:w-40 h-10 px-4 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <div className="flex flex-col">
                      <div className="px-6 py-4 bg-emerald-50/40 border-b border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-700">🛒 Penjualan</span>
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">{(filteredTransactions || []).length} Transaksi</span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari Nomor Transaksi..."
                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            value={searchHistory}
                            onChange={(e) => setSearchHistory(e.target.value)}
                          />
                          <ShoppingCart size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
                        {(filteredTransactions || []).filter(t => formatTransactionNumber(t.timestamp || t.date, t.orderNumber).includes(searchHistory)).map((t, index) => (
                          <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2 gap-4">
                                <div className="space-y-0.5 shrink-0">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">NO.{index + 1}</span>
                                     <p className="font-bold text-slate-800 text-sm">#{formatTransactionNumber(t.timestamp || t.date, t.orderNumber)}</p>
                                  </div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{formatDate(t.timestamp || t.date)} • {t.paymentMethod || 'Tunai'}</p>
                                </div>
                                <div className="flex-1 text-right">
                                  <span className="font-black text-emerald-600 text-sm whitespace-nowrap">{formatIDR(t.totalPrice || t.total || 0)}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(t.items || []).map((item: any, idx: number) => (
                                  <span key={idx} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium border border-slate-200/50">
                                    {item.name} x{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => handleVoidTransaction(t.id)}
                              className="ml-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- MODAL SETTINGS (MANAJEMEN MENU KASIR) --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-black text-sm tracking-tight text-slate-800 uppercase">Manajemen Menu Kasir</h3>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">Update Katalog Jualan</p>
              </div>
              <button onClick={() => { setIsSettingsOpen(false); setEditingRecipeId(null); }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><X size={16}/></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
              {/* FORM INPUT MENU BARU */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {editingRecipeId ? 'Edit Menu Terpilih' : 'Daftar Menu Baru'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Produk</label>
                    <input
                      placeholder="CONTOH: ES TEH MANIS"
                      value={editingRecipeId ? editMenuData.name : newItem.name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        if (editingRecipeId) setEditMenuData({...editMenuData, name: val});
                        else setNewItem({...newItem, name: val});
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                      <div className="flex gap-1 p-0.5 bg-white rounded-xl border border-slate-200">
                        {['Makanan', 'Minuman', 'Pelengkap'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => {
                              if (editingRecipeId) setEditMenuData({...editMenuData, category: cat});
                              else setNewItem({...newItem, category: cat});
                            }}
                            className={cn(
                              "flex-1 h-7 rounded-lg text-[7px] font-black uppercase transition-all",
                              (editingRecipeId ? editMenuData.category : newItem.category) === cat
                                ? (cat === 'Makanan' ? "bg-orange-500 text-white shadow-sm" : "bg-slate-900 text-white shadow-sm")
                                : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            {cat.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Jual</label>
                      <div className="relative">
                        <input
                          placeholder="0"
                          value={editingRecipeId ? editMenuData.price : newItem.price}
                          onChange={(e) => {
                            const val = formatInputNumber(e.target.value);
                            if (editingRecipeId) setEditMenuData({...editMenuData, price: val});
                            else setNewItem({...newItem, price: val});
                          }}
                          className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-sm font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">RP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingRecipeId ? (
                    <>
                      <button onClick={() => setEditingRecipeId(null)} className="flex-1 h-10 text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all">Batal</button>
                      <button onClick={handleSaveEditMenu} className="flex-[2] h-10 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.1em] shadow-lg shadow-blue-100 active:scale-95 transition-all">Simpan</button>
                    </>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!newItem.name || !newItem.price) return;
                        const priceNum = parseInputNumber(newItem.price);
                        if (onAddRecipe) {
                          await onAddRecipe({
                            id: generateId(),
                            name: newItem.name,
                            category: newItem.category,
                            sellingPrice: priceNum,
                            markupPercent: 0,
                            laborCost: 0,
                            overheadCost: 0,
                            shrinkagePercent: 0,
                            items: []
                          });
                          alert('Menu didaftarkan!');
                          setNewItem({ name: '', price: '', category: 'Makanan' });
                        }
                      }}
                      className="w-full h-10 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 active:scale-95 transition-all"
                    >
                      Daftarkan Menu
                    </button>
                  )}
                </div>
              </div>

              {/* LISTING MENU SAAT INI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Katalog Jualan</span>
                   <span className="text-[7px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{(recipes || []).length} Produk</span>
                </div>

                <div className="space-y-1.5 pb-10">
                  {(recipes || []).map(recipe => (
                    <div key={recipe?.id} className={cn(
                      "p-3 rounded-2xl border transition-all flex items-center justify-between group",
                      editingRecipeId === recipe?.id ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100 hover:border-slate-200"
                    )}>
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase leading-none">{recipe?.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                             "text-[7px] font-bold uppercase px-1.5 py-0.5 rounded",
                             recipe?.category === 'Makanan' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                          )}>{recipe?.category}</span>
                          <span className="text-[9px] font-black text-slate-400">Rp {formatNumber(recipe?.roundedSellingPrice || recipe?.sellingPrice)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditMenu(recipe); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 active:bg-blue-100 transition-all shadow-sm"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMenu(recipe?.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 bg-rose-50 active:bg-rose-100 transition-all shadow-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner mb-2">
                 <Check size={32} strokeWidth={3} />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">TRANSAKSI SELESAI</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Silakan Pilih Jenis Struk</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handlePrint('receipt-kitchen', 'KITCHEN_ORDER')}
                className="w-full h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-all group shadow-lg shadow-blue-500/20"
              >
                <div className="flex items-center gap-3">
                  <Utensils size={18} className="text-blue-100" />
                  <span className="text-[11px] font-black uppercase tracking-widest">STRUK DAPUR</span>
                </div>
                <Printer size={14} className="text-blue-300" />
              </button>

              <button
                onClick={() => handlePrint('receipt-customer', 'CUSTOMER_RECEIPT')}
                className="w-full h-14 bg-white border-2 border-slate-100 text-slate-800 rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Receipt size={18} className="text-emerald-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest">STRUK PELANGGAN</span>
                </div>
                <Printer size={14} className="text-slate-300" />
              </button>

              <button
                onClick={() => handlePrint('report-closing', 'CLOSING_REPORT')}
                className="w-full h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-all group border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">LAPORAN CLOSING</span>
                </div>
                <Printer size={14} className="text-slate-300" />
              </button>

              <div className="pt-4 border-t border-slate-50">
                <button
                  onClick={() => resetOrder()}
                  className="w-full h-12 text-blue-500 text-[10px] font-black uppercase hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  TRANSAKSI BARU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN RECEIPT TEMPLATES (58MM) */}
      <div className="absolute-offscreen">
        {/* KITCHEN RECEIPT */}
        <div id="receipt-kitchen" className="receipt-container">
          <div className="receipt-header">
            <div className="kitchen-brand">PESANAN KITCHEN</div>
            <div className="kitchen-order-no">#{String(currentOrderNumber).padStart(3, '0')}</div>
            <div className="receipt-info">{formatDate(new Date())} {new Date().toLocaleTimeString('id-ID')}</div>
          </div>
          <div className="receipt-divider"></div>
          <div className="receipt-body">
            {cart.map((item, idx) => (
              <div key={idx} className="kitchen-card">
                <div className="receipt-row">
                  <span className="kitchen-qty-large">{item.quantity}x</span>
                  <div className="flex-1">
                    <div className="kitchen-item-name">{item.name}</div>
                    {item.isTakeAway && <div className="kitchen-takeaway-badge">[ TAKE AWAY ]</div>}
                    {!item.isTakeAway && <div className="kitchen-takeaway-badge">[ DINE IN ]</div>}
                    {item.note && <div className="kitchen-note">* {item.note}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="receipt-divider"></div>
          <div className="receipt-footer">
            <div className="font-bold">--- SEGERA DIPROSES ---</div>
          </div>
        </div>

        {/* CUSTOMER RECEIPT */}
        <div id="receipt-customer" className="receipt-container">
          <div className="receipt-header">
            <div className="receipt-brand-large">KASIRGO</div>
            <div className="receipt-address">Jl. Pertanian No. 57</div>
            <div className="receipt-address">Lebak Bulus, Jakarta Selatan</div>
            <div className="receipt-address">WA: 0812-3456-7890</div>
          </div>
          <div className="receipt-order-no">Order #{String(currentOrderNumber).padStart(3, '0')}</div>
          <div className="receipt-divider"></div>
          <div className="receipt-info">
            <div className="receipt-row">
              <span className="receipt-label">Tgl:</span>
              <span className="receipt-value">{new Date().toLocaleDateString('id-ID')}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Jam:</span>
              <span className="receipt-value">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">No. Bill:</span>
              <span className="receipt-value">{formatTransactionNumber(new Date(), currentOrderNumber || 0)}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Pelayan:</span>
              <span className="receipt-value">Admin</span>
            </div>
          </div>
          <div className="receipt-divider"></div>
          <div className="receipt-table-header">
            <span className="receipt-col-menu">Transaksi</span>
            <span className="receipt-col-qty">Qty</span>
            <span className="receipt-col-price">Harga</span>
            <span className="receipt-col-total">Total</span>
          </div>
          <div className="receipt-body">
            {cart.map((item, idx) => (
              <div key={idx} className="receipt-item-row">
                <div className="receipt-item-content">
                  <span className="receipt-col-menu">{item.name}</span>
                  <span className="receipt-col-qty">{item.quantity}</span>
                  <span className="receipt-col-price">{formatNumber(item.price)}</span>
                  <span className="receipt-col-total">{formatNumber(item.price * item.quantity)}</span>
                </div>
                {item.note && <div className="receipt-info" style={{paddingLeft: '4px'}}>* {item.note}</div>}
              </div>
            ))}
          </div>
          <div className="receipt-divider-thick"></div>
          <div className="receipt-summary">
            <div className="receipt-row font-bold">
              <span className="receipt-brand-large">TOTAL</span>
              <span className="receipt-brand-large">{formatNumber(totalAmount)}</span>
            </div>
            <div className="receipt-row">
              <span>Metode Bayar</span>
              <span>{paymentMethod}</span>
            </div>
            <div className="receipt-row">
              <span>Bayar</span>
              <span>{formatNumber(cashReceived || totalAmount)}</span>
            </div>
            <div className="receipt-row">
              <span>Kembali</span>
              <span>{formatNumber(change)}</span>
            </div>
          </div>
          <div className="receipt-divider"></div>
          <div className="receipt-footer">
            <div>Terima Kasih,</div>
            <div>Ditunggu Kembali Kedatangannya!</div>
          </div>
        </div>

        {/* CLOSING REPORT */}
        <div id="report-closing" className="receipt-container">
          <div className="receipt-header">
            <div className="receipt-brand-large">KASIRGO</div>
            <div className="receipt-address">Jl. Pertanian No. 57</div>
            <div className="receipt-address">Lebak Bulus, Jakarta Selatan</div>
          </div>
          <div className="receipt-divider"></div>
          <div className="report-title">LAPORAN REKAPITULASI</div>
          <div className="receipt-info">
            <div className="receipt-row"><span className="receipt-label">Bulan:</span><span className="receipt-value">{filterMonth}</span></div>
            <div className="receipt-row"><span className="receipt-label">Kasir:</span><span className="receipt-value">Admin</span></div>
            <div className="receipt-row"><span className="receipt-label">Mulai:</span><span className="receipt-value">{formatDate(new Date())}</span></div>
            <div className="receipt-row"><span className="receipt-label">Selesai:</span><span className="receipt-value">{formatDate(new Date())}</span></div>
            <div className="receipt-row"><span className="receipt-label">Terjual:</span><span className="receipt-value">{(transactions || []).length} Item</span></div>
          </div>
          <div className="receipt-divider"></div>
          <div className="report-section-title">DETAIL TRANSAKSI</div>
          <div className="receipt-body">
            {itemsSold.length > 0 ? itemsSold.map(([name, qty], idx) => (
              <div key={idx} className="receipt-row">
                <span className="receipt-label">{name}</span>
                <span className="receipt-value">x {qty}</span>
              </div>
            )) : <div className="receipt-row"><span className="receipt-label">-</span><span className="receipt-value">0</span></div>}
          </div>
          <div className="receipt-divider"></div>
          <div className="report-section-title">TRANSAKSI VOID</div>
          <div className="receipt-body">
            {(voidedTransactions || []).length > 0 ? voidedTransactions.map((tx, idx) => (
              <div key={idx} className="receipt-row">
                <span className="receipt-label">#{formatTransactionNumber(tx.timestamp || tx.date, tx.orderNumber)}</span>
                <span className="receipt-value">{formatNumber(tx.totalPrice || tx.total || 0)}</span>
              </div>
            )) : (
              <div className="receipt-row">
                <span className="receipt-label">TOTAL VOID</span>
                <span className="receipt-value">0</span>
              </div>
            )}
          </div>
          <div className="receipt-divider"></div>
          <div className="report-section-title">DETAIL PEMASUKAN</div>
          <div className="receipt-info">
            <div className="receipt-row"><span className="receipt-label">QRIS</span><span className="receipt-value">Rp {formatNumber(incomeByMethod.QRIS)}</span></div>
            <div className="receipt-row"><span className="receipt-label">DEBIT CARD</span><span className="receipt-value">Rp {formatNumber(incomeByMethod.Debet)}</span></div>
            <div className="receipt-row"><span className="receipt-label">TUNAI</span><span className="receipt-value">Rp {formatNumber(incomeByMethod.Tunai)}</span></div>
            <div className="receipt-row font-bold"><span className="receipt-label">TOTAL PEMASUKAN</span><span className="receipt-value">Rp {formatNumber(incomeByMethod.QRIS + incomeByMethod.Debet + incomeByMethod.Tunai)}</span></div>
          </div>
          <div className="receipt-divider"></div>
          <div className="report-section-title">DETAIL KAS KECIL</div>
          <div className="receipt-info">
            <div className="receipt-row"><span className="receipt-label">KAS AWAL</span><span className="receipt-value">Rp {formatNumber(pettyCash)}</span></div>
            <div className="receipt-row"><span className="receipt-label">SALDO</span><span className="receipt-value">Rp {formatNumber(currentBalance)}</span></div>
            <div className="receipt-row font-bold"><span className="receipt-label">TOTAL KAS</span><span className="receipt-value">Rp {formatNumber(currentBalance)}</span></div>
          </div>
          <div className="receipt-divider"></div>
          <div className="receipt-footer">
            <div className="receipt-address">Diterbitkan Oleh</div>
            <div className="font-bold">KASIRGO POS APP</div>
            <div className="receipt-address">Jl. Pertanian No. 57</div>
            <div className="receipt-address">Lebak Bulus, Jakarta Selatan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
