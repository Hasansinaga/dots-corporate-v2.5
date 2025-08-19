import { CustomerRepository } from "../repositories/customer.repository";
export const searchCreditCustomers =
  (repo: CustomerRepository) => (q: string, filters?: { collectibility?: string[] }) =>
    repo.searchCreditCustomers(q, filters);
