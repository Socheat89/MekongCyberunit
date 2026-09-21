import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StockService, StockItem, StockMovement, StockOutRequest } from '../../services/stock.service';

@Component({
  selector: 'app-stock-out',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Stock Out / Dispatch</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              នាំទំនិញចេញពីស្តុក
            </span>
          </div>
          <p class="text-sm text-slate-600 mt-1.5 font-medium">
            Issue items for customer sales orders, department requests, store replenishment, or write-off scrap.
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

      <!-- 2 Columns Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Stock Out Form -->
        <div class="lg:col-span-5">
          <div class="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div class="flex items-center space-x-3.5 pb-4 border-b border-slate-100">
              <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900">Issue Goods (បញ្ចេញទំនិញ)</h2>
                <p class="text-xs text-slate-500 font-medium">Deduct inventory and generate dispatch record</p>
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

            <form (ngSubmit)="submitStockOut()" class="space-y-4.5 text-sm">
              <!-- Item Selector -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Select Product *</label>
                <select
                  [(ngModel)]="selectedItemId"
                  name="selectedItemId"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option [ngValue]="null">-- Choose an item to dispatch --</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id" [disabled]="item.quantityOnHand <= 0">
                      {{ item.name }} ({{ item.sku }}) — Available: {{ item.quantityOnHand }} {{ item.unit }}
                    </option>
                  }
                </select>
              </div>

              <!-- Selected Item Availability Pill -->
              @if (selectedItem()) {
                <div
                  class="p-3.5 rounded-2xl border flex items-center justify-between"
                  [class.bg-rose-50]="selectedItem()!.quantityOnHand === 0"
                  [class.border-rose-200]="selectedItem()!.quantityOnHand === 0"
                  [class.bg-amber-50/70]="selectedItem()!.quantityOnHand > 0"
                  [class.border-amber-200]="selectedItem()!.quantityOnHand > 0"
                >
                  <div>
                    <div class="font-bold text-slate-900 text-sm">{{ selectedItem()?.name }}</div>
                    <div class="text-xs font-mono mt-0.5" [class.text-rose-700]="selectedItem()!.quantityOnHand === 0" [class.text-amber-800]="selectedItem()!.quantityOnHand > 0">
                      Available Stock: <strong>{{ selectedItem()?.quantityOnHand }} {{ selectedItem()?.unit }}</strong>
                    </div>
                  </div>
                  <span class="px-3 py-1 rounded-lg bg-white font-bold border text-xs font-mono" [class.text-rose-700]="selectedItem()!.quantityOnHand === 0" [class.border-rose-200]="selectedItem()!.quantityOnHand === 0" [class.text-amber-800]="selectedItem()!.quantityOnHand > 0" [class.border-amber-200]="selectedItem()!.quantityOnHand > 0">
                    {{ selectedItem()?.quantityOnHand === 0 ? 'Out of Stock' : 'Ready to Issue' }}
                  </span>
                </div>
              }

              <!-- Quantity to Dispatch -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="font-bold text-slate-700">Quantity to Issue *</label>
                  @if (selectedItem()) {
                    <span class="text-xs text-slate-500 font-semibold">Max available: {{ selectedItem()?.quantityOnHand }}</span>
                  }
                </div>
                <input
                  type="number"
                  min="1"
                  [max]="selectedItem()?.quantityOnHand || 9999"
                  [(ngModel)]="quantity"
                  name="quantity"
                  required
                  placeholder="e.g. 5"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                @if (selectedItem() && quantity > selectedItem()!.quantityOnHand) {
                  <p class="text-xs text-rose-600 font-bold mt-1.5 flex items-center space-x-1">
                    <span>⚠ Requested quantity exceeds available stock!</span>
                  </p>
                }
              </div>

              <!-- Reason Dropdown -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Dispatch Reason (មូលហេតុ) *</label>
                <select
                  [(ngModel)]="reason"
                  name="reason"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-sm"
                >
                  <option value="Sales Dispatch">Sales Dispatch (បញ្ជូនទៅលក់ / អតិថិជន)</option>
                  <option value="Retail Outlet Transfer">Retail Outlet Transfer (ផ្ទេរទៅសាខាលក់)</option>
                  <option value="Internal Warehouse Consumption">Internal Consumption (ប្រើប្រាស់ផ្ទៃក្នុង)</option>
                  <option value="Damaged / Write-off">Damaged / Write-off (ខូចខាត / បោះបង់)</option>
                  <option value="Expired Stock">Expired Stock (ផុតកំណត់កាលបរិច្ឆេទ)</option>
                  <option value="Return to Supplier">Return to Supplier (ផ្ញើត្រឡប់ទៅក្រុមហ៊ុន)</option>
                </select>
              </div>

              <!-- Recipient / Customer -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Destination / Recipient / Customer</label>
                <input
                  type="text"
                  [(ngModel)]="destinationOrCustomer"
                  name="destinationOrCustomer"
                  placeholder="e.g. Phnom Penh Central Outlet, Customer #402"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <!-- DO / Reference -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Delivery Order / Reference #</label>
                <input
                  type="text"
                  [(ngModel)]="referenceNo"
                  name="referenceNo"
                  placeholder="e.g. DO-2026-0045"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <!-- Notes -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Notes / Shipping Details</label>
                <textarea
                  [(ngModel)]="notes"
                  name="notes"
                  rows="2"
                  placeholder="e.g. Dispatched by driver Sokha via delivery van..."
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                [disabled]="!selectedItemId || quantity <= 0 || (selectedItem() && quantity > selectedItem()!.quantityOnHand)"
                class="w-full py-3 rounded-xl bg-white hover:bg-amber-600 text-amber-700 hover:text-white border-2 border-amber-600 disabled:opacity-50 font-bold transition shadow-sm flex items-center justify-center space-x-2 text-sm"
              >
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
                <span>Confirm Dispatch (បញ្ជាក់ការនាំចេញ)</span>
              </button>
            </form>
          </div>
        </div>

        <!-- Recent Outward Movements Table -->
        <div class="lg:col-span-7">
          <div class="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900">Recent Outward Dispatches</h2>
                <p class="text-xs text-slate-500 font-medium">Latest issued items and recipient records</p>
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
                    <th class="py-3 px-3.5 text-right">Dispatched</th>
                    <th class="py-3 px-3.5 text-center">Remaining</th>
                    <th class="py-3 px-3.5">Recipient &amp; Reason</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  @for (m of recentOutMovements(); track m.id) {
                    <tr class="hover:bg-slate-50/60 transition">
                      <td class="py-3.5 px-3.5 font-mono font-bold text-slate-800 text-sm">
                        {{ m.referenceNo }}
                        <div class="text-xs text-slate-400 font-sans font-normal mt-0.5">{{ m.createdAtUtc | date:'short' }}</div>
                      </td>
                      <td class="py-3.5 px-3.5">
                        <div class="font-bold text-slate-900 text-sm">{{ m.itemName }}</div>
                        <div class="text-xs font-mono text-slate-400 mt-0.5">SKU: {{ m.itemSku }}</div>
                      </td>
                      <td class="py-3.5 px-3.5 text-right font-mono font-black text-rose-600 text-sm">
                        -{{ m.quantity }}
                      </td>
                      <td class="py-3.5 px-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                          {{ m.balanceAfter }}
                        </span>
                      </td>
                      <td class="py-3.5 px-3.5 text-slate-600 text-xs">
                        <div class="font-semibold text-slate-800 text-sm">{{ m.supplierOrRecipient || 'Direct Order' }}</div>
                        <div class="text-xs text-slate-500 mt-0.5">{{ m.reason }}</div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="py-10 text-center text-slate-400">
                        No outward dispatches recorded yet.
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
export class StockOutComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<StockItem[]>([]);
  readonly recentOutMovements = signal<StockMovement[]>([]);
  readonly successMessage = signal<string>('');

  selectedItemId: number | null = null;
  quantity: number = 1;
  reason: string = 'Sales Dispatch';
  destinationOrCustomer: string = '';
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
        this.route.queryParams.subscribe(params => {
          if (params['itemId']) {
            const id = Number(params['itemId']);
            const match = data.find(i => i.id === id);
            if (match) {
              this.selectedItemId = match.id;
            }
          }
        });
      }
    });

    this.stockService.getMovements({ type: 'OUT', limit: 10 }).subscribe({
      next: data => this.recentOutMovements.set(data)
    });
  }

  submitStockOut(): void {
    if (!this.selectedItemId || this.quantity <= 0) return;
    const item = this.selectedItem();
    if (!item || this.quantity > item.quantityOnHand) {
      alert('Requested quantity exceeds available stock!');
      return;
    }

    const req: StockOutRequest = {
      itemId: this.selectedItemId,
      quantity: this.quantity,
      reason: this.reason,
      destinationOrCustomer: this.destinationOrCustomer,
      referenceNo: this.referenceNo,
      notes: this.notes
    };

    this.stockService.recordStockOut(req).subscribe({
      next: m => {
        this.successMessage.set(`Dispatched ${m.quantity} units for ${m.itemName}. Remaining stock: ${m.balanceAfter}`);
        this.quantity = 1;
        this.referenceNo = '';
        this.notes = '';
        this.loadData();
      },
      error: err => alert(err?.error?.message || 'Failed to record stock out')
    });
  }
}
