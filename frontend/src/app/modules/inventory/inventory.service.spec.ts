import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { environment } from '../../../environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load stocks and update state store', () => {
    service.loadStocks();

    const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/inventory/stocks`);
    expect(req.request.method).toBe('GET');

    req.flush({
      items: [
        {
          id: 1,
          warehouseId: 1,
          warehouseName: 'HQ Warehouse',
          productId: 101,
          productSku: 'SKU-COFFEE-01',
          productName: 'Mekong Robusta Whole Beans 1kg',
          quantityOnHand: 45,
          reservedQuantity: 5,
          availableQuantity: 40,
          updatedAtUtc: new Date().toISOString()
        }
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 25,
      totalPages: 1
    });

    expect(service.store.items().length).toBe(1);
    expect(service.store.items()[0].productSku).toBe('SKU-COFFEE-01');
    expect(service.store.totalCount()).toBe(1);
    expect(service.store.loading()).toBe(false);
  });

  it('should load warehouses', () => {
    service.loadWarehouses();

    const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/warehouses`);
    expect(req.request.method).toBe('GET');

    req.flush([
      { id: 1, code: 'WH-HQ', name: 'Phnom Penh HQ', isActive: true, createdAtUtc: new Date().toISOString() }
    ]);

    expect(service.warehouses().length).toBe(1);
    expect(service.warehouses()[0].code).toBe('WH-HQ');
  });

  it('should post stock adjustment and trigger refresh', () => {
    service.recordAdjustment({
      warehouseId: 1,
      productId: 101,
      adjustmentType: 'AUDIT',
      newQuantity: 50,
      reason: 'Physical count verified'
    }).subscribe(res => {
      expect(res.adjustmentNo).toBe('ADJ-2026-001');
    });

    const adjustReq = httpMock.expectOne(`${environment.apiUrl}/inventory/adjust`);
    expect(adjustReq.request.method).toBe('POST');
    adjustReq.flush({
      id: 1,
      adjustmentNo: 'ADJ-2026-001',
      warehouseId: 1,
      productId: 101,
      quantityBefore: 45,
      quantityAdjusted: 5,
      quantityAfter: 50
    });

    // Expect stocks and alerts reload requests
    const stocksReq = httpMock.expectOne(req => req.url === `${environment.apiUrl}/inventory/stocks`);
    stocksReq.flush({ items: [], totalCount: 0, pageNumber: 1, pageSize: 25 });

    const alertsReq = httpMock.expectOne(`${environment.apiUrl}/inventory/alerts`);
    alertsReq.flush([]);
  });
});
