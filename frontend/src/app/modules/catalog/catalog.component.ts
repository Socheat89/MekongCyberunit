import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { ProductDto } from '../../models/catalog.models';
import { PagedResult } from '../../models/common.models';
import { StatusBadgeComponent } from '../common/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, SkeletonTableComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-table [rows]="6"></app-skeleton-table>
      } @else if (products.length === 0) {
        <app-empty-state
          title="No catalog products found"
          description="Product master catalog records will appear here."
          icon="document"
        ></app-empty-state>
      } @else {
        <div class="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-6">SKU / Code</th>
                  <th class="py-3.5 px-4">Product Name</th>
                  <th class="py-3.5 px-4">Category</th>
                  <th class="py-3.5 px-4 text-right">Cost Price</th>
                  <th class="py-3.5 px-4 text-right">Selling Price</th>
                  <th class="py-3.5 px-4 text-center">Status</th>
                  <th class="py-3.5 px-6 text-right">Stock</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                @for (p of products; track p.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-6 font-mono font-bold text-teal-800">{{ p.sku }}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">{{ p.name }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ p.categoryName || 'General' }}</td>
                    <td class="py-3.5 px-4 text-right font-mono">$ {{ p.costPrice | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ {{ p.sellingPrice | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 text-center">
                      <app-status-badge [status]="p.status"></app-status-badge>
                    </td>
                    <td class="py-3.5 px-6 text-right font-mono font-bold">{{ p.quantityOnHand }} units</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class CatalogComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  products: ProductDto[] = [];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Product Master Catalog',
      subtitle: 'SKU, Barcodes & Variants',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Catalog' }
      ]
    });

    this.http.getPaged<ProductDto>('products', { page: 1, pageSize: 50 }).subscribe({
      next: (res: PagedResult<ProductDto>) => {
        this.products = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
