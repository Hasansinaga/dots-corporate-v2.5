import API from '../services/APIManager';
import { CompanyCfgsys, CompanyCfgsysResponse, FeatureConfig, FeatureConfigs } from '../types/cfgsys';

class CfgsysService {
  private baseUrl = '/core/company-cfgsys';

  /**
   * Get company configuration by ljk_code and code
   */
  async getCompanyConfig(ljkCode: string, code: string): Promise<CompanyCfgsys | null> {
    try {
      console.log('[cfgsys] Getting config:', { ljkCode, code, endpoint: this.baseUrl });
      const response = await API.get<CompanyCfgsysResponse>(this.baseUrl, {
        params: {
          ljk_code: ljkCode,
          code: code,
        },
      });

      console.log('[cfgsys] API response:', response.data);
      const configs = response.data;
      if (configs && configs.length > 0) {
        console.log('[cfgsys] Config found:', configs[0]);
        return configs[0];
      }

      console.log('[cfgsys] No config found for:', { ljkCode, code });
      return null;
    } catch (error: any) {
      console.error('[cfgsys] Error getting config:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        endpoint: this.baseUrl,
        ljkCode,
        code
      });
      throw new Error(`Failed to get company config: ${error.message}`);
    }
  }

  /**
   * Get multiple company configurations
   */
  async getCompanyConfigs(ljkCode: string, codes: string[]): Promise<FeatureConfigs> {
    try {
      console.log('[cfgsys] Getting multiple configs:', { ljkCode, codes });
      
      const configs: FeatureConfigs = {};
      
      // Get all configs in parallel
      const promises = codes.map(async (code) => {
        try {
          const config = await this.getCompanyConfig(ljkCode, code);
          if (config) {
            configs[code] = {
              code: config.code,
              enabled: config.numvalue1 === 1 && config.numvalue2 === 1,
              description: config.description,
            };
          } else {
            configs[code] = {
              code,
              enabled: false,
              description: '',
            };
          }
        } catch (error) {
          console.warn('[cfgsys] Failed to get config for:', code);
          configs[code] = {
            code,
            enabled: false,
            description: '',
          };
        }
      });

      await Promise.all(promises);
      
      console.log('[cfgsys] All configs loaded:', configs);
      return configs;
    } catch (error: any) {
      console.error('[cfgsys] Error getting multiple configs:', error.message);
      throw new Error(`Failed to get company configs: ${error.message}`);
    }
  }

  /**
   * Check if a feature is enabled based on numvalue1 and numvalue2
   */
  isFeatureEnabled(config: CompanyCfgsys | null): boolean {
    if (!config) return false;
    return config.numvalue1 === 1 && config.numvalue2 === 1;
  }

  /**
   * Get feature status for a specific code
   */
  async isFeatureEnabledByCode(ljkCode: string, code: string): Promise<boolean> {
    try {
      const config = await this.getCompanyConfig(ljkCode, code);
      return this.isFeatureEnabled(config);
    } catch (error) {
      console.error('[cfgsys] Error checking feature status:', error);
      return false;
    }
  }
}

export const cfgsysService = new CfgsysService();
