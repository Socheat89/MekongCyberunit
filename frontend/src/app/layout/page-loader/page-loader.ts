import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top Progress Bar (NProgress-style) -->
    @if (loadingService.isLoading() || loadingService.progress() > 0) {
      <div class="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-slate-200/40 overflow-hidden pointer-events-none">
        <div
          class="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 transition-all duration-200 ease-out shadow-[0_0_12px_rgba(20,184,166,0.8)]"
          [style.width.%]="loadingService.progress()"
        ></div>
      </div>
    }

    <!-- Glassmorphic Page Loading Overlay -->
    @if (loadingService.isLoading()) {
      <div
        class="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/25 backdrop-blur-md transition-all duration-300 animate-fade-in"
        role="status"
        aria-live="polite"
      >
        <div class="relative flex flex-col items-center p-8 rounded-3xl bg-white/90 shadow-2xl shadow-teal-950/20 border border-teal-100/80 backdrop-blur-xl max-w-sm w-full mx-4 text-center transform scale-100 animate-in">
          
          <!-- Animated Brand Icon / Spinner -->
          <div class="relative mb-5 flex items-center justify-center">
            <!-- Glowing ripple pulse -->
            <div class="absolute -inset-2 rounded-2xl bg-teal-400/20 animate-ping opacity-60"></div>
            <div class="absolute -inset-3 rounded-3xl bg-emerald-500/10 blur-sm"></div>

            <!-- Rotating gradient spinner circle -->
            <div class="w-16 h-16 rounded-2xl border-2 border-teal-100 border-t-teal-600 border-r-emerald-500 animate-spin"></div>

            <!-- Center Brand Emblem -->
            <div class="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/30">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <!-- Loading Title -->
          <h3 class="text-base font-bold text-slate-800 tracking-tight mb-1">
            Mekong Stock
          </h3>

          <!-- Animated message -->
          <p class="text-xs font-semibold text-teal-700/90 flex items-center gap-1.5">
            <span>{{ loadingService.loadingMessage() }}</span>
            <span class="inline-flex gap-0.5">
              <span class="w-1 h-1 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.3s]"></span>
              <span class="w-1 h-1 rounded-full bg-teal-600 animate-bounce [animation-delay:-0.15s]"></span>
              <span class="w-1 h-1 rounded-full bg-teal-600 animate-bounce"></span>
            </span>
          </p>

          <!-- Subtle Progress line in modal -->
          <div class="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
              [style.width.%]="loadingService.progress()"
            ></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      pointer-events: none;
    }
  `]
})
export class PageLoader {
  readonly loadingService = inject(LoadingService);
}
