// src/config/env.ts
import {
  API_URL,
  ONESIGNAL_APP_ID,
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
} from '@env';

const PKG = require('../../package.json');

export const ENV = {
  API_URL: API_URL || '',
  ONESIGNAL_APP_ID: ONESIGNAL_APP_ID || '',
  SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  VERSION_APP: (PKG?.version as string) || '', // fallback aman dari package.json
} as const;
