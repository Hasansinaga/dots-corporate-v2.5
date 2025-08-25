import { Customer, CreditCustomer } from "../../types/customer";
import { NplData } from "../../types/npl";

export interface CustomerRepository {
  // savings
  fetchSavingsCustomers(offset: number, limit: number): Promise<Customer[]>;
  searchSavingsCustomers(query: string): Promise<Customer[]>;

  // credit
  fetchCreditCustomers(filters?: { collectibility?: string[] }): Promise<{ customers: CreditCustomer[]; npl: NplData }>;
  searchCreditCustomers(query: string, filters?: { collectibility?: string[] }): Promise<{ customers: CreditCustomer[]; npl: NplData }>;
}
