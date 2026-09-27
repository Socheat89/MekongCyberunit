import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TopNavbarComponent } from './top-navbar/top-navbar';
import { SubHeaderComponent } from './sub-header/sub-header';
import { ToastContainerComponent } from '../modules/common/toast-container/toast-container.component';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TopNavbarComponent,
    SubHeaderComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="min-h-screen bg-[#070a13] text-slate-100 dark:bg-[#070a13] dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased relative overflow-x-hidden">
      <!-- Ambient Cosmic Glow Mesh Orbs (Futuristic Executive Atmosphere) -->
      <div class="fixed top-[-10%] left-[20%] w-[650px] h-[450px] bg-gradient-to-br from-emerald-500/12 via-teal-500/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" style="animation-duration: 8s;"></div>
      <div class="fixed top-[20%] right-[-5%] w-[550px] h-[450px] bg-gradient-to-bl from-cyan-500/10 via-indigo-600/8 to-transparent rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse" style="animation-duration: 12s;"></div>
      <div class="fixed bottom-[-10%] left-[30%] w-[750px] h-[500px] bg-gradient-to-tr from-teal-600/8 via-emerald-600/10 to-transparent rounded-full blur-[160px] pointer-events-none -z-10"></div>
      <!-- Subtle Tech Grid Overlay for Texture -->
      <div class="fixed inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10"></div>

      <!-- Sticky Odoo-Inspired Top Navbar -->
      <app-top-navbar></app-top-navbar>

      <!-- Contextual Dynamic Sub-Header Ribbon -->
      <app-sub-header></app-sub-header>

      <!-- Main Application Workspace (Full-Width, Zero Left Sidebar) -->
      <main class="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8">
        <div
          class="relative w-full transition-opacity duration-200"
          [class.opacity-100]="isRouteReady()"
          [class.opacity-70]="!isRouteReady()"
        >
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Global Enterprise Toast Alerts Container -->
      <app-toast-container></app-toast-container>
    </div>
  `
})
export class AppLayout {
  readonly themeService = inject(ThemeService);
  readonly isRouteReady = signal<boolean>(true);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isRouteReady.set(false);
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        requestAnimationFrame(() => {
          this.isRouteReady.set(true);
        });
      }
    });
  }
}
