/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Minus, Package, DollarSign,
  FileDown, Pencil, Check, Save, Download, Wallet,
  Search, Filter, ChevronDown, ChevronUp, History,
  TrendingUp, AlertCircle, MapPin, Activity, LayoutDashboard,
  Calendar, ArrowRight, ArrowLeft, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatIDR, formatNumber, parseNumber, cn, generateId, toTitleCase } from '../../lib/utils';
import { PriceInput } from "../../components/PriceInput";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { RestaurantAsset } from '../../types';

// --- TYPES ---
interface Asset extends RestaurantAsset {
  last_maintenance?: string;
  created_at?: string;
}

interface MaintenanceLog {
  id: string;
  asset_id: string;
  description: string;
  cost: number;
  date: string;
}

const CATEGORIES = ['Dapur', 'Elektronik', 'Furniture', 'Alat Makan', 'Dekorasi', 'Lainnya'];
const LOCATIONS = ['Area Makan', 'Dapur Utama', 'Gudang', 'Kasir', 'Luar'];

interface RestaurantAssetsPageProps {
  theme?: 'light' | 'dark';
  assets: Asset[];
  maintenanceLogs: MaintenanceLog[];
  onSaveAsset: (asset: Partial<Asset>, editingId: string | null) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
  onAddMaintenance: (log: MaintenanceLog, asset: Asset) => Promise<void>;
  isLoaded: boolean;
  onModalToggle?: (isOpen: boolean) => void;
}

