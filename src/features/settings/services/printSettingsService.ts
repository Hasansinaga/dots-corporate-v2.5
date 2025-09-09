import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothEscposPrinter } from '@brooons/react-native-bluetooth-escpos-printer';

export interface PrintSettings {
  alignment: number;
  fontSize: number;
  fontType: number;
  widthTimes: number;
  heightTimes: number;
}

const PRINT_SETTINGS_KEY = '@print_settings';

export class PrintSettingsService {
  /**
   * Simpan pengaturan print ke AsyncStorage
   */
  static async saveSettings(settings: PrintSettings): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(PRINT_SETTINGS_KEY, jsonValue);
      console.log('[print-settings] Settings saved successfully');
    } catch (error) {
      console.error('[print-settings] Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Load pengaturan print dari AsyncStorage
   */
  static async loadSettings(): Promise<PrintSettings | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(PRINT_SETTINGS_KEY);
      if (jsonValue !== null) {
        const settings = JSON.parse(jsonValue) as PrintSettings;
        console.log('[print-settings] Settings loaded successfully');
        return settings;
      }
      return null;
    } catch (error) {
      console.error('[print-settings] Error loading settings:', error);
      return null;
    }
  }

  /**
   * Hapus pengaturan print dari AsyncStorage
   */
  static async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PRINT_SETTINGS_KEY);
      console.log('[print-settings] Settings cleared successfully');
    } catch (error) {
      console.error('[print-settings] Error clearing settings:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): PrintSettings {
    return {
      alignment: BluetoothEscposPrinter.ALIGN.CENTER,
      fontSize: 16,
      fontType: 1, // Bold
      widthTimes: 2, // Normal
      heightTimes: 2, // Normal
    };
  }
}
