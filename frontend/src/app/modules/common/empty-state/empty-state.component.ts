import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-white/10 bg-[#0c1222]/80 backdrop-blur-xl shadow-2xl animate-fade-in my-6">
      <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
        @if (icon() === 'inventory') {
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        } @else if (icon() === 'search') {
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        } @else {
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      </div>

      <h3 class="text-base font-bold text-white mb-1">
        {{ title() }}
      </h3>

      <p class="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        {{ description() }}
      </p>

      @if (actionLabel()) {
        <button
          type="button"
          (click)="actionClicked.emit()"
          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition flex items-center gap-2 cursor-pointer"
        >
          <span>{{ actionLabel() }}</span>
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  readonly title = input<string>('No records found');
  readonly description = input<string>('There are no items matching your current filters or criteria.');
  readonly icon = input<'inventory' | 'search' | 'document'>('inventory');
  readonly actionLabel = input<string | null>(null);

  readonly actionClicked = output<void>();
}
