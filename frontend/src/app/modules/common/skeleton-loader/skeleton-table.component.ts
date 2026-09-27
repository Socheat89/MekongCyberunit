import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1222]/80 backdrop-blur-xl shadow-2xl">
      <!-- Table Header Placeholder -->
      <div class="border-b border-white/[0.08] bg-white/[0.02] px-6 py-4 flex items-center justify-between gap-4">
        <div class="h-4 w-48 rounded-md bg-white/[0.08] animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-8 w-24 rounded-xl bg-white/[0.06] animate-pulse"></div>
          <div class="h-8 w-20 rounded-xl bg-white/[0.06] animate-pulse"></div>
        </div>
      </div>

      <!-- Shimmer Rows -->
      <div class="divide-y divide-white/[0.04]">
        @for (row of rowsArray(); track $index) {
          <div class="px-6 py-4 flex items-center gap-6 animate-pulse">
            <!-- Col 1: Sku / Code -->
            <div class="w-32 flex flex-col gap-1.5 flex-shrink-0">
              <div class="h-4 w-24 rounded bg-white/[0.1]"></div>
              <div class="h-3 w-16 rounded bg-white/[0.05]"></div>
            </div>

            <!-- Col 2: Name / Details -->
            <div class="flex-1 flex flex-col gap-1.5">
              <div class="h-4 w-3/4 rounded bg-white/[0.1]"></div>
              <div class="h-3 w-1/2 rounded bg-white/[0.05]"></div>
            </div>

            <!-- Col 3: Warehouse / Category -->
            <div class="w-40 hidden md:flex flex-col gap-1.5 flex-shrink-0">
              <div class="h-3.5 w-28 rounded bg-white/[0.08]"></div>
              <div class="h-2.5 w-16 rounded bg-white/[0.04]"></div>
            </div>

            <!-- Col 4: Quantities -->
            <div class="w-28 text-right hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
              <div class="h-4 w-16 rounded bg-white/[0.1]"></div>
              <div class="h-3 w-10 rounded bg-white/[0.05]"></div>
            </div>

            <!-- Col 5: Status Pill -->
            <div class="w-28 flex justify-center flex-shrink-0">
              <div class="h-6 w-20 rounded-full bg-white/[0.08]"></div>
            </div>

            <!-- Col 6: Actions -->
            <div class="w-20 flex justify-end gap-1.5 flex-shrink-0">
              <div class="h-7 w-7 rounded-lg bg-white/[0.08]"></div>
              <div class="h-7 w-7 rounded-lg bg-white/[0.08]"></div>
            </div>
          </div>
        }
      </div>

      <!-- Pagination Footer Placeholder -->
      <div class="border-t border-white/[0.06] bg-white/[0.02] px-6 py-3.5 flex items-center justify-between">
        <div class="h-4 w-36 rounded bg-white/[0.08] animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-8 w-8 rounded-lg bg-white/[0.08] animate-pulse"></div>
          <div class="h-8 w-8 rounded-lg bg-white/[0.08] animate-pulse"></div>
          <div class="h-8 w-8 rounded-lg bg-white/[0.08] animate-pulse"></div>
        </div>
      </div>
    </div>
  `
})
export class SkeletonTableComponent {
  readonly rows = input<number>(6);

  rowsArray(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i);
  }
}
