import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface PrinterConfig {
  enabled: boolean
  autoPrint: boolean
  deviceAddress?: string
}

export interface ReceiptData {
  storeName: string
  items: Array<{
    name: string
    price: number
    quantity: number
    subtotal: number
  }>
  subtotal: number
  tax?: number
  discount?: number
  total: number
  paymentMethod: string
  paymentAmount: number
  change: number
  date: Date
  transactionId: string
  cashier: string
}

// Format currency for receipt
function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

// Generate ESC/POS commands for thermal printer
function generateESCPOSCommands(receipt: ReceiptData): string {
  const lines: string[] = []

  // Initialize printer
  lines.push('\x1B@') // Initialize

  // Center align header
  lines.push('\x1B\x61\x01') // Center align
  lines.push(`${receipt.storeName}\n`)
  lines.push('===============================\n')

  // Left align for items
  lines.push('\x1B\x61\x00') // Left align

  // Transaction details
  lines.push(`No: ${receipt.transactionId}\n`)
  lines.push(`Date: ${receipt.date.toLocaleString('id-ID')}\n`)
  lines.push(`Cashier: ${receipt.cashier}\n`)
  lines.push('-------------------------------\n')

  // Items
  receipt.items.forEach((item, index) => {
    const itemNum = `${index + 1}.`
    const name = item.name.substring(0, 18) // Truncate long names
    const price = formatCurrency(item.price)
    const qty = `${item.quantity}x`
    const subtotal = formatCurrency(item.subtotal)

    lines.push(`${itemNum} ${name}\n`)
    lines.push(`   ${price} ${qty} = ${subtotal}\n`)
  })

  lines.push('-------------------------------\n')

  // Totals
  lines.push(`Subtotal:     ${formatCurrency(receipt.subtotal).padStart(15)}\n`)
  if (receipt.tax && receipt.tax > 0) {
    lines.push(`Tax (10%):    ${formatCurrency(receipt.tax).padStart(15)}\n`)
  }
  if (receipt.discount && receipt.discount > 0) {
    lines.push(`Discount:     -${formatCurrency(receipt.discount).padStart(14)}\n`)
  }
  lines.push('\x1B\x45\x01') // Bold on
  lines.push(`TOTAL:        ${formatCurrency(receipt.total).padStart(15)}\n`)
  lines.push('\x1B\x45\x00') // Bold off

  lines.push('-------------------------------\n')

  // Payment details
  lines.push(`Payment:      ${receipt.paymentMethod.padEnd(15)}\n`)
  lines.push(`Amount:       ${formatCurrency(receipt.paymentAmount).padStart(15)}\n`)
  lines.push(`Change:       ${formatCurrency(receipt.change).padStart(15)}\n`)

  // Footer
  lines.push('\n')
  lines.push('Thank you for shopping!\n')
  lines.push('Please come again.\n')
  lines.push('\n')
  lines.push('\x0A') // Feed line
  lines.push('\x0A') // Feed line
  lines.push('\x1D\x56\x42\x03') // Cut paper (partial)

  return lines.join('')
}

// Connect to Bluetooth printer
export async function connectToPrinter(deviceAddress: string): Promise<boolean> {
  try {
    await BluetoothSerial.connect(deviceAddress)
    return true
  } catch (error) {
    console.error('Failed to connect to printer:', error)
    return false
  }
}

// Disconnect from printer
export async function disconnectPrinter(): Promise<boolean> {
  try {
    await BluetoothSerial.disconnect()
    return true
  } catch (error) {
    console.error('Failed to disconnect printer:', error)
    return false
  }
}

// Print receipt via Bluetooth
export async function printReceiptBluetooth(
  receipt: ReceiptData,
  deviceAddress: string
): Promise<boolean> {
  try {
    // Generate ESC/POS commands
    const commands = generateESCPOSCommands(receipt)

    // Write to Bluetooth printer
    await BluetoothSerial.write(commands)

    return true
  } catch (error) {
    console.error('Failed to print receipt:', error)
    return false
  }
}

// Print receipt (auto-connects if needed)
export async function printReceipt(
  receipt: ReceiptData,
  config: PrinterConfig
): Promise<boolean> {
  if (!config.enabled || !config.autoPrint || !config.deviceAddress) {
    console.log('Auto-print disabled or no printer configured')
    return false
  }

  try {
    // Check if already connected
    const isConnected = await BluetoothSerial.isConnected()

    if (!isConnected) {
      // Connect to printer
      const connected = await connectToPrinter(config.deviceAddress)
      if (!connected) {
        console.error('Failed to connect to printer')
        return false
      }
    }

    // Print receipt
    const printed = await printReceiptBluetooth(receipt, config.deviceAddress)

    // Disconnect after printing
    await disconnectPrinter()

    return printed
  } catch (error) {
    console.error('Error during auto-print:', error)
    return false
  }
}

// Get paired Bluetooth devices
export async function getPairedDevices(): Promise<Array<{ id: string; name: string; address: string }>> {
  try {
    const devices = await BluetoothSerial.list()
    return devices
  } catch (error) {
    console.error('Failed to get paired devices:', error)
    return []
  }
}
