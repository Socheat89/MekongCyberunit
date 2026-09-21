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
    <header class="mekong-header h-[60px] sticky top-0 z-10 px-4 sm:px-6 flex items-center justify-between">

      <!-- Left: Mobile Toggle + Breadcrumb -->
      <div class="flex items-center gap-3">
        <!-- Mobile hamburger -->
        <button
          type="button"
          id="sidebar-toggle"
          (click)="toggleSidebar.emit()"
          class="mekong-hamburger lg:hidden"
          aria-label="Toggle navigation"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm font-semibold">
          <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide"
            style="background: linear-gradient(135deg, #e4f8f3, rgba(195,236,226,0.65)); border: 1px solid #b8e4da; color: #0f766e;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            Mekong Stock
          </span>
          <span class="text-slate-300 text-base leading-none hidden sm:inline">/</span>
          <span class="text-[#1a3e3b] capitalize font-bold text-sm">{{ currentSection() }}</span>
        </div>
      </div>

      <!-- Right: Tenant + User + Logout -->
      <div class="flex items-center gap-2 sm:gap-3">

        <!-- Active Tenant Badge -->
        <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
          style="background: rgba(232,248,244,0.9); border: 1px solid rgba(180,225,215,0.7); color: #4a6e68;">
          <svg class="w-3.5 h-3.5 text-[#0f766e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <span class="font-semibold text-[#5a8880]">Tenant:</span>
          <span class="font-bold text-[#1a3e3b]">{{ tenantService.activeTenant() || 'Default' }}</span>
        </div>

        <!-- User Profile Link -->
        <a
          routerLink="/profile"
          id="user-profile-link"
          class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all hover:bg-teal-600/10 group cursor-pointer"
          title="View profile & security"
        >
          <div class="mekong-user-avatar group-hover:scale-105 transition-transform">
            <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div class="hidden md:block text-left">
            <div class="text-sm font-bold text-[#1a3e3b] leading-tight group-hover:text-teal-800 transition-colors">
              {{ authService.currentUser()?.username || 'Authenticated' }}
            </div>
            <div class="text-xs font-bold uppercase tracking-wide leading-tight mt-0.5 text-teal-700" style="font-size: 0.65rem;">
              {{ primaryRole() }}
            </div>
          </div>
        </a>

        <!-- Divider -->
        <div class="hidden sm:block w-px h-5" style="background: rgba(200,228,222,0.9);"></div>

        <!-- Logout Button -->
        <button
          id="logout-btn"
          (click)="logout()"
          class="mekong-logout-btn flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border"
          style="background: rgba(243,249,247,0.85); border-color: rgba(195,224,216,0.8); color: #4a726c;"
          title="Sign out"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
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

  userInitials(): string {
    const username = this.authService.currentUser()?.username || 'AU';
    return username.substring(0, 2).toUpperCase();
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
