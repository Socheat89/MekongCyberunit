import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppSidebar } from './app-sidebar/app-sidebar';
import { AppHeader } from './app-header/app-header';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppSidebar, AppHeader],
  template: `
    <div class="mekong-shell h-screen text-slate-800 flex overflow-hidden font-sans">
      <!-- Backdrop for Mobile Sidebar -->
      @if (sidebarOpen()) {
        <div
          (click)="sidebarOpen.set(false)"
          class="mekong-backdrop lg:hidden"
        ></div>
      }

      <!-- Sidebar (always show on lg) -->
      <app-sidebar [isOpen]="sidebarOpen()"></app-sidebar>

      <!-- Main Shell Area -->
      <div class="mekong-content flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navigation Header -->
        <app-header (toggleSidebar)="toggleSidebar()"></app-header>

        <!-- Main Page Content with Smooth Transition -->
        <main class="mekong-main relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div
            class="max-w-7xl mx-auto relative mekong-page-wrapper"
            [class.mekong-page-enter]="isRouteAnimating()"
          >
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `
})
export class AppLayout {
  readonly sidebarOpen = signal<boolean>(false);
  readonly isRouteAnimating = signal<boolean>(false);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private animTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.animTimer) clearTimeout(this.animTimer);
        this.isRouteAnimating.set(false);
      }

      if (event instanceof NavigationEnd) {
        // Trigger silky smooth entrance transition
        requestAnimationFrame(() => {
          this.isRouteAnimating.set(true);
        });
      }

      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isRouteAnimating.set(true);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(val => !val);
  }
}

