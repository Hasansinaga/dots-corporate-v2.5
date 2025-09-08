export interface CompanyCfgsys {
  ljk_code: string;
  code: string;
  numvalue1: number;
  numvalue2: number;
  textvalue1: string;
  textvalue2: string;
  description: string;
  stsbar: number;
  decval1: number;
  decval2: number;
  session_code: string | null;
}

export type CompanyCfgsysResponse = CompanyCfgsys[];

export interface FeatureConfig {
  code: string;
  enabled: boolean;
  description: string;
}

export interface FeatureConfigs {
  [key: string]: FeatureConfig;
}
