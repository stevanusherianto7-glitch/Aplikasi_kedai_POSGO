import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Ingredient, Recipe, Employee, ShiftType, Attendance } from "../types";
import { formatCurrency } from "../lib/utils";
import { SHIFT_CONFIGS } from "../schedulerConstants";

const FONT_FAMILY = 'helvetica';

// ─── UI LOADING FEEDBACK ───────────────────────────────────────────────────
const showLoadingOverlay = () => {
  const overlayId = 'pdf-loading-overlay';
  let overlay = document.getElementById(overlayId);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = overlayId;
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      backgroundColor: 'rgba(12, 14, 20, 0.9)', color: 'white', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: '10000', backdropFilter: 'blur(10px)'
    });
    overlay.innerHTML = `
      <div style="width: 60px; height: 60px; border: 4px solid #1e293b; border-top: 4px solid #6366f1; border-radius: 50%; animation: spin-pdf 1s linear infinite;"></div>
      <style>@keyframes spin-pdf { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      <h2 style="font-size: 14px; font-weight: 900; margin-top: 24px; letter-spacing: 0.3em; color: white; font-family: sans-serif;">GENERATING DOCUMENT</h2>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
};

const hideLoadingOverlay = (overlay: HTMLElement | null) => {
  if (overlay && document.body.contains(overlay)) document.body.removeChild(overlay);
};

// ─── NATIVE SAVE SYSTEM ────────────────────────────────────────────────────
const saveFile = async (doc: jsPDF, filename: string) => {
  const now = new Date();
  const fileID = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  const finalFilename = `Posgo_${filename}_${fileID}.pdf`;
  const isNative = (window as any).Capacitor?.isNativePlatform();

  if (isNative) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: finalFilename,
        data: doc.output('datauristring').split(',')[1],
        directory: Directory.Documents,
        recursive: true
      });
      alert(`✅ BERHASIL\nFile: ${finalFilename}\nFolder: Documents`);
    } catch (e: any) {
      doc.save(finalFilename);
      alert(`⚠️ SIMPAN NATIVE GAGAL\nFile: ${finalFilename}\nCek folder Downloads.`);
    }
  } else {
    doc.save(finalFilename);
  }
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pw = doc.internal.pageSize.getWidth();
  doc.setTextColor(30, 41, 59).setFont(FONT_FAMILY, 'bold').setFontSize(16).text(title.toUpperCase(), pw / 2, 15, { align: 'center' });
  if (subtitle) doc.setFontSize(8).setFont(FONT_FAMILY, 'normal').setTextColor(100, 116, 139).text(subtitle.toUpperCase(), pw / 2, 22, { align: 'center' });
};

const addFooter = (doc: jsPDF, data: any) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(7).setTextColor(150);
  doc.text(`Posgo System | Halaman ${data.pageNumber}`, pw - 20, ph - 10, { align: 'right' });
};

// ─── UNIFIED COLOR LOGIC (SYNCED) ───
const SHIFT_COLORS: Record<string, [number, number, number]> = {
  'P': [37, 99, 235],   // Blue
  'M': [16, 185, 129],  // Emerald
  'O': [220, 38, 38]    // Rose
};

// Helper to get string code from ShiftType reliably
const getCode = (type: any): string => {
    const t = String(type).toUpperCase();
    if (t === 'PAGI') return 'P';
    if (t === 'MIDDLE') return 'M';
    return 'O';
};

// 1. JADWAL SHIFT (MONTHLY)
export const handleExportShiftPDF = (employees: Employee[], shifts: Record<string, Record<string, ShiftType>>, dates: string[], currentDate: Date) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const period = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    addHeader(doc, "Laporan Jadwal Shift Bulanan", period);

    const head = ['Karyawan', ...dates.map(dateStr => {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('id-ID', { weekday: 'short' }).toUpperCase()}\n${d.getDate()}`;
    })];

    const body = employees.map(emp => {
      const row: any[] = [''];
      dates.forEach(d => {
        const type = shifts[emp.id]?.[d] || ShiftType.LIBUR;
        row.push(getCode(type));
      });
      return row;
    });

    autoTable(doc, {
      startY: 30,
      head: [head],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [226, 232, 240], textColor: [30, 41, 59], fontSize: 5, halign: 'center', valign: 'middle', fontStyle: 'bold' },
      bodyStyles: { halign: 'center', valign: 'middle', fontSize: 5, minCellHeight: 8, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 35 } },
      didParseCell: (data) => {
        if (data.column.index === 0) data.cell.text = [];
        if (data.section === 'body' && data.column.index >= 1) {
          const val = String(data.cell.raw).trim().toUpperCase();
          if (SHIFT_COLORS[val]) {
            data.cell.styles.fillColor = SHIFT_COLORS[val];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const { x, y } = data.cell;
          const emp = employees[data.row.index];
          if (emp) {
            doc.setFont(FONT_FAMILY, 'bold').setFontSize(6).setTextColor(30, 41, 59).text(emp.name.toUpperCase(), x + 2, y + 3.5);
            doc.setFont(FONT_FAMILY, 'normal').setFontSize(4.5).setTextColor(148, 163, 184).text(emp.role.toUpperCase(), x + 2, y + 6.5);
          }
        }
      },
      didDrawPage: (data) => addFooter(doc, data)
    });
    saveFile(doc, 'Jadwal_Shift_Bulanan');
  } finally { hideLoadingOverlay(overlay); }
};

