import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { SupplierDto } from '../../models/supplier.models';
import { PagedResult } from '../../models/common.models';
import { StatusBadgeComponent } from '../common/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, SkeletonTableComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-table [rows]="5"></app-skeleton-table>
      } @else if (suppliers.length === 0) {
        <app-empty-state
          title="No suppliers found"
          description="Supplier directory and vendor records will appear here."
          icon="document"
        ></app-empty-state>
      } @else {
        <div class="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-6">Supplier Code</th>
                  <th class="py-3.5 px-4">Vendor Name</th>
                  <th class="py-3.5 px-4">Contact Person</th>
                  <th class="py-3.5 px-4">Phone / Email</th>
                  <th class="py-3.5 px-4">Terms</th>
                  <th class="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                @for (s of suppliers; track s.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-6 font-mono font-bold text-teal-800">{{ s.supplierCode }}</td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">{{ s.name }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ s.contactPerson || '-' }}</td>
                    <td class="py-3.5 px-4 text-slate-500">{{ s.phone || s.email || '-' }}</td>
                    <td class="py-3.5 px-4 font-medium text-slate-600">{{ s.paymentTerms }}</td>
                    <td class="py-3.5 px-6 text-center">
                      <app-status-badge [status]="s.isActive ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
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
export class SuppliersComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  suppliers: SupplierDto[] = [];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Supplier & Vendor Management',
      subtitle: 'Vendor Records & Procurement Terms',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Suppliers' }
      ]
    });

    this.http.getPaged<SupplierDto>('suppliers', { page: 1, pageSize: 25 }).subscribe({
      next: (res: PagedResult<SupplierDto>) => {
        this.suppliers = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
