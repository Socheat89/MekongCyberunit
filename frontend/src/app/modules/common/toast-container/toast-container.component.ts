import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      @for (notif of notificationService.notifications(); track notif.id) {
        <div
          class="pointer-events-auto rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] border backdrop-blur-2xl flex items-start gap-3.5 transition-all duration-300 transform translate-y-0 animate-in"
          [ngClass]="cardClasses(notif)"
        >
          <!-- Icon -->
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" [ngClass]="iconBoxClasses(notif)">
            @if (notif.type === 'success') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
              </svg>
            } @else if (notif.type === 'error') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else if (notif.type === 'warning') {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          </div>

          <!-- Body -->
          <div class="flex-1 min-w-0 pt-0.5">
            <h4 class="text-sm font-bold text-white leading-tight">
              {{ notif.title }}
            </h4>
            @if (notif.message) {
              <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                {{ notif.message }}
              </p>
            }
          </div>

          <!-- Dismiss button -->
          <button
            type="button"
            (click)="notificationService.dismiss(notif.id)"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.08] transition cursor-pointer flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly notificationService = inject(NotificationService);

  cardClasses(notif: AppNotification): string {
    switch (notif.type) {
      case 'success':
        return 'bg-[#0c1222]/95 border-emerald-500/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]';
      case 'error':
        return 'bg-[#0c1222]/95 border-rose-500/30 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)]';
      case 'warning':
        return 'bg-[#0c1222]/95 border-amber-500/30 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]';
      default:
        return 'bg-[#0c1222]/95 border-teal-500/30 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)]';
    }
  }

  iconBoxClasses(notif: AppNotification): string {
    switch (notif.type) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'error':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
    }
  }
}
