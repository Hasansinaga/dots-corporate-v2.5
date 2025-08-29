import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  AppState,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Users,
  History,
  FileText,
  Calculator,
  Briefcase,
} from 'lucide-react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors as TColors, spacing, typography } from '../../../theme';
import { useAuth } from '../../../stores/useAuth';
import {
  isLocationTrackingEnabled,
  startBackgroundTrackingIfEnabled,
  isTrackingActive,
  stopBackgroundTracking,
  ensureLocationReady,
} from '../../../shared/services/tracking/trackingService';

import {
  startGpsMonitoring,
  stopGpsMonitoring,
  addGpsStatusListener,
  removeGpsStatusListener,
  getGpsMonitoringStatus,
  forceGpsStatusCheck,
} from '../../../shared/services/tracking/locationPermissions';

const { width } = Dimensions.get('window');

const pick = (obj: any, keys: string[], fb: string) =>
  keys.reduce<string | undefined>((v, k) => v ?? obj?.[k], undefined) ?? fb;

const PRIMARY = pick(TColors, ['primaryColor', 'primary'], '#0E73E3');
const BG = pick(TColors, ['background'], '#FFFFFF');
const CARD = pick(TColors, ['inputBackground'], '#F5F7FA');
const TEXT = pick(TColors, ['text'], '#111827');
const TEXT_MUTED = pick(TColors, ['textSecondary'], '#6B7280');
const BORDER = pick(TColors, ['border'], '#E5E7EB');
const WARN_BG = '#FEF3C7';
const WARN_TEXT = '#B45309';

const formatIDR = (n: number) =>
  'Rp ' + (Math.floor(n) + '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const greet = (h: number) =>
  h < 11
    ? 'Selamat pagi'
    : h < 15
    ? 'Selamat siang'
    : h < 19
    ? 'Selamat sore'
    : 'Selamat malam';
const indoDate = (d: Date) => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][
    d.getDay()
  ];
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ][d.getMonth()];
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${hari}, ${d.getDate()} ${bulan} ${d.getFullYear()} | ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

type QuickActionProps = {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
};

