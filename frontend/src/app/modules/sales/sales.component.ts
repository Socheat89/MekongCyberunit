import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { SalesOrderDto } from '../../models/sales.models';
import { PagedResult } from '../../models/common.models';
import { StatusBadgeComponent } from '../common/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, SkeletonTableComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-table [rows]="5"></app-skeleton-table>
      } @else if (sales.length === 0) {
        <app-empty-state
          title="No sales orders found"
          description="Sales orders and customer invoices will appear here."
          icon="document"
        ></app-empty-state>
      } @else {
        <div class="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-6">Invoice #</th>
                  <th class="py-3.5 px-4">Customer</th>
                  <th class="py-3.5 px-4">Date</th>
                  <th class="py-3.5 px-4 text-right">Total Amount</th>
                  <th class="py-3.5 px-4 text-center">Payment Status</th>
                  <th class="py-3.5 px-6 text-center">Order Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                @for (s of sales; track s.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-6 font-mono font-bold text-teal-800">{{ s.invoiceNumber }}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">{{ s.customerName }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ s.saleDateUtc | date:'mediumDate' }}</td>
                    <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ {{ s.totalAmount | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 text-center">
                      <app-status-badge [status]="s.paymentStatus"></app-status-badge>
                    </td>
                    <td class="py-3.5 px-6 text-center">
                      <app-status-badge [status]="s.status"></app-status-badge>
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
export class SalesComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  sales: SalesOrderDto[] = [];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Sales Orders & Invoicing',
      subtitle: 'Order Fulfillment & Customer Dispatch',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Sales' }
      ]
    });

    this.http.getPaged<SalesOrderDto>('sales/orders', { page: 1, pageSize: 25 }).subscribe({
      next: (res: PagedResult<SalesOrderDto>) => {
        this.sales = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
