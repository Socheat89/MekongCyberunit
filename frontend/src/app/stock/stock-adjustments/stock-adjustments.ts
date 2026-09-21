import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockService, StockItem, StockMovement, StockAdjustmentRequest } from '../../services/stock.service';

@Component({
  selector: 'app-stock-adjustments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Inventory Adjustments</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              កែសម្រួលស្តុក / ផ្ទៀងផ្ទាត់ស្តុក
            </span>
          </div>
          <p class="text-sm text-slate-600 mt-1.5 font-medium">
            Reconcile physical stock counts with system records to fix shrinkage, damage, or counting errors.
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

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Adjustment Form -->
        <div class="lg:col-span-5">
          <div class="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div class="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div class="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900">Stocktake Reconciliation</h2>
                <p class="text-xs font-medium text-slate-500">Post physical count audit variance</p>
              </div>
            </div>

            @if (successMessage()) {
              <div class="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-semibold flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                  <svg class="w-4.5 h-4.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>{{ successMessage() }}</span>
                </div>
                <button (click)="successMessage.set('')" class="text-indigo-500 hover:text-indigo-900 text-base font-bold">×</button>
              </div>
            }

            <form (ngSubmit)="submitAdjustment()" class="space-y-4.5 text-sm">
              <!-- Item Selector -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Product to Reconcile *</label>
                <select
                  [(ngModel)]="selectedItemId"
                  (ngModelChange)="onItemSelect($event)"
                  name="selectedItemId"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option [ngValue]="null">-- Select product to adjust --</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">
                      {{ item.name }} ({{ item.sku }}) — Current System: {{ item.quantityOnHand }} {{ item.unit }}
                    </option>
                  }
                </select>
              </div>

              <!-- Live Comparison Card -->
              @if (selectedItem()) {
                <div class="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">System Qty</span>
                    <div class="text-xl font-black text-slate-800 mt-1">{{ selectedItem()?.quantityOnHand }}</div>
                  </div>
                  <div>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">New Count</span>
                    <div class="text-xl font-black text-indigo-600 mt-1">{{ newQuantity }}</div>
                  </div>
                  <div>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Variance</span>
                    <div
                      class="text-xl font-black mt-1 font-mono"
                      [class.text-emerald-600]="variance() > 0"
                      [class.text-rose-600]="variance() < 0"
                      [class.text-slate-400]="variance() === 0"
                    >
                      {{ variance() > 0 ? '+' : '' }}{{ variance() }}
                    </div>
                  </div>
                </div>
              }

              <!-- New Actual Count Input -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">New Actual Physical Count *</label>
                <input
                  type="number"
                  min="0"
                  [(ngModel)]="newQuantity"
                  name="newQuantity"
                  required
                  placeholder="0"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base"
                />
              </div>

              <!-- Reason Dropdown -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Adjustment Reason (មូលហេតុ) *</label>
                <select
                  [(ngModel)]="reason"
                  name="reason"
                  required
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
                >
                  <option value="Physical Stocktake Discrepancy">Physical Count Discrepancy (រាប់ឃើញខ្វះខាត/លើស)</option>
                  <option value="Damaged in Warehouse">Damaged in Warehouse (ខូចខាតពេលផ្ទុក/លើកដាក់)</option>
                  <option value="Loss / Shrinkage">Loss / Shrinkage (បាត់បង់មិនដឹងមូលហេតុ)</option>
                  <option value="Found Items / Surplus">Found Surplus Stock (រកឃើញទំនិញលើស)</option>
                  <option value="Data Entry Correction">Data Entry Correction (កែតម្រូវទិន្នន័យច្រឡំ)</option>
                </select>
              </div>

              <!-- Notes -->
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">Audit Notes / Explanations</label>
                <textarea
                  [(ngModel)]="notes"
                  name="notes"
                  rows="2"
                  placeholder="e.g. Conducted monthly cycle count by auditor..."
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                ></textarea>
              </div>

              <button
                type="submit"
                [disabled]="!selectedItemId || variance() === 0"
                class="w-full py-3 rounded-xl bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border-2 border-indigo-600 disabled:opacity-50 font-bold transition shadow-sm flex items-center justify-center space-x-2 text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Save Adjustment (រក្សាទុកការកែប្រែ)</span>
              </button>
            </form>
          </div>
        </div>

        <!-- Recent Adjustments Table -->
        <div class="lg:col-span-7">
          <div class="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 class="text-lg font-black text-slate-900">Recent Audit Adjustments</h2>
                <p class="text-xs font-medium text-slate-500">Physical count reconciliations &amp; variance logs</p>
              </div>
              <a
                routerLink="/stock/movements"
                class="text-sm font-bold text-teal-600 hover:text-teal-800 transition inline-flex items-center space-x-1"
              >
                <span>Full Ledger</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th class="py-3 px-3.5">Reference</th>
                    <th class="py-3 px-3.5">Item</th>
                    <th class="py-3 px-3.5 text-center">Variance</th>
                    <th class="py-3 px-3.5 text-center">New Count</th>
                    <th class="py-3 px-3.5">Reason</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  @for (m of recentAdjustments(); track m.id) {
                    <tr class="hover:bg-slate-50/60 transition">
                      <td class="py-3.5 px-3.5 font-mono font-bold text-slate-800 text-sm">
                        {{ m.referenceNo }}
                        <div class="text-xs text-slate-400 font-sans font-normal mt-0.5">{{ m.createdAtUtc | date:'short' }}</div>
                      </td>
                      <td class="py-3.5 px-3.5">
                        <div class="font-bold text-slate-900 text-sm">{{ m.itemName }}</div>
                        <div class="text-xs font-mono text-slate-400 mt-0.5">SKU: {{ m.itemSku }}</div>
                      </td>
                      <td class="py-3.5 px-3.5 text-center font-mono font-black text-sm">
                        @if (m.balanceAfter > m.balanceBefore) {
                          <span class="text-emerald-600">+{{ m.balanceAfter - m.balanceBefore }}</span>
                        } @else {
                          <span class="text-rose-600">{{ m.balanceAfter - m.balanceBefore }}</span>
                        }
                      </td>
                      <td class="py-3.5 px-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {{ m.balanceAfter }}
                        </span>
                      </td>
                      <td class="py-3.5 px-3.5 text-slate-600 text-xs font-medium">
                        {{ m.reason }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="py-10 text-center text-slate-400 text-sm">
                        No audit adjustments recorded yet.
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
export class StockAdjustmentsComponent implements OnInit {
  private readonly stockService = inject(StockService);

  readonly items = signal<StockItem[]>([]);
  readonly recentAdjustments = signal<StockMovement[]>([]);
  readonly successMessage = signal<string>('');

  selectedItemId: number | null = null;
  newQuantity: number = 0;
  reason: string = 'Physical Stocktake Discrepancy';
  notes: string = '';

  selectedItem = computed(() => {
    const id = this.selectedItemId;
    if (!id) return null;
    return this.items().find(i => i.id === id) || null;
  });

  variance = computed(() => {
    const item = this.selectedItem();
    if (!item) return 0;
    return this.newQuantity - item.quantityOnHand;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.stockService.getItems().subscribe({
      next: data => this.items.set(data)
    });

    this.stockService.getMovements({ type: 'ADJUSTMENT', limit: 10 }).subscribe({
      next: data => this.recentAdjustments.set(data)
    });
  }

  onItemSelect(id: number | null): void {
    if (!id) return;
    const item = this.items().find(i => i.id === id);
    if (item) {
      this.newQuantity = item.quantityOnHand;
    }
  }

  submitAdjustment(): void {
    if (!this.selectedItemId || this.variance() === 0) return;

    const req: StockAdjustmentRequest = {
      itemId: this.selectedItemId,
      newQuantity: this.newQuantity,
      reason: this.reason,
      notes: this.notes
    };

    this.stockService.recordAdjustment(req).subscribe({
      next: m => {
        this.successMessage.set(`Adjusted ${m.itemName} balance to ${m.balanceAfter} (Variance: ${this.variance() > 0 ? '+' : ''}${this.variance()})`);
        this.notes = '';
        this.loadData();
      },
      error: err => alert(err?.error?.message || 'Failed to record adjustment')
    });
  }
}