// 2. WEEKLY PATTERN (CLONED LOGIC FROM MONTHLY)
export const handleExportPatternPDF = (employees: Employee[], weeklyPattern: Record<string, ShiftType[]>, effectiveDate?: string) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    addHeader(doc, "Pola Jadwal Mingguan", effectiveDate || "Standard Cycle");

    const head = ['Karyawan', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

    // Explicitly clones the data formatting from the working Monthly version
    const body = employees.map(emp => {
      const p = weeklyPattern[emp.id] || Array(7).fill(ShiftType.LIBUR);
      const row: any[] = [''];
      p.forEach(type => {
        row.push(getCode(type));
      });
      return row;
    });

    autoTable(doc, {
      startY: 30,
      head: [head],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [226, 232, 240], textColor: [30, 41, 59], fontSize: 8, halign: 'center', valign: 'middle', fontStyle: 'bold' },
      bodyStyles: { halign: 'center', valign: 'middle', fontSize: 8, minCellHeight: 12, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 50 } },
      didParseCell: (data) => {
        if (data.column.index === 0) data.cell.text = [];
        if (data.section === 'body' && data.column.index >= 1) {
          // Identical color detection as Monthly
          const val = String(data.cell.raw).trim().toUpperCase();
          if (SHIFT_COLORS[val]) {
            data.cell.styles.fillColor = SHIFT_COLORS[val];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const { x, y } = data.cell;
          const emp = employees[data.row.index];
          if (emp) {
            doc.setFont(FONT_FAMILY, 'bold').setFontSize(8).setTextColor(30, 41, 59).text(emp.name.toUpperCase(), x + 2, y + 5);
            doc.setFont(FONT_FAMILY, 'normal').setFontSize(6).setTextColor(148, 163, 184).text(emp.role.toUpperCase(), x + 2, y + 9);
          }
        }
      },
      didDrawPage: (data) => addFooter(doc, data)
    });
    saveFile(doc, 'Pola_Mingguan');
  } finally { hideLoadingOverlay(overlay); }
};

// ─── OTHER EXPORTS ───
export const handleExportInventoryPDF = (ingredients: Ingredient[]) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF();
    addHeader(doc, "Database Bahan Baku");
    autoTable(doc, { startY: 40, head: [['Nama', 'Kat', 'Unit', 'Harga', 'Stok']], body: ingredients.map(i => [i.name, i.category, i.useUnit, formatCurrency(i.purchasePrice), i.stockQuantity]), theme: 'grid' });
    saveFile(doc, 'Inventory');
  } finally { hideLoadingOverlay(overlay); }
};

