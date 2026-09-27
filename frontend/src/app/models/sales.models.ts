export interface SalesOrderDto {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  warehouseId?: number | null;
  warehouseName?: string | null;
  saleDateUtc: string;
  status: 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED' | string;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string | null;
  createdByUsername?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  items: SalesOrderItemDto[];
  payments?: SalePaymentDto[];
}

export interface SalesOrderItemDto {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface SalePaymentDto {
  id: number;
  paymentNumber: string;
  salesOrderId: number;
  amount: number;
  paymentMethod: string;
  paymentDateUtc: string;
  referenceNo?: string | null;
  notes?: string | null;
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

export interface InitialPaymentRequest {
  paymentMethod: string;
  amount: number;
  referenceNo?: string | null;
  notes?: string | null;
}

export interface CreateSaleRequest {
  customerId: number;
  warehouseId?: number | null;
  tax: number;
  discount: number;
  notes?: string | null;
  autoConfirm: boolean;
  items: CreateSaleItemRequest[];
  initialPayment?: InitialPaymentRequest | null;
}
