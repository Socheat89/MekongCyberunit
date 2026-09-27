import { TestBed } from '@angular/core/testing';
import { StateHandlerService } from './state-handler.service';
import { PagedResult } from '../models/common.models';

interface TestItem {
  id: number;
  name: string;
}

describe('StateHandlerService & EntityStateStore', () => {
  let service: StateHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateHandlerService);
  });

  it('should initialize store with default values', () => {
    const store = service.createStore<TestItem>();
    expect(store.items()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.totalCount()).toBe(0);
    expect(store.page()).toBe(1);
    expect(store.pageSize()).toBe(25);
    expect(store.isEmpty()).toBe(true);
    expect(store.hasData()).toBe(false);
  });

  it('should update state when setPagedResult is called', () => {
    const store = service.createStore<TestItem>();
    const mockResult: PagedResult<TestItem> = {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ],
      totalCount: 50,
      pageNumber: 1,
      pageSize: 25,
      totalPages: 2
    };

    store.setPagedResult(mockResult);

    expect(store.items().length).toBe(2);
    expect(store.totalCount()).toBe(50);
    expect(store.page()).toBe(1);
    expect(store.totalPages()).toBe(2);
    expect(store.hasData()).toBe(true);
    expect(store.isEmpty()).toBe(false);
    expect(store.hasNextPage()).toBe(true);
    expect(store.hasPreviousPage()).toBe(false);
    expect(store.rangeLabel()).toBe('1 - 25 of 50');
  });

  it('should handle pagination changes properly', () => {
    const store = service.createStore<TestItem>();
    store.totalCount.set(60);
    store.pageSize.set(20);

    expect(store.totalPages()).toBe(3);

    store.nextPage();
    expect(store.page()).toBe(2);
    expect(store.hasPreviousPage()).toBe(true);
    expect(store.hasNextPage()).toBe(true);

    store.nextPage();
    expect(store.page()).toBe(3);
    expect(store.hasNextPage()).toBe(false);

    store.previousPage();
    expect(store.page()).toBe(2);
  });

  it('should handle filters and search updates', () => {
    const store = service.createStore<TestItem>();
    store.setPage(3);
    store.setSearch('test query');

    expect(store.searchTerm()).toBe('test query');
    expect(store.page()).toBe(1); // resets page to 1

    store.setFilter('warehouseId', 2);
    expect(store.filters()['warehouseId']).toBe(2);

    store.clearFilters();
    expect(store.filters()).toEqual({});
    expect(store.searchTerm()).toBe('');
  });

  it('should toggle view mode between table and kanban', () => {
    const store = service.createStore<TestItem>();
    expect(store.viewMode()).toBe('table');

    store.toggleViewMode();
    expect(store.viewMode()).toBe('kanban');

    store.toggleViewMode();
    expect(store.viewMode()).toBe('table');
  });
});