export const handleExportRecipePDF = (recipe: Recipe, ingredients: Ingredient[]) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();

    // 1. Clean Branding Header (No Block)
    addHeader(doc, "Kalkulasi HPP Resep", recipe.name);

    doc.setFontSize(7).setTextColor(100, 116, 139); // Slate-500
    doc.text(`KATEGORI: ${String(recipe.category || 'MAKANAN').toUpperCase()}`, pw / 2, 28, { align: 'center' });

    const margin = 14;
    let currentY = 40;

    // 2. Ingredients Table
    autoTable(doc, {
      startY: currentY,
      head: [['NO', 'KOMPONEN BAHAN', 'TAKARAN', 'HARGA/UNIT', 'SUBTOTAL']],
      body: (recipe.items || []).map((item, i) => {
        const ing = ingredients.find(ing => ing.id === item.ingredientId);
        const pricePerUnit = (ing?.purchasePrice || 0) / (ing?.conversionValue || 1);
        const subtotal = (item.quantityNeeded || 0) * pricePerUnit;
        return [
          i + 1,
          ing?.name.toUpperCase() || '?',
          `${item.quantityNeeded} ${ing?.useUnit || '-'}`,
          formatCurrency(pricePerUnit),
          formatCurrency(subtotal)
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
      styles: { fontSize: 7, font: FONT_FAMILY },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'right', cellWidth: 35 }, 4: { halign: 'right', cellWidth: 35 } },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Cost Breakdown & Analysis
    const ingMap = new Map(ingredients.map(i => [i.id, i]));
    const rawCost = (recipe.items || []).reduce((acc, item) => {
      const ing = ingMap.get(item.ingredientId);
      if (!ing || !ing.conversionValue) return acc;
      return acc + (item.quantityNeeded * (ing.purchasePrice / ing.conversionValue));
    }, 0);

    const wasteAmt = rawCost * ((recipe.shrinkagePercent || 0) / 100);
    const laborMonthly = recipe.overheadBreakdown?.labor || 0;
    const laborDaily = laborMonthly / 26;
    const laborPerPortion = recipe.laborCost || 0;
    const overheadPerPortion = recipe.overheadCost || 0;
    const totalCost = rawCost + wasteAmt + laborPerPortion + overheadPerPortion;

    autoTable(doc, {
      startY: currentY,
      body: [
        ['BIAYA BAHAN BAKU (RAW)', formatCurrency(rawCost)],
        [`WASTE / SHRINKAGE (${recipe.shrinkagePercent || 0}%)`, formatCurrency(wasteAmt)],
        [`TOTAL GAJI KARYAWAN / HARI`, formatCurrency(laborDaily)],
        [`ALOKASI GAJI / PORSI`, formatCurrency(laborPerPortion)],
        ['BIAYA OVERHEAD / PORSI', formatCurrency(overheadPerPortion)],
        ['TOTAL HARGA POKOK (HPP)', formatCurrency(totalCost)],
        ['HARGA JUAL FINAL', formatCurrency(recipe.roundedSellingPrice || recipe.sellingPrice || 0)],
        ['LABA BERSIH / PORSI', formatCurrency((recipe.roundedSellingPrice || recipe.sellingPrice || 0) - totalCost)]
      ],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 3, font: FONT_FAMILY },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.row.index === 5) { data.cell.styles.fillColor = [254, 242, 242]; data.cell.styles.textColor = [153, 27, 27]; }
        if (data.row.index === 6) { data.cell.styles.fillColor = [236, 253, 245]; data.cell.styles.textColor = [6, 78, 59]; }
      }
    });

    saveFile(doc, `HPP_${recipe.name.replace(/\s+/g, '_')}`);
  } finally { hideLoadingOverlay(overlay); }
};

export const handleExportSlipPDF = (employee: Employee | null, attendances: Attendance[]) => {
  if (!employee) return;
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF();
    addHeader(doc, "Slip Gaji", employee.name);
    autoTable(doc, { startY: 45, body: [['NAMA', employee.name.toUpperCase()], ['GAJI', formatCurrency(employee.salary)]], theme: 'plain' });
    saveFile(doc, `Slip_${employee.name}`);
  } finally { hideLoadingOverlay(overlay); }
};

export const handleExportJobdeskPDF = (selectedTasks: string[], reportTitle: string) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF();
    addHeader(doc, "SOP", reportTitle);
    autoTable(doc, { startY: 40, body: selectedTasks.map(t => [t]), theme: 'grid' });
    saveFile(doc, 'Jobdesk');
  } finally { hideLoadingOverlay(overlay); }
};

export const handleExportAssetsPDF = (items: any[]) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    addHeader(doc, "Daftar Aset");
    autoTable(doc, { startY: 40, head: [['Item', 'Kondisi', 'Qty']], body: items.map(i => [i.name, i.condition, i.quantity]), theme: 'grid' });
    saveFile(doc, 'Aset');
  } finally { hideLoadingOverlay(overlay); }
};
