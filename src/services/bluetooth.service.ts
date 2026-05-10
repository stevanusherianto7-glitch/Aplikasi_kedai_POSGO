import { Injectable } from '@angular/core'
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx'
import { Subject, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private bluetoothEnabled = new Subject<boolean>()
  private connectedDevice = new Subject<string>()
  private receivedData = new Subject<string>()
  private connectionStatus = new Subject<boolean>()

  bluetoothEnabled$ = this.bluetoothEnabled.asObservable()
  connectedDevice$ = this.connectedDevice.asObservable()
  receivedData$ = this.receivedData.asObservable()
  connectionStatus$ = this.connectionStatus.asObservable()

  constructor(private bluetoothSerial: BluetoothSerial) {
    this.initializeBluetooth()
  }

  async initializeBluetooth() {
    try {
      // Check if Bluetooth is enabled
      const isEnabled = await this.bluetoothSerial.isEnabled()
      this.bluetoothEnabled.next(isEnabled)
      
      if (!isEnabled) {
        await this.bluetoothSerial.enable()
        this.bluetoothEnabled.next(true)
      }

      // Listen for incoming data
      this.bluetoothSerial.subscribe('\n').subscribe((data: string) => {
        this.receivedData.next(data)
      })

      // Listen for connection status changes
      this.bluetoothSerial.subscribeRawData().subscribe((data: any) => {
        console.log('Raw data received:', data)
      })

    } catch (error) {
      console.error('Bluetooth initialization error:', error)
      this.bluetoothEnabled.next(false)
    }
  }

  async listDevices(): Promise<any[]> {
    try {
      const devices = await this.bluetoothSerial.list()
      return devices
    } catch (error) {
      console.error('Error listing devices:', error)
      throw error
    }
  }

  async connect(address: string): Promise<void> {
    try {
      await this.bluetoothSerial.connect(address)
      this.connectedDevice.next(address)
      this.connectionStatus.next(true)
      console.log('Connected to device:', address)
    } catch (error) {
      console.error('Connection error:', error)
      this.connectionStatus.next(false)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.bluetoothSerial.disconnect()
      this.connectedDevice.next('')
      this.connectionStatus.next(false)
      console.log('Disconnected from device')
    } catch (error) {
      console.error('Disconnection error:', error)
      throw error
    }
  }

  async sendData(data: string): Promise<void> {
    try {
      await this.bluetoothSerial.write(data)
      console.log('Data sent:', data)
    } catch (error) {
      console.error('Error sending data:', error)
      throw error
    }
  }

  async discoverUnpairedDevices(): Promise<any[]> {
    try {
      await this.bluetoothSerial.discoverUnpaired()
      const devices = await this.bluetoothSerial.list()
      return devices.filter((device: any) => !device.paired)
    } catch (error) {
      console.error('Error discovering unpaired devices:', error)
      throw error
    }
  }

  async pairDevice(address: string): Promise<void> {
    try {
      // Note: Pairing functionality might be limited on some platforms
      await this.bluetoothSerial.connectInsecure(address)
      console.log('Device paired/connected:', address)
    } catch (error) {
      console.error('Pairing error:', error)
      throw error
    }
  }

  isConnected(): boolean {
    return this.bluetoothSerial.isConnected()
  }

  getAvailableDevices() {
    return this.bluetoothSerial.list()
  }

  // Helper method to format device info
  formatDeviceInfo(device: any): string {
    return `${device.name || 'Unknown'} (${device.address})`
  }
}
