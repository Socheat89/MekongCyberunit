import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { HttpBaseService } from '../../services/http-base.service';
import { AuditLog } from '../../models/audit.models';
import { PagedResult } from '../../models/common.models';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonTableComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      @if (loading) {
        <app-skeleton-table [rows]="6"></app-skeleton-table>
      } @else if (logs.length === 0) {
        <app-empty-state
          title="No audit events found"
          description="System events, security audits, and activity logs will appear here."
          icon="document"
        ></app-empty-state>
      } @else {
        <div class="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3.5 px-6">Timestamp (UTC)</th>
                  <th class="py-3.5 px-4">User</th>
                  <th class="py-3.5 px-4">Action</th>
                  <th class="py-3.5 px-4">Target Entity</th>
                  <th class="py-3.5 px-6">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                @for (log of logs; track log.id) {
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3.5 px-6 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {{ log.createdAtUtc | date:'medium' }}
                    </td>
                    <td class="py-3.5 px-4 font-semibold text-slate-800">
                      {{ log.username || 'System' }}
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        [ngClass]="log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' : log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'">
                        {{ log.action }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 font-mono text-slate-600">
                      {{ log.entityName }} #{{ log.entityId || '-' }}
                    </td>
                    <td class="py-3.5 px-6 text-slate-600">
                      {{ log.description }}
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
export class AuditComponent implements OnInit {
  private readonly subHeader = inject(SubHeaderService);
  private readonly http = inject(HttpBaseService);

  loading = true;
  logs: AuditLog[] = [];

  ngOnInit(): void {
    this.subHeader.setConfig({
      title: 'Audit Logs & Security Trail',
      subtitle: 'System Event Ledger & Entity Mutations',
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Audit Trail' }
      ]
    });

    this.http.getPaged<AuditLog>('audit/logs', { page: 1, pageSize: 30 }).subscribe({
      next: (res: PagedResult<AuditLog>) => {
        this.logs = res.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
