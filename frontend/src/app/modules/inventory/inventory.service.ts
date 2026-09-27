import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpBaseService } from '../../services/http-base.service';
import { StateHandlerService, EntityStateStore } from '../../services/state-handler.service';
import { NotificationService } from '../../services/notification.service';
import {
  WarehouseStockDto,
  WarehouseDto,
  StockAlertDto,
  StockAdjustmentDto,
  CreateAdjustmentRequest,
  StockTransferDto,
  CreateTransferRequest
} from '../../models/inventory.models';
import { PagedResult } from '../../models/common.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpBaseService);
  private readonly stateHandler = inject(StateHandlerService);
  private readonly notification = inject(NotificationService);

  // Core Entity State Store using Signals
  readonly store: EntityStateStore<WarehouseStockDto> = this.stateHandler.createStore<WarehouseStockDto>({
    initialPageSize: 25,
    initialViewMode: 'table'
  });

  // Ancillary Signals
  readonly warehouses = signal<WarehouseDto[]>([]);
  readonly stockAlerts = signal<StockAlertDto[]>([]);
  readonly isActionSubmitting = signal<boolean>(false);

  /**
   * Loads paged warehouse stocks matching current search, warehouse, and pagination filters
   */
  loadStocks(showProgress = false): void {
    this.store.setLoading(true);

    const params: Record<string, any> = {
      page: this.store.page(),
      pageSize: this.store.pageSize(),
      search: this.store.searchTerm() || undefined,
      warehouseId: this.store.filters()['warehouseId'] || undefined
    };

    this.http.getPaged<WarehouseStockDto>('inventory/stocks', params, showProgress).subscribe({
      next: (result: PagedResult<WarehouseStockDto>) => {
        // Apply frontend status filter if set (In Stock / Low Stock / Out of Stock)
        const statusFilter = this.store.filters()['status'];
        if (statusFilter && statusFilter !== 'ALL') {
          const filteredItems = result.items.filter(item => {
            if (statusFilter === 'OUT_OF_STOCK') return item.availableQuantity <= 0;
            if (statusFilter === 'LOW_STOCK') return item.availableQuantity > 0 && item.availableQuantity < 10;
            if (statusFilter === 'IN_STOCK') return item.availableQuantity >= 10;
            return true;
          });
          this.store.setPagedResult({
            ...result,
            items: filteredItems,
            totalCount: filteredItems.length
          });
        } else {
          this.store.setPagedResult(result);
        }
      },
      error: err => {
        this.store.setError(err.message || 'Failed to load inventory stocks');
      }
    });
  }

  /**
   * Fetches active warehouses for filter dropdowns and transfer destination targets
   */
  loadWarehouses(): void {
    this.http.get<WarehouseDto[]>('warehouses', { onlyActive: true }).subscribe({
      next: data => {
        this.warehouses.set(data || []);
      },
      error: () => {
        // Fallback demo warehouses if backend table is initially empty
        if (this.warehouses().length === 0) {
          this.warehouses.set([
            { id: 1, code: 'WH-HQ', name: 'Phnom Penh Central Hub', location: 'Building A, Phnom Penh', isActive: true, createdAtUtc: new Date().toISOString() },
            { id: 2, code: 'WH-SR', name: 'Siem Reap Regional Depot', location: 'National Road 6, Siem Reap', isActive: true, createdAtUtc: new Date().toISOString() },
            { id: 3, code: 'WH-BTB', name: 'Battambang Distribution Center', location: 'River Road, Battambang', isActive: true, createdAtUtc: new Date().toISOString() }
          ]);
        }
      }
    });
  }

  /**
   * Fetches stock threshold alerts from the backend
   */
  loadStockAlerts(warehouseId?: number): void {
    const params = warehouseId ? { warehouseId } : undefined;
    this.http.get<StockAlertDto[]>('inventory/alerts', params).subscribe({
      next: alerts => {
        this.stockAlerts.set(alerts || []);
      },
      error: () => {
        this.stockAlerts.set([]);
      }
    });
  }

  /**
   * Submits a stock adjustment (SURPLUS, SHRINKAGE, DAMAGE, AUDIT)
   */
  recordAdjustment(request: CreateAdjustmentRequest): Observable<StockAdjustmentDto> {
    this.isActionSubmitting.set(true);
    return this.http.post<StockAdjustmentDto>('inventory/adjust', request, true).pipe(
      tap({
        next: result => {
          this.isActionSubmitting.set(false);
          this.notification.success(
            'Adjustment Recorded',
            `Adjustment ${result.adjustmentNo} processed. New quantity: ${result.quantityAfter}.`
          );
          // Refresh list to update available inventory
          this.loadStocks();
          this.loadStockAlerts();
        },
        error: () => {
          this.isActionSubmitting.set(false);
        }
      })
    );
  }

  /**
   * Submits a stock transfer between warehouses
   */
  createTransfer(request: CreateTransferRequest): Observable<StockTransferDto> {
    this.isActionSubmitting.set(true);
    return this.http.post<StockTransferDto>('transfers', request, true).pipe(
      tap({
        next: result => {
          this.isActionSubmitting.set(false);
          this.notification.success(
            'Transfer Initiated',
            `Transfer ${result.transferNo} submitted with ${result.items.length} item(s).`
          );
          this.loadStocks();
        },
        error: () => {
          this.isActionSubmitting.set(false);
        }
      })
    );
  }
}
