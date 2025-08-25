export type CollectibilityType = "1" | "2" | "3" | "4" | "5";

export interface Customer {
  cif: string;
  fullName: string;
  address?: string;
  phone?: string;
  accountNumber?: string;
  balance?: number;
}

export interface CreditCustomer extends Customer {
  collectibility?: CollectibilityType;
  productName?: string;
}
