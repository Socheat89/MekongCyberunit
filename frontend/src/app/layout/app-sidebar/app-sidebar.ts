import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { NavigationService } from './navigation.service';
import { AuthService } from '../../login/auth.service';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="mekong-sidebar fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0"
      [class.-translate-x-full]="!isOpen()"
      [class.translate-x-0]="isOpen()"
    >
      <!-- Brand Logo -->
      <div class="mekong-sidebar__brand h-[72px] flex items-center px-4">
        <a routerLink="/dashboard" class="flex items-center gap-3 group w-full">
          <div class="mekong-logo w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="flex flex-col leading-none min-w-0">
            <span class="text-sm font-black tracking-tight text-white transition-colors group-hover:text-[#3de8d4]">
              Mekong Stock
            </span>
            <span class="mekong-sidebar__tagline text-xs font-semibold uppercase mt-1">
              Inventory workspace
            </span>
          </div>
        </a>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 overflow-y-auto px-3 py-5 space-y-6">

        <!-- Workspace Section -->
        <div>
          <div class="mekong-sidebar__section px-2 mb-2.5">Workspace</div>
          <nav class="space-y-0.5">

            <!-- Dashboard -->
            @if (hasAccess('dashboard')) {
              <a routerLink="/dashboard" routerLinkActive="active" class="mekong-nav-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"/>
                </svg>
                <span>Dashboard</span>
              </a>
            }
          </nav>
        </div>

        <!-- Stock Management Section -->
        @if (hasStockAccess()) {
          <div>
            <div class="mekong-sidebar__section px-2 mb-2.5 flex items-center justify-between">
              <span>Stock &amp; Inventory</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-md" style="background: rgba(20,200,180,0.12); color: rgba(62,232,212,0.75); border: 1px solid rgba(20,200,180,0.18);">
                គ្រប់គ្រងស្តុក
              </span>
            </div>

            <div class="space-y-0.5">
              <button type="button" (click)="toggleStock()" class="mekong-settings-toggle">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 flex-shrink-0" style="color: rgba(62,232,212,0.7);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <span class="font-semibold">Stock Operations</span>
                </div>
                <div class="flex items-center gap-1.5">
                  @if (alertCount() > 0) {
                    <span class="px-2 py-0.5 rounded-full text-white text-xs font-black leading-tight"
                      style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                      {{ alertCount() }}
                    </span>
                  }
                  <svg
                    class="w-3.5 h-3.5 flex-shrink-0"
                    [class.mekong-chevron-open]="isStockExpanded()"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>

              <!-- Stock Submenu -->
              @if (isStockExpanded()) {
                <div class="mekong-submenu mt-0.5 ml-4 pl-3 space-y-0.5 border-l-[1.5px]">
                  @if (hasAccess('stock-items')) {
                    <a routerLink="/stock/items" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                      </svg>
                      <span>Items Catalogue</span>
                    </a>
                  }

                  @if (hasAccess('stock-in')) {
                    <a routerLink="/stock/in" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                      </svg>
                      <span>Stock In (នាំចូល)</span>
                    </a>
                  }

                  @if (hasAccess('stock-out')) {
                    <a routerLink="/stock/out" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                      </svg>
                      <span>Stock Out (នាំចេញ)</span>
                    </a>
                  }

                  @if (hasAccess('stock-adjustments')) {
                    <a routerLink="/stock/adjustments" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                      </svg>
                      <span>Adjustments (កែសម្រួល)</span>
                    </a>
                  }

                  @if (hasAccess('stock-movements')) {
                    <a routerLink="/stock/movements" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Movements (ចលនាស្តុក)</span>
                    </a>
                  }

                  @if (hasAccess('stock-alerts')) {
                    <a routerLink="/stock/alerts" routerLinkActive="active" class="mekong-submenu-item justify-between">
                      <div class="flex items-center gap-2.5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        <span>Low Stock Alerts</span>
                      </div>
                      @if (alertCount() > 0) {
                        <span class="px-2 py-0.5 rounded-full text-xs font-black" style="background: rgba(239,68,68,0.18); color: #fca5a5;">
                          {{ alertCount() }}
                        </span>
                      }
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Configuration Section -->
        @if (hasSettingsAccess()) {
          <div>
            <div class="mekong-sidebar__section px-2 mb-2.5">Configuration</div>

            <div class="space-y-0.5">
              <button type="button" (click)="toggleSettings()" class="mekong-settings-toggle">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <circle cx="12" cy="12" r="3" stroke-width="1.8"/>
                  </svg>
                  <span class="font-semibold">Settings</span>
                </div>
                <svg
                  class="w-3.5 h-3.5 flex-shrink-0"
                  [class.mekong-chevron-open]="isSettingsExpanded()"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              @if (isSettingsExpanded()) {
                <div class="mekong-submenu mt-0.5 ml-4 pl-3 space-y-0.5 border-l-[1.5px]">
                  @if (hasAccess('units')) {
                    <a routerLink="/units" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      <span>Units of Measure</span>
                    </a>
                  }

                  @if (hasAccess('roles')) {
                    <a routerLink="/roles" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      <span>System Roles</span>
                    </a>
                  }

                  @if (hasAccess('permissions')) {
                    <a routerLink="/permissions" routerLinkActive="active" class="mekong-submenu-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                      </svg>
                      <span>Permissions</span>
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Bottom Profile Bar -->
      <div class="mekong-sidebar__profile p-3">
        <a routerLink="/profile" class="mekong-sidebar__profile-link">
          <div class="mekong-profile-avatar">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate leading-tight" style="color: rgba(220,245,240,0.9);">
              {{ authService.currentUser()?.username || 'admin' }}
            </div>
            <div class="text-xs font-medium truncate mt-0.5" style="color: rgba(100,170,162,0.7);">
              View Profile &amp; Security
            </div>
          </div>
          <svg class="w-4 h-4 flex-shrink-0" style="color: rgba(62,200,180,0.45);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </aside>
  `
})
export class AppSidebar implements OnInit {
  readonly navService = inject(NavigationService);
  readonly authService = inject(AuthService);
  readonly stockService = inject(StockService);
  readonly isOpen = input<boolean>(false);

  readonly isSettingsExpanded = signal<boolean>(false);
  readonly isStockExpanded = signal<boolean>(true);
  readonly alertCount = signal<number>(0);

  ngOnInit(): void {
    this.navService.getNavigation().subscribe({
      error: () => {}
    });

    this.stockService.getAlerts().subscribe({
      next: alerts => this.alertCount.set(alerts?.length || 0),
      error: () => {}
    });
  }

  toggleSettings(): void {
    this.isSettingsExpanded.update(val => !val);
  }

  toggleStock(): void {
    this.isStockExpanded.update(val => !val);
  }

  userInitials(): string {
    const username = this.authService.currentUser()?.username || 'Admin';
    return username.substring(0, 2).toUpperCase();
  }

  hasAccess(pageCode: string): boolean {
    const items = this.navService.navigationItems();
    if (!items || items.length === 0) return false;
    return this.navService.hasPageCode(items, pageCode);
  }

  hasStockAccess(): boolean {
    return this.hasAccess('stock') ||
           this.hasAccess('stock-items') ||
           this.hasAccess('stock-in') ||
           this.hasAccess('stock-out') ||
           this.hasAccess('stock-adjustments') ||
           this.hasAccess('stock-movements') ||
           this.hasAccess('stock-alerts');
  }

  hasSettingsAccess(): boolean {
    return this.hasAccess('settings') || this.hasAccess('units') || this.hasAccess('roles') || this.hasAccess('permissions');
  }
}
