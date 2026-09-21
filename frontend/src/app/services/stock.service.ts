import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StockItem {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantityOnHand: number;
  minStockLevel: number;
  location?: string;
  isActive: boolean;
  status: 'InStock' | 'LowStock' | 'OutOfStock';
  createdAtUtc: string;
}

export interface CreateStockItemRequest {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  initialQuantity: number;
  minStockLevel: number;
  location?: string;
}

export interface UpdateStockItemRequest {
  name: string;
  description?: string;
  categoryId?: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  location?: string;
  isActive: boolean;
}

export interface StockInRequest {
  itemId: number;
  quantity: number;
  unitCost?: number;
  referenceNo?: string;
  supplier?: string;
  notes?: string;
}

export interface StockOutRequest {
  itemId: number;
  quantity: number;
  referenceNo?: string;
  destinationOrCustomer?: string;
  reason: string;
  notes?: string;
}

export interface StockAdjustmentRequest {
  itemId: number;
  newQuantity: number;
  reason: string;
  notes?: string;
}

export interface StockMovement {
  id: number;
  referenceNo: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  itemId: number;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  supplierOrRecipient?: string;
  notes?: string;
  createdByUsername?: string;
  createdAtUtc: string;
}

export interface StockCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface StockSummary {
  totalItems: number;
  totalQuantity: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayMovementsCount: number;
  todayInCount: number;
  todayOutCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  getItems(params?: { search?: string; category?: string; status?: string; isActive?: boolean }): Observable<StockItem[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());

    return this.http.get<StockItem[]>(`${this.apiUrl}/items`, { params: httpParams });
  }

  getItem(id: number): Observable<StockItem> {
    return this.http.get<StockItem>(`${this.apiUrl}/items/${id}`);
  }

  createItem(request: CreateStockItemRequest): Observable<StockItem> {
    return this.http.post<StockItem>(`${this.apiUrl}/items`, request);
  }

  updateItem(id: number, request: UpdateStockItemRequest): Observable<StockItem> {
    return this.http.put<StockItem>(`${this.apiUrl}/items/${id}`, request);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
  }

  recordStockIn(request: StockInRequest): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.apiUrl}/in`, request);
  }

  recordStockOut(request: StockOutRequest): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.apiUrl}/out`, request);
  }

  recordAdjustment(request: StockAdjustmentRequest): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.apiUrl}/adjust`, request);
  }

  getMovements(params?: { itemId?: number; type?: string; limit?: number }): Observable<StockMovement[]> {
    let httpParams = new HttpParams();
    if (params?.itemId) httpParams = httpParams.set('itemId', params.itemId.toString());
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<StockMovement[]>(`${this.apiUrl}/movements`, { params: httpParams });
  }

  getAlerts(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(`${this.apiUrl}/alerts`);
  }

  getCategories(): Observable<StockCategory[]> {
    return this.http.get<StockCategory[]>(`${this.apiUrl}/categories`);
  }

  createCategory(category: { name: string; description?: string }): Observable<StockCategory> {
    return this.http.post<StockCategory>(`${this.apiUrl}/categories`, category);
  }

  getSummary(): Observable<StockSummary> {
    return this.http.get<StockSummary>(`${this.apiUrl}/summary`);
  }
}
