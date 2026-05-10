import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rp 0';
  const num = typeof amount === 'string' ? parseNumber(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatIDR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rp 0';
  const num = typeof amount === 'string' ? parseNumber(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('Rp', 'Rp\u00A0');
}

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(/,/g, '.')) : val;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function parseNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const clean = val.replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(clean) || 0;
}

// --- PRINTER CONFIGURATION ---

export interface PrinterConfig {
  enabled: boolean;
  autoPrint: boolean;
  deviceAddress?: string;
}

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  address: string;
}

export interface ReceiptData {
  orderNumber: number;
  customerName: string;
  customerWA: string;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashReceived: number;
  change: number;
  timestamp: Date;
}

/**
 * Get paired Bluetooth devices using Web Bluetooth API.
 * Falls back to navigator.bluetooth if available; otherwise returns empty array.
 */
export async function getPairedDevices(): Promise<BluetoothDeviceInfo[]> {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    console.warn('Web Bluetooth API is not available in this browser.');
    return [];
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    if (device) {
      return [{
        id: device.id,
        name: device.name || 'Unknown Device',
        address: device.id
      }];
    }
    return [];
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      // User cancelled the device picker
      return [];
    }
    console.error('Bluetooth scan failed:', error);
    return [];
  }
}

/**
 * Format receipt data into ESC/POS commands for thermal printers (58mm)
 */
function buildEscPosReceipt(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];

  const addText = (text: string) => {
    const encoded = encoder.encode(text);
    commands.push(...encoded);
  };

  const addLine = () => {
    addText('\n');
  };

  // ESC @ - Initialize printer
  commands.push(0x1B, 0x40);

  // Center alignment
  commands.push(0x1B, 0x61, 0x01);

  // Double height + width for store name
  commands.push(0x1B, 0x21, 0x30);
  addText('POSGO\n');

  // Normal text
  commands.push(0x1B, 0x21, 0x00);
  addText('Struk Pembayaran\n');
  addLine();

  // Separator
  addText('================================\n');

  // Left alignment
  commands.push(0x1B, 0x61, 0x00);

  // Order info
  addText(`No. Pesanan : ${String(data.orderNumber).padStart(4, '0')}\n`);
  addText(`Tanggal     : ${data.timestamp.toLocaleDateString('id-ID')} ${data.timestamp.toLocaleTimeString('id-ID')}\n`);
  if (data.customerName) {
    addText(`Pelanggan   : ${data.customerName}\n`);
  }
  addLine();

  // Separator
  addText('--------------------------------\n');

  // Items
  addText('Item                    Qty  Harga\n');
  addText('--------------------------------\n');

  for (const item of data.items) {
    const name = item.name.length > 20 ? item.name.substring(0, 20) : item.name;
    const qty = `x${item.quantity}`.padStart(3);
    const price = formatIDR(item.price * item.quantity);
    addText(`${name}${qty}  ${price}\n`);
  }

  addText('--------------------------------\n');

  // Totals
  addText(`Subtotal    : ${formatIDR(data.subtotal)}\n`);
  if (data.discount > 0) {
    addText(`Diskon      : -${formatIDR(data.discount)}\n`);
  }
  addText(`Total       : ${formatIDR(data.total)}\n`);
  addText(`Bayar       : ${formatIDR(data.cashReceived)}\n`);
  if (data.change > 0) {
    addText(`Kembalian   : ${formatIDR(data.change)}\n`);
  }
  addLine();

  // Center alignment
  commands.push(0x1B, 0x61, 0x01);
  addText(`Metode: ${data.paymentMethod.toUpperCase()}\n`);
  addLine();
  addText('Terima kasih!\n');
  addText('================================\n');
  addLine();
  addLine();

  // Cut paper (partial cut)
  commands.push(0x1D, 0x56, 0x01);

  return new Uint8Array(commands);
}

/**
 * Print a receipt via Bluetooth thermal printer.
 * type: 'customer' | 'merchant' (currently both produce the same receipt)
 */
export async function printReceipt(
  type: 'customer' | 'merchant',
  data: ReceiptData
): Promise<boolean> {
  const savedAddress = localStorage.getItem('printerDeviceAddress');
  if (!savedAddress) {
    console.warn('No printer device address configured.');
    return false;
  }

  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    console.warn('Web Bluetooth API is not available.');
    return false;
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    if (!device) {
      console.error('No Bluetooth device selected.');
      return false;
    }

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002af0-0000-1000-8000-00805f9b34fb');

    const receiptData = buildEscPosReceipt(data);

    // Split into chunks (BLE has ~512 byte MTU, use 100-byte chunks for safety)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < receiptData.length; i += CHUNK_SIZE) {
      const chunk = receiptData.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Disconnect after printing
    device.gatt.disconnect();

    return true;
  } catch (error) {
    console.error('Failed to print receipt:', error);
    return false;
  }
}
