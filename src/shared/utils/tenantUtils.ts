import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get tenant ID (KodeKantor) from AsyncStorage
 * This is the LJK code used for API calls
 */
export async function getTenantId(): Promise<string | null> {
  try {
    const kodeKantor = await AsyncStorage.getItem('kodeKantor');
    console.log('[tenant-utils] Retrieved KodeKantor:', kodeKantor);
    return kodeKantor;
  } catch (error) {
    console.error('[tenant-utils] Error getting KodeKantor:', error);
    return null;
  }
}

/**
 * Get tenant ID with fallback to default
 */
export async function getTenantIdWithFallback(defaultTenantId: string = '600001'): Promise<string> {
  const tenantId = await getTenantId();
  return tenantId || defaultTenantId;
}
