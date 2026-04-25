import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Ingredient, Recipe, Employee, ShiftType, Attendance } from "../types";
import { formatCurrency } from "../lib/utils";
import { SHIFT_CONFIGS } from "../schedulerConstants";

const FONT_FAMILY = 'helvetica';
const LOGO_URL = "https://mrrfmrzhumcmhmqjceul.supabase.co/storage/v1/object/sign/public-images/IMG-20260425-WA0010.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNGYxMmNiMy01YWU4LTRjYjQtYTgwZS00ZWEwMTlhOWE3YTciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwdWJsaWMtaW1hZ2VzL0lNRy0yMDI2MDQyNS1XQTAwMTAucG5nIiwiaWF0IjoxNzc3MTUwMDg1LCJleHAiOjE3Nzc3NTQ4ODV9.-7eC44SPNDU5Gw4gI8tOXxjgYU7gM-32VaSiPU_fjYA";

/**
 * Helper to convert URL to Base64 to bypass CORS issues in jsPDF
 */
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

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

    addHeader(doc, "Kalkulasi HPP Resep", recipe.name);

    doc.setFontSize(7).setTextColor(100, 116, 139); // Slate-500
    doc.text(`KATEGORI: ${String(recipe.category || 'MAKANAN').toUpperCase()}`, pw / 2, 28, { align: 'center' });

    const margin = 14;
    let currentY = 40;

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

/**
 * 4. SLIP GAJI - KEDAI ELVERA 57 (PRECISION ALIGNMENT v1.4.9)
 * Optimized coordinates for pixel-perfect document export.
 */
