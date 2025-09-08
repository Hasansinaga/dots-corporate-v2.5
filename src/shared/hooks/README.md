# useFeatureConfig Hook

Hook untuk mengelola konfigurasi fitur aplikasi berdasarkan API `company-cfgsys`. Hook ini memungkinkan Anda untuk mengontrol tampilan fitur secara dinamis berdasarkan konfigurasi dari server.

## 📋 Daftar Isi

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Installation

Hook ini sudah tersedia di `src/shared/hooks/useFeatureConfig.ts`. Pastikan dependencies berikut sudah terinstall:

```bash
npm install @react-navigation/native
```

## 📖 Basic Usage

### 1. Import Hook

```typescript
import { useFeatureConfig, useQuickActionsConfig } from '../../../shared/hooks/useFeatureConfig';
```

### 2. Basic Configuration

```typescript
function MyComponent() {
  const { 
    configs, 
    isLoading, 
    error, 
    isFeatureEnabled, 
    loadConfigs 
  } = useFeatureConfig({
    ljkCode: '600001',
    autoLoad: true
  });

  // Check if feature is enabled
  const showNewFeature = isFeatureEnabled('MBCORP_NEW_FEATURE');

  return (
    <View>
      {showNewFeature && <NewFeatureComponent />}
    </View>
  );
}
```

### 3. Quick Actions Configuration

```typescript
function HomeScreen() {
  const {
    showDaftarNasabah,
    showSejarahBatch,
    showPengajuanPinjaman,
    showSimulasiKredit,
    showUKM,
    loadQuickActionsConfig,
  } = useQuickActionsConfig();

  useEffect(() => {
    loadQuickActionsConfig();
  }, [loadQuickActionsConfig]);

  return (
    <View>
      {showDaftarNasabah && <DaftarNasabahButton />}
      {showSejarahBatch && <SejarahBatchButton />}
      {/* ... other features */}
    </View>
  );
}
```

## 🔧 API Reference

### useFeatureConfig(options)

Hook utama untuk mengelola konfigurasi fitur.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ljkCode` | `string` | `'600001'` | Kode LJK untuk identifikasi perusahaan |
| `autoLoad` | `boolean` | `false` | Otomatis load konfigurasi saat mount |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `configs` | `FeatureConfigs` | Object berisi semua konfigurasi fitur |
| `isLoading` | `boolean` | Status loading saat fetch konfigurasi |
| `error` | `string \| null` | Error message jika ada |
| `isFeatureEnabled` | `(code: string) => boolean` | Function untuk cek status fitur |
| `loadConfigs` | `(codes: string[]) => Promise<void>` | Function untuk load konfigurasi |
| `refreshConfigs` | `() => Promise<void>` | Function untuk refresh konfigurasi |

### useQuickActionsConfig()

Hook khusus untuk konfigurasi QuickActions.

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `showDaftarNasabah` | `boolean` | Status fitur Daftar Nasabah |
| `showSejarahBatch` | `boolean` | Status fitur Sejarah Batch |
| `showPengajuanPinjaman` | `boolean` | Status fitur Pengajuan Pinjaman |
| `showSimulasiKredit` | `boolean` | Status fitur Simulasi Kredit |
| `showUKM` | `boolean` | Status fitur UKM |
| `loadQuickActionsConfig` | `() => Promise<void>` | Function untuk load konfigurasi QuickActions |
| `isLoading` | `boolean` | Status loading |
| `error` | `string \| null` | Error message |

## 💡 Examples

### Example 1: Basic Feature Toggle

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useFeatureConfig } from '../../../shared/hooks/useFeatureConfig';

function FeatureToggle() {
  const { isFeatureEnabled, loadConfigs, isLoading } = useFeatureConfig();

  React.useEffect(() => {
    loadConfigs(['MBCORP_NEW_FEATURE']);
  }, [loadConfigs]);

  const showNewFeature = isFeatureEnabled('MBCORP_NEW_FEATURE');

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      {showNewFeature ? (
        <Text>New Feature is enabled!</Text>
      ) : (
        <Text>New Feature is disabled</Text>
      )}
    </View>
  );
}
```

### Example 2: Multiple Features

```typescript
import React from 'react';
import { View, Button } from 'react-native';
import { useFeatureConfig } from '../../../shared/hooks/useFeatureConfig';

function MultiFeatureComponent() {
  const { isFeatureEnabled, loadConfigs } = useFeatureConfig();

  React.useEffect(() => {
    loadConfigs([
      'MBCORP_FEATURE_A',
      'MBCORP_FEATURE_B',
      'MBCORP_FEATURE_C'
    ]);
  }, [loadConfigs]);

  const showFeatureA = isFeatureEnabled('MBCORP_FEATURE_A');
  const showFeatureB = isFeatureEnabled('MBCORP_FEATURE_B');
  const showFeatureC = isFeatureEnabled('MBCORP_FEATURE_C');

  return (
    <View>
      {showFeatureA && <Button title="Feature A" />}
      {showFeatureB && <Button title="Feature B" />}
      {showFeatureC && <Button title="Feature C" />}
    </View>
  );
}
```

### Example 3: Custom LJK Code

```typescript
import React from 'react';
import { useFeatureConfig } from '../../../shared/hooks/useFeatureConfig';

function CustomLJKComponent() {
  const { isFeatureEnabled, loadConfigs } = useFeatureConfig({
    ljkCode: '600002', // Custom LJK code
    autoLoad: false
  });

  React.useEffect(() => {
    loadConfigs(['MBCORP_CUSTOM_FEATURE']);
  }, [loadConfigs]);

  const showCustomFeature = isFeatureEnabled('MBCORP_CUSTOM_FEATURE');

  return (
    <View>
      {showCustomFeature && <CustomFeatureComponent />}
    </View>
  );
}
```

