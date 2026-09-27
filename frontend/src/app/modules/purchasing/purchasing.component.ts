import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { PurchaseOrderDto } from '../../models/purchasing.models';
import { PagedResult } from '../../models/common.models';
import { StatusBadgeComponent } from '../common/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, SkeletonTableComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-table [rows]="5"></app-skeleton-table>
      } @else if (orders.length === 0) {
        <app-empty-state
          title="No purchase orders found"
          description="Purchase orders and vendor receipts will appear here."
          icon="document"
        ></app-empty-state>
      } @else {
        <div class="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-6">PO Number</th>
                  <th class="py-3.5 px-4">Vendor / Supplier</th>
                  <th class="py-3.5 px-4">Warehouse</th>
                  <th class="py-3.5 px-4">Order Date</th>
                  <th class="py-3.5 px-4 text-right">Total Amount</th>
                  <th class="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                @for (po of orders; track po.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-6 font-mono font-bold text-teal-800">{{ po.poNumber }}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">{{ po.supplierName }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ po.warehouseName || 'HQ Central' }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ po.orderDateUtc | date:'mediumDate' }}</td>
                    <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ {{ po.totalAmount | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-6 text-center">
                      <app-status-badge [status]="po.status"></app-status-badge>
                    </td>
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
export class PurchasingComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  orders: PurchaseOrderDto[] = [];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Purchase Orders & Vendor Goods Receipt',
      subtitle: 'Procurement Workflow',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Purchasing' }
      ]
    });

    this.http.getPaged<PurchaseOrderDto>('purchasing/orders', { page: 1, pageSize: 25 }).subscribe({
      next: (res: PagedResult<PurchaseOrderDto>) => {
        this.orders = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
