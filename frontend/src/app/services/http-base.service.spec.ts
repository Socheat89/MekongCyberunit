import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpBaseService } from './http-base.service';
import { environment } from '../../environments/environment';

describe('HttpBaseService', () => {
  let service: HttpBaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpBaseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HttpBaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should issue GET request with cleaned parameters', () => {
    service.get('inventory/stocks', {
      search: 'coffee',
      warehouseId: 1,
      emptyVal: '',
      nullVal: null,
      undefinedVal: undefined
    }).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(req => {
      return (
        req.url === `${environment.apiUrl}/inventory/stocks` &&
        req.params.has('search') &&
        req.params.has('warehouseId') &&
        !req.params.has('emptyVal') &&
        !req.params.has('nullVal') &&
        !req.params.has('undefinedVal')
      );
    });

    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, pageNumber: 1, pageSize: 25 });
  });

  it('should issue POST request with body', () => {
    const postBody = { warehouseId: 1, productId: 10, newQuantity: 15, reason: 'Audit' };

    service.post('inventory/adjust', postBody).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/inventory/adjust`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(postBody);

    req.flush({ id: 1, adjustmentNo: 'ADJ-001', ...postBody });
  });

  it('should extract error message from ProblemDetails', () => {
    let errorReceived: any;

    service.get('test/error').subscribe({
      next: () => expect(true).toBe(false),
      error: err => {
        errorReceived = err;
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/test/error`);
    req.flush(
      { message: 'Warehouse code already exists' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(errorReceived).toBeTruthy();
    expect(errorReceived.message).toContain('Warehouse code already exists');
  });
});
