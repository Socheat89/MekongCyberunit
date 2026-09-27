export interface WarehouseDto {
  id: number;
  code: string;
  name: string;
  location?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAtUtc: string;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  location?: string | null;
  contactPhone?: string | null;
}

export interface UpdateWarehouseRequest {
  name: string;
  location?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
}

export interface WarehouseStockDto {
  id: number;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productSku: string;
  productName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAtUtc: string;
}

export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'INITIAL';

export interface StockMovementDto {
  id: number;
  referenceNo: string;
  movementType: MovementType | string;
  referenceType?: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string | null;
  supplierOrRecipient?: string | null;
  notes?: string | null;
  createdByUsername?: string | null;
  createdAtUtc: string;
}

export type AdjustmentType = 'SURPLUS' | 'SHRINKAGE' | 'DAMAGE' | 'AUDIT';

export interface CreateAdjustmentRequest {
  warehouseId: number;
  productId: number;
  adjustmentType: AdjustmentType | string;
  newQuantity: number;
  reason: string;
  notes?: string | null;
}

export interface StockAdjustmentDto {
  id: number;
  adjustmentNo: string;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productSku: string;
  productName: string;
  adjustmentType: string;
  quantityBefore: number;
  quantityAdjusted: number;
  quantityAfter: number;
  unitCost: number;
  reason: string;
  notes?: string | null;
  createdByUsername?: string | null;
  createdAtUtc: string;
}

export interface TransferItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateTransferRequest {
  fromWarehouseId: number;
  toWarehouseId: number;
  notes?: string | null;
  items: TransferItemRequest[];
}

export interface StockTransferItemDto {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
}

export interface StockTransferDto {
  id: number;
  transferNo: string;
  fromWarehouseId: number;
  fromWarehouseName: string;
  toWarehouseId: number;
  toWarehouseName: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | string;
  notes?: string | null;
  createdByUsername?: string | null;
  createdAtUtc: string;
  completedAtUtc?: string | null;
  items: StockTransferItemDto[];
}

export interface StockAlertDto {
  productId: number;
  productSku: string;
  productName: string;
  quantityOnHand: number;
  minStockLevel: number;
  maxStockLevel: number;
  status: 'InStock' | 'LowStock' | 'OutOfStock' | string;
}