const QuickAction: React.FC<QuickActionProps> = ({ label, onPress, icon }) => (
  <Pressable
    style={S.quick}
    onPress={onPress}
    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
  >
    <View style={S.quickIconWrap}>{icon}</View>
    <Text style={S.quickLabel} numberOfLines={2} ellipsizeMode="clip">
      {label}
    </Text>
  </Pressable>
);

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const name = user?.name ?? 'User';

  const now = useMemo(() => new Date(), []);
  const greetText = `${greet(now.getHours())}, ${name}`;
  const dateText = indoDate(now);

  const [batchActive, setBatchActive] = useState(false);
  const [batchCode, setBatchCode] = useState<string | null>(null);
  const [totalMoney, setTotalMoney] = useState(1000);
  const [totalDeposit, setTotalDeposit] = useState(20);

  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const [locationRequired, setLocationRequired] = useState<boolean>(false);
  
  // NEW: GPS monitoring state
  const [gpsEnabled, setGpsEnabled] = useState<boolean | null>(null);
  const [gpsMonitoringActive, setGpsMonitoringActive] = useState<boolean>(false);
  
  const hasShownLocationPrompt = useRef(false);
  const locationCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isCheckingLocation = useRef(false);

  const refreshTrackingStatus = useCallback(async () => {
    try {
      // Check if location tracking is required by server config
      const trackingEnabled = await isLocationTrackingEnabled();
      setLocationRequired(trackingEnabled);

      // Check if tracking is actually active
      const active = await isTrackingActive();
      setTrackingActive(active);

      console.log(
        '[home] Location required:',
        trackingEnabled,
        'Active:',
        active,
      );
      return { required: trackingEnabled, active };
    } catch (error) {
      console.warn('[home] Error checking tracking status:', error);
      setLocationRequired(false);
      setTrackingActive(false);
      return { required: false, active: false };
    }
  }, []);

  // NEW: GPS status change handler
  const handleGpsStatusChange = useCallback((isEnabled: boolean) => {
    console.log('[home] GPS status changed to:', isEnabled);
    setGpsEnabled(isEnabled);
    
    if (!isEnabled && locationRequired) {
      // GPS was turned off and it's required
      Alert.alert(
        'GPS Dimatikan',
        'GPS telah dimatikan. Aplikasi memerlukan GPS untuk tracking lokasi.',
        [
          {
            text: 'Buka Pengaturan',
            onPress: () => openLocationSettings(),
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => performLogout(),
          },
        ],
        { cancelable: false },
      );
    } else if (isEnabled && locationRequired && !trackingActive) {
      // GPS was turned on, try to restart tracking
      console.log('[home] GPS enabled, attempting to restart tracking...');
      setTimeout(async () => {
        try {
          const success = await startBackgroundTrackingIfEnabled();
          if (success) {
            await refreshTrackingStatus();
            console.log('[home] Tracking restarted successfully');
          }
        } catch (error) {
          console.warn('[home] Failed to restart tracking:', error);
        }
      }, 2000); // Wait 2 seconds for GPS to stabilize
    }
  }, [locationRequired, trackingActive]);

  // NEW: Start/stop GPS monitoring based on location requirement
  useEffect(() => {
    if (locationRequired && !gpsMonitoringActive) {
      console.log('[home] Starting GPS monitoring...');
      setGpsMonitoringActive(true);
      
      // Add our status change listener
      addGpsStatusListener(handleGpsStatusChange);
      
      // Start monitoring with callback
      startGpsMonitoring(handleGpsStatusChange);
      
      // Force initial check
      forceGpsStatusCheck().then(status => {
        setGpsEnabled(status);
      });
      
    } else if (!locationRequired && gpsMonitoringActive) {
      console.log('[home] Stopping GPS monitoring...');
      setGpsMonitoringActive(false);
      
      // Remove listener and stop monitoring
      removeGpsStatusListener(handleGpsStatusChange);
      stopGpsMonitoring();
      
      setGpsEnabled(null);
    }

    return () => {
      // Cleanup when component unmounts
      if (gpsMonitoringActive) {
        removeGpsStatusListener(handleGpsStatusChange);
        stopGpsMonitoring();
      }
    };
  }, [locationRequired, gpsMonitoringActive, handleGpsStatusChange]);

  const openLocationSettings = useCallback(async () => {
    try {
      console.log('[home] Attempting to open location settings...');

      await Linking.openSettings(); // Tidak perlu return value

      console.log('[home] Settings opened successfully');
    } catch (error) {
      console.error('[home] Error opening location settings:', error);

      // fallback manual
      try {
        await Linking.openURL('app-settings:');
      } catch (fallbackError) {
        console.warn(
          '[home] Fallback settings URL also failed:',
          fallbackError,
        );

        Alert.alert(
          'Pengaturan Manual',
          'Silakan buka Pengaturan → Lokasi secara manual untuk mengaktifkan GPS.',
          [{ text: 'OK' }],
        );
      }
    }
  }, []);

  // Function to check GPS/Location services
  const checkLocationServices = useCallback(async () => {
    if (isCheckingLocation.current || !locationRequired) return;

    isCheckingLocation.current = true;
    try {
      const locationReady = await ensureLocationReady();
      if (!locationReady && locationRequired) {
        // Location services are off, show alert
        Alert.alert(
          'GPS/Lokasi Tidak Aktif',
          'Lokasi GPS diperlukan untuk tracking. Silakan aktifkan GPS di pengaturan perangkat Anda.',
          [
            {
              text: 'Pengaturan',
              onPress: () => {
                openLocationSettings();
              },
            },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: () => {
                performLogout();
              },
            },
          ],
          { cancelable: false },
        );
      }
    } catch (error) {
      console.warn('[home] Error checking location services:', error);
    } finally {
      isCheckingLocation.current = false;
    }
  }, [locationRequired, openLocationSettings]);

  // FIXED: Proper logout function similar to DemoDebugScreen
  const performLogout = useCallback(async () => {
    try {
      console.log('[home] Performing logout...');

      // Stop GPS monitoring first
      if (gpsMonitoringActive) {
        removeGpsStatusListener(handleGpsStatusChange);
        stopGpsMonitoring();
        setGpsMonitoringActive(false);
      }

      // Stop tracking
      await stopBackgroundTracking();

      // Clear any intervals
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
        locationCheckInterval.current = null;
      }

      // Clear AsyncStorage similar to DemoDebugScreen
      await AsyncStorage.multiRemove([
        'authToken',
        'kodeKantor',
        'userId',
        'trxBatchId',
        'activeBatchData',
        'trackingActive', // Also clear tracking flag
      ]);

      console.log('[home] AsyncStorage cleared');

      // Reset navigation to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });

      console.log('[home] Navigation reset to Login');
    } catch (error) {
      console.error('[home] Error during logout:', error);

      // Force navigation reset even if there's an error
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      } catch (navError) {
        console.error('[home] Even navigation reset failed:', navError);
        // As last resort, try using the auth store signOut
        signOut();
      }
    }
  }, [navigation, signOut, gpsMonitoringActive, handleGpsStatusChange]);

  const handleLocationPrompt = useCallback(async () => {
    if (!locationRequired || hasShownLocationPrompt.current) return;

    hasShownLocationPrompt.current = true;

    Alert.alert(
      'Tracking Lokasi Diperlukan',
      'Perusahaan mengharuskan tracking lokasi untuk keamanan. Apakah Anda mengizinkan?',
      [
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: async () => {
            // Make sure tracking is stopped
            await stopBackgroundTracking();
            await refreshTrackingStatus();

            // Show warning that they must enable location or logout
            Alert.alert(
              'Lokasi Diperlukan',
              'Tracking lokasi diperlukan untuk menggunakan aplikasi ini. Silakan aktifkan lokasi atau logout dari aplikasi.',
              [
                {
                  text: 'Coba Lagi',
                  onPress: () => {
                    hasShownLocationPrompt.current = false;
                    setTimeout(() => handleLocationPrompt(), 100);
                  },
                },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    performLogout();
                  },
                },
              ],
              { cancelable: false },
            );
          },
        },
        {
          text: 'Ya, Izinkan',
          onPress: async () => {
            try {
              console.log('[home] Starting background tracking...');
              const success = await startBackgroundTrackingIfEnabled();
              console.log('[home] Background tracking result:', success);

              await refreshTrackingStatus();

              if (success) {
                Alert.alert('Berhasil', 'Tracking lokasi telah diaktifkan.', [
                  { text: 'OK' },
                ]);
              } else {
                Alert.alert(
                  'Gagal',
                  'Gagal mengaktifkan tracking lokasi. Pastikan GPS aktif dan izin lokasi sudah diberikan.',
                  [
                    {
                      text: 'Pengaturan',
                      onPress: () => openLocationSettings(),
                    },
                    {
                      text: 'Coba Lagi',
                      onPress: () => {
                        hasShownLocationPrompt.current = false;
                        setTimeout(() => handleLocationPrompt(), 100);
                      },
                    },
                    {
                      text: 'Logout',
                      style: 'destructive',
                      onPress: () => performLogout(),
                    },
                  ],
                  { cancelable: false },
                );
              }
            } catch (error) {
              console.error('[home] Error starting tracking:', error);
              await refreshTrackingStatus();
              Alert.alert(
                'Error',
                'Terjadi kesalahan saat mengaktifkan tracking lokasi.',
                [
                  {
                    text: 'Pengaturan',
                    onPress: () => openLocationSettings(),
                  },
                  {
                    text: 'Coba Lagi',
                    onPress: () => {
                      hasShownLocationPrompt.current = false;
                      setTimeout(() => handleLocationPrompt(), 100);
                    },
                  },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => performLogout(),
                  },
                ],
                { cancelable: false },
              );
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, [
    locationRequired,
    performLogout,
    refreshTrackingStatus,
    openLocationSettings,
  ]);

  // Monitor app state changes to check location services
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && locationRequired) {
        // Check location services when app becomes active
        setTimeout(() => {
          checkLocationServices();
          refreshTrackingStatus();
          // Also force GPS check when app becomes active
          if (gpsMonitoringActive) {
            forceGpsStatusCheck();
          }
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [locationRequired, checkLocationServices, refreshTrackingStatus, gpsMonitoringActive]);

  // Set up periodic location check
  useEffect(() => {
    if (locationRequired && trackingActive) {
      // Check location services every 30 seconds
      locationCheckInterval.current = setInterval(() => {
        checkLocationServices();
      }, 30000);
    } else {
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
        locationCheckInterval.current = null;
      }
    }

    return () => {
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
        locationCheckInterval.current = null;
      }
    };
  }, [locationRequired, trackingActive, checkLocationServices]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const initialize = async () => {
        if (!mounted) return;

        // First refresh the tracking status
        await refreshTrackingStatus();

        if (!mounted) return;

        // Then check if we need to show location prompt
        setTimeout(() => {
          if (mounted) {
            handleLocationPrompt();
          }
        }, 500); // Small delay to ensure UI is ready
      };

      initialize();

      return () => {
        mounted = false;
      };
    }, [refreshTrackingStatus, handleLocationPrompt]),
  );

  const startBatch = () => {
    setBatchActive(true);
    setBatchCode('B734211…');
  };

  const finishTransfer = () => {};

  const stopBatch = () => {
    setBatchActive(false);
    setBatchCode(null);
    setTotalMoney(0);
    setTotalDeposit(0);
  };

  const goDaftarNasabah = () => {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate('DaftarNasabah');
    else navigation.navigate('DaftarNasabah');
  };

  const handleTrackingBadgePress = async () => {
    if (locationRequired && !trackingActive) {
      Alert.alert(
        'Tracking Lokasi Nonaktif',
        'Tracking lokasi diperlukan. Apakah Anda ingin mengaktifkannya sekarang?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Aktifkan',
            onPress: async () => {
              try {
                const success = await startBackgroundTrackingIfEnabled();
                await refreshTrackingStatus();
                if (success) {
                  Alert.alert('Berhasil', 'Tracking lokasi telah diaktifkan.');
                } else {
                  Alert.alert(
                    'Gagal',
                    'Gagal mengaktifkan tracking lokasi. Pastikan GPS aktif.',
                    [
                      {
                        text: 'Pengaturan',
                        onPress: () => openLocationSettings(),
                      },
                      { text: 'OK' },
                    ],
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Error',
                  'Terjadi kesalahan saat mengaktifkan tracking lokasi.',
                  [
                    {
                      text: 'Pengaturan',
                      onPress: () => openLocationSettings(),
                    },
                    { text: 'OK' },
                  ],
                );
              }
            },
          },
        ],
      );
    } else if (!locationRequired) {
      Alert.alert(
        'Info',
        'Tracking lokasi tidak diperlukan oleh perusahaan Anda.',
        [{ text: 'OK' }],
      );
    } else {
      // Already active, show info with GPS monitoring status
      const monitorStatus = getGpsMonitoringStatus();
      Alert.alert(
        'Tracking Aktif', 
        `Tracking lokasi sedang berjalan.\n\nGPS Monitor: ${monitorStatus.isActive ? 'Aktif' : 'Nonaktif'}\nStatus GPS: ${gpsEnabled === true ? 'Aktif' : gpsEnabled === false ? 'Nonaktif' : 'Belum diketahui'}`, 
        [{ text: 'OK' }]
      );
    }
  };

  // NEW: Function to get GPS badge status and color
  const getGpsBadgeInfo = () => {
    if (!locationRequired) return null;
    
    if (gpsEnabled === null) {
      return { text: 'Memeriksa...', style: S.badgeWarning };
    } else if (gpsEnabled === false) {
      return { text: 'GPS Mati', style: S.badgeError };
    } else {
      return { text: 'GPS Aktif', style: S.badgeActive };
    }
  };

  const gpsBadgeInfo = getGpsBadgeInfo();

  const actions: QuickActionProps[] = [
    {
      label: 'Daftar Nasabah',
      onPress: goDaftarNasabah,
      icon: <Users size={22} color={PRIMARY} />,
    },
    {
      label: 'Sejarah Batch',
      onPress: () => {},
      icon: <History size={22} color={PRIMARY} />,
    },
    {
      label: 'Pengajuan\nPinjaman',
      onPress: () => {},
      icon: <FileText size={22} color={PRIMARY} />,
    },
    {
      label: 'Simulasi Kredit',
      onPress: () => {},
      icon: <Calculator size={22} color={PRIMARY} />,
    },
    {
      label: 'UKM',
      onPress: () => {},
      icon: <Briefcase size={22} color={PRIMARY} />,
    },
  ];

  return (
    <SafeAreaView style={S.container} edges={['top', 'left', 'right']}>
      <View style={S.appbar}>
        <Text style={S.appbarTitle}>BPR Dev</Text>
      </View>

      <View style={S.body}>
        <View style={S.header}>
          <Text style={S.greet}>{greetText}</Text>
          <Text style={S.date}>{dateText}</Text>
        </View>

        <View style={S.card}>
          <View style={S.row}>
            <Text style={S.cardLabel}>Batch</Text>
            <Text style={S.cardValue}>{batchActive ? batchCode : '—'}</Text>
          </View>

          <View style={[S.row, { marginTop: 6 }]}>
            <Text style={S.cardLabel}>Status</Text>
            <Text
              style={[S.badge, batchActive ? S.badgeActive : S.badgeInactive]}
            >
              {batchActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {/* Badge status tracking - show only if location is required */}
          {locationRequired && (
            <Pressable
              style={[S.row, { marginTop: 6 }]}
              onPress={handleTrackingBadgePress}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            >
              <Text style={S.cardLabel}>Tracking Lokasi</Text>
              <Text
                style={[
                  S.badge,
                  trackingActive ? S.badgeActive : S.badgeWarning,
                ]}
              >
                {trackingActive ? 'Aktif' : 'Nonaktif'}
              </Text>
            </Pressable>
          )}

          {/* NEW: GPS Status Badge - show only if location is required */}
          {locationRequired && gpsBadgeInfo && (
            <Pressable
              style={[S.row, { marginTop: 6 }]}
              onPress={() => {
                Alert.alert(
                  'Status GPS',
                  `GPS saat ini ${gpsEnabled === true ? 'aktif' : gpsEnabled === false ? 'tidak aktif' : 'sedang diperiksa'}.\n\nMonitoring GPS: ${gpsMonitoringActive ? 'Berjalan setiap 1 menit' : 'Tidak aktif'}`,
                  [
                    {
                      text: 'Periksa Sekarang',
                      onPress: async () => {
                        const status = await forceGpsStatusCheck();
                        Alert.alert('Hasil Pemeriksaan', `GPS saat ini ${status ? 'aktif' : 'tidak aktif'}.`);
                      },
                    },
                    { text: 'OK' },
                  ],
                );
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            >
              <Text style={S.cardLabel}>Status GPS</Text>
              <Text style={[S.badge, gpsBadgeInfo.style]}>
                {gpsBadgeInfo.text}
              </Text>
            </Pressable>
          )}

          <View style={S.statsWrap}>
            <View style={S.stat}>
              <Text style={S.statLabel}>Jumlah Uang</Text>
              <Text style={S.statValue}>{formatIDR(totalMoney)}</Text>
            </View>
            <View style={S.dividerV} />
            <View style={S.stat}>
              <Text style={S.statLabel}>Total Setoran</Text>
              <Text style={S.statValue}>{totalDeposit}</Text>
            </View>
          </View>

          {!batchActive ? (
            <Pressable
              style={S.cta}
              onPress={startBatch}
              android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            >
              <Text style={S.ctaText}>Mulai Batch</Text>
            </Pressable>
          ) : (
            <View style={S.ctaBar}>
              <Pressable
                style={[S.ctaHalf, S.ctaGhost]}
                onPress={finishTransfer}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                <Text style={S.ctaGhostText}>Selesai transfer</Text>
              </Pressable>
              <View style={S.dividerH} />
              <Pressable
                style={S.ctaHalf}
                onPress={stopBatch}
                android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
              >
                <Text style={S.ctaText}>Hentikan batch</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={S.quickRow}>
          {actions.map((a, i) => (
            <QuickAction key={i} {...a} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const SIDE = spacing?.xl ?? 20;
const GAP = spacing?.md ?? 12;
const ITEM_W = (width - SIDE * 2 - GAP * 3) / 4;

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  appbar: {
    height: 56,
    paddingHorizontal: SIDE,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appbarTitle: {
    color: '#fff',
    fontSize: 18,
    letterSpacing: 0.3,
    fontFamily: typography?.primary?.bold ?? 'System',
  },
  body: { flex: 1, paddingHorizontal: SIDE, paddingTop: SIDE, gap: 16 },
  header: { marginBottom: 4 },
  greet: {
    color: TEXT,
    fontSize: 20,
    fontFamily: typography?.primary?.bold ?? 'System',
  },
  date: { color: TEXT_MUTED, marginTop: 4, fontSize: 12 },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: { color: TEXT_MUTED, fontSize: 12 },
  cardValue: {
    color: TEXT,
    fontSize: 14,
    fontFamily: typography?.primary?.medium ?? 'System',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  badgeInactive: { color: WARN_TEXT, backgroundColor: WARN_BG },
  badgeActive: { color: '#065F46', backgroundColor: '#D1FAE5' },
  badgeWarning: { color: '#DC2626', backgroundColor: '#FEE2E2' },
  badgeError: { color: '#991B1B', backgroundColor: '#FECACA' },
  statsWrap: {
    marginTop: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  stat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  statLabel: { color: TEXT_MUTED, fontSize: 12, marginBottom: 6 },
  statValue: {
    color: TEXT,
    fontSize: 18,
    fontFamily: typography?.primary?.bold ?? 'System',
  },
  dividerV: { width: 1, backgroundColor: BORDER },
  cta: {
    marginTop: 4,
    backgroundColor: PRIMARY,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 2,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: typography?.primary?.bold ?? 'System',
    letterSpacing: 0.2,
  },
  ctaBar: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  ctaHalf: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  ctaGhost: { backgroundColor: '#FFFFFF' },
  ctaGhostText: {
    color: TEXT,
    fontSize: 15,
    fontFamily: typography?.primary?.medium ?? 'System',
  },
  dividerH: { width: 1, backgroundColor: BORDER },
  quickRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: GAP,
  },
  quick: { width: ITEM_W, alignItems: 'center', marginBottom: GAP },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE8FF',
    marginBottom: 8,
  },
  quickLabel: {
    color: TEXT,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});