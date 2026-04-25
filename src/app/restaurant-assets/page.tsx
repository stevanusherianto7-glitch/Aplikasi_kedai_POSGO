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
    const result = await onSaveAsset(newAsset, editingAsset?.id || null);

    if ((result as any)?.success !== false) {
      setIsAddingAsset(false);
      setEditingAsset(null);
      setNewAsset({ name: '', category: 'Dapur', quantity: 1, price: 0, condition: 'Bagus', location: 'Dapur Utama' });
      alert('asset telah disimpan');
    } else {
      alert('GAGAL SIMPAN: ' + (result as any)?.message);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50 pb-32 transition-colors duration-500 no-scrollbar">
      {/* 1. STICKY HEADER - RESTORED PRO GRID */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 pt-10 pb-6 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm rounded-b-[3.5rem] no-scrollbar">
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          {/* Row 0: Standalone Title */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Package className="text-white" size={16} />
             </div>
             <div className="flex flex-col">
               <h1 className="text-sm font-black uppercase tracking-tight text-slate-900">INVENTARIS KEDAI</h1>
               <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest opacity-60">Asset Management Hub</span>
             </div>
          </div>

          {/* 2 Rows of Buttons (Restored to Original Professional Layout) */}
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
                className="h-12 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-500/20"
              >
                <FileDown size={14} /> EXPORT PDF
              </button>
            </div>

            {/* Row 2: Navigation Tabs (Restored to Original Professional Grid) */}
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
                    "flex flex-col items-center justify-center gap-1 h-14 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all border-2",
                    activeSubTab === tab.id
                      ? "bg-blue-600/10 text-blue-600 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                      : "bg-white text-slate-500 border-slate-300 shadow-sm"
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
      <main className="pt-80 px-6 space-y-6 no-scrollbar max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {activeSubTab === 'inventory' && (
            <motion.div
              key="inv"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Search & Filter Row */}
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <input 
                    placeholder="Cari aset..."
                    value={searchQuery}
                    onChange={e => setSearchHistory(e.target.value)}
                    className="w-full h-11 pl-10 pr-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                </div>

                <div className="relative min-w-[120px]">
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full h-11 pl-3 pr-8 rounded-xl bg-white border border-slate-100 shadow-sm text-[9px] font-black uppercase tracking-tight outline-none appearance-none cursor-pointer"
                  >
                    <option value="Semua">SEMUA</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
              </div>

              {/* Asset Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20">
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-full uppercase tracking-tighter">{asset.category}</span>
                          <h3 className="text-sm font-black text-slate-800 uppercase line-clamp-1">{asset.name}</h3>
                          <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tight"><MapPin size={10}/> {asset.location}</p>
                        </div>
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-[8px] font-black uppercase",
                          asset.condition === 'Bagus' ? "bg-emerald-50 text-emerald-600" :
                          asset.condition === 'Rusak' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {asset.condition}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                         <div className="flex flex-col">
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Qty</span>
                           <span className="text-xs font-black text-slate-700">{asset.quantity} Item</span>
                         </div>
                         <div className="flex flex-col items-end">
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Price</span>
                           <span className="text-xs font-black text-blue-600 text-right">{formatIDR(asset.price)}</span>
                         </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setNewAsset(asset);
                            setIsAddingAsset(true);
                          }}
                          className="flex-1 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100/50"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssetForMaintenance(asset);
                            setIsMaintenanceModalOpen(true);
                          }}
                          className="flex-1 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase hover:bg-amber-50 hover:text-amber-600 transition-all border border-slate-100/50"
                        >
                          <Activity size={12} /> Servis
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="w-9 h-9 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all border border-rose-100/50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSubTab === 'analytics' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-4"
            >
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                 <div className="bg-slate-900 text-white p-5 rounded-[2rem] space-y-2 shadow-xl relative overflow-hidden">
                   <DollarSign className="absolute -right-2 -bottom-2 w-16 h-16 text-white/5 rotate-12" />
                   <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/50 leading-none">Total Investasi</p>
                   <h2 className="text-sm font-black truncate">{formatIDR(stats.totalValue)}</h2>
                   <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-3/4" />
                   </div>
                 </div>

                 <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-2 shadow-sm">
                   <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">Aset Bermasalah</p>
                   <div className="flex items-center justify-between">
                     <h2 className="text-xl font-black text-rose-600 leading-none">{stats.brokenCount}</h2>
                     <div className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[6px] font-black uppercase">Service Required</div>
                   </div>
                 </div>

                 <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-2 shadow-sm">
                   <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">Total Biaya Servis</p>
                   <h2 className="text-sm font-black text-amber-600 truncate leading-none">{formatIDR(stats.maintenanceCost)}</h2>
                 </div>

                 <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-2 shadow-sm">
                   <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none">Aset Sehat</p>
                   <div className="flex items-center justify-between">
                     <h2 className="text-xl font-black text-emerald-600 leading-none">
                       {Math.round(((assets.length - stats.brokenCount) / (assets.length || 1)) * 100)}%
                     </h2>
                     <div className="flex gap-0.5">
                       {[1,2,3].map(i => <div key={i} className={cn("h-1 w-2 rounded-full", i <= 2 ? "bg-emerald-500" : "bg-slate-100")} />)}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Category Distribution */}
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                   <Activity size={14} className="text-blue-500" />
                   Distribusi Kategori
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                   {Object.entries(stats.categoryDistribution).map(([cat, count]: any) => (
                     <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-end text-[8px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">{cat}</span>
                          <span className="text-blue-600">{count} Item</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / assets.length) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
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
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                   <div className="space-y-0.5">
                     <h3 className="font-black text-xs text-slate-800 uppercase tracking-tight">Log Pemeliharaan Aset</h3>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Riwayat Perbaikan berkala</p>
                   </div>
                 </div>
                 <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto no-scrollbar">
                    {maintenanceLogs.map(log => {
                      const asset = assets.find(a => a.id === log.asset_id);
                      return (
                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                               <RefreshCw size={16} />
                             </div>
                             <div className="space-y-0.5">
                               <h4 className="font-black text-[11px] text-slate-800 uppercase leading-none">{asset?.name || 'Aset Terhapus'}</h4>
                               <p className="text-[10px] text-slate-500 font-medium">{log.description}</p>
                               <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                             </div>
                           </div>
                           <div className="text-right pl-4">
                             <span className="text-xs font-black text-amber-600 whitespace-nowrap">{formatIDR(log.cost)}</span>
                           </div>
                        </div>
                      );
                    })}
                    {maintenanceLogs.length === 0 && (
                      <div className="p-20 text-center text-slate-400 italic text-xs">Belum ada riwayat pemeliharaan.</div>
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
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-800">
                    TAMBAH ASSET
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Inventaris Kedai</p>
                </div>
                <button
                  onClick={() => { setIsAddingAsset(false); setEditingAsset(null); }}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:text-rose-500 transition-all"
                >
                  <X size={16}/>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-3">
                {/* BARIS 1: NAMA & KATEGORI */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Barang</label>
                  <input
                    placeholder="Contoh: Blender"
                    value={newAsset.name}
                    onChange={e => setNewAsset({...newAsset, name: e.target.value.toUpperCase()})}
                    className="w-full h-11 px-4 rounded-2xl bg-slate-50 border-none text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select
                    value={newAsset.category}
                    onChange={e => setNewAsset({...newAsset, category: e.target.value})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-[10px] font-bold text-slate-900"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* BARIS 2: JUMLAH & HARGA */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah</label>
                  <input
                    placeholder="0"
                    type="number"
                    value={newAsset.quantity}
                    onChange={e => setNewAsset({...newAsset, quantity: Number(e.target.value)})}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-xs font-black text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Satuan</label>
                  <div className="relative">
                    <input
                      placeholder="0"
                      value={formatNumber(String(newAsset.price))}
                      onChange={e => setNewAsset({...newAsset, price: Number(parseNumber(e.target.value))})}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-xs font-black text-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">RP</span>
                  </div>
                </div>
             </div>

             <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setIsAddingAsset(false); setEditingAsset(null); }}
                  className="flex-1 h-12 rounded-2xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAsset}
                  className="flex-[2] h-12 bg-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
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
           <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                   <Activity size={32} />
                 </div>
                 <div className="space-y-0.5">
                   <h3 className="font-black text-base uppercase tracking-tight text-slate-800">Catat Perbaikan</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px] mx-auto">{selectedAssetForMaintenance?.name}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan</label>
                   <input
                     placeholder="Ganti pisau blender..."
                     value={newMaintenance.description}
                     onChange={e => setNewMaintenance({...newMaintenance, description: e.target.value})}
                     className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/10 transition-all"
                   />
                 </div>

                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Biaya Servis</label>
                    <div className="relative">
                      <input
                        placeholder="0"
                        value={newMaintenance.cost}
                        onChange={e => setNewMaintenance({...newMaintenance, cost: formatNumber(e.target.value)})}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-sm font-black text-amber-600 focus:ring-2 focus:ring-amber-500/10 transition-all"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">RP</span>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setIsMaintenanceModalOpen(false)} className="flex-1 h-12 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Batal</button>
                 <button onClick={handleAddMaintenance} className="flex-[2] h-12 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Simpan Log</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