### Example 4: Error Handling

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useFeatureConfig } from '../../../shared/hooks/useFeatureConfig';

function ErrorHandlingComponent() {
  const { 
    isFeatureEnabled, 
    loadConfigs, 
    isLoading, 
    error,
    refreshConfigs 
  } = useFeatureConfig();

  React.useEffect(() => {
    loadConfigs(['MBCORP_FEATURE']);
  }, [loadConfigs]);

  const showFeature = isFeatureEnabled('MBCORP_FEATURE');

  if (error) {
    return (
      <View>
        <Text>Error: {error}</Text>
        <Button title="Retry" onPress={refreshConfigs} />
      </View>
    );
  }

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      {showFeature && <FeatureComponent />}
    </View>
  );
}
```

### Example 5: QuickActions Implementation

```typescript
import React from 'react';
import { View, Button } from 'react-native';
import { useQuickActionsConfig } from '../../../shared/hooks/useFeatureConfig';

function QuickActionsComponent() {
  const {
    showDaftarNasabah,
    showSejarahBatch,
    showPengajuanPinjaman,
    showSimulasiKredit,
    showUKM,
    loadQuickActionsConfig,
    isLoading,
  } = useQuickActionsConfig();

  React.useEffect(() => {
    loadQuickActionsConfig();
  }, [loadQuickActionsConfig]);

  if (isLoading) {
    return <Text>Loading QuickActions...</Text>;
  }

  return (
    <View>
      {showDaftarNasabah && (
        <Button title="Daftar Nasabah" onPress={() => console.log('Daftar Nasabah')} />
      )}
      {showSejarahBatch && (
        <Button title="Sejarah Batch" onPress={() => console.log('Sejarah Batch')} />
      )}
      {showPengajuanPinjaman && (
        <Button title="Pengajuan Pinjaman" onPress={() => console.log('Pengajuan Pinjaman')} />
      )}
      {showSimulasiKredit && (
        <Button title="Simulasi Kredit" onPress={() => console.log('Simulasi Kredit')} />
      )}
      {showUKM && (
        <Button title="UKM" onPress={() => console.log('UKM')} />
      )}
    </View>
  );
}
```

## 🎯 Best Practices

### 1. Gunakan useQuickActionsConfig untuk QuickActions

```typescript
// ✅ Good
const { showDaftarNasabah, loadQuickActionsConfig } = useQuickActionsConfig();

// ❌ Avoid
const { isFeatureEnabled, loadConfigs } = useFeatureConfig();
const showDaftarNasabah = isFeatureEnabled('MBCORP_DAFTAR_NASABAH');
```

### 2. Load konfigurasi di useEffect

```typescript
// ✅ Good
React.useEffect(() => {
  loadConfigs(['MBCORP_FEATURE']);
}, [loadConfigs]);

// ❌ Avoid
loadConfigs(['MBCORP_FEATURE']); // Direct call
```

### 3. Handle loading dan error states

```typescript
// ✅ Good
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!isFeatureEnabled('MBCORP_FEATURE')) return null;

// ❌ Avoid
if (isFeatureEnabled('MBCORP_FEATURE')) {
  return <FeatureComponent />;
}
```

### 4. Gunakan conditional rendering

```typescript
// ✅ Good
{showFeature && <FeatureComponent />}

// ❌ Avoid
{showFeature ? <FeatureComponent /> : <div />}
```

### 5. Refresh konfigurasi saat pull-to-refresh

```typescript
// ✅ Good
const onRefresh = useCallback(async () => {
  await Promise.all([
    refreshConfigs(),
    loadOtherData(),
  ]);
}, [refreshConfigs]);
```

## 🔍 Troubleshooting

### Problem: Feature tidak muncul meski API return enabled

**Solution:**
```typescript
// Pastikan numvalue1 dan numvalue2 sama-sama 1
// API Response harus:
{
  "numvalue1": 1,
  "numvalue2": 1
}
```

### Problem: Loading state tidak berubah

**Solution:**
```typescript
// Pastikan loadConfigs dipanggil
React.useEffect(() => {
  loadConfigs(['MBCORP_FEATURE']);
}, [loadConfigs]);
```

### Problem: Error saat load konfigurasi

**Solution:**
```typescript
// Handle error dengan try-catch
try {
  await loadConfigs(['MBCORP_FEATURE']);
} catch (error) {
  console.error('Failed to load config:', error);
}
```

### Problem: Konfigurasi tidak ter-update

**Solution:**
```typescript
// Gunakan refreshConfigs untuk update
const onRefresh = useCallback(async () => {
  await refreshConfigs();
}, [refreshConfigs]);
```

## 📝 Notes

- Hook ini menggunakan API `company-cfgsys` untuk mendapatkan konfigurasi
- Feature dianggap enabled jika `numvalue1 === 1 && numvalue2 === 1`
- Konfigurasi di-cache di memory untuk performa yang lebih baik
- Gunakan `refreshConfigs()` untuk mendapatkan konfigurasi terbaru
- Hook ini thread-safe dan bisa digunakan di multiple components

## 🤝 Contributing

Jika Anda ingin menambahkan fitur baru atau memperbaiki bug, silakan:

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.