export const handleExportSlipPDF = async (employee: Employee | null, slipData: any) => {
  if (!employee) return;
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const marginX = 25; // Standard alignment for all content
    const d = slipData || { baseSalary: 0, allowance: 0, overtime: 0, thr: 0, alphaDeduction: 0, hrdNotes: "" };

    // ─── 1. FETCH LOGO AS BASE64 ───
    let logoBase64 = "";
    try {
        logoBase64 = await getBase64ImageFromURL(LOGO_URL);
    } catch (err) {
        console.warn("Logo loading failed, continuing without logo", err);
    }

    // ─── 2. BOXED HEADER (PRECISION ALIGNMENT) ───
    let currentY = 20;
    const headerH = 22;

    // Draw Header Box
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginX, currentY, pw - (marginX * 2), headerH, 2, 2, 'S');

    // Logo inside box
    if (logoBase64) {
        doc.addImage(logoBase64, "PNG", marginX + 5, currentY + 3, 16, 16);
    }

    // Divider Line inside Box
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX + 25, currentY + 4, marginX + 25, currentY + headerH - 4);

    // Brand Center with Color Logic
    doc.setFontSize(14);
    doc.setFont(FONT_FAMILY, 'bold');
    const txt1 = "KEDAI ";
    const txt2 = "ELVERA";
    const txt3 = " 57";
    const w1 = doc.getTextWidth(txt1);
    const w2 = doc.getTextWidth(txt2);
    const w3 = doc.getTextWidth(txt3);
    const totalW = w1 + w2 + w3;
    const startBrandX = marginX + 25 + ((pw - marginX * 2 - 25 - totalW) / 2);

    doc.setTextColor(0, 0, 0); doc.text(txt1, startBrandX, currentY + 12);
    doc.setTextColor(37, 99, 235); doc.text(txt2, startBrandX + w1, currentY + 12);
    doc.setTextColor(0, 0, 0); doc.text(txt3, startBrandX + w1 + w2, currentY + 12);

    doc.setFontSize(7).setTextColor(148, 163, 184).text("DOKUMEN RESMI PENGGAJIAN", marginX + 25 + ((pw - marginX * 2 - 25) / 2), currentY + 18, { align: 'center' });

    // ─── 3. TITLE ───
    currentY += headerH + 15;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16).setFont(FONT_FAMILY, 'bold').text("SLIP GAJI", pw / 2, currentY, { align: 'center' });

    // ─── 4. METADATA (ALIGNED AT X=25) ───
    currentY += 18;
    doc.setFontSize(9).setFont(FONT_FAMILY, 'normal');
    const metaRows = [
        ["Tanggal", ":", new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
        ["Nama", ":", employee.name.toUpperCase()],
        ["Jabatan", ":", employee.role.toUpperCase()]
    ];

    metaRows.forEach(row => {
        doc.setTextColor(100, 116, 139);
        doc.text(row[0], marginX, currentY);
        doc.text(row[1], marginX + 25, currentY);
        doc.setTextColor(30, 41, 59);
        doc.setFont(FONT_FAMILY, 'bold').text(row[2], marginX + 30, currentY);
        doc.setFont(FONT_FAMILY, 'normal');
        currentY += 7;
    });

    // ─── 5. FINANCIAL DATA (ALIGNED AT X=25) ───
    currentY += 12;
    const finX = marginX;
    const lines = [
        ["Gaji Pokok Dasar", d.baseSalary],
        ["Tunjangan Jabatan", d.allowance],
        ["Lembur / Bonus", d.overtime],
        ["THR Khusus", d.thr],
        ["Potongan Absen / Alpha (-)", d.alphaDeduction]
    ];

    lines.forEach((line, i) => {
        doc.setFont(FONT_FAMILY, 'bold').setFontSize(8).setTextColor(30, 41, 59);
        doc.text(String(line[0]).toUpperCase(), finX, currentY);
        doc.setFont(FONT_FAMILY, 'normal').setFontSize(9).text(":", finX + 65, currentY);
        doc.text("Rp", finX + 70, currentY);
        doc.text(Number(line[1]).toLocaleString('id-ID'), pw - marginX - 10, currentY, { align: 'right' });
        doc.setDrawColor(203, 213, 225); doc.setLineDashPattern([0.5, 0.5], 0);
        doc.line(finX + 80, currentY + 1, pw - marginX - 15, currentY + 1);
        doc.setLineDashPattern([], 0);
        if (i === 4) {
            doc.setTextColor(0); doc.setFontSize(12).text("+", pw - marginX - 5, currentY);
            doc.setDrawColor(0); doc.setLineWidth(0.4).line(finX + 70, currentY + 3, pw - marginX - 10, currentY + 3);
        }
        currentY += 10;
    });

    // ─── 6. GAJI BERSIH (TOTAL WITH GREEN HIGHLIGHT) ───
    currentY += 12;
    const total = d.baseSalary + d.allowance + d.overtime + d.thr - d.alphaDeduction;

    // Draw Emerald Background Box
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.roundedRect(marginX - 5, currentY - 7, pw - (marginX * 2) + 10, 14, 2, 2, 'F');

    doc.setTextColor(6, 78, 59); // Emerald-900
    doc.setFontSize(10).setFont(FONT_FAMILY, 'bold').text("GAJI BERSIH", finX, currentY);
    doc.text(":", finX + 65, currentY);
    doc.text("Rp", finX + 70, currentY);
    doc.setFontSize(14).text(total.toLocaleString('id-ID'), pw - marginX - 10, currentY, { align: 'right' });
    doc.setTextColor(30, 41, 59); // Reset to Slate

    // ─── 7. HORIZONTAL SIGNATURE & COMPACT NOTES (BALANCED) ───
    currentY += 35;
    const sigY = currentY;

    // Receiver (Left)
    doc.setFontSize(8).setFont(FONT_FAMILY, 'bold').text("PENERIMA,", marginX + 5, sigY);
    doc.line(marginX, sigY + 20, marginX + 45, sigY + 20);
    doc.text(employee.name.toUpperCase(), marginX + 5, sigY + 25);

    // HRD Notes (Right - Balanced with Signature)
    const boxW = 75;
    const boxX = pw - marginX - boxW;
    doc.setDrawColor(15, 23, 42); doc.setLineDashPattern([1, 1], 0);
    doc.rect(boxX, sigY - 5, boxW, 30);
    doc.setFont(FONT_FAMILY, 'bold').setFontSize(7).text("CATATAN HRD:", boxX + 5, sigY);
    doc.setFont(FONT_FAMILY, 'normal').setFontSize(8).setTextColor(71, 85, 105);
    doc.text(d.hrdNotes || "................................................", boxX + 5, sigY + 8, { maxWidth: boxW - 10 });
    doc.setLineDashPattern([], 0);

    // (HRD MANAGER SIGNATURE REMOVED PER REQUEST)

    saveFile(doc, `Slip_Gaji_${employee.name.replace(/\s+/g, '_')}`);
  } catch (e) { console.error("PDF Export Error:", e); }
  finally { hideLoadingOverlay(overlay); }
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
