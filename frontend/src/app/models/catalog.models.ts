export interface ProductDto {
  id: number;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  brand?: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantityOnHand: number;
  minStockLevel: number;
  maxStockLevel: number;
  location?: string | null;
  isActive: boolean;
  status: 'InStock' | 'LowStock' | 'OutOfStock' | string;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CreateProductRequest {
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  brand?: string | null;
  unit?: string | null;
  costPrice: number;
  sellingPrice: number;
  initialQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  location?: string | null;
}

export interface UpdateProductRequest {
  name: string;
  description?: string | null;
  categoryId?: number | null;
  brand?: string | null;
  unit?: string | null;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  location?: string | null;
  isActive: boolean;
}

export interface CategoryDto {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAtUtc: string;
}

export interface BarcodeDto {
  id: number;
  productId: number;
  barcode: string;
  barcodeType?: string | null;
  isPrimary: boolean;
  createdAtUtc: string;
}
