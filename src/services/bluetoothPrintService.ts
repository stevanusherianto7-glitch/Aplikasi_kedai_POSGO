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

  public static async printReceipt(transaction: Transaction, printerAddress?: string) {
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

      // 2. Prepare Data
      let commands = INITIALIZE;
      
      // Header
      commands += ALIGN_CENTER + BOLD_ON + DOUBLE_HEIGHT + 'KEDAI ELVERA 57' + LINE_FEED;
      commands += NORMAL_SIZE + BOLD_OFF + 'Telp: 0895-3763-48626' + LINE_FEED;
      commands += LINE_FEED; // Padding setelah header
      commands += '--------------------------------' + LINE_FEED;
      
      // Info Transaksi
      commands += ALIGN_LEFT;
      commands += `No : ${transaction.id.slice(0, 8)}` + LINE_FEED;
      commands += `Tgl: ${new Date(transaction.date).toLocaleString('id-ID')}` + LINE_FEED;
      commands += '--------------------------------' + LINE_FEED;

      // Items
      transaction.items.forEach(item => {
        commands += BOLD_ON + item.name + BOLD_OFF + LINE_FEED; // Nama item tebal
        
        const originalSubtotal = item.quantity * item.price;
        const subtotalToDisplay = item.discountedSubtotal ?? originalSubtotal;
        
        const qtyText = `  ${item.quantity} x ${formatIDR(item.price)}`; // Indentasi qty
        const totalText = formatIDR(subtotalToDisplay);
        
        const paddingCount = 32 - qtyText.length - totalText.length;
        const padding = paddingCount > 0 ? ' '.repeat(paddingCount) : ' ';
        commands += qtyText + padding + totalText + LINE_FEED;

        if (subtotalToDisplay < originalSubtotal) {
          const discountLabel = `    Diskon (${item.discountPercent || 0}%):`; // Indentasi diskon
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
      commands += BOLD_OFF + LINE_FEED; // Padding setelah total
      
      commands += ALIGN_CENTER + BOLD_OFF;
      commands += LINE_FEED + 'Terima Kasih Atas' + LINE_FEED;
      commands += 'Kunjungan Anda' + LINE_FEED + LINE_FEED;
      
      // Cut/Feed
      commands += LINE_FEED + LINE_FEED + LINE_FEED;

      // 3. Send to Printer
      await BluetoothSerial.write(commands);
      console.log('[PRINT] Receipt sent successfully');
      return true;

    } catch (error) {
      console.error('[PRINT] Critical Print Error:', error);
      return false;
    }
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
