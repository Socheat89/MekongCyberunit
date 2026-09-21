import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StockService, StockItem, StockMovement, StockInRequest } from '../../services/stock.service';

@Component({
  selector: 'app-stock-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Stock In / Receiving</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              នាំទំនិញចូលស្តុក
            </span>
          </div>
          <p class="text-sm text-slate-600 mt-1.5 font-medium">
            Record incoming inventory shipments, vendor deliveries, and purchase receipts into warehouse storage.
          </p>
        </div>

        <a
          routerLink="/stock/items"
          class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold shadow-sm transition inline-flex items-center space-x-2"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span>Back to Catalogue</span>
        </a>
      </div>

      <!-- Main Layout: 2 Columns (Form on left, Recent inward movements on right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Stock In Form -->
        <div class="lg:col-span-5">
          <div class="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div class="flex items-center space-x-3.5 pb-4 border-b border-slate-100">
              <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900">Receive Inventory (បញ្ចូលស្តុក)</h2>
                <p class="text-xs text-slate-500 font-medium">Post inbound delivery to stock ledger</p>
              </div>
            </div>

            @if (successMessage()) {
              <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                  <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>{{ successMessage() }}</span>
                </div>
                <button (click)="successMessage.set('')" class="text-emerald-500 hover:text-emerald-800 text-base font-bold">×</button>
              </div>
            }

            <form (ngSubmit)="submitStockIn()" class="space-y-4.5 text-sm">
              <!-- Item Selector -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Select Product (ជ្រើសរើសទំនិញ) *</label>
                <select
                  [(ngModel)]="selectedItemId"
                  (ngModelChange)="onItemSelect($event)"
                  name="selectedItemId"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option [ngValue]="null">-- Choose an item to receive --</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">
                      {{ item.name }} ({{ item.sku }}) — Current: {{ item.quantityOnHand }} {{ item.unit }}
                    </option>
                  }
                </select>
              </div>

              <!-- Selected Item Summary Pill -->
              @if (selectedItem()) {
                <div class="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
                  <div>
                    <div class="font-bold text-teal-950 text-sm">{{ selectedItem()?.name }}</div>
                    <div class="text-xs text-teal-700 font-mono mt-0.5">
                      Current Stock: <strong>{{ selectedItem()?.quantityOnHand }} {{ selectedItem()?.unit }}</strong>
                    </div>
                  </div>
                  <span class="px-3 py-1 rounded-lg bg-white text-teal-800 font-bold border border-teal-200 text-xs font-mono">
                    SKU: {{ selectedItem()?.sku }}
                  </span>
                </div>
              }

              <div class="grid grid-cols-2 gap-3.5">
                <!-- Quantity to Receive -->
                <div>
                  <label class="block font-bold text-slate-700 mb-1.5">Quantity to Receive *</label>
                  <input
                    type="number"
                    min="1"
                    [(ngModel)]="quantity"
                    name="quantity"
                    required
                    placeholder="e.g. 50"
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <!-- Unit Cost -->
                <div>
                  <label class="block font-bold text-slate-700 mb-1.5">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="unitCost"
                    name="unitCost"
                    placeholder="0.00"
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <!-- Computed Total Batch Cost -->
              @if (quantity > 0 && unitCost > 0) {
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                  <span class="text-slate-600 font-medium">Estimated Batch Total:</span>
                  <span class="font-bold font-mono text-slate-900 text-base">
                    $ {{ (quantity * unitCost) | number:'1.2-2' }}
                  </span>
                </div>
              }

              <!-- Supplier -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Supplier / Vendor (អ្នកផ្គត់ផ្គង់)</label>
                <input
                  type="text"
                  [(ngModel)]="supplier"
                  name="supplier"
                  placeholder="e.g. Mekong Beverage Distribution Co."
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <!-- PO / Reference -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">PO / Delivery Reference #</label>
                <input
                  type="text"
                  [(ngModel)]="referenceNo"
                  name="referenceNo"
                  placeholder="e.g. PO-2026-0901"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <!-- Notes -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Notes / Receiving Remarks</label>
                <textarea
                  [(ngModel)]="notes"
                  name="notes"
                  rows="2"
                  placeholder="e.g. Pallet stored in Zone A, inspection passed..."
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
              </div>

              <button
                type="submit"
                [disabled]="!selectedItemId || quantity <= 0"
                class="w-full py-3 rounded-xl bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border-2 border-emerald-600 disabled:opacity-50 text-sm font-bold transition shadow-sm flex items-center justify-center space-x-2"
              >
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
                <span>Confirm Stock In (បញ្ជាក់ការនាំចូល)</span>
              </button>
            </form>
          </div>
        </div>

        <!-- Recent Inward Receipts Table -->
        <div class="lg:col-span-7">
          <div class="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900">Recent Inward Receipts</h2>
                <p class="text-xs text-slate-500 font-medium">Latest completed stock deliveries</p>
              </div>
              <a
                routerLink="/stock/movements"
                class="text-xs font-bold text-teal-600 hover:text-teal-800 transition inline-flex items-center space-x-1"
              >
                <span>Full Ledger</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th class="py-3 px-3.5">Reference</th>
                    <th class="py-3 px-3.5">Item</th>
                    <th class="py-3 px-3.5 text-right">Received</th>
                    <th class="py-3 px-3.5 text-center">New Balance</th>
                    <th class="py-3 px-3.5">Supplier</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  @for (m of recentInMovements(); track m.id) {
                    <tr class="hover:bg-slate-50/60 transition">
                      <td class="py-3.5 px-3.5 font-mono font-bold text-slate-800 text-sm">
                        {{ m.referenceNo }}
                        <div class="text-xs text-slate-400 font-sans font-normal mt-0.5">{{ m.createdAtUtc | date:'short' }}</div>
                      </td>
                      <td class="py-3.5 px-3.5">
                        <div class="font-bold text-slate-900 text-sm">{{ m.itemName }}</div>
                        <div class="text-xs font-mono text-slate-400 mt-0.5">SKU: {{ m.itemSku }}</div>
                      </td>
                      <td class="py-3.5 px-3.5 text-right font-mono font-black text-emerald-600 text-sm">
                        +{{ m.quantity }}
                      </td>
                      <td class="py-3.5 px-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                          {{ m.balanceAfter }}
                        </span>
                      </td>
                      <td class="py-3.5 px-3.5 text-slate-600 text-xs">
                        {{ m.supplierOrRecipient || 'Direct Vendor' }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="py-10 text-center text-slate-400">
                        No inward receipts recorded yet.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StockInComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<StockItem[]>([]);
  readonly recentInMovements = signal<StockMovement[]>([]);
  readonly successMessage = signal<string>('');

  selectedItemId: number | null = null;
  quantity: number = 10;
  unitCost: number = 0;
  supplier: string = '';
  referenceNo: string = '';
  notes: string = '';

  selectedItem = computed(() => {
    const id = this.selectedItemId;
    if (!id) return null;
    return this.items().find(i => i.id === id) || null;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.stockService.getItems().subscribe({
      next: data => {
        this.items.set(data);
        // Check query param for pre-selection
        this.route.queryParams.subscribe(params => {
          if (params['itemId']) {
            const id = Number(params['itemId']);
            const match = data.find(i => i.id === id);
            if (match) {
              this.selectedItemId = match.id;
              this.unitCost = match.costPrice;
            }
          }
        });
      }
    });

    this.stockService.getMovements({ type: 'IN', limit: 10 }).subscribe({
      next: data => this.recentInMovements.set(data)
    });
  }

  onItemSelect(itemId: number | null): void {
    if (!itemId) return;
    const item = this.items().find(i => i.id === itemId);
    if (item) {
      this.unitCost = item.costPrice;
    }
  }

  submitStockIn(): void {
    if (!this.selectedItemId || this.quantity <= 0) return;

    const req: StockInRequest = {
      itemId: this.selectedItemId,
      quantity: this.quantity,
      unitCost: this.unitCost > 0 ? this.unitCost : undefined,
      supplier: this.supplier,
      referenceNo: this.referenceNo,
      notes: this.notes
    };

    this.stockService.recordStockIn(req).subscribe({
      next: m => {
        this.successMessage.set(`Successfully received ${m.quantity} units for ${m.itemName}. New stock: ${m.balanceAfter}`);
        this.quantity = 10;
        this.referenceNo = '';
        this.notes = '';
        this.loadData();
      },
      error: err => alert(err?.error?.message || 'Failed to record stock in')
    });
  }
}
