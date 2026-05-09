import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
import { Transaction } from '../types';
import { formatIDR } from '../lib/utils';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const INITIALIZE = ESC + '@';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_RIGHT = ESC + 'a' + '\x02';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_HEIGHT = GS + '!' + '\x01';
const DOUBLE_WIDTH = GS + '!' + '\x10';
const DOUBLE_SIZE = GS + '!' + '\x11';
const NORMAL_SIZE = GS + '!' + '\x00';
const LINE_FEED = '\n';

export class BluetoothPrintService {
  private static async isConnected(): Promise<boolean> {
    try {
      const connected = await BluetoothSerial.isConnected();
      return !!connected;
    } catch {
      return false;
    }
  }

  private static async connect(address: string): Promise<boolean> {
    return new Promise((resolve) => {
      BluetoothSerial.connect(address).subscribe({
        next: () => resolve(true),
        error: (err) => {
          console.error('[PRINT] Connection Error:', err);
          resolve(false);
        }
      });
    });
  }

  private static generateReceiptHeader(): string {
    return INITIALIZE +
      ALIGN_CENTER + BOLD_ON + DOUBLE_HEIGHT + 'KEDAI ELVERA 57' + LINE_FEED +
      NORMAL_SIZE + BOLD_OFF + 'Telp: 0895-3763-48626' + LINE_FEED +
      LINE_FEED +
      '--------------------------------' + LINE_FEED;
  }

  private static generateReceiptFooter(): string {
    return ALIGN_CENTER + BOLD_OFF +
      LINE_FEED + 'Terima Kasih Atas' + LINE_FEED +
      'Kunjungan Anda' + LINE_FEED + LINE_FEED +
      LINE_FEED + LINE_FEED + LINE_FEED;
  }

  public static async printReceipt(transaction: Transaction, printerAddress?: string, type: 'customer' | 'kitchen' | 'closing' = 'customer') {
    try {
      // 1. Check Connection
      let connected = await this.isConnected();

      if (!connected && printerAddress) {
        connected = await this.connect(printerAddress);
      }

      if (!connected) {
        console.warn('[PRINT] Not connected to any printer');
        return false;
      }

      // 2. Build receipt based on type
      let commands = '';
      switch (type) {
        case 'kitchen':
          commands = this.buildKitchenReceipt(transaction);
          break;
        case 'closing':
          commands = this.buildClosingReceipt(transaction);
          break;
        default:
          commands = this.buildCustomerReceipt(transaction);
      }

      // 3. Send to Printer
      await BluetoothSerial.write(commands);
      console.log(`[PRINT] ${type} receipt sent successfully`);
      return true;

    } catch (error) {
      console.error('[PRINT] Critical Print Error:', error);
      return false;
    }
  }

  // ─── CUSTOMER RECEIPT ───────────────────────────────────────
  private static buildCustomerReceipt(transaction: Transaction): string {
    let commands = this.generateReceiptHeader();

    // Info Transaksi
    commands += ALIGN_LEFT;
    commands += `No : ${transaction.id.slice(0, 8)}` + LINE_FEED;
    commands += `Tgl: ${new Date(transaction.date).toLocaleString('id-ID')}` + LINE_FEED;
    commands += '--------------------------------' + LINE_FEED;

    // Items
    transaction.items.forEach(item => {
      commands += BOLD_ON + item.name + BOLD_OFF + LINE_FEED;

      const originalSubtotal = item.quantity * item.price;
      const subtotalToDisplay = item.discountedSubtotal ?? originalSubtotal;

      const qtyText = `  ${item.quantity} x ${formatIDR(item.price)}`;
      const totalText = formatIDR(subtotalToDisplay);

      const paddingCount = 32 - qtyText.length - totalText.length;
      const padding = paddingCount > 0 ? ' '.repeat(paddingCount) : ' ';
      commands += qtyText + padding + totalText + LINE_FEED;

      if (subtotalToDisplay < originalSubtotal) {
        const discountLabel = `    Diskon (${item.discountPercent || 0}%):`;
        const discountValue = `-${formatIDR(originalSubtotal - subtotalToDisplay)}`;
        const discPadding = 32 - discountLabel.length - discountValue.length;
        commands += discountLabel + ' '.repeat(discPadding > 0 ? discPadding : 1) + discountValue + LINE_FEED;
      }
    });

    commands += '--------------------------------' + LINE_FEED;

    // Total
    commands += BOLD_ON;
    const totalLabel = 'TOTAL:';
    const totalVal = formatIDR(transaction.totalPrice);
    const totalPadding = 32 - totalLabel.length - totalVal.length;
    commands += totalLabel + ' '.repeat(totalPadding > 0 ? totalPadding : 1) + totalVal + LINE_FEED;
    commands += BOLD_OFF + LINE_FEED;

    // Payment method
    if ((transaction as any).paymentMethod) {
      commands += ALIGN_LEFT;
      const pmLabel = 'Bayar:';
      const pmVal = (transaction as any).paymentMethod.toUpperCase();
      const pmPadding = 32 - pmLabel.length - pmVal.length;
      commands += pmLabel + ' '.repeat(pmPadding > 0 ? pmPadding : 1) + pmVal + LINE_FEED;
      commands += LINE_FEED;
    }

    commands += this.generateReceiptFooter();
    return commands;
  }

