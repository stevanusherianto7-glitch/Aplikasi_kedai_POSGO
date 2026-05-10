import { Component, OnInit, OnDestroy } from '@angular/core'
import { BluetoothService } from '../../services/bluetooth.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-bluetooth',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.scss'],
  standalone: true
})
export class BluetoothComponent implements OnInit, OnDestroy {
  devices: any[] = []
  selectedDevice: any = null
  isScanning = false
  isConnecting = false
  isConnected = false
  connectedDeviceName = ''
  receivedData = ''
  messageToSend = ''
  errorMessage = ''

  private subscriptions: Subscription[] = []

  constructor(private bluetoothService: BluetoothService) {}

  async ngOnInit() {
    // Subscribe to Bluetooth status
    this.subscriptions.push(
      this.bluetoothService.bluetoothEnabled$.subscribe((enabled: boolean) => {
        if (!enabled) {
          this.errorMessage = 'Bluetooth is not enabled'
        } else {
          this.errorMessage = ''
        }
      })
    )

    // Subscribe to connection status
    this.subscriptions.push(
      this.bluetoothService.connectionStatus$.subscribe((status: boolean) => {
        this.isConnected = status
        if (!status) {
          this.connectedDeviceName = ''
        }
      })
    )

    // Subscribe to connected device
    this.subscriptions.push(
      this.bluetoothService.connectedDevice$.subscribe((address: string) => {
        const device = this.devices.find((d: any) => d.address === address)
        if (device) {
          this.connectedDeviceName = device.name || 'Unknown Device'
        }
      })
    )

    // Subscribe to received data
    this.subscriptions.push(
      this.bluetoothService.receivedData$.subscribe((data: string) => {
        this.receivedData += data + '\n'
      })
    )

    // Load paired devices on init
    await this.scanForDevices()
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  async scanForDevices() {
    this.isScanning = true
    this.errorMessage = ''
    try {
      this.devices = await this.bluetoothService.listDevices()
      console.log('Found devices:', this.devices)
    } catch (error) {
      this.errorMessage = 'Error scanning for devices'
      console.error('Scan error:', error)
    } finally {
      this.isScanning = false
    }
  }

  async discoverNewDevices() {
    this.isScanning = true
    this.errorMessage = ''
    try {
      const unpairedDevices = await this.bluetoothService.discoverUnpairedDevices()
      // Merge with existing devices
      const pairedDevices = await this.bluetoothService.listDevices()
      this.devices = [...pairedDevices, ...unpairedDevices]
      console.log('All devices:', this.devices)
    } catch (error) {
      this.errorMessage = 'Error discovering new devices'
      console.error('Discovery error:', error)
    } finally {
      this.isScanning = false
    }
  }

  async connectToDevice(device: any) {
    this.isConnecting = true
    this.errorMessage = ''
    this.selectedDevice = device
    try {
      await this.bluetoothService.connect(device.address)
      console.log('Successfully connected to:', device.name)
    } catch (error) {
      this.errorMessage = `Failed to connect to ${device.name || 'device'}`
      console.error('Connect error:', error)
    } finally {
      this.isConnecting = false
    }
  }

  async disconnectFromDevice() {
    this.errorMessage = ''
    try {
      await this.bluetoothService.disconnect()
      this.selectedDevice = null
      console.log('Successfully disconnected')
    } catch (error) {
      this.errorMessage = 'Failed to disconnect'
      console.error('Disconnect error:', error)
    }
  }

  async send() {
    if (!this.messageToSend.trim()) return
    this.errorMessage = ''
    try {
      await this.bluetoothService.sendData(this.messageToSend)
      this.messageToSend = ''
    } catch (error) {
      this.errorMessage = 'Failed to send data'
      console.error('Send error:', error)
    }
  }

  clearReceivedData() {
    this.receivedData = ''
  }

  getDeviceIcon(device: any): string {
    // Return appropriate icon based on device class/type
    if (device.class) {
      const deviceClass = parseInt(device.class, 16)
      // Major device class bits
      const majorClass = (deviceClass >> 8) & 0x1F
      switch (majorClass) {
        case 1: return 'computer'     // Computer
        case 2: return 'phone'        // Phone
        case 3: return 'network'      // Network
        case 4: return 'audio'        // Audio/Video
        case 5: return 'gamepad'      // Peripheral
        case 6: return 'print'        // Imaging (Printer)
        default: return 'bluetooth'
      }
    }
    return 'bluetooth'
  }
}
