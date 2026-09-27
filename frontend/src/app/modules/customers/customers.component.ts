import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { CustomerDto } from '../../models/customer.models';
import { PagedResult } from '../../models/common.models';
import { StatusBadgeComponent } from '../common/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, SkeletonTableComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-table [rows]="5"></app-skeleton-table>
      } @else if (customers.length === 0) {
        <app-empty-state
          title="No customers recorded"
          description="Customer directory and credit balances will appear here."
          icon="document"
        ></app-empty-state>
      } @else {
        <div class="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-6">Code</th>
                  <th class="py-3.5 px-4">Customer Name</th>
                  <th class="py-3.5 px-4">Contact / Phone</th>
                  <th class="py-3.5 px-4">Type</th>
                  <th class="py-3.5 px-4 text-right">Credit Limit</th>
                  <th class="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                @for (c of customers; track c.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-6 font-mono font-bold text-teal-800">{{ c.customerCode }}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">{{ c.name }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ c.phone || '-' }}</td>
                    <td class="py-3.5 px-4 text-slate-600">{{ c.customerType }}</td>
                    <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-900">$ {{ c.creditLimit | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-6 text-center">
                      <app-status-badge [status]="c.isActive ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
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
export class CustomersComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  customers: CustomerDto[] = [];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Customer Directory & Accounts',
      subtitle: 'Customer Profiles & Balance Tracking',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Customers' }
      ]
    });

    this.http.getPaged<CustomerDto>('customers', { page: 1, pageSize: 25 }).subscribe({
      next: (res: PagedResult<CustomerDto>) => {
        this.customers = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
