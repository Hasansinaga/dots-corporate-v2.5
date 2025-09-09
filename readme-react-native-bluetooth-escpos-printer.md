# Dokumentasi Perbaikan react-native-bluetooth-escpos-printer

## Masalah yang Dihadapi

Library `react-native-bluetooth-escpos-printer` versi 0.0.5 tidak kompatibel dengan React Native 0.81.0 karena:

1. **Perintah `react-native link` sudah tidak ada** di React Native 0.60+
2. **Library tidak mendukung autolinking** otomatis
3. **Konfigurasi Gradle menggunakan versi lama** yang tidak kompatibel
4. **Import statements menggunakan android.support** yang sudah deprecated
5. **SDK version terlalu lama** (compileSdkVersion 27)

## Solusi yang Diterapkan

### 1. Membuat File Konfigurasi Manual Linking

**File:** `react-native.config.js` (di root project)

```javascript
module.exports = {
  dependencies: {
    'react-native-bluetooth-escpos-printer': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-bluetooth-escpos-printer/android',
          packageImportPath: 'import cn.jystudio.bluetooth.RNBluetoothEscposPrinterPackage;',
        },
        ios: {
          podspecPath: '../node_modules/react-native-bluetooth-escpos-printer/RNBluetoothEscposPrinter.podspec',
        },
      },
    },
  },
};
```

### 2. Update Konfigurasi Gradle Utama

**File:** `android/build.gradle`

```gradle
repositories {
    google()
    mavenCentral()
    jcenter {
        content {
            // Allow insecure protocols for jcenter
            allowInsecureProtocol = true
        }
    }
}
```

**File:** `android/app/build.gradle`

```gradle
repositories {
    google()
    mavenCentral()
    jcenter {
        content {
            // Allow insecure protocols for jcenter
            allowInsecureProtocol = true
        }
    }
}
```

### 3. Perbaikan Konfigurasi Library Bluetooth Printer

**File:** `node_modules/react-native-bluetooth-escpos-printer/android/build.gradle`

#### Perubahan Repository:
```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
        jcenter {
            content {
                allowInsecureProtocol = true
            }
        }
        maven {
            url "https://repo.spring.io/plugins-release/"
        }
        maven {
            url "$rootDir/../node_modules/react-native/android"
        }
    }
}

repositories {
    google()
    mavenCentral()
    jcenter {
        content {
            allowInsecureProtocol = true
        }
    }
    maven {
        url "https://repo.spring.io/plugins-release/"
    }
    maven {
        url "$rootDir/../node_modules/react-native/android"
    }
}
```

#### Update SDK Version:
```gradle
android {
    compileSdkVersion 36        // Sebelumnya: 27
    buildToolsVersion "36.0.0"  // Sebelumnya: "27.0.3"

    defaultConfig {
        minSdkVersion 24        // Sebelumnya: 16
        targetSdkVersion 36     // Sebelumnya: 24
        versionCode 1
        versionName "1.0"
    }
}
```

#### Update Dependencies:
```gradle
dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'com.facebook.react:react-native:+'
    implementation 'androidx.legacy:legacy-support-v4:1.0.0'  // Sebelumnya: com.android.support
    implementation 'androidx.core:core:1.12.0'                // Baru ditambahkan
    implementation "com.google.zxing:core:3.5.2"              // Sebelumnya: 3.3.0
}
```

### 4. Perbaikan Import Statements Java

**File:** `node_modules/react-native-bluetooth-escpos-printer/android/src/main/java/cn/jystudio/bluetooth/RNBluetoothManagerModule.java`

#### Perubahan Import:
```java
// Sebelumnya:
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;

// Sesudah:
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
```

## Langkah-langkah Implementasi

1. **Buat file `react-native.config.js`** di root project
2. **Update konfigurasi Gradle** di `android/build.gradle` dan `android/app/build.gradle`
3. **Modifikasi file build.gradle** di library bluetooth printer
4. **Update import statements** di file Java
5. **Bersihkan cache** dengan `npx react-native clean`
6. **Build ulang** dengan `npx react-native run-android`

## Catatan Penting

⚠️ **Peringatan:** Perubahan di `node_modules` akan hilang jika menjalankan `npm install` ulang.

### Solusi Permanen:
1. **Fork library** dan perbaiki konfigurasinya
2. **Gunakan library alternatif** yang mendukung autolinking
3. **Buat patch file** untuk otomatis menerapkan perubahan

## Testing

Setelah semua perubahan diterapkan, library dapat digunakan:

```javascript
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

const printText = async () => {
  try {
    await BluetoothEscposPrinter.printText("Hello World!\n");
  } catch (error) {
    console.error('Print error:', error);
  }
};
```

## Versi yang Diperbaiki

- **React Native:** 0.81.0
- **Library:** react-native-bluetooth-escpos-printer@0.0.5
- **Android SDK:** 36
- **Build Tools:** 36.0.0
- **Min SDK:** 24
- **Target SDK:** 36

## Status

✅ **Berhasil:** Library sekarang kompatibel dengan React Native 0.81.0 dan dapat digunakan untuk printing via Bluetooth ESC/POS.