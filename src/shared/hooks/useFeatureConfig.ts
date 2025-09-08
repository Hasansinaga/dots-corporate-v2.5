import { useState, useEffect, useCallback } from 'react';
import { cfgsysService } from '../services/cfgsysService';
import { FeatureConfigs } from '../types/cfgsys';

interface UseFeatureConfigOptions {
  ljkCode?: string;
  autoLoad?: boolean;
}

interface UseFeatureConfigReturn {
  configs: FeatureConfigs;
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (code: string) => boolean;
  loadConfigs: (codes: string[]) => Promise<void>;
  refreshConfigs: () => Promise<void>;
}

export function useFeatureConfig(options: UseFeatureConfigOptions = {}): UseFeatureConfigReturn {
  const { ljkCode = '600001', autoLoad = false } = options;
  
  const [configs, setConfigs] = useState<FeatureConfigs>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedCodes, setLastLoadedCodes] = useState<string[]>([]);

  const loadConfigs = useCallback(async (codes: string[]) => {
    if (codes.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[feature-config] Loading configs for codes:', codes);
      const loadedConfigs = await cfgsysService.getCompanyConfigs(ljkCode, codes);
      setConfigs(loadedConfigs);
      setLastLoadedCodes(codes);
      console.log('[feature-config] Configs loaded successfully:', loadedConfigs);
    } catch (err: any) {
      console.error('[feature-config] Error loading configs:', err);
      setError(err.message || 'Failed to load feature configs');
    } finally {
      setIsLoading(false);
    }
  }, [ljkCode]);

  const refreshConfigs = useCallback(async () => {
    if (lastLoadedCodes.length > 0) {
      await loadConfigs(lastLoadedCodes);
    }
  }, [loadConfigs, lastLoadedCodes]);

  const isFeatureEnabled = useCallback((code: string): boolean => {
    const config = configs[code];
    return config ? config.enabled : false;
  }, [configs]);

  // Auto load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      // Load common feature codes
      const commonCodes = [
        'MBCORP_NOTIF_WHATSAPP',
        'MBCORP_UKM_FEATURE',
        'MBCORP_SIMULASI_KREDIT',
        'MBCORP_PENGAJUAN_PINJAMAN',
        'MBCORP_SEJARAH_BATCH',
        'MBCORP_DAFTAR_NASABAH',
      ];
      loadConfigs(commonCodes);
    }
  }, [autoLoad, loadConfigs]);

  return {
    configs,
    isLoading,
    error,
    isFeatureEnabled,
    loadConfigs,
    refreshConfigs,
  };
}

// Hook khusus untuk QuickActions
export function useQuickActionsConfig() {
  const { configs, isLoading, error, isFeatureEnabled, loadConfigs } = useFeatureConfig({
    ljkCode: '600001',
  });

  const loadQuickActionsConfig = useCallback(async () => {
    const quickActionCodes = [
      'MBCORP_DAFTAR_NASABAH',
      'MBCORP_SEJARAH_BATCH', 
      'MBCORP_PENGAJUAN_PINJAMAN',
      'MBCORP_SIMULASI_KREDIT',
      'MBCORP_UKM_FEATURE',
    ];
    
    console.log('[quick-actions-config] Loading configs for codes:', quickActionCodes);
    await loadConfigs(quickActionCodes);
  }, [loadConfigs]);

  const showDaftarNasabah = isFeatureEnabled('MBCORP_DAFTAR_NASABAH');
  const showSejarahBatch = isFeatureEnabled('MBCORP_SEJARAH_BATCH');
  const showPengajuanPinjaman = isFeatureEnabled('MBCORP_PENGAJUAN_PINJAMAN');
  const showSimulasiKredit = isFeatureEnabled('MBCORP_SIMULASI_KREDIT');
  const showUKM = isFeatureEnabled('MBCORP_UKM_FEATURE');

  // Debug logging
  console.log('[quick-actions-config] Feature states:', {
    showDaftarNasabah,
    showSejarahBatch,
    showPengajuanPinjaman,
    showSimulasiKredit,
    showUKM,
    configs,
  });

  return {
    configs,
    isLoading,
    error,
    isFeatureEnabled,
    loadQuickActionsConfig,
    // Specific feature checks
    showDaftarNasabah,
    showSejarahBatch,
    showPengajuanPinjaman,
    showSimulasiKredit,
    showUKM,
  };
}
