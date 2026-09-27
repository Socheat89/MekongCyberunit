export interface PurchaseOrderDto {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  warehouseId?: number | null;
  warehouseName?: string | null;
  orderDateUtc: string;
  expectedDateUtc?: string | null;
  paymentTerms: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | string;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  notes?: string | null;
  createdByUsername?: string | null;
  approvedByUsername?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemDto {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
  subtotal: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface CreatePoItemRequest {
  productId: number;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
}

export interface CreatePoRequest {
  supplierId: number;
  warehouseId?: number | null;
  expectedDateUtc?: string | null;
  paymentTerms?: string | null;
  tax: number;
  discount: number;
  notes?: string | null;
  items: CreatePoItemRequest[];
}
