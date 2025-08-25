import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const BASE_URL = (API_URL ?? '').replace(/\/+$/, '');
export const BaseApi = { url: BASE_URL, timeout: 10000 };

function authHeaders(token: string, tenant: string) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenant,
  };
}

async function getAuth() {
  const token = await AsyncStorage.getItem('authToken');
  const tenant = await AsyncStorage.getItem('kodeKantor');
  if (!token || !tenant) return null;
  return { token, tenant };
}

function qs(params: Record<string, string | undefined>) {
  return Object.entries(params)
    .filter(([, v]) => typeof v === 'string' && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
    .join('&');
}

async function getAllCustomers(offset = 0, limit = 10) {
  try {
    const auth = await getAuth();
    if (!auth) return { kind: 'bad-data' };

    const url = `${BaseApi.url}/core/customers?${qs({ offset: String(offset), limit: String(limit) })}`;
    const res = await fetch(url, { method: 'GET', headers: authHeaders(auth.token, auth.tenant) });
    if (!res.ok) return { kind: 'bad-data' };

    const data = await res.json();
    return {
      kind: 'ok',
      customers: data?.customers ?? data?.items ?? [],
      prev: data?.prev ?? data?.previous ?? null,
      next: data?.next ?? null,
    };
  } catch (e) {
    console.error('[getAllCustomers] error:', e);
    return undefined;
  }
}

async function getAllCustomersSearch(offset = 0, limit = 10, full_name?: string, cif?: string) {
  try {
    const auth = await getAuth();
    if (!auth) return { kind: 'bad-data' };

    const url = `${BaseApi.url}/core/customers?${qs({
      offset: String(offset),
      limit: String(limit),
      full_name,
      cif,
    })}`;
    const res = await fetch(url, { method: 'GET', headers: authHeaders(auth.token, auth.tenant) });
    if (!res.ok) return { kind: 'bad-data' };

    const data = await res.json();
    return {
      kind: 'ok',
      customers: data?.customers ?? data?.items ?? [],
      prev: data?.prev ?? data?.previous ?? null,
      next: data?.next ?? null,
    };
  } catch (e) {
    console.error('[getAllCustomersSearch] error:', e);
    return undefined;
  }
}

async function getCustomerSavingsByCif(cif: string) {
  try {
    const auth = await getAuth();
    if (!auth) return { kind: 'bad-data' };

    const url = `${BaseApi.url}/core/customers/${encodeURIComponent(cif)}/savings`;
    const res = await fetch(url, { method: 'GET', headers: authHeaders(auth.token, auth.tenant) });
    if (!res.ok) return { kind: 'bad-data' };

    const data = await res.json();
    return { kind: 'ok', savings: Array.isArray(data) ? data : (data?.savings ?? []) };
  } catch (e) {
    console.error('[getCustomerSavingsByCif] error:', e);
    return undefined;
  }
}

async function getAllLoans(
  collectibility?: string[],
  offset = 0,
  limit = 100,
  days_in_arrears_max?: number,
  days_in_arrears_min = 0,
  cif?: string,
  full_name?: string,
  installment_due_date?: string,
  product_code?: string,
) {
  try {
    const auth = await getAuth();
    if (!auth) return { kind: 'bad-data' };

    const base: Record<string, string | undefined> = {
      offset: String(Math.max(0, offset)),
      limit: String(Math.max(1, limit)),
      days_in_arrears_min: String(Math.max(0, days_in_arrears_min)),
      cif: cif?.trim(),
      full_name: full_name?.trim(),
      installment_due_date: installment_due_date?.trim(),
      product_code: product_code?.trim(),
    };
    if (typeof days_in_arrears_max === 'number') base.days_in_arrears_max = String(Math.max(0, days_in_arrears_max));

    let query = qs(base);
    if (Array.isArray(collectibility) && collectibility.length) {
      const extra = collectibility
        .filter(c => c && c.trim())
        .map(c => `collectibility=${encodeURIComponent(c.trim())}`)
        .join('&');
      query = query ? `${query}&${extra}` : extra;
    }

    const url = `${BaseApi.url}/core/loans?${query}`;
    const res = await fetch(url, { method: 'GET', headers: authHeaders(auth.token, auth.tenant) });
    if (!res.ok) return { kind: 'bad-data' };

    const data = await res.json();
    return {
      kind: 'ok',
      loans: data?.loans ?? [],
      npl_data: data?.npl_data ?? {
        ao_code: '',
        office_code: '',
        kol1_total: '0',
        kol2_total: '0',
        kol3_total: '0',
        kol4_total: '0',
        kol5_total: '0',
        npl_amount: '0',
        npl_percentage: '0',
      },
    };
  } catch (e) {
    console.error('[getAllLoans] error:', e);
    return undefined;
  }
}

function fetchCreditCustomers(filters?: { collectibility?: string[] }) {
  return getAllLoans(filters?.collectibility, 0, 100);
}

function searchCreditCustomers(q: string, filters?: { collectibility?: string[] }) {
  const isCif = /^\d+$/.test(q);
  return getAllLoans(
    filters?.collectibility,
    0,
    100,
    undefined,
    0,
    isCif ? q : undefined,
    !isCif ? q : undefined,
  );
}

async function getFeatureFlag(key: string) {
  try {
    const auth = await getAuth();
    if (!auth) return { kind: 'bad-data' };

    const url = `${BaseApi.url}/mobile-corporate/featureflags?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { method: 'GET', headers: authHeaders(auth.token, auth.tenant) });
    if (!res.ok) return { kind: 'bad-data' };

    const data = await res.json();
    return { kind: 'ok', value: data };
  } catch (e) {
    console.error('[getFeatureFlag] error:', e);
    return undefined;
  }
}

export const api = {
  getAllCustomers,
  getAllCustomersSearch,
  getCustomerSavingsByCif,
  getAllLoans,
  fetchCreditCustomers,
  searchCreditCustomers,
  getFeatureFlag,
};

export const CoreApi = api;
export default api;
