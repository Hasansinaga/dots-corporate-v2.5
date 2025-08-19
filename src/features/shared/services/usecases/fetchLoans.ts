import { CustomerRepository } from "../repositories/customer.repository";
export const fetchLoans =
  (repo: CustomerRepository) => (filters?: { collectibility?: string[] }) =>
    repo.fetchCreditCustomers(filters);
