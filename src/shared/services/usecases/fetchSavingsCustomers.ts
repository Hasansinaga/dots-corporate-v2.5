import { CustomerRepository } from "../repositories/customer.repository";
export const fetchSavingsCustomers =
  (repo: CustomerRepository) => (offset: number, limit: number) =>
    repo.fetchSavingsCustomers(offset, limit);
