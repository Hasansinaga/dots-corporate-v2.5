import { CoreApi as API } from '../../../services/api';
import { CustomerRepository } from './customer.repository';
import { Customer, CreditCustomer, CollectibilityType } from '../../types/customer';
import { NplData } from '../../types/npl';

const mapSavings = (c: any, s?: any): Customer => ({
  cif: c?.cif ?? 'N/A',
  fullName: c?.full_name ?? c?.id_name ?? 'N/A',
  address: c?.address ?? c?.domicile_address ?? '',
  phone: c?.phone_number ?? '',
  accountNumber: s?.account_number,
  balance: s?.balance,
});

const mapCredit = (loan: any): CreditCustomer => ({
  cif: loan?.customer_data?.cif ?? loan?.cif ?? 'N/A',
  fullName: loan?.customer_data?.full_name ?? loan?.customer_data?.id_name ?? 'N/A',
  address: loan?.customer_data?.address ?? loan?.address ?? '',
  phone: loan?.customer_data?.phone_number ?? '-',
  accountNumber: loan?.account_number,
  balance: loan?.balance ?? 0,
  productName: loan?.product_data?.full_name ?? '-',
  collectibility: loan?.collectibility as CollectibilityType | undefined,
});

const mapNpl = (raw: any): NplData => ({
  amount: Number(raw?.npl_amount ?? 0),
  percentage: Number(raw?.npl_percentage ?? 0),
});

const uniqByCif = <T extends { cif: string }>(arr: (T | null | undefined)[]): T[] => {
  const m = new Map<string, T>();
  for (const it of arr) if (it?.cif) m.set(it.cif, it as T);
  return Array.from(m.values());
};

export class CustomerRepositoryImpl implements CustomerRepository {
  async fetchSavingsCustomers(offset: number, limit: number): Promise<Customer[]> {
    const res = await API.getAllCustomers(offset, limit);
    if (res?.kind !== 'ok' || !Array.isArray(res.customers)) return [];
    const mapped = await Promise.all(
      res.customers.map(async (c: any): Promise<Customer | null> => {
        try {
          const s = await API.getCustomerSavingsByCif(c.cif);
          const first = s?.kind === 'ok' ? s.savings?.[0] : undefined;
          return first ? mapSavings(c, first) : null;
        } catch { return null; }
      }),
    );
    return uniqByCif<Customer>(mapped);
  }

  async searchSavingsCustomers(q: string): Promise<Customer[]> {
    const isCif = /^\d+$/.test(q);
    const res = await API.getAllCustomersSearch(0, 100, isCif ? undefined : q, isCif ? q : undefined);
    if (res?.kind !== 'ok' || !Array.isArray(res.customers)) return [];
    const mapped = await Promise.all(
      res.customers.map(async (c: any): Promise<Customer | null> => {
        try {
          const s = await API.getCustomerSavingsByCif(c.cif);
          const first = s?.kind === 'ok' ? s.savings?.[0] : undefined;
          return first ? mapSavings(c, first) : null;
        } catch { return null; }
      }),
    );
    return uniqByCif<Customer>(mapped);
  }

  async fetchCreditCustomers(filters?: { collectibility?: string[] }): Promise<{ customers: CreditCustomer[]; npl: NplData }> {
    const res = await API.fetchCreditCustomers({ collectibility: filters?.collectibility });
    if (res?.kind !== 'ok') return { customers: [], npl: { amount: 0, percentage: 0 } };
    const loans: CreditCustomer[] = (res.loans ?? []).map(mapCredit);
    const customers: CreditCustomer[] = uniqByCif<CreditCustomer>(loans);
    const npl: NplData = mapNpl(res.npl_data);
    return { customers, npl };
  }

  async searchCreditCustomers(q: string, filters?: { collectibility?: string[] }): Promise<{ customers: CreditCustomer[]; npl: NplData }> {
    const res = await API.searchCreditCustomers(q, filters);
    if (res?.kind !== 'ok') return { customers: [], npl: { amount: 0, percentage: 0 } };
    const loans: CreditCustomer[] = (res.loans ?? []).map(mapCredit);
    const customers: CreditCustomer[] = uniqByCif<CreditCustomer>(loans);
    const npl: NplData = mapNpl(res.npl_data);
    return { customers, npl };
  }
}
