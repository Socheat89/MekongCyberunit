import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockService, StockMovement, StockItem } from '../../services/stock.service';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Stock Movement Ledger</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              ប្រវត្តិចលនាស្តុក
            </span>
          </div>
          <p class="text-sm text-slate-600 mt-1.5 font-medium">
            Chronological audit trail of all inward receipts, outward dispatches, and inventory adjustments.
          </p>
        </div>

        <div class="flex items-center space-x-2.5">
          <a
            routerLink="/stock/in"
            class="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition inline-flex items-center space-x-1.5 border border-emerald-200/60 shadow-xs"
          >
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
            <span>Receive In (នាំចូល)</span>
          </a>
          <a
            routerLink="/stock/out"
            class="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition inline-flex items-center space-x-1.5 border border-amber-200/60 shadow-xs"
          >
            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
            </svg>
            <span>Issue Out (នាំចេញ)</span>
          </a>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="glass-panel rounded-2xl p-4.5 border border-slate-200 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div class="flex-1 w-full flex flex-col sm:flex-row gap-3 items-center">
          <!-- Search -->
          <div class="relative w-full sm:w-80">
            <svg class="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search reference, reason, recipient..."
              class="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          <!-- Movement Type Filter -->
          <div class="w-full sm:w-56">
            <select
              [(ngModel)]="selectedType"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Types (គ្រប់ចលនា)</option>
              <option value="IN">IN — Receipts (នាំចូល)</option>
              <option value="OUT">OUT — Dispatches (នាំចេញ)</option>
              <option value="ADJUSTMENT">ADJ — Adjustments (កែសម្រួល)</option>
            </select>
          </div>

          <!-- Item Filter -->
          <div class="w-full sm:w-64">
            <select
              [(ngModel)]="selectedItemId"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option [ngValue]="null">All Products (គ្រប់ទំនិញ)</option>
              @for (item of items(); track item.id) {
                <option [ngValue]="item.id">{{ item.name }} ({{ item.sku }})</option>
              }
            </select>
          </div>
        </div>

        <div class="text-sm text-slate-600 font-medium whitespace-nowrap">
          Total Movements: <span class="font-bold text-slate-900">{{ filteredMovements().length }}</span>
        </div>
      </div>

      <!-- Ledger Table -->
      <div class="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th class="py-4 px-4.5">Reference &amp; Date</th>
                <th class="py-4 px-3.5 text-center">Type</th>
                <th class="py-4 px-3.5">Product</th>
                <th class="py-4 px-3.5 text-right">Quantity</th>
                <th class="py-4 px-3.5 text-center">Balance Flow</th>
                <th class="py-4 px-3.5">Party / Reason</th>
                <th class="py-4 px-4 text-right">User</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (m of filteredMovements(); track m.id) {
                <tr class="hover:bg-slate-50/60 transition">
                  <td class="py-3.5 px-4.5">
                    <div class="font-mono font-bold text-slate-900 text-sm">{{ m.referenceNo }}</div>
                    <div class="text-xs text-slate-400 font-sans mt-0.5">{{ m.createdAtUtc | date:'medium' }}</div>
                  </td>

                  <td class="py-3.5 px-3.5 text-center">
                    @if (m.movementType === 'IN') {
                      <span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        RECEIPT
                      </span>
                    } @else if (m.movementType === 'OUT') {
                      <span class="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                        DISPATCH
                      </span>
                    } @else {
                      <span class="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ADJUST
                      </span>
                    }
                  </td>

                  <td class="py-3.5 px-3.5">
                    <div class="font-bold text-slate-900 text-sm">{{ m.itemName }}</div>
                    <div class="text-xs font-mono text-slate-400 mt-0.5">SKU: {{ m.itemSku }}</div>
                  </td>

                  <td class="py-3.5 px-3.5 text-right font-mono font-black text-base">
                    @if (m.movementType === 'IN') {
                      <span class="text-emerald-600">+{{ m.quantity }}</span>
                    } @else if (m.movementType === 'OUT') {
                      <span class="text-rose-600">-{{ m.quantity }}</span>
                    } @else {
                      <span class="text-indigo-600">
                        {{ m.balanceAfter >= m.balanceBefore ? '+' : '-' }}{{ m.quantity }}
                      </span>
                    }
                  </td>

                  <td class="py-3.5 px-3.5 text-center font-mono text-xs">
                    <div class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100">
                      <span class="text-slate-400">{{ m.balanceBefore }}</span>
                      <span class="text-slate-300">→</span>
                      <span class="font-bold text-slate-800">{{ m.balanceAfter }}</span>
                    </div>
                  </td>

                  <td class="py-3.5 px-3.5">
                    <div class="font-bold text-slate-800 text-sm">{{ m.supplierOrRecipient || 'Internal' }}</div>
                    <div class="text-xs text-slate-400 truncate max-w-xs mt-0.5">{{ m.reason || m.notes || '—' }}</div>
                  </td>

                  <td class="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                    {{ m.createdByUsername || 'system' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-14 text-slate-400">
                    <p class="font-bold text-slate-700 text-base">No stock movements found</p>
                    <p class="text-sm text-slate-400 mt-1">Try changing your filters.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class StockMovementsComponent implements OnInit {
  private readonly stockService = inject(StockService);

  readonly movements = signal<StockMovement[]>([]);
  readonly items = signal<StockItem[]>([]);

  searchQuery = '';
  selectedType = 'ALL';
  selectedItemId: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.stockService.getItems().subscribe({
      next: data => this.items.set(data)
    });
    this.fetchMovements();
  }

  fetchMovements(): void {
    const params: { type?: string; itemId?: number; limit?: number } = { limit: 200 };
    if (this.selectedType !== 'ALL') params.type = this.selectedType;
    if (this.selectedItemId) params.itemId = this.selectedItemId;

    this.stockService.getMovements(params).subscribe({
      next: data => this.movements.set(data)
    });
  }

  onFilterChange(): void {
    this.fetchMovements();
  }

  filteredMovements(): StockMovement[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.movements().filter(m => {
      if (!q) return true;
      return (
        m.referenceNo.toLowerCase().includes(q) ||
        m.itemName.toLowerCase().includes(q) ||
        m.itemSku.toLowerCase().includes(q) ||
        (m.supplierOrRecipient && m.supplierOrRecipient.toLowerCase().includes(q)) ||
        (m.reason && m.reason.toLowerCase().includes(q))
      );
    });
  }
}