  // ─── KITCHEN RECEIPT ────────────────────────────────────────
  private static buildKitchenReceipt(transaction: Transaction): string {
    let commands = INITIALIZE;

    // Header
    commands += ALIGN_CENTER + BOLD_ON + DOUBLE_HEIGHT + '** ORDER DAPUR **' + LINE_FEED;
    commands += NORMAL_SIZE + BOLD_OFF + LINE_FEED;

    // Transaction info
    commands += ALIGN_LEFT;
    commands += `No : ${transaction.id.slice(0, 8)}` + LINE_FEED;
    commands += `Tgl: ${new Date(transaction.date).toLocaleString('id-ID')}` + LINE_FEED;
    commands += '================================' + LINE_FEED;

    // Items — only name and quantity, no prices
    transaction.items.forEach(item => {
      commands += BOLD_ON + DOUBLE_HEIGHT + `${item.quantity}x  ${item.name}` + LINE_FEED;
      commands += NORMAL_SIZE + BOLD_OFF;
    });

    commands += '================================' + LINE_FEED;
    commands += ALIGN_CENTER;
    commands += BOLD_ON + `Total Item: ${transaction.items.reduce((s, i) => s + i.quantity, 0)}` + LINE_FEED;
    commands += BOLD_OFF + LINE_FEED;

    // Notes area
    commands += ALIGN_LEFT;
    commands += 'Catatan: ___________________' + LINE_FEED;
    commands += '        ___________________' + LINE_FEED;
    commands += LINE_FEED;

    // Timestamp line for kitchen prep
    const now = new Date();
    commands += ALIGN_CENTER;
    commands += `Dicetak: ${now.toLocaleString('id-ID')}` + LINE_FEED;
    commands += LINE_FEED + LINE_FEED + LINE_FEED;

    return commands;
  }

  // ─── CLOSING RECEIPT ────────────────────────────────────────
  private static buildClosingReceipt(transaction: Transaction): string {
    const now = new Date();
    const txDate = new Date(transaction.date);

    let commands = INITIALIZE;

    // Header
    commands += ALIGN_CENTER + BOLD_ON + DOUBLE_HEIGHT + 'LAPORAN CLOSING' + LINE_FEED;
    commands += NORMAL_SIZE + BOLD_OFF + 'KEDAI ELVERA 57' + LINE_FEED;
    commands += LINE_FEED;
    commands += `Tanggal: ${now.toLocaleDateString('id-ID')}` + LINE_FEED;
    commands += `Jam    : ${now.toLocaleTimeString('id-ID')}` + LINE_FEED;
    commands += '================================' + LINE_FEED;

    // Summary
    commands += ALIGN_LEFT + BOLD_ON;
    commands += 'Jumlah Transaksi: ' + BOLD_OFF + `${(transaction as any).transactionCount ?? 1}` + LINE_FEED;

    const totalRevenue = transaction.totalPrice;
    commands += BOLD_ON + 'Total Pendapatan: ' + BOLD_OFF + formatIDR(totalRevenue) + LINE_FEED;

    const totalHpp = (transaction as any).totalHpp ?? 0;
    if (totalHpp > 0) {
      commands += BOLD_ON + 'Total HPP      : ' + BOLD_OFF + formatIDR(totalHpp) + LINE_FEED;
      const profit = totalRevenue - totalHpp;
      commands += BOLD_ON + 'Laba Kotor     : ' + BOLD_OFF + formatIDR(profit) + LINE_FEED;
    }

    commands += '================================' + LINE_FEED;

    // Payment breakdown if available
    const paymentBreakdown = (transaction as any).paymentBreakdown;
    if (paymentBreakdown && typeof paymentBreakdown === 'object') {
      commands += ALIGN_CENTER + BOLD_ON + 'Rincian Pembayaran' + LINE_FEED + BOLD_OFF;
      commands += '--------------------------------' + LINE_FEED;
      commands += ALIGN_LEFT;
      for (const [method, amount] of Object.entries(paymentBreakdown)) {
        const mLabel = method + ':';
        const mVal = formatIDR(amount as number);
        const mPad = 32 - mLabel.length - mVal.length;
        commands += mLabel + ' '.repeat(mPad > 0 ? mPad : 1) + mVal + LINE_FEED;
      }
      commands += '--------------------------------' + LINE_FEED;
    }

    // Item breakdown
    commands += ALIGN_CENTER + BOLD_ON + 'Rincian Menu Terjual' + LINE_FEED + BOLD_OFF;
    commands += '--------------------------------' + LINE_FEED;
    commands += ALIGN_LEFT;

    const itemSummary = new Map<string, { qty: number; revenue: number }>();
    transaction.items.forEach(item => {
      const existing = itemSummary.get(item.name) ?? { qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += (item.discountedSubtotal ?? item.quantity * item.price);
      itemSummary.set(item.name, existing);
    });

    itemSummary.forEach((val, name) => {
      const qtyStr = `${val.qty}x ${name}`;
      const revStr = formatIDR(val.revenue);
      const pad = 32 - qtyStr.length - revStr.length;
      commands += qtyStr + ' '.repeat(pad > 0 ? pad : 1) + revStr + LINE_FEED;
    });

    commands += '================================' + LINE_FEED;

    // Footer
    commands += ALIGN_CENTER + LINE_FEED;
    commands += 'Dicetak otomatis oleh sistem' + LINE_FEED;
    commands += LINE_FEED + LINE_FEED + LINE_FEED;

    return commands;
  }

  public static async listDevices() {
    try {
      return await BluetoothSerial.list();
    } catch (error) {
      console.error('[PRINT] List Devices Error:', error);
      return [];
    }
  }
}
