export interface CustomerDto {
  id: number;
  customerCode: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  customerType: string;
  creditLimit: number;
  paymentTerms: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CreateCustomerRequest {
  customerCode: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  customerType?: string | null;
  creditLimit: number;
  paymentTerms?: string | null;
}

export interface UpdateCustomerRequest {
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  customerType?: string | null;
  creditLimit: number;
  paymentTerms?: string | null;
  isActive: boolean;
}
