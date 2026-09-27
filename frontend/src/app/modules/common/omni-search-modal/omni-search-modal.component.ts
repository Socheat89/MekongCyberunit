import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface SearchResultItem {
  id: string | number;
  category: 'Module' | 'Product' | 'Warehouse' | 'Action';
  title: string;
  subtitle?: string;
  badge?: string;
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-omni-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-[9990] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        (click)="close()"
      >
        <div
          class="w-full max-w-2xl bg-[#0c1222]/95 backdrop-blur-3xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden transform transition-all animate-scale-up"
          (click)="$event.stopPropagation()"
        >
          <!-- Search Header Input -->
          <div class="relative flex items-center px-5 border-b border-white/[0.08] bg-white/[0.02]">
            <svg class="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              #searchInput
              type="text"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange()"
              (keydown)="handleKeydown($event)"
              placeholder="Search SKUs, products, barcodes, documents, or apps... (Ctrl+K)"
              class="w-full py-4 text-sm sm:text-base text-white placeholder-slate-500 bg-transparent border-0 focus:outline-none focus:ring-0 font-medium"
              autofocus
            />
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <kbd class="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white/[0.06] rounded border border-white/10 shadow-xs">ESC</kbd>
            </div>
          </div>

          <!-- Quick Filters Pills -->
          <div class="px-5 py-2.5 bg-white/[0.01] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs">
            <span class="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Quick:</span>
            <button
              type="button"
              (click)="filterCategory('ALL')"
              class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs"
              [ngClass]="activeFilter() === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'"
            >All</button>
            <button
              type="button"
              (click)="filterCategory('Product')"
              class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs"
              [ngClass]="activeFilter() === 'Product' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'"
            >Products / SKUs</button>
            <button
              type="button"
              (click)="filterCategory('Module')"
              class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs"
              [ngClass]="activeFilter() === 'Module' ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'"
            >Modules</button>
          </div>

          <!-- Results List -->
          <div class="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04] p-2">
            @if (filteredResults().length === 0) {
              <div class="py-12 text-center text-slate-500">
                <svg class="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm font-medium text-slate-400">No results found for "{{ query }}"</p>
                <p class="text-xs text-slate-500 mt-0.5">Try searching for SKU 'SKU-', 'Stock', or 'Dashboard'</p>
              </div>
            } @else {
              @for (item of filteredResults(); track item.id; let idx = $index) {
                <div
                  (click)="selectItem(item)"
                  (mouseenter)="selectedIndex.set(idx)"
                  class="px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  [ngClass]="selectedIndex() === idx ? 'bg-emerald-500/15 border border-emerald-500/30' : 'hover:bg-white/[0.04] border border-transparent'"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      [ngClass]="categoryIconClasses(item.category)"
                    >
                      @if (item.category === 'Module') {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                      } @else if (item.category === 'Product') {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      } @else if (item.category === 'Warehouse') {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      }
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-semibold text-white truncate">{{ item.title }}</div>
                      @if (item.subtitle) {
                        <div class="text-xs text-slate-400 truncate">{{ item.subtitle }}</div>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    @if (item.badge) {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] text-slate-300 border border-white/10">
                        {{ item.badge }}
                      </span>
                    }
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Modal Footer Quick Help -->
          <div class="px-5 py-3 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono">↑</kbd>
                <kbd class="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono">↓</kbd>
                to navigate
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/10 font-mono">↵</kbd>
                to select
              </span>
            </div>
            <span class="text-emerald-400 font-mono">Mekong Omni-Search</span>
          </div>
        </div>
      </div>
    }
  `
})
export class OmniSearchModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();

  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  query = '';
  readonly activeFilter = signal<string>('ALL');
  readonly selectedIndex = signal<number>(0);
  readonly allResults = signal<SearchResultItem[]>([
    { id: 'mod-1', category: 'Module', title: 'Inventory Management', subtitle: 'Warehouses, on-hand stock, transfers, movements', badge: 'Module', route: '/inventory' },
    { id: 'mod-2', category: 'Module', title: 'Executive Dashboard', subtitle: 'KPI metrics, stock valuation, live sales', badge: 'Module', route: '/dashboard' },
    { id: 'mod-3', category: 'Module', title: 'Catalog & Products', subtitle: 'Product master, SKU records, barcode lookup', badge: 'Module', route: '/catalog' },
    { id: 'mod-4', category: 'Module', title: 'Purchasing & POs', subtitle: 'Purchase orders, vendor receipts, supplier bills', badge: 'Module', route: '/purchasing' },
    { id: 'mod-5', category: 'Module', title: 'Sales Orders', subtitle: 'Customer orders, dispatch notes, invoices', badge: 'Module', route: '/sales' },
    { id: 'mod-6', category: 'Module', title: 'Reports & Analytics', subtitle: 'Stock valuation, turnover, financial summaries', badge: 'Module', route: '/reports' },
    { id: 'mod-7', category: 'Module', title: 'Audit Trail', subtitle: 'Security logs, system activity timeline', badge: 'Module', route: '/audit' },
    { id: 'mod-8', category: 'Module', title: 'User Management', subtitle: 'RBAC accounts, directory, access', badge: 'Admin', route: '/users' },
    { id: 'mod-9', category: 'Module', title: 'Roles & Permissions', subtitle: 'Security roles & page authorization', badge: 'Admin', route: '/roles' },
    { id: 'mod-10', category: 'Module', title: 'Units of Measure (UoM)', subtitle: 'Measurement units and conversions', badge: 'Settings', route: '/units' },
    { id: 'act-1', category: 'Action', title: 'New Stock Adjustment', subtitle: 'Record surplus, shrinkage, or audit diff', badge: 'Action', route: '/inventory' },
    { id: 'act-2', category: 'Action', title: 'Stock Transfer', subtitle: 'Move goods between warehouses', badge: 'Action', route: '/inventory' },
  ]);

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
    }
  }

  filteredResults(): SearchResultItem[] {
    const q = this.query.trim().toLowerCase();
    const filter = this.activeFilter();
    let results = this.allResults();

    if (filter !== 'ALL') {
      results = results.filter(r => r.category === filter);
    }

    if (!q) return results.slice(0, 8);

    return results.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  }

  filterCategory(cat: string): void {
    this.activeFilter.set(cat);
    this.selectedIndex.set(0);
  }

  onQueryChange(): void {
    this.selectedIndex.set(0);
  }

  handleKeydown(e: KeyboardEvent): void {
    const list = this.filteredResults();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex.update(i => (i + 1 < list.length ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.update(i => (i - 1 >= 0 ? i - 1 : list.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = list[this.selectedIndex()];
      if (item) {
        this.selectItem(item);
      }
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  selectItem(item: SearchResultItem): void {
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
    this.close();
  }

  close(): void {
    this.query = '';
    this.closed.emit();
  }

  categoryIconClasses(cat: string): string {
    switch (cat) {
      case 'Module': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Product': return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
      case 'Warehouse': return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    }
  }
}
