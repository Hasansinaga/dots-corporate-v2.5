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
| `ljkCode` | `string` | `undefined` | Kode LJK untuk identifikasi perusahaan (auto-detect dari AsyncStorage jika tidak disediakan) |
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

### useLocationConfig(options)

Hook untuk mengelola konfigurasi location tracking.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ljkCode` | `string` | `undefined` | Kode LJK untuk identifikasi perusahaan (auto-detect dari AsyncStorage jika tidak disediakan) |
| `autoLoad` | `boolean` | `true` | Otomatis load konfigurasi saat mount |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `trackingActive` | `boolean` | Status tracking aktif/tidak |
| `locationRequired` | `boolean` | Apakah lokasi diperlukan |
| `locationAvailable` | `boolean` | Apakah lokasi tersedia |
| `monitoringActive` | `boolean` | Status monitoring aktif |
| `isLocationTrackingEnabled` | `boolean` | Status konfigurasi tracking dari API |
| `isLoading` | `boolean` | Status loading |
| `error` | `string \| null` | Error message |
| `refreshTrackingStatus` | `() => Promise<any>` | Function untuk refresh status tracking |
| `handleTrackingBadgePress` | `() => Promise<void>` | Function untuk handle badge press |
| `openLocationSettings` | `() => Promise<void>` | Function untuk buka pengaturan lokasi |
| `loadLocationConfig` | `() => Promise<void>` | Function untuk load konfigurasi |
| `refreshLocationConfig` | `() => Promise<void>` | Function untuk refresh konfigurasi |
| `cleanup` | `() => void` | Function untuk cleanup |

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

### Example 6: Location Tracking Configuration

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocationConfig } from '../../../shared/hooks/useLocationConfig';

function LocationTrackingComponent() {
  const {
    trackingActive,
    locationRequired,
    locationAvailable,
    monitoringActive,
    isLocationTrackingEnabled,
    isLoading,
    error,
    handleTrackingBadgePress,
    refreshLocationConfig,
  } = useLocationConfig({
    ljkCode: '600001',
    autoLoad: true,
  });

  if (isLoading) {
    return <Text>Loading location config...</Text>;
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error}</Text>
        <Button title="Retry" onPress={refreshLocationConfig} />
      </View>
    );
  }

  return (
    <View>
      <Text>Location Tracking Status:</Text>
      <Text>Config Enabled: {isLocationTrackingEnabled ? 'Yes' : 'No'}</Text>
      <Text>Tracking Active: {trackingActive ? 'Yes' : 'No'}</Text>
      <Text>Location Available: {locationAvailable ? 'Yes' : 'No'}</Text>
      <Text>Monitoring Active: {monitoringActive ? 'Yes' : 'No'}</Text>
      
      <Button 
        title="Toggle Tracking" 
        onPress={handleTrackingBadgePress}
      />
    </View>
  );
}
```

## 🏢 Tenant ID Management

Sistem ini secara otomatis menggunakan `KodeKantor` yang disimpan saat login sebagai LJK code untuk API calls.

### Auto-Detection

```typescript
// ✅ Recommended - Auto-detect dari AsyncStorage
const config = useFeatureConfig();

// ✅ Manual override jika diperlukan
const config = useFeatureConfig({ ljkCode: '600002' });
```

### Tenant Utils

```typescript
import { getTenantId, getTenantIdWithFallback } from '../utils/tenantUtils';

// Get tenant ID dari AsyncStorage
const tenantId = await getTenantId();

// Get dengan fallback
const tenantId = await getTenantIdWithFallback('600001');
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
