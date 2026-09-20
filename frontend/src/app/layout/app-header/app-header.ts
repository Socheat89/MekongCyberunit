import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../login/auth.service';
import { TenantService } from '../../tenancy/tenant.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="mekong-header h-20 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-all">
      <!-- Left: Mobile Menu Toggle & Breadcrumbs -->
      <div class="flex items-center space-x-3 sm:space-x-4">
        <button
          type="button"
          (click)="toggleSidebar.emit()"
          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Breadcrumbs -->
        <div class="flex items-center space-x-2 text-xs font-semibold">
          <span class="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-bold tracking-wide">
            Mekong Stock
          </span>
          <span class="text-slate-300">/</span>
          <span class="text-slate-700 capitalize font-medium text-sm">{{ currentSection() }}</span>
        </div>
      </div>

      <!-- Right: Tenant Context, User Profile & Logout -->
      <div class="flex items-center space-x-3 sm:space-x-4">
        <!-- Active Tenant Badge -->
        <div class="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <span class="text-slate-500 text-[11px] font-medium">Tenant:</span>
          <span class="font-semibold text-slate-800 text-[11px]">{{ tenantService.activeTenant() || 'Default' }}</span>
        </div>

        <!-- User Profile with User Icon -->
        <a
          routerLink="/profile"
          class="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition group"
          title="View profile & security"
        >
          <!-- SVG User Icon Avatar -->
          <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div class="hidden md:block text-left">
            <div class="text-xs font-bold text-slate-800 leading-tight">
              {{ authService.currentUser()?.username || 'Authenticated' }}
            </div>
            <div class="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider leading-tight">
              {{ primaryRole() }}
            </div>
          </div>
        </a>

        <!-- Logout Button -->
        <button
          (click)="logout()"
          class="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition shadow-xs group"
          title="Sign out"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  `
})
export class AppHeader {
  readonly authService = inject(AuthService);
  readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  readonly toggleSidebar = output<void>();

  currentSection(): string {
    const url = this.router.url.split('?')[0];
    const segment = url.split('/').filter(Boolean)[0] || 'dashboard';
    return segment;
  }

  primaryRole(): string {
    const roles = this.authService.currentUser()?.roles;
    if (roles && roles.length > 0) {
      return roles[0];
    }
    return 'User';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
