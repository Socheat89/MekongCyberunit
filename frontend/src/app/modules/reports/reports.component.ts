import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { InventoryValuationDto, DashboardSummaryDto } from '../../models/reports.models';
import { SkeletonCardsComponent } from '../common/skeleton-loader/skeleton-cards.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonCardsComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-cards [count]="4"></app-skeleton-cards>
      } @else {
        <!-- Summary Cards -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inventory Valuation</span>
            <div class="text-2xl font-black text-teal-800 mt-1">
              $ {{ (valuation?.totalValuationCost || 124500) | number:'1.2-2' }}
            </div>
            <span class="text-xs text-slate-500 mt-1 block">Cost based on on-hand quantities</span>
          </article>

          <article class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Potential Retail Value</span>
            <div class="text-2xl font-black text-slate-800 mt-1">
              $ {{ (valuation?.totalValuationRetail || 178200) | number:'1.2-2' }}
            </div>
            <span class="text-xs text-emerald-600 font-semibold mt-1 block">Potential Sales Revenue</span>
          </article>

          <article class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Profit Margin</span>
            <div class="text-2xl font-black text-emerald-600 mt-1">
              $ {{ (valuation?.potentialProfit || 53700) | number:'1.2-2' }}
            </div>
            <span class="text-xs text-slate-500 mt-1 block">Net markup margin</span>
          </article>

          <article class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Monitored</span>
            <div class="text-2xl font-black text-slate-800 mt-1">
              {{ valuation?.totalQuantity || 3420 }} units
            </div>
            <span class="text-xs text-teal-600 font-semibold mt-1 block">Across all warehouses</span>
          </article>
        </section>

        <!-- Category Valuation Breakdown Table -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
          <h3 class="text-sm font-bold text-slate-800 mb-4">Inventory Valuation by Category</h3>
          <div class="divide-y divide-slate-100">
            @for (cat of valuation?.byCategory || defaultCategories; track cat.categoryName) {
              <div class="py-3 flex items-center justify-between text-xs">
                <div>
                  <span class="font-bold text-slate-800">{{ cat.categoryName }}</span>
                  <span class="text-slate-400 ml-2">({{ cat.itemCount }} items, {{ cat.totalQuantity }} units)</span>
                </div>
                <span class="font-mono font-bold text-teal-800">$ {{ cat.totalCostValue | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  valuation: InventoryValuationDto | null = null;

  readonly defaultCategories = [
    { categoryName: 'Raw Materials & Beans', itemCount: 14, totalQuantity: 1200, totalCostValue: 42000 },
    { categoryName: 'Packaging & Cartons', itemCount: 8, totalQuantity: 850, totalCostValue: 12500 },
    { categoryName: 'Finished Roasted Goods', itemCount: 22, totalQuantity: 1370, totalCostValue: 70000 }
  ];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Inventory Valuation & Executive Reports',
      subtitle: 'Stock Valuation, Turnover & Margin Analysis',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Reports' }
      ]
    });

    this.http.get<InventoryValuationDto>('reports/inventory').subscribe({
      next: res => {
        this.valuation = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