export default function RestaurantAssetsPage({
  theme = 'dark',
  assets = [],
  maintenanceLogs = [],
  onSaveAsset,
  onDeleteAsset,
  onAddMaintenance,
  isLoaded,
  onModalToggle
}: RestaurantAssetsPageProps) {
  // Tabs State
  const [activeSubTab, setActiveTab] = useState<'inventory' | 'analytics' | 'maintenance'>('inventory');
  
  // UI State
  const [isAddingAsset, _setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchHistory] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [isMaintenanceModalOpen, _setIsMaintenanceModalOpen] = useState(false);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<Asset | null>(null);

  const setIsAddingAsset = (val: boolean) => {
    _setIsAddingAsset(val);
    if (onModalToggle) onModalToggle(val);
  };

  const setIsMaintenanceModalOpen = (val: boolean) => {
    _setIsMaintenanceModalOpen(val);
    if (onModalToggle) onModalToggle(val);
  };

  // Form State
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '', category: 'Dapur', quantity: 1, price: 0, condition: 'Bagus', location: 'Dapur Utama'
  });
  const [newMaintenance, setNewMaintenance] = useState({ description: '', cost: '' });

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return (assets || []).filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'Semua' || a.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchQuery, filterCategory]);

  // Analytics
  const stats = useMemo(() => {
    const totalValue = (assets || []).reduce((sum, a) => sum + (a.price * a.quantity), 0);
    const brokenCount = (assets || []).filter(a => a.condition === 'Rusak').length;
    const maintenanceCost = (maintenanceLogs || []).reduce((sum, l) => sum + l.cost, 0);
    const categoryDistribution = (assets || []).reduce((acc: any, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {});

    return { totalValue, brokenCount, maintenanceCost, categoryDistribution };
  }, [assets, maintenanceLogs]);

  // Actions
  const handleSaveAsset = async () => {
    if (!newAsset.name) return;
    await onSaveAsset(newAsset, editingAsset?.id || null);
    setIsAddingAsset(false);
    setEditingAsset(null);
    setNewAsset({ name: '', category: 'Dapur', quantity: 1, price: 0, condition: 'Bagus', location: 'Dapur Utama' });
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Hapus aset ini secara permanen?')) {
      await onDeleteAsset(id);
    }
  };

  const handleAddMaintenance = async () => {
    if (!selectedAssetForMaintenance || !newMaintenance.description) return;

    const log: MaintenanceLog = {
      id: generateId(),
      asset_id: selectedAssetForMaintenance.id,
      description: newMaintenance.description,
      cost: Number(parseNumber(newMaintenance.cost)),
      date: new Date().toISOString()
    };

    await onAddMaintenance(log, selectedAssetForMaintenance);
    setIsMaintenanceModalOpen(false);
    setNewMaintenance({ description: '', cost: '' });
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN INVENTARIS ASET KEDAI', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Box
    doc.setFillColor(245, 247, 250);
    doc.rect(15, 35, pageWidth - 30, 25, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN ASET:', 20, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Nilai Investasi: ${formatIDR(stats.totalValue)}`, 20, 50);
    doc.text(`Jumlah Aset Rusak: ${stats.brokenCount} Item`, 100, 50);
    doc.text(`Total Biaya Servis: ${formatIDR(stats.maintenanceCost)}`, 180, 50);

    // Table
    autoTable(doc, {
      startY: 65,
      head: [['Nama Barang', 'Kategori', 'Qty', 'Harga Satuan', 'Kondisi', 'Lokasi']],
      body: filteredAssets.map(a => [
        a.name, a.category, a.quantity, formatIDR(a.price), a.condition, a.location
      ]),
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        4: { fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw;
          if (val === 'Rusak') data.cell.styles.textColor = [220, 38, 38];
          if (val === 'Servis') data.cell.styles.textColor = [217, 119, 6];
        }
      }
    });

    if (Capacitor.isNativePlatform()) {
      const base64 = doc.output('datauristring').split(',')[1];
      await Filesystem.writeFile({
        path: `Laporan_Aset_${Date.now()}.pdf`,
        data: base64,
        directory: Directory.Documents,
        recursive: true
      });
      alert('PDF berhasil disimpan di folder Documents!');
    } else {
      doc.save('Laporan_Aset_Resto.pdf');
    }
  };

  if (!isLoaded) return <div className="p-20 text-center text-slate-400">Loading Assets...</div>;

  return (
    <div className={cn(
      "min-h-screen pb-32 transition-colors duration-500 no-scrollbar",
      theme === 'dark' ? "bg-[#0a0a0c]" : "bg-transparent"
    )}>
      {/* 1. STICKY HEADER - NEON GLOW STYLE */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 pt-10 pb-6 backdrop-blur-xl border-b rounded-b-[3.5rem] transition-all no-scrollbar",
        theme === 'dark' ? "bg-black/80 border-white/5 shadow-2xl shadow-black/40" : "bg-white/80 border-slate-200 shadow-sm"
      )}>
        <div className="flex flex-col gap-6">
          {/* Row 0: Standalone Title */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Package className="text-white" size={16} />
             </div>
             <div className="flex flex-col">
               <h1 className={cn("text-sm font-black uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>INVENTARIS KEDAI</h1>
               <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest opacity-60">Asset Management Hub</span>
             </div>
          </div>

          {/* 2 Rows of Buttons (Total 5 buttons) */}
          <div className="space-y-2">
            {/* Row 1: Add and PDF */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAddingAsset(true)}
                className="h-12 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus size={14} /> TAMBAH ASET
              </button>
              <button
                onClick={handleExportPDF}
                className="h-12 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 transition-all active:scale-95"
              >
                <FileDown size={14} /> EXPORT PDF
              </button>
            </div>

            {/* Row 2: Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'inventory', label: 'Inventory', icon: LayoutDashboard },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'maintenance', label: 'Service', icon: History },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-14 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all border",
                    activeSubTab === tab.id
                      ? "bg-blue-600/10 text-blue-500 border-blue-500/50 shadow-inner"
                      : "bg-transparent text-slate-500 border-slate-100 dark:border-white/5"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="pt-80 px-6 space-y-6 no-scrollbar">
        <AnimatePresence mode="wait">
          {activeSubTab === 'inventory' && (
            <motion.div
              key="inv"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search & Filter Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <input 
                    placeholder="Cari aset kedai..."
                    value={searchQuery}
                    onChange={e => setSearchHistory(e.target.value)}
                    className="w-full h-12 pl-12 pr-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>

                <div className="flex gap-2 min-w-[140px]">
                  <div className="relative w-full">
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 rounded-xl bg-white border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-tight outline-none appearance-none cursor-pointer hover:border-blue-200 transition-all"
                    >
                      <option value="Semua">KATEGORI: SEMUA</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>

              {/* Asset Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="bg-white/60 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-200/50 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-full uppercase">{asset.category}</span>
                        <h3 className="text-sm font-black text-slate-800 uppercase line-clamp-1">{asset.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><MapPin size={10}/> {asset.location}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                        asset.condition === 'Bagus' ? "bg-emerald-50 text-emerald-600" :
                        asset.condition === 'Rusak' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {asset.condition}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                       <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Kuantitas</span>
                         <span className="text-sm font-black text-slate-700">{asset.quantity} Item</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Harga / Unit</span>
                         <span className="text-sm font-black text-blue-600">{formatIDR(asset.price)}</span>
                       </div>
                    </div>

                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setNewAsset(asset);
                          setIsAddingAsset(true);
                        }}
                        className="flex-1 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <Pencil size={14} /> EDIT
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssetForMaintenance(asset);
                          setIsMaintenanceModalOpen(true);
                        }}
                        className="flex-1 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-amber-50 hover:text-amber-600 transition-all"
                      >
                        <Activity size={14} /> SERVIS
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Quick Stat Badge */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-3xl pointer-events-none" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSubTab === 'analytics' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden">
                   <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Investasi Aset</p>
                   <h2 className="text-2xl font-black">{formatIDR(stats.totalValue)}</h2>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-3/4" />
                   </div>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-sm">
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Aset Bermasalah</p>
                   <div className="flex items-center gap-4">
                     <h2 className="text-3xl font-black text-rose-600">{stats.brokenCount}</h2>
                     <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase">Need Repair</div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">SEGERA TINDAK LANJUTI</p>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-sm">
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Total Biaya Pemeliharaan</p>
                   <h2 className="text-2xl font-black text-amber-600">{formatIDR(stats.maintenanceCost)}</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">TOTAL COST LIFE-CYCLE</p>
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-sm">
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Kesehatan Aset</p>
                   <h2 className="text-3xl font-black text-emerald-600">
                     {Math.round(((assets.length - stats.brokenCount) / (assets.length || 1)) * 100)}%
                   </h2>
                   <div className="flex gap-1">
                     {[1,2,3,4,5].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full", i <= 4 ? "bg-emerald-500" : "bg-slate-100")} />)}
                   </div>
                 </div>
               </div>

               {/* Category Distribution */}
               <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                 <h3 className="font-black text-base text-slate-800 uppercase tracking-tight mb-8">Distribusi Aset Per Kategori</h3>
                 <div className="space-y-6">
                   {Object.entries(stats.categoryDistribution).map(([cat, count]: any) => (
                     <div key={cat} className="space-y-2">
                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">{cat}</span>
                          <span className="text-blue-600">{count} Item</span>
                        </div>
                        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / assets.length) * 100}%` }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            </motion.div>
          )}

          {activeSubTab === 'maintenance' && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                   <div className="space-y-1">
                     <h3 className="font-black text-base text-slate-800 uppercase tracking-tight">Log Pemeliharaan Aset</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riwayat Perbaikan & Servis berkala</p>
                   </div>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {maintenanceLogs.map(log => {
                      const asset = assets.find(a => a.id === log.asset_id);
                      return (
                        <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                               <RefreshCw size={22} />
                             </div>
                             <div className="space-y-1">
                               <h4 className="font-black text-sm text-slate-800 uppercase leading-none">{asset?.name || 'Unknown Asset'}</h4>
                               <p className="text-xs text-slate-500 font-medium">{log.description}</p>
                               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                             </div>
                           </div>
                           <div className="text-right">
                             <span className="text-sm font-black text-amber-600">{formatIDR(log.cost)}</span>
                           </div>
                        </div>
                      );
                    })}
                    {maintenanceLogs.length === 0 && (
                      <div className="p-20 text-center text-slate-400 italic font-medium">Belum ada riwayat pemeliharaan.</div>
                    )}
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. MODALS */}
      {/* Add/Edit Asset Modal */}
      {isAddingAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
           <div className={cn(
             "rounded-[2.5rem] w-full max-w-sm p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] no-scrollbar",
             theme === 'dark' ? "bg-[#161421] border border-white/10" : "bg-white"
           )}>
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className={cn("font-black text-sm uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>
                    {editingAsset ? 'Perbarui Aset' : 'Register Aset'}
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inventaris</p>
                </div>
                <button
                  onClick={() => { setIsAddingAsset(false); setEditingAsset(null); }}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                    theme === 'dark' ? "bg-white/5 text-slate-400 hover:text-white" : "bg-slate-50 text-slate-400 hover:text-rose-500"
                  )}
                >
                  <X size={16}/>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5 col-span-2">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Barang</label>
                  <input
                    placeholder="Contoh: Blender Philips"
                    value={newAsset.name}
                    onChange={e => setNewAsset({...newAsset, name: toTitleCase(e.target.value)})}
                    className={cn(
                      "w-full h-9 px-4 rounded-xl text-xs font-bold outline-none transition-all",
                      theme === 'dark' ? "bg-white/5 border border-white/10 text-white focus:border-blue-500/50" : "bg-slate-50 border-none text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                    )}
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select
                    value={newAsset.category}
                    onChange={e => setNewAsset({...newAsset, category: e.target.value})}
                    className={cn(
                      "w-full h-9 px-4 rounded-xl text-[10px] font-bold outline-none",
                      theme === 'dark' ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border-none text-slate-900"
                    )}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasi</label>
                  <select
                    value={newAsset.location}
                    onChange={e => setNewAsset({...newAsset, location: e.target.value})}
                    className={cn(
                      "w-full h-9 px-4 rounded-xl text-[10px] font-bold outline-none",
                      theme === 'dark' ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border-none text-slate-900"
                    )}
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                  <input
                    type="number"
                    value={newAsset.quantity}
                    onChange={e => setNewAsset({...newAsset, quantity: Number(e.target.value)})}
                    className={cn(
                      "w-full h-9 px-4 rounded-xl text-xs font-bold outline-none",
                      theme === 'dark' ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border-none text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi</label>
                  <div className={cn(
                    "flex gap-1 p-0.5 rounded-xl",
                    theme === 'dark' ? "bg-white/5" : "bg-slate-50"
                  )}>
                    {['Bagus', 'Rusak', 'Servis'].map(cond => (
                      <button
                        key={cond}
                        onClick={() => setNewAsset({...newAsset, condition: cond as any})}
                        className={cn(
                          "flex-1 h-7 rounded-lg text-[6px] font-black uppercase tracking-tight transition-all",
                          newAsset.condition === cond
                            ? (theme === 'dark' ? "bg-blue-600 text-white" : "bg-white text-blue-600 shadow-sm")
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-0.5 col-span-2">
                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Satuan (Rp)</label>
                  <div className="relative">
                    <input
                      placeholder="0"
                      value={formatNumber(newAsset.price)}
                      onChange={e => setNewAsset({...newAsset, price: parseNumber(e.target.value)})}
                      className={cn(
                        "w-full h-9 pl-10 pr-4 rounded-xl text-xs font-black outline-none transition-all",
                        theme === 'dark' ? "bg-white/5 border border-white/10 text-blue-400" : "bg-slate-50 border-none text-blue-600"
                      )}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">RP</span>
                  </div>
                </div>
             </div>

             <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setIsAddingAsset(false); setEditingAsset(null); }}
                  className={cn(
                    "flex-1 h-10 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all",
                    theme === 'dark' ? "text-slate-400 hover:bg-white/5" : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAsset}
                  className="flex-[2] h-10 bg-blue-600 text-white rounded-xl font-black text-[8px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Simpan Aset
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
           <div className={cn(
             "rounded-[2.5rem] w-full max-w-xs p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300",
             theme === 'dark' ? "bg-[#161421] border border-white/10" : "bg-white"
           )}>
              <div className="text-center space-y-2">
                 <div className={cn(
                   "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-inner",
                   theme === 'dark' ? "bg-white/5 text-amber-500" : "bg-amber-50 text-amber-600"
                 )}>
                   <Activity size={28} />
                 </div>
                 <div className="space-y-0.5">
                   <h3 className={cn("font-black text-base uppercase tracking-tight", theme === 'dark' ? "text-white" : "text-slate-800")}>Catat Perbaikan</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{selectedAssetForMaintenance?.name}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan</label>
                   <input
                     placeholder="Ganti pisau blender..."
                     value={newMaintenance.description}
                     onChange={e => setNewMaintenance({...newMaintenance, description: toTitleCase(e.target.value)})}
                     className={cn(
                       "w-full h-10 px-4 rounded-xl text-xs font-bold outline-none",
                       theme === 'dark' ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border-none text-slate-900"
                     )}
                   />
                 </div>

                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Biaya (Rp)</label>
                    <div className="relative">
                      <input
                        placeholder="0"
                        value={newMaintenance.cost}
                        onChange={e => setNewMaintenance({...newMaintenance, cost: formatNumber(e.target.value)})}
                        className={cn(
                          "w-full h-10 pl-10 pr-4 rounded-xl text-sm font-black outline-none",
                          theme === 'dark' ? "bg-white/5 border border-white/10 text-amber-500" : "bg-slate-50 border-none text-amber-600"
                        )}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">RP</span>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setIsMaintenanceModalOpen(false)} className="flex-1 h-11 text-slate-400 font-black text-[9px] uppercase tracking-widest">Batal</button>
                 <button onClick={handleAddMaintenance} className="flex-[2] h-11 bg-amber-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Simpan Log</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
