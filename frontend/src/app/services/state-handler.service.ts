import { Injectable, computed, signal, Signal, WritableSignal } from '@angular/core';
import { PagedResult } from '../models/common.models';

export type ViewMode = 'table' | 'kanban';

export interface StateStoreOptions<T> {
  initialPageSize?: number;
  initialViewMode?: ViewMode;
  initialFilters?: Record<string, any>;
}

/**
 * Generic Entity State Store leveraging Angular Signals for ultra-responsive,
 * predictable enterprise UI state management.
 */
export class EntityStateStore<T> {
  // Core State Signals
  readonly items: WritableSignal<T[]> = signal<T[]>([]);
  readonly selectedItem: WritableSignal<T | null> = signal<T | null>(null);
  readonly totalCount: WritableSignal<number> = signal<number>(0);
  readonly page: WritableSignal<number> = signal<number>(1);
  readonly pageSize: WritableSignal<number>;
  readonly loading: WritableSignal<boolean> = signal<boolean>(false);
  readonly error: WritableSignal<string | null> = signal<string | null>(null);
  readonly searchTerm: WritableSignal<string> = signal<string>('');
  readonly filters: WritableSignal<Record<string, any>>;
  readonly viewMode: WritableSignal<ViewMode>;
  readonly sortColumn: WritableSignal<string | null> = signal<string | null>(null);
  readonly sortDirection: WritableSignal<'asc' | 'desc'> = signal<'asc' | 'desc'>('asc');

  // Derived Computed Signals
  readonly isEmpty: Signal<boolean> = computed(
    () => !this.loading() && this.items().length === 0
  );
  readonly hasData: Signal<boolean> = computed(
    () => this.items().length > 0
  );
  readonly totalPages: Signal<number> = computed(() => {
    const total = this.totalCount();
    const size = this.pageSize() || 1;
    return Math.max(1, Math.ceil(total / size));
  });
  readonly hasPreviousPage: Signal<boolean> = computed(
    () => this.page() > 1
  );
  readonly hasNextPage: Signal<boolean> = computed(
    () => this.page() < this.totalPages()
  );
  readonly rangeStart: Signal<number> = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });
  readonly rangeEnd: Signal<number> = computed(() => {
    return Math.min(this.page() * this.pageSize(), this.totalCount());
  });
  readonly rangeLabel: Signal<string> = computed(() => {
    if (this.totalCount() === 0) return '0 items';
    return `${this.rangeStart()} - ${this.rangeEnd()} of ${this.totalCount()}`;
  });

  constructor(options?: StateStoreOptions<T>) {
    this.pageSize = signal<number>(options?.initialPageSize ?? 25);
    this.viewMode = signal<ViewMode>(options?.initialViewMode ?? 'table');
    this.filters = signal<Record<string, any>>(options?.initialFilters ?? {});
  }

  // State Mutation Actions
  setLoading(isLoading: boolean): void {
    this.loading.set(isLoading);
    if (isLoading) {
      this.error.set(null);
    }
  }

  setError(errorMsg: string | null): void {
    this.error.set(errorMsg);
    this.loading.set(false);
  }

  setItems(items: T[], total?: number): void {
    this.items.set(items);
    this.totalCount.set(total !== undefined ? total : items.length);
    this.loading.set(false);
    this.error.set(null);
  }

  setPagedResult(result: PagedResult<T>): void {
    this.items.set(result.items || []);
    this.totalCount.set(result.totalCount || 0);
    this.page.set(result.pageNumber || 1);
    this.pageSize.set(result.pageSize || 25);
    this.loading.set(false);
    this.error.set(null);
  }

  selectItem(item: T | null): void {
    this.selectedItem.set(item);
  }

  setPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages()) {
      this.page.set(pageNumber);
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.page.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.page.update(p => p - 1);
    }
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1); // Reset to page 1 when page size changes
  }

  setSearch(term: string): void {
    this.searchTerm.set(term);
    this.page.set(1);
  }

  setFilter(key: string, value: any): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.page.set(1);
  }

  removeFilter(key: string): void {
    this.filters.update(f => {
      const next = { ...f };
      delete next[key];
      return next;
    });
    this.page.set(1);
  }

  clearFilters(): void {
    this.filters.set({});
    this.searchTerm.set('');
    this.page.set(1);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  toggleViewMode(): void {
    this.viewMode.update(m => (m === 'table' ? 'kanban' : 'table'));
  }

  setSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  patchItem(predicate: (item: T) => boolean, updater: (item: T) => T): void {
    this.items.update(list =>
      list.map(item => (predicate(item) ? updater(item) : item))
    );
  }

  removeItem(predicate: (item: T) => boolean): void {
    this.items.update(list => list.filter(item => !predicate(item)));
    this.totalCount.update(c => Math.max(0, c - 1));
  }

  addItem(item: T, prepend = true): void {
    this.items.update(list => (prepend ? [item, ...list] : [...list, item]));
    this.totalCount.update(c => c + 1);
  }

  reset(): void {
    this.items.set([]);
    this.selectedItem.set(null);
    this.totalCount.set(0);
    this.page.set(1);
    this.loading.set(false);
    this.error.set(null);
    this.searchTerm.set('');
    this.filters.set({});
  }
}

@Injectable({
  providedIn: 'root'
})
export class StateHandlerService {
  /**
   * Factory method to create an isolated, strongly-typed EntityStateStore
   */
  createStore<T>(options?: StateStoreOptions<T>): EntityStateStore<T> {
    return new EntityStateStore<T>(options);
  }
}
