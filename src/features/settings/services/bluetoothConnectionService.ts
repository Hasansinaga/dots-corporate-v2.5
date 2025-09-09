import { BluetoothManager } from "@brooons/react-native-bluetooth-escpos-printer";

export interface BluetoothDevice {
  name: string;
  address: string;
}

class BluetoothConnectionService {
  private static instance: BluetoothConnectionService;
  private connectedDevice: BluetoothDevice | null = null;
  private isConnected: boolean = false;
  private listeners: Array<(device: BluetoothDevice | null, connected: boolean) => void> = [];

  private constructor() {}

  static getInstance(): BluetoothConnectionService {
    if (!BluetoothConnectionService.instance) {
      BluetoothConnectionService.instance = new BluetoothConnectionService();
    }
    return BluetoothConnectionService.instance;
  }

  // Subscribe to connection changes
  subscribe(listener: (device: BluetoothDevice | null, connected: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.connectedDevice, this.isConnected);
    });
  }

  // Get current connection state
  getConnectionState(): { device: BluetoothDevice | null; connected: boolean } {
    return {
      device: this.connectedDevice,
      connected: this.isConnected,
    };
  }

  // Connect to device
  async connect(device: BluetoothDevice): Promise<void> {
    try {
      if (!BluetoothManager || typeof BluetoothManager.connect !== 'function') {
        throw new Error('BluetoothManager tidak tersedia. Pastikan library sudah ter-link dengan benar.');
      }
      
      await BluetoothManager.connect(device.address);
      this.connectedDevice = device;
      this.isConnected = true;
      this.notifyListeners();
    } catch (error) {
      console.error("[bluetooth-connect] Error:", error);
      throw error;
    }
  }

  // Disconnect from device
  async disconnect(): Promise<void> {
    try {
      if (!BluetoothManager || typeof BluetoothManager.disconnect !== 'function') {
        throw new Error('BluetoothManager tidak tersedia');
      }
      
      if (this.connectedDevice) {
        await BluetoothManager.disconnect(this.connectedDevice.address);
      }
      this.connectedDevice = null;
      this.isConnected = false;
      this.notifyListeners();
    } catch (error) {
      console.error("[bluetooth-disconnect] Error:", error);
      throw error;
    }
  }

  // Check if device is connected
  isDeviceConnected(device: BluetoothDevice): boolean {
    return this.isConnected && this.connectedDevice?.address === device.address;
  }

  // Get connected device
  getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  // Check if any device is connected
  hasConnection(): boolean {
    return this.isConnected && this.connectedDevice !== null;
  }
}

export const bluetoothConnectionService = BluetoothConnectionService.getInstance();
