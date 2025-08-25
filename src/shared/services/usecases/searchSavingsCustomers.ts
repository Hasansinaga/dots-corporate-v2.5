import { CustomerRepository } from "../repositories/customer.repository";
export const searchSavingsCustomers =
  (repo: CustomerRepository) => (q: string) =>
    repo.searchSavingsCustomers(q);
