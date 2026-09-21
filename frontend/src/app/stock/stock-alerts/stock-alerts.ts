import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StockService, StockItem } from '../../services/stock.service';

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Low Stock &amp; Restock Alerts</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              ការជូនដំណឹងស្តុកទាប
            </span>
          </div>
          <p class="text-sm text-slate-600 mt-1.5 font-medium">
            Real-time monitoring of items below minimum safety threshold. Prevent stockouts and lost revenue.
          </p>
        </div>

        <a
          routerLink="/stock/in"
          class="px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition hover:scale-[1.02] active:scale-[0.98] inline-flex items-center space-x-2"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
          <span>Batch Restock (នាំចូលស្តុក)</span>
        </a>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
        <div class="glass-panel rounded-2xl p-5 border border-rose-200 bg-rose-50/25 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-rose-600 uppercase tracking-wider">Critical / Out of Stock</div>
            <div class="text-3xl font-black text-rose-700 mt-1">{{ criticalCount() }}</div>
            <div class="text-xs text-rose-600 font-medium mt-1">0 units available in warehouse</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-5 border border-amber-200 bg-amber-50/25 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-amber-600 uppercase tracking-wider">Low Stock Warning</div>
            <div class="text-3xl font-black text-amber-700 mt-1">{{ lowStockCount() }}</div>
            <div class="text-xs text-amber-700 font-medium mt-1">Below safety stock level</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Restock Cost</div>
            <div class="text-3xl font-black text-slate-900 mt-1">$ {{ estimatedRestockCost() | number:'1.2-2' }}</div>
            <div class="text-xs text-teal-700 font-semibold mt-1">To reach safety levels</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Alerting Items Table -->
      <div class="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th class="py-4 px-4.5">Item &amp; SKU</th>
                <th class="py-4 px-3.5">Location</th>
                <th class="py-4 px-3.5 text-center">Current Qty</th>
                <th class="py-4 px-3.5 text-center">Safety Level</th>
                <th class="py-4 px-3.5 text-center">Deficit (ខ្វះ)</th>
                <th class="py-4 px-3.5 text-right">Est. Cost</th>
                <th class="py-4 px-4.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (item of alertItems(); track item.id) {
                <tr class="hover:bg-slate-50/60 transition">
                  <td class="py-4 px-4.5">
                    <div class="flex items-center space-x-3.5">
                      <div
                        class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs"
                        [class.bg-rose-100]="item.quantityOnHand === 0"
                        [class.text-rose-700]="item.quantityOnHand === 0"
                        [class.bg-amber-100]="item.quantityOnHand > 0"
                        [class.text-amber-800]="item.quantityOnHand > 0"
                      >
                        {{ item.sku.substring(0, 2) }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-sm">{{ item.name }}</div>
                        <div class="text-xs font-mono text-slate-400 mt-0.5">SKU: {{ item.sku }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="py-4 px-3.5 text-slate-600 text-xs font-medium">
                    {{ item.location || 'Warehouse Main' }}
                  </td>

                  <td class="py-4 px-3.5 text-center font-mono font-black text-base" [class.text-rose-600]="item.quantityOnHand === 0" [class.text-amber-600]="item.quantityOnHand > 0">
                    {{ item.quantityOnHand }} <span class="text-xs font-normal text-slate-400">{{ item.unit }}</span>
                  </td>

                  <td class="py-4 px-3.5 text-center font-mono text-slate-700 text-sm">
                    {{ item.minStockLevel }} {{ item.unit }}
                  </td>

                  <td class="py-4 px-3.5 text-center font-mono font-bold text-rose-600 text-sm">
                    -{{ item.minStockLevel - item.quantityOnHand }} {{ item.unit }}
                  </td>

                  <td class="py-4 px-3.5 text-right font-mono font-bold text-slate-800 text-sm">
                    $ {{ ((item.minStockLevel - item.quantityOnHand) * item.costPrice) | number:'1.2-2' }}
                  </td>

                  <td class="py-4 px-4.5 text-right">
                    <a
                      [routerLink]="['/stock/in']"
                      [queryParams]="{ itemId: item.id }"
                      class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition inline-flex items-center space-x-1.5"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                      </svg>
                      <span>Restock Now</span>
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-14 text-slate-400">
                    <div class="flex flex-col items-center">
                      <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <p class="font-bold text-slate-700 text-base">All products are healthy!</p>
                      <p class="text-sm text-slate-400 mt-1">No products currently below minimum stock threshold.</p>
                    </div>
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
export class StockAlertsComponent implements OnInit {
  private readonly stockService = inject(StockService);

  readonly alertItems = signal<StockItem[]>([]);

  criticalCount = computed(() => this.alertItems().filter(i => i.quantityOnHand === 0).length);
  lowStockCount = computed(() => this.alertItems().filter(i => i.quantityOnHand > 0).length);

  estimatedRestockCost = computed(() => {
    return this.alertItems().reduce((sum, item) => {
      const deficit = Math.max(0, item.minStockLevel - item.quantityOnHand);
      return sum + (deficit * item.costPrice);
    }, 0);
  });

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.stockService.getAlerts().subscribe({
      next: data => this.alertItems.set(data)
    });
  }
}
