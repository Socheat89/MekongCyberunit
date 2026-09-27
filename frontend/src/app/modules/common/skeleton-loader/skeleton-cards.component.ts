import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      @for (card of cardsArray(); track $index) {
        <div class="rounded-3xl border border-white/[0.08] bg-[#0c1222]/80 backdrop-blur-xl p-5 shadow-xl flex flex-col gap-4 animate-pulse">
          <div class="flex items-center justify-between">
            <div class="h-6 w-24 rounded-full bg-white/[0.08]"></div>
            <div class="h-4 w-16 rounded bg-white/[0.05]"></div>
          </div>
          <div class="space-y-2">
            <div class="h-5 w-3/4 rounded bg-white/[0.1]"></div>
            <div class="h-3.5 w-1/2 rounded bg-white/[0.05]"></div>
          </div>
          <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <div class="h-6 w-20 rounded bg-white/[0.08]"></div>
            <div class="h-8 w-16 rounded-xl bg-white/[0.08]"></div>
          </div>
        </div>
      }
    </div>
  `
})
export class SkeletonCardsComponent {
  readonly count = input<number>(8);

  cardsArray(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
