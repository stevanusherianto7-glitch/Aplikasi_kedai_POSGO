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
import { BluetoothPrintService } from '../../services/bluetoothPrintService';

// --- UTILS ---
import { formatIDR, formatCurrency, formatNumber, parseNumber, generateId, cn, PrinterConfig, printReceipt, getPairedDevices } from '../../lib/utils';
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

// --- ERROR BOUNDARY COMPONENTS ---
interface ErrorFallbackProps {
  error: Error;
  context?: 'root' | 'billing' | 'modal' | 'cart' | 'checkout';
  onRetry?: () => void;
}

const ErrorBoundaryFallback: React.FC<ErrorFallbackProps> = ({ error, context = 'root', onRetry }) => {
  const getContextMessage = () => {
    switch (context) {
      case 'billing': return 'Sistem Pembayaran Bermasalah';
      case 'modal': return 'Jendela Popup Bermasalah';
      case 'cart': return 'Keranjang Belanja Bermasalah';
      case 'checkout': return 'Proses Checkout Bermasalah';
      default: return 'Modul Kasir Bermasalah';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'billing': return 'Terjadi kesalahan pada sistem pembayaran. Mohon coba kembali atau gunakan metode pembayaran lain.';
      case 'modal': return 'Jendela popup tidak dapat dimuat. Data tidak hilang, silakan muat ulang halaman.';
      case 'cart': return 'Keranjang belanja mengalami gangguan. Data Anda aman, silakan muat ulang.';
      case 'checkout': return 'Proses checkout gagal. Pastikan koneksi internet stabil dan coba lagi.';
      default: return 'Terjadi kesalahan internal pada komponen KasirGo.';
    }
  };

  const getErrorDetails = () => {
    if (error?.stack) {
      const match = error.stack.match(/at (\w+)/);
      return match ? match[1] : 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <X size={32} />
        </div>
        <h1 className="text-xl font-black text-slate-800 uppercase">{getContextMessage()}</h1>
        <p className="text-xs text-slate-500 font-bold leading-relaxed">{getContextDescription()}</p>

        {error?.message && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-left">
            <p className="text-[10px] text-rose-700 font-bold">Error: {error.message}</p>
            <p className="text-[9px] text-rose-600 mt-1">Komponen: {getErrorDetails()}</p>
          </div>
        )}

        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 h-12 bg-slate-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              Coba Lagi
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
};

class KasirGoErrorBoundary extends React.Component<{
  children: React.ReactNode;
  context?: 'root' | 'billing' | 'modal' | 'cart' | 'checkout';
  fallback?: React.ReactNode;
}, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('KasirGo Error Boundary:', {
      error,
      errorInfo,
      context: this.props.context || 'root'
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorBoundaryFallback
          error={this.state.error || new Error('Unknown error')}
          context={this.props.context}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// --- MAIN COMPONENTS ---
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
  promoEvents?: any[];
  paymentMethods?: any[];
  onModalToggle?: (isOpen: boolean) => void;
}

export default function KasirGoPage(props: KasirGoPageProps) {
  // Pastikan onModalToggle diteruskan dengan benar
  const safeProps = {
    ...props,
    onModalToggle: props.onModalToggle || (() => {})
  };

  try {
    return <KasirGoContent {...safeProps} />;
  } catch (e: any) {
    console.error("KasirGo Root Error:", e);
    return <ErrorBoundaryFallback error={e} context="root" />;
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
  onModalToggle,
  promoEvents = [],
  paymentMethods = []
}: KasirGoPageProps & { onModalToggle?: (isOpen: boolean) => void }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan'>('kasir');
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
  const [pengeluaranSubTab, setPengeluaranSubTab] = useState<'harian' | 'bulanan'>('harian');
  const [pemasukanSubTab, setPemasukanSubTab] = useState<'harian' | 'bulanan'>('harian');

  // Sync filterMonth to current month when switching to bulanan mode
  useEffect(() => {
    if (pengeluaranSubTab === 'bulanan' || pemasukanSubTab === 'bulanan') {
      setFilterMonth(currentMonthStr);
    }
  }, [pengeluaranSubTab, pemasukanSubTab, currentMonthStr]);

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
  const [selectedDiscount, setSelectedDiscount] = useState<{ type: 'percent' | 'amount', value: number } | null>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
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

  // Printer Configuration State
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    enabled: localStorage.getItem('printerEnabled') === 'true',
    autoPrint: localStorage.getItem('autoPrint') === 'true',
    deviceAddress: localStorage.getItem('printerDeviceAddress') || undefined
  });
  const [availablePrinters, setAvailablePrinters] = useState<Array<{ id: string; name: string; address: string }>>([]);

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

  // Load available printers on mount
  useEffect(() => {
    if (printerConfig.enabled) {
      loadPrinters();
    }
  }, [printerConfig.enabled]);

  const loadPrinters = async () => {
    try {
      const devices = await getPairedDevices();
      const printers = devices.map(d => ({
        id: d.id,
        name: d.name,
        address: d.address
      }));
      
      // Tambahkan printer RPP02N sebagai opsi hardcoded
      if (!printers.some(p => p.name === 'RPP02N')) {
        printers.push({
          id: 'rpp02n-dummy-id',
          name: 'RPP02N',
          address: '00:11:22:33:44:55' // Dummy address
        });
      }
      
      setAvailablePrinters(printers);
    } catch (error) {
      console.error('Failed to load printers:', error);
      // Jika gagal load, tetap sediakan printer RPP02N
      setAvailablePrinters([{
        id: 'rpp02n-dummy-id',
        name: 'RPP02N',
        address: '00:11:22:33:44:55'
      }]);
    }
  };

  // Update printer config and persist to localStorage
  const updatePrinterConfig = (updates: Partial<PrinterConfig>) => {
    const newConfig = { ...printerConfig, ...updates };
    setPrinterConfig(newConfig);
    if (updates.enabled !== undefined) localStorage.setItem('printerEnabled', String(updates.enabled));
    if (updates.autoPrint !== undefined) localStorage.setItem('autoPrint', String(updates.autoPrint));
    if (updates.deviceAddress !== undefined) {
      if (updates.deviceAddress) {
        localStorage.setItem('printerDeviceAddress', updates.deviceAddress);
      } else {
        localStorage.removeItem('printerDeviceAddress');
      }
    }
  };

  // Editing existing menu state
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editMenuData, setEditMenuData] = useState({ name: '', price: '', category: 'Makanan' });

  // Calculations
  const baseTotalAmount = (cart || []).reduce((sum, item) => sum + (Number(item?.price || 0) * (Number(item?.quantity || 0))), 0);
  const discountAmount = selectedDiscount 
    ? (selectedDiscount.type === 'percent' ? (baseTotalAmount * selectedDiscount.value / 100) : selectedDiscount.value)
    : 0;
  const totalAmount = baseTotalAmount - discountAmount;
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

    // Auto-print if enabled
    if (printerConfig.autoPrint && printerConfig.enabled && printerConfig.deviceAddress) {
      setTimeout(async () => {
        try {
          await printReceipt('customer', {
            orderNumber: orderNum,
            customerName,
            customerWA,
            items: cart,
            subtotal: baseTotalAmount,
            discount: discountAmount,
            total: totalAmount,
            paymentMethod,
            cashReceived,
            change,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Auto-print failed:', error);
        }
      }, 500);
    }
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
    if (filename === 'CUSTOMER_RECEIPT') {
      try {
        // Hitung tinggi dinamis: base height + (jumlah item * estimasi tinggi item)
        const baseHeight = 90;
        const itemHeight = cart.length * 8;
        const calculatedHeight = baseHeight + itemHeight;
        
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [58, calculatedHeight] });
        const pw = doc.internal.pageSize.getWidth();
        let y = 10;

        // Header
        doc.setFont('courier', 'bold').setFontSize(10);
        doc.text('KEDAI ELVERA 57', pw / 2, y, { align: 'center' });
        y += 4;
        
        doc.setFont('courier', 'normal').setFontSize(6);
        doc.text('Jl. Pertanian No. 57', pw / 2, y, { align: 'center' });
        y += 3;
        doc.text('Lebak Bulus, Jakarta Selatan', pw / 2, y, { align: 'center' });
        y += 3;
        doc.text('WA: 0895-3763-48626', pw / 2, y, { align: 'center' });
        y += 5;

        doc.text(`Order #${String(currentOrderNumber).padStart(3, '0')}`, pw / 2, y, { align: 'center' });
        y += 3;
        
        doc.setLineWidth(0.1).setDrawColor(150);
        doc.line(2, y, pw - 2, y);
        y += 4;

        // Meta Info
        doc.text(`Tgl: ${new Date().toLocaleDateString('id-ID')}`, 2, y);
        y += 3;
        doc.text(`Jam: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, 2, y);
        y += 3;
        doc.text(`Bill: ${formatTransactionNumber(new Date(), currentOrderNumber || 0)}`, 2, y);
        y += 3;
        doc.text(`Kasir: Verena`, 2, y);
        y += 4;

        doc.line(2, y, pw - 2, y);
        y += 4;

        // Table Header
        doc.setFont('courier', 'bold');
        doc.text('Transaksi', 2, y);
        doc.text('Qty', 22, y);
        doc.text('Harga', 30, y);
        doc.text('Total', pw - 2, y, { align: 'right' });
        y += 4;

        doc.line(2, y, pw - 2, y);
        y += 4;

        // Items
        doc.setFont('courier', 'normal');
        cart.forEach(item => {
          const nameLines = doc.splitTextToSize(item.name.toUpperCase(), 18);
          doc.text(nameLines, 2, y);
          doc.text(String(item.quantity), 22, y);
          doc.text(formatNumber(item.price), 30, y);
          doc.text(formatNumber(item.price * item.quantity), pw - 2, y, { align: 'right' });
          y += Math.max(nameLines.length * 3, 4);
          if (item.note) {
            doc.text(`* ${item.note}`, 4, y);
            y += 3;
          }
        });

        doc.line(2, y, pw - 2, y);
        y += 4;

        // Summary
        if (selectedDiscount) {
          doc.text('Subtotal:', 2, y);
          const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          doc.text(formatNumber(subtotal), pw - 2, y, { align: 'right' });
          y += 3;
          
          doc.text(`Diskon (${selectedDiscount.type === 'percent' ? `${selectedDiscount.value}%` : 'Nom' }):`, 2, y);
          const discAmt = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - totalAmount;
          doc.text(`-${formatNumber(discAmt)}`, pw - 2, y, { align: 'right' });
          y += 3;
        }

        doc.setFont('courier', 'bold').setFontSize(8);
        doc.text('TOTAL', 2, y);
        doc.text(formatNumber(totalAmount), pw - 2, y, { align: 'right' });
        y += 4;

        doc.setFont('courier', 'normal').setFontSize(6);
        doc.text('Metode Bayar:', 2, y);
        doc.text(paymentMethod, pw - 2, y, { align: 'right' });
        y += 3;

        doc.text('Bayar:', 2, y);
        doc.text(formatNumber(cashReceived || totalAmount), pw - 2, y, { align: 'right' });
        y += 3;

        doc.text('Kembali:', 2, y);
        doc.text(formatNumber(change), pw - 2, y, { align: 'right' });
        y += 5;

        doc.line(2, y, pw - 2, y);
        y += 4;

        // Footer
        doc.text('Dukung UMKM Indonesia', pw / 2, y, { align: 'center' });
        y += 3;
        doc.text('Tulang Punggung Ekonomi Nasional', pw / 2, y, { align: 'center' });

        // Save
        if (Capacitor.isNativePlatform()) {
          const base64 = doc.output('datauristring').split(',')[1];
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          await Filesystem.writeFile({
            path: `${filename}_${Date.now()}.pdf`,
            data: base64,
            directory: Directory.Documents
          });
          alert(`Berhasil! PDF tersimpan di folder Documents.`);
        } else {
          doc.save(`${filename}.pdf`);
        }
      } catch (e) {
        console.error("Print Error:", e);
        alert("Gagal mencetak struk.");
      }
      return;
    }

    // Fallback untuk Kitchen & Closing (Gunakan html2canvas yang sudah diperbaiki)
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.querySelector('.absolute-offscreen');
          if (wrapper) {
            (wrapper as HTMLElement).style.position = 'relative';
            (wrapper as HTMLElement).style.left = '0';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [58, (canvas.height * 58) / canvas.width]);
      pdf.addImage(imgData, 'PNG', 0, 0, 58, (canvas.height * 58) / canvas.width);

      if (Capacitor.isNativePlatform()) {
        const base64 = pdf.output('datauristring').split(',')[1];
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
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
                  setPromoModalOpen={setPromoModalOpen}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  paymentMethods={paymentMethods}
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
                      title="Pilih Bulan"
                      aria-label="Pilih Bulan"
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
                          <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 group relative">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                   <span className="text-[9px] font-black bg-slate-800 text-white px-2 py-0.5 rounded tracking-tighter shrink-0">ORDER #{String(index + 1).padStart(3, '0')}</span>
                                   <p className="font-bold text-slate-400 text-[10px] truncate">#{t.transaction_code || formatTransactionNumber(t.timestamp || t.date, t.orderNumber)}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{formatDate(t.timestamp || t.date)} • {t.paymentMethod || 'Tunai'}</p>
                              </div>

                              <div className="flex flex-col items-end shrink-0">
                                <span className="font-black text-emerald-600 text-sm whitespace-nowrap">
                                  {formatIDR(t.totalPrice || t.total || 0)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleVoidTransaction(t.id); }}
                              title="Batalkan Transaksi"
                              aria-label="Batalkan Transaksi"
                              className="absolute top-4 right-4 translate-x-12 group-hover:translate-x-0 text-slate-300 hover:text-rose-500 transition-all shrink-0"
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

      {/* --- MODAL PROMO (Redesigned) --- */}
      {promoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] w-full max-w-sm p-8 shadow-2xl flex flex-col max-h-[85vh] border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="space-y-1">
                <h3 className="font-black text-base tracking-tight text-slate-900 uppercase">Pilih Promo</h3>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Maksimal 1 promo per transaksi</p>
              </div>
              <button 
                onClick={() => setPromoModalOpen(false)} 
                title="Tutup"
                aria-label="Tutup"
                className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
              {/* Hardcoded Promo 1: Grand Opening */}
              <button 
                onClick={() => { 
                  setSelectedDiscount({ type: 'percent', value: 20 }); 
                  setPromoModalOpen(false); 
                }}
                className="group w-full p-4 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-100/50 rounded-2xl transition-all duration-300 active:scale-[0.98] text-left flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-emerald-800 block">Grand Opening</span>
                  <span className="text-[10px] font-bold text-emerald-600 block">Diskon Spesial Pembukaan</span>
                </div>
                <div className="px-3 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <span className="text-sm font-black text-emerald-600">20%</span>
                </div>
              </button>

              {/* Hardcoded Promo 2: Proklamasi */}
              <button 
                onClick={() => { 
                  setSelectedDiscount({ type: 'percent', value: 10 }); 
                  setPromoModalOpen(false); 
                }}
                className="group w-full p-4 bg-gradient-to-br from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border border-rose-100/50 rounded-2xl transition-all duration-300 active:scale-[0.98] text-left flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-rose-800 block">Diskon Proklamasi</span>
                  <span className="text-[10px] font-bold text-rose-600 block">Semarak Kemerdekaan</span>
                </div>
                <div className="px-3 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <span className="text-sm font-black text-rose-600">10%</span>
                </div>
              </button>

              {promoEvents && promoEvents.filter((p: any) => p.isActive).map((promo: any) => (
                <button 
                  key={promo.id}
                  onClick={() => { 
                    setSelectedDiscount({ 
                      type: promo.discountPercent > 0 ? 'percent' : 'amount', 
                      value: promo.discountPercent > 0 ? promo.discountPercent : promo.discountAmount 
                    }); 
                    setPromoModalOpen(false); 
                  }}
                  className="group w-full p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100/50 rounded-2xl transition-all duration-300 active:scale-[0.98] text-left flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-blue-800 block">{promo.name}</span>
                    <span className="text-[10px] font-bold text-blue-600 block">Promo Aktif</span>
                  </div>
                  <div className="px-3 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {promo.discountPercent > 0 ? (
                      <span className="text-sm font-black text-blue-600">{promo.discountPercent}%</span>
                    ) : (
                      <span className="text-sm font-black text-blue-600">Rp{formatNumber(promo.discountAmount)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 shrink-0">
              <button 
                onClick={() => { setSelectedDiscount(null); setPromoModalOpen(false); }}
                className="w-full h-12 bg-[#800000] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#600000] active:scale-95 transition-all shadow-lg shadow-red-900/10"
              >
                Reset / Tanpa Diskon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SETTINGS (MANAJEMEN MENU KASIR) --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-black text-sm tracking-tight text-slate-800 uppercase">Manajemen Menu Kasir</h3>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">Update Katalog Jualan</p>
              </div>
              <button onClick={() => { setIsSettingsOpen(false); setEditingRecipeId(null); }} title="Tutup" aria-label="Tutup" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><X size={16}/></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
              {/* PRINTER CONFIGURATION */}
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Printer size={14} className="text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Konfigurasi Printer
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-600">Aktifkan Printer Bluetooth</span>
                    <button
                      onClick={() => updatePrinterConfig({ enabled: !printerConfig.enabled })}
                      title="Aktifkan Printer Bluetooth"
                      aria-label="Aktifkan Printer Bluetooth"
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        printerConfig.enabled ? "bg-blue-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                        printerConfig.enabled ? "left-7" : "left-1"
                      )}></div>
                    </button>
                  </div>

                  {printerConfig.enabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-600">Auto-Print Setelah Checkout</span>
                        <button
                          onClick={() => updatePrinterConfig({ autoPrint: !printerConfig.autoPrint })}
                          title="Auto-Print Setelah Checkout"
                          aria-label="Auto-Print Setelah Checkout"
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            printerConfig.autoPrint ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                            printerConfig.autoPrint ? "left-7" : "left-1"
                          )}></div>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="select-printer" className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Printer</label>
                        <select
                          id="select-printer"
                          title="Pilih Printer"
                          value={printerConfig.deviceAddress || ''}
                          onChange={(e) => updatePrinterConfig({ deviceAddress: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">-- Pilih Printer --</option>
                          {availablePrinters.map(p => (
                            <option key={p.id} value={p.address}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={loadPrinters}
                        className="w-full h-8 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-all"
                      >
                        Scan Printer Terpasang
                      </button>
                    </>
                  )}
                </div>
              </div>

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
                          title="Edit Menu"
                          aria-label="Edit Menu"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 active:bg-blue-100 transition-all shadow-sm"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMenu(recipe?.id); }}
                          title="Hapus Menu"
                          aria-label="Hapus Menu"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-8 w-full max-w-md space-y-6 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-2 transform hover:rotate-12 transition-transform duration-300">
                 <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">TRANSAKSI SELESAI</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Silakan Pilih Jenis Struk</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* STRUK DAPUR */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const tx = { id: generateId(), date: new Date().toISOString(), totalPrice: totalAmount, items: cart, paymentMethod, orderNumber: currentOrderNumber };
                    await BluetoothPrintService.printReceipt(tx as any, localStorage.getItem('printer_address') || undefined, 'kitchen');
                  }}
                  title="Cetak Struk Dapur"
                  className="flex-1 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-between px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Utensils size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black uppercase tracking-wider">STRUK DAPUR</span>
                      <span className="text-[10px] text-blue-100 font-medium">Untuk Area Dapur</span>
                    </div>
                  </div>
                  <Printer size={18} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => handlePrint('receipt-kitchen', 'KITCHEN_ORDER')}
                  className="w-16 h-16 bg-white/80 backdrop-blur-sm text-slate-600 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-slate-50"
                  title="Simpan PDF"
                >
                  <FileDown size={22} className="text-slate-500" />
                </button>
              </div>

              {/* STRUK PELANGGAN */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const tx = { id: generateId(), date: new Date().toISOString(), totalPrice: totalAmount, items: cart, paymentMethod, orderNumber: currentOrderNumber };
                    await BluetoothPrintService.printReceipt(tx as any, localStorage.getItem('printer_address') || undefined, 'customer');
                  }}
                  title="Cetak Struk Pelanggan"
                  className="flex-1 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-between px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Receipt size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black uppercase tracking-wider">STRUK PELANGGAN</span>
                      <span className="text-[10px] text-emerald-100 font-medium">Untuk Pelanggan</span>
                    </div>
                  </div>
                  <Printer size={18} className="text-emerald-200 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => handlePrint('receipt-customer', 'CUSTOMER_RECEIPT')}
                  className="w-16 h-16 bg-white/80 backdrop-blur-sm text-slate-600 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-slate-50"
                  title="Simpan PDF"
                >
                  <FileDown size={22} className="text-slate-500" />
                </button>
              </div>

              {/* LAPORAN CLOSING */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const tx = { id: generateId(), date: new Date().toISOString(), totalPrice: totalAmount, items: cart, paymentMethod, orderNumber: currentOrderNumber };
                    await BluetoothPrintService.printReceipt(tx as any, localStorage.getItem('printer_address') || undefined, 'closing');
                  }}
                  title="Cetak Laporan Closing"
                  className="flex-1 h-16 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-2xl flex items-center justify-between px-6 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-lg shadow-slate-700/25 hover:shadow-slate-700/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black uppercase tracking-wider">LAPORAN CLOSING</span>
                      <span className="text-[10px] text-slate-300 font-medium">Rekapitulasi Shift</span>
                    </div>
                  </div>
                  <Printer size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => handlePrint('report-closing', 'CLOSING_REPORT')}
                  className="w-16 h-16 bg-white/80 backdrop-blur-sm text-slate-600 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-slate-200/60 shadow-sm hover:shadow-md hover:bg-slate-50"
                  title="Simpan PDF"
                >
                  <FileDown size={22} className="text-slate-500" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => resetOrder()}
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                >
                  <Plus size={16} strokeWidth={3} />
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
            <div className="receipt-info">
              <div className="receipt-row"><span className="receipt-label">Tgl:</span><span className="receipt-value">{new Date().toLocaleDateString('id-ID')}</span></div>
              <div className="receipt-row"><span className="receipt-label">Jam:</span><span className="receipt-value">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
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
            <div className="receipt-brand-large">Kedai Elvera 57</div>
            <div className="receipt-address">Jl. Pertanian No. 57</div>
            <div className="receipt-address">Lebak Bulus, Jakarta Selatan</div>
            <div className="receipt-address">WA: 0895-3763-48626</div>
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
            <div className="receipt-row font-bold">
              <span className="receipt-label">No. Bill:</span>
              <span className="receipt-value">{formatTransactionNumber(new Date(), currentOrderNumber || 0)}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Kasir:</span>
              <span className="receipt-value">Verena</span>
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
                  <span className="receipt-col-menu font-bold">{item.name}</span>
                  <span className="receipt-col-qty">{item.quantity}</span>
                  <span className="receipt-col-price">{formatNumber(item.price)}</span>
                  <span className="receipt-col-total">{formatNumber(item.price * item.quantity)}</span>
                </div>
                {item.note && <div className="receipt-info pl-1">* {item.note}</div>}
              </div>
            ))}
          </div>
          <div className="receipt-divider-thick"></div>
          <div className="receipt-summary">
            {selectedDiscount && (
              <>
                <div className="receipt-row">
                  <span>Subtotal:</span>
                  <span>{formatNumber(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                </div>
                <div className="receipt-row">
                  <span>Diskon ({selectedDiscount.type === 'percent' ? `${selectedDiscount.value}%` : 'Nominal'}):</span>
                  <span>-{formatNumber(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - totalAmount)}</span>
                </div>
              </>
            )}
            <div className="receipt-row font-bold">
              <span className="receipt-brand-large">TOTAL</span>
              <span className="receipt-brand-large">{formatNumber(totalAmount)}</span>
            </div>
            <div className="receipt-row">
              <span>Metode Bayar</span>
              <span className="font-bold">{paymentMethod}</span>
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
            <div>Dukung UMKM Indonesia</div>
            <div>Tulang Punggung Ekonomi Nasional</div>
          </div>
        </div>

        {/* CLOSING REPORT */}
        <div id="report-closing" className="receipt-container">
          <div className="receipt-header">
            <div className="receipt-brand-large">Kedai Elvera 57</div>
            <div className="receipt-address">Jl. Pertanian No. 57</div>
            <div className="receipt-address">Lebak Bulus, Jakarta Selatan</div>
            <div className="receipt-address">WA: 0895-3763-48626</div>
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
              <div key={idx} className="receipt-row font-bold">
                <span>{name}</span>
                <span>x {qty}</span>
              </div>
            )) : <div className="receipt-row"><span className="receipt-label">-</span><span className="receipt-value">0</span></div>}
          </div>
          <div className="receipt-divider"></div>
          <div className="report-section-title">TRANSAKSI VOID</div>
          <div className="receipt-body">
            {(voidedTransactions || []).length > 0 ? voidedTransactions.map((tx, idx) => (
              <div key={idx} className="receipt-row font-bold">
                <span>#{formatTransactionNumber(tx.timestamp || tx.date, tx.orderNumber)}</span>
                <span>{formatNumber(tx.totalPrice || tx.total || 0)}</span>
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
