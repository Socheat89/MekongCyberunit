import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType =
  | 'InStock'
  | 'LowStock'
  | 'OutOfStock'
  | 'DRAFT'
  | 'CONFIRMED'
  | 'DONE'
  | 'CANCELLED'
  | 'PENDING'
  | 'COMPLETED'
  | 'RECEIVED'
  | 'DELIVERED'
  | 'PAID'
  | 'UNPAID'
  | 'PARTIAL'
  | 'ACTIVE'
  | 'INACTIVE'
  | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[11px] font-bold tracking-wide border transition-all duration-200"
      [ngClass]="badgeClasses()"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClasses()"></span>
      <span class="leading-none">{{ formattedLabel() }}</span>
    </span>
  `
})
export class StatusBadgeComponent {
  readonly status = input.required<StatusType>();
  readonly label = input<string | null>(null);

  readonly normalizedStatus = computed(() => {
    return (this.status() || '').toString().trim().toUpperCase();
  });

  readonly formattedLabel = computed(() => {
    if (this.label()) return this.label()!;
    const st = this.status() || '';
    return st
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim();
  });

  readonly badgeClasses = computed(() => {
    const s = this.normalizedStatus();
    switch (s) {
      case 'INSTOCK':
      case 'DONE':
      case 'COMPLETED':
      case 'PAID':
      case 'ACTIVE':
      case 'RECEIVED':
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.18)]';

      case 'LOWSTOCK':
      case 'PENDING':
      case 'PARTIAL':
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.18)]';

      case 'OUTOFSTOCK':
      case 'CANCELLED':
      case 'UNPAID':
      case 'INACTIVE':
      case 'DANGER':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.18)]';

      case 'DRAFT':
        return 'bg-slate-800 text-slate-300 border-slate-700/80';

      case 'CONFIRMED':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.18)]';

      default:
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.18)]';
    }
  });

  readonly dotClasses = computed(() => {
    const s = this.normalizedStatus();
    switch (s) {
      case 'INSTOCK':
      case 'DONE':
      case 'COMPLETED':
      case 'PAID':
      case 'ACTIVE':
      case 'RECEIVED':
      case 'DELIVERED':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]';

      case 'LOWSTOCK':
      case 'PENDING':
      case 'PARTIAL':
      case 'WARNING':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse';

      case 'OUTOFSTOCK':
      case 'CANCELLED':
      case 'UNPAID':
      case 'INACTIVE':
      case 'DANGER':
        return 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)] animate-pulse';

      case 'DRAFT':
        return 'bg-slate-500';

      case 'CONFIRMED':
        return 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]';

      default:
        return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]';
    }
  });
}
