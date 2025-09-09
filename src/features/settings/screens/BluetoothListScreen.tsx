import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, ActivityIndicator, PermissionsAndroid, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography } from "../../../theme";
import AppBar from "../../../shared/components/AppBar";
import CustomButton from "../../../shared/components/CustomButton";
import { BluetoothManager } from "@brooons/react-native-bluetooth-escpos-printer";
import { bluetoothConnectionService, BluetoothDevice } from "../services/bluetoothConnectionService";


function BluetoothListScreen() {
  const navigation = useNavigation();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<{ device: BluetoothDevice | null; connected: boolean }>({
    device: null,
    connected: false
  });
  
  // Get connection state from service
  const { device: connectedDevice, connected: isConnected } = bluetoothConnectionService.getConnectionState();

  // Debug effect untuk melihat perubahan devices state
  useEffect(() => {
    console.log('Devices state changed:', devices);
    console.log('Devices length:', devices.length);
  }, [devices]);

  // Subscribe to connection changes
  useEffect(() => {
    const unsubscribe = bluetoothConnectionService.subscribe((device, connected) => {
      setConnectionState({ device, connected });
      if (connected && device) {
        setSelectedDevice(device);
      } else if (!connected) {
        setSelectedDevice(undefined);
      }
    });

    return unsubscribe;
  }, []);

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        
        const scanGranted = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
        const connectGranted = granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
        
        return scanGranted && connectGranted;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const startBluetoothScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);

      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        Alert.alert("Izin Diperlukan", "Aplikasi memerlukan izin Bluetooth untuk memindai perangkat");
        return;
      }

      if (!BluetoothManager) {
        throw new Error('BluetoothManager tidak tersedia. Pastikan library sudah ter-link dengan benar.');
      }

      if (typeof BluetoothManager.scanDevices !== 'function') {
        throw new Error('Fungsi scanDevices tidak tersedia. Pastikan library sudah ter-link dengan benar.');
      }

      let deviceList: BluetoothDevice[] = [];

      try {
        if (typeof BluetoothManager.enableBluetooth === 'function') {
          const enableResult = await BluetoothManager.enableBluetooth();
          console.log('Bluetooth enable result:', enableResult);

          if (Array.isArray(enableResult) && enableResult.length > 0) {
            deviceList = enableResult.map((device: any, index: number) => {
              let parsedDevice = device;
              if (typeof device === 'string') {
                try {
                  parsedDevice = JSON.parse(device);
                } catch (e) {
                  console.log('Failed to parse device:', device);
                }
              }
              return {
                name: parsedDevice.name || parsedDevice.deviceName || `Device ${index + 1}`,
                address: parsedDevice.address || parsedDevice.deviceAddress || `Unknown_${index}`
              };
            });
            console.log('Using devices from enableBluetooth result:', deviceList);
          }
        } else {
          console.log('enableBluetooth function not available, trying scanDevices...');
        }
      } catch (error) {
        console.log('Bluetooth enable failed:', error);
      }

      if (deviceList.length === 0) {
        try {
          const devicesResult = await BluetoothManager.scanDevices();
          const parsedDevices = JSON.parse(devicesResult);
          console.log('Full scanDevices result:', parsedDevices);
          
          const pairedDevices = parsedDevices.paired || [];
          const availableDevices = parsedDevices.available || [];
          
          const allDevices = [...pairedDevices, ...availableDevices];
          
          if (allDevices && allDevices.length > 0) {
            deviceList = allDevices.map((device: any) => ({
              name: device.name || device.deviceName || 'Unknown Device',
              address: device.address || device.deviceAddress || 'Unknown Address'
            }));
            
            const uniqueDevices = deviceList.filter((device, index, self) => 
              index === self.findIndex(d => d.address === device.address)
            );
            deviceList = uniqueDevices;
          }
        } catch (error: any) {
          console.log('scanDevices failed:', error.message);
        }
      }
      
      if (deviceList && deviceList.length > 0) {
        console.log('Setting devices state with:', deviceList);
        console.log('Device list length:', deviceList.length);
        
        setDevices(deviceList);
        
        setTimeout(() => {
          Alert.alert("Berhasil", `Ditemukan ${deviceList.length} perangkat Bluetooth (paired dan available)`);
        }, 100);
      } else {
        Alert.alert(
          "Tidak Ada Perangkat", 
          "Tidak ada perangkat Bluetooth yang terdeteksi. Pastikan:\n• Bluetooth sudah aktif\n• Perangkat printer sudah dalam jangkauan\n• Coba pasangkan printer di pengaturan Bluetooth perangkat terlebih dahulu"
        );
      }
    } catch (error) {
      console.error("[bluetooth-scan] Error:", error);
      
      let errorMessage = "Gagal memindai perangkat Bluetooth";
      if (error instanceof Error) {
        if (error.message.includes('tidak tersedia')) {
          errorMessage = "Library Bluetooth Printer belum ter-link dengan benar. Silakan rebuild aplikasi.";
        } else if (error.message.includes('permission')) {
          errorMessage = "Aplikasi memerlukan izin Bluetooth. Silakan aktifkan di pengaturan.";
        } else if (error.message.includes('NOT_STARTED')) {
          errorMessage = "Bluetooth belum aktif atau belum diinisialisasi. Silakan aktifkan Bluetooth di pengaturan perangkat.";
        } else if (error.message.includes('is not a function')) {
          errorMessage = "Library Bluetooth Printer belum ter-link dengan benar. Silakan rebuild aplikasi.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      setIsConnecting(true);
      
      await bluetoothConnectionService.connect(device);
      
      Alert.alert("Berhasil", `Terhubung ke ${device.name}`);
    } catch (error) {
      console.error("[bluetooth-connect] Error:", error);
      
      let errorMessage = "Gagal terhubung ke printer";
      if (error instanceof Error) {
        if (error.message.includes('tidak tersedia')) {
          errorMessage = "Library Bluetooth Printer belum ter-link dengan benar. Silakan rebuild aplikasi.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectPrinter = async () => {
    try {
      await bluetoothConnectionService.disconnect();
      Alert.alert("Info", "Printer terputus");
    } catch (error) {
      console.error("[bluetooth-disconnect] Error:", error);
      Alert.alert("Error", "Gagal memutus koneksi printer");
    }
  };

  const renderDeviceItem = ({ item, index }: { item: BluetoothDevice, index: number }) => {
    console.log('Rendering device item:', item, 'at index:', index);
    const isCurrentDevice = selectedDevice?.address === item.address;
    const isDeviceConnected = connectionState.connected && connectionState.device?.address === item.address;

    return (
      <View style={[
        S.deviceItem,
        isCurrentDevice && S.selectedDevice
      ]}>
        <TouchableOpacity
          style={S.deviceInfoContainer}
          onPress={() => setSelectedDevice(item)}
          disabled={isConnecting}
        >
          <View style={S.deviceInfo}>
            <Text style={S.deviceName}>{item.name}</Text>
            <Text style={S.deviceAddress}>{item.address}</Text>
            {isCurrentDevice && (
              <Text style={S.connectionStatus}>
                {isDeviceConnected ? "Terhubung" : "Terputus"}
              </Text>
            )}
            <Text style={S.deviceType}>
              {item.name.toLowerCase().includes('printer') || 
               item.name.toLowerCase().includes('pos') ||
               item.name.toLowerCase().includes('esc') ? 
               "📄 Printer" : "📱 Perangkat"}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={S.deviceActions}>
          {isCurrentDevice && isDeviceConnected ? (
            <TouchableOpacity
              style={S.disconnectButton}
              onPress={disconnectPrinter}
              disabled={isConnecting}
            >
              <Text style={S.buttonText}>Putus</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={S.connectButton}
              onPress={() => connectToDevice(item)}
              disabled={isConnecting}
            >
              {isConnecting && isCurrentDevice ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={S.buttonText}>Koneksi</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handlePrintSettings = () => {
    const connectedDevice = bluetoothConnectionService.getConnectedDevice();
    if (!bluetoothConnectionService.hasConnection() || !connectedDevice) {
      Alert.alert("Error", "Pilih dan hubungkan printer terlebih dahulu");
      return;
    }
    (navigation as any).navigate('PrintSettings', { device: connectedDevice });
  };

  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <AppBar 
        title="Setting Printer Bluetooth" 
        showBackButton 
        onBackPress={() => navigation.goBack()} 
      />
      
      <View style={S.content}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Perangkat Bluetooth</Text>
          <Text style={S.subtitle}>Pilih dan hubungkan printer Bluetooth</Text>
        </View>

        {/* Scan Buttons */}
        <View style={S.scanButtonsContainer}>
          <CustomButton
            title={isScanning ? "Memindai..." : "Pindai Perangkat"}
            onPress={startBluetoothScan}
            disabled={isScanning}
            style={S.scanButton}
          />
          <CustomButton
            title="Refresh"
            onPress={startBluetoothScan}
            disabled={isScanning}
            style={S.refreshButton}
          />
        </View>
        
        {/* Device Count */}
        {devices.length > 0 && (
          <Text style={S.deviceCountText}>
            Ditemukan {devices.length} perangkat Bluetooth
          </Text>
        )}

        {/* Device List */}
        <View style={S.listContainer}>
          {devices.length > 0 ? (
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={(item, index) => `${item.address}_${index}`}
              style={S.deviceList}
              showsVerticalScrollIndicator={false}
              onLayout={() => console.log('FlatList onLayout triggered')}
            />
          ) : (
            <View style={S.noDevicesContainer}>
              <Text style={S.noDevicesText}>
                {isScanning ? "Memindai perangkat..." : "Belum ada perangkat yang ditemukan"}
              </Text>
              <Text style={S.noDevicesSubtext}>
                Tekan "Pindai Perangkat" untuk mencari perangkat Bluetooth
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={S.actionButtons}>
          <CustomButton
            title="Pengaturan Print"
            onPress={handlePrintSettings}
            style={S.settingsButton}
            disabled={!bluetoothConnectionService.hasConnection()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.primary.regular,
    color: colors.textSecondary,
  },
  scanButtonsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  scanButton: {
    backgroundColor: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  refreshButton: {
    backgroundColor: colors.primaryLight,
    minWidth: 80,
  },
  deviceCountText: {
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  deviceList: {
    flex: 1,
  },
  noDevicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noDevicesText: {
    fontSize: 16,
    fontFamily: typography.primary.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  noDevicesSubtext: {
    fontSize: 14,
    fontFamily: typography.primary.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  deviceInfoContainer: {
    flex: 1,
  },
  selectedDevice: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: typography.primary.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  deviceAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  connectionStatus: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: typography.primary.medium,
    marginTop: spacing.xs,
  },
  deviceType: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.primary.regular,
    marginTop: spacing.xs,
  },
  deviceActions: {
    marginLeft: spacing.sm,
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    elevation: 1,
  },
  disconnectButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    elevation: 1,
  },
  buttonText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: typography.primary.medium,
  },
  actionButtons: {
    marginTop: spacing.lg,
  },
  settingsButton: {
    backgroundColor: colors.success,
  },
});

export default BluetoothListScreen;
