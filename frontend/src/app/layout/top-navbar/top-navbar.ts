import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../login/auth.service';
import { TenantService } from '../../tenancy/tenant.service';
import { LoadingService } from '../../services/loading.service';
import { ThemeService } from '../../services/theme.service';
import { OmniSearchModalComponent } from '../../modules/common/omni-search-modal/omni-search-modal.component';

export interface ModuleAppItem {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  category: 'Core' | 'Operations' | 'Finance' | 'Admin';
}

export interface BranchItem {
  id: string;
  code: string;
  name: string;
  location: string;
  isDefault?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'warning' | 'info' | 'danger';
  route?: string;
  unread: boolean;
}

export interface QuickTab {
  label: string;
  route: string;
  icon?: string;
  badge?: string;
}

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, OmniSearchModalComponent],
  template: `
    <!-- Top Progress Bar for Active HTTP calls -->
    @if (loadingService.isLoading() || loadingService.progress() > 0) {
      <div class="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-emerald-950/40 overflow-hidden pointer-events-none">
        <div
          class="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 transition-all duration-200 ease-out shadow-[0_0_16px_rgba(52,211,153,1)]"
          [style.width.%]="loadingService.progress()"
        ></div>
      </div>
    }

    <!-- Sticky Main Header Bar (Cyber Obsidian Glassmorphism) -->
    <header class="sticky top-0 z-40 bg-[#080d1a]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.6)] transition-all">
      <div class="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        <!-- ══════════════════════════════════════════════════════════
             LEFT: BRAND LOGO + ODOO APP LAUNCHER + QUICK LINK TABS
             ══════════════════════════════════════════════════════════ -->
        <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">

          <!-- Odoo-Style App Launcher (9-Dots Grid) -->
          <div class="relative">
            <button
              type="button"
              id="app-launcher-btn"
              (click)="toggleAppLauncher($event)"
              class="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] group relative"
              [class.bg-emerald-500-15]="appLauncherOpen()"
              [class.border-emerald-500-40]="appLauncherOpen()"
              [class.ring-2]="appLauncherOpen()"
              [class.ring-emerald-500-30]="appLauncherOpen()"
              title="Application Launcher (All Modules)"
              aria-label="Application Launcher"
            >
              <!-- 9-dot grid icon -->
              <svg class="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="5" r="2" />
                <circle cx="12" cy="5" r="2" />
                <circle cx="19" cy="5" r="2" />
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="12" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
              </svg>
            </button>

            <!-- App Launcher Dropdown Flyout Grid -->
            @if (appLauncherOpen()) {
              <div
                class="absolute left-0 mt-3 w-[360px] sm:w-[520px] bg-[#0c1222]/95 backdrop-blur-3xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/10 p-5 z-50 animate-fade-in-up"
                (click)="$event.stopPropagation()"
              >
                <div class="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/[0.08]">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse"></span>
                    <span class="text-xs font-black text-white uppercase tracking-wider">Enterprise Command Center</span>
                  </div>
                  <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    Odoo Architecture
                  </span>
                </div>

                <!-- Grid of Apps -->
                <div class="grid grid-cols-3 gap-2.5 max-h-[440px] overflow-y-auto p-1">
                  @for (app of appModules; track app.id) {
                    <a
                      [routerLink]="app.route"
                      (click)="appLauncherOpen.set(false)"
                      class="flex flex-col items-center text-center p-3 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-200 group cursor-pointer hover:shadow-lg"
                      [class.bg-emerald-500-10]="isRouteActive(app.route)"
                      [class.border-emerald-500-30]="isRouteActive(app.route)"
                    >
                      <div
                        class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-200"
                        [ngClass]="app.color"
                      >
                        <span class="font-bold text-lg" [innerHTML]="app.icon"></span>
                      </div>
                      <span class="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors leading-tight line-clamp-1">
                        {{ app.name }}
                      </span>
                      <span class="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {{ app.description }}
                      </span>
                    </a>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Company Brand Logo with Gradient & Micro-Badge -->
          <a routerLink="/dashboard" class="flex items-center gap-3 group cursor-pointer">
            <div class="relative">
              <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div class="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 via-emerald-950 to-teal-900 flex items-center justify-center text-white shadow-xl border border-emerald-400/40">
                <svg class="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
            <div class="hidden md:flex flex-col">
              <div class="flex items-center gap-1.5">
                <span class="text-base font-black tracking-tight text-white leading-tight">
                  Mekong<span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Stock</span>
                </span>
                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)] flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  v2.4
                </span>
              </div>
              <span class="text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                Command Centre
              </span>
            </div>
          </a>

          <!-- Quick-Link Module Tabs (Top Horizontal Nav) -->
          <nav class="hidden lg:flex items-center gap-1 ml-2 border-l border-white/[0.08] pl-3.5">
            @for (tab of quickTabs; track tab.route) {
              <a
                [routerLink]="tab.route"
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer flex items-center gap-1.5"
                [ngClass]="isRouteActive(tab.route)
                  ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'"
              >
                @if (isRouteActive(tab.route)) {
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                }
                <span>{{ tab.label }}</span>
                @if (tab.badge) {
                  <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {{ tab.badge }}
                  </span>
                }
              </a>
            }
          </nav>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             CENTER: GLOBAL OMNI-SEARCH BAR (Ctrl+K)
             ══════════════════════════════════════════════════════════ -->
        <div class="flex-1 max-w-xl mx-2">
          <button
            type="button"
            id="omni-search-trigger"
            (click)="omniSearchOpen.set(true)"
            class="w-full h-10 px-4 rounded-full bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-emerald-500/40 text-slate-400 hover:text-slate-200 flex items-center justify-between text-xs sm:text-sm transition-all duration-200 shadow-inner hover:shadow-[0_0_20px_rgba(16,185,129,0.18)] cursor-pointer group"
          >
            <div class="flex items-center gap-2.5 truncate">
              <svg class="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span class="truncate text-slate-400 font-medium group-hover:text-slate-200">Search SKU, Barcode, Warehouse, Document...</span>
            </div>

            <!-- Keyboard Shortcut Badge -->
            <div class="flex items-center gap-1 flex-shrink-0 pl-2">
              <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300 bg-white/[0.06] border border-white/10 rounded shadow-xs">
                Ctrl K
              </kbd>
            </div>
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             RIGHT: TENANCY SELECTOR + THEME + NOTIFS + USER PROFILE
             ══════════════════════════════════════════════════════════ -->
        <div class="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">

          <!-- Multi-Tenancy / Branch Selector Dropdown -->
          <div class="relative">
            <button
              type="button"
              id="branch-selector-btn"
              (click)="toggleBranchMenu($event)"
              class="h-9 px-3 rounded-full bg-slate-900/70 hover:bg-slate-800/80 border border-white/[0.08] text-slate-200 flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow-md hover:border-emerald-500/40"
              [class.border-emerald-500-40]="branchMenuOpen()"
              [class.ring-2]="branchMenuOpen()"
              [class.ring-emerald-500-30]="branchMenuOpen()"
              title="Switch Warehouse Branch / Company Tenant"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span class="font-bold text-white truncate max-w-[120px]">{{ activeBranch().name }}</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- Branch Dropdown -->
            @if (branchMenuOpen()) {
              <div
                class="absolute right-0 mt-2.5 w-68 bg-[#0c1222]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 p-2.5 z-50 animate-fade-in-up"
                (click)="$event.stopPropagation()"
              >
                <div class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.08] flex items-center justify-between">
                  <span>Active Facility / Tenant</span>
                  <span class="text-emerald-400 font-mono">3 Online</span>
                </div>
                <div class="py-1 space-y-1">
                  @for (b of branches; track b.id) {
                    <button
                      type="button"
                      (click)="selectBranch(b)"
                      class="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left text-xs transition cursor-pointer"
                      [ngClass]="activeBranch().id === b.id ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30' : 'hover:bg-white/[0.06] text-slate-300 border border-transparent'"
                    >
                      <div class="min-w-0">
                        <div class="truncate font-bold text-white">{{ b.name }}</div>
                        <div class="text-[10px] text-slate-400 truncate">{{ b.location }}</div>
                      </div>
                      @if (activeBranch().id === b.id) {
                        <div class="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      }
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Quick Theme Switcher Button (Dark / Light) -->
          <button
            type="button"
            id="theme-toggle-btn"
            (click)="themeService.toggleTheme()"
            class="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-300 hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer shadow-md"
            [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            @if (themeService.isDark()) {
              <svg class="w-4.5 h-4.5 text-amber-400 hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            } @else {
              <svg class="w-4.5 h-4.5 text-slate-200 hover:-rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            }
          </button>

          <!-- Notification Bell with Live Counters -->
          <div class="relative">
            <button
              type="button"
              id="notification-bell-btn"
              (click)="toggleNotifications($event)"
              class="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer relative shadow-md"
              [class.bg-emerald-500-15]="notificationsOpen()"
              title="System & Stock Alerts"
            >
              <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>

              <!-- Pill Counter Badge -->
              @if (unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-[#080d1a] shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse">
                  {{ unreadCount() }}
                </span>
              }
            </button>

            <!-- Notifications Dropdown -->
            @if (notificationsOpen()) {
              <div
                class="absolute right-0 mt-2.5 w-84 sm:w-96 bg-[#0c1222]/95 backdrop-blur-2xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden z-50 animate-fade-in-up"
                (click)="$event.stopPropagation()"
              >
                <div class="px-4 py-3 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white">Operational Alerts</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {{ unreadCount() }} New
                    </span>
                  </div>
                  <button
                    type="button"
                    (click)="markAllNotificationsRead()"
                    class="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Mark all read
                  </button>
                </div>

                <div class="divide-y divide-white/[0.06] max-h-[320px] overflow-y-auto">
                  @for (n of notifications(); track n.id) {
                    <div
                      class="p-3.5 hover:bg-white/[0.04] transition flex gap-3 items-start cursor-pointer"
                      [class.bg-amber-500-10]="n.unread"
                      (click)="handleNotificationClick(n)"
                    >
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        [ngClass]="n.type === 'danger' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold text-white leading-tight">{{ n.title }}</div>
                        <div class="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{{ n.description }}</div>
                        <div class="text-[10px] text-slate-500 mt-1 font-medium">{{ n.time }}</div>
                      </div>
                    </div>
                  }
                </div>

                <div class="p-2.5 bg-white/[0.02] border-t border-white/[0.08] text-center">
                  <a routerLink="/inventory" (click)="notificationsOpen.set(false)" class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
                    View full inventory alerts →
                  </a>
                </div>
              </div>
            }
          </div>

          <!-- Divider -->
          <div class="h-6 w-px bg-white/[0.08] mx-0.5 hidden sm:block"></div>

          <!-- User Profile Dropdown -->
          <div class="relative">
            <button
              type="button"
              id="user-menu-btn"
              (click)="toggleUserMenu($event)"
              class="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-full hover:bg-white/[0.08] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer group"
              [class.bg-white-08]="userMenuOpen()"
              title="User Account & Preferences"
            >
              <!-- Avatar with Ring Accent -->
              <div class="relative">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md ring-2 ring-emerald-400/40 group-hover:scale-105 transition-transform">
                  {{ userInitials() }}
                </div>
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080d1a] shadow-[0_0_6px_rgba(52,211,153,0.9)]"></span>
              </div>

              <!-- Username & Role -->
              <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                  {{ currentUser()?.username || 'User' }}
                </span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                  {{ primaryRole() }}
                </span>
              </div>

              <svg class="w-3.5 h-3.5 text-slate-400 ml-0.5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- User Menu Dropdown -->
            @if (userMenuOpen()) {
              <div
                class="absolute right-0 mt-2.5 w-60 bg-[#0c1222]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 p-2.5 z-50 animate-fade-in-up"
                (click)="$event.stopPropagation()"
              >
                <!-- Profile Header -->
                <div class="px-3 py-2.5 border-b border-white/[0.08] mb-1.5 bg-white/[0.03] rounded-xl">
                  <div class="text-xs font-bold text-white">{{ currentUser()?.username }}</div>
                  <div class="text-[11px] text-emerald-400 font-semibold mt-0.5">Role: {{ primaryRole() }}</div>
                </div>

                <!-- Links -->
                <div class="space-y-0.5">
                  <a
                    routerLink="/profile"
                    (click)="userMenuOpen.set(false)"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span>My Profile</span>
                  </a>

                  <a
                    routerLink="/2fa-setup"
                    (click)="userMenuOpen.set(false)"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span>2FA Security Setup</span>
                  </a>

                  <a
                    routerLink="/users"
                    (click)="userMenuOpen.set(false)"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    <span>Users & RBAC Directory</span>
                  </a>
                </div>

                <!-- Divider -->
                <div class="my-1.5 border-t border-white/[0.08]"></div>

                <!-- Logout -->
                <button
                  type="button"
                  id="navbar-logout-btn"
                  (click)="logout()"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            }
          </div>

        </div>

      </div>
    </header>

    <!-- Global Omni-Search Modal -->
    <app-omni-search-modal
      [isOpen]="omniSearchOpen()"
      (closed)="omniSearchOpen.set(false)"
    ></app-omni-search-modal>
  `
})
export class TopNavbarComponent {
  readonly authService = inject(AuthService);
  readonly tenantService = inject(TenantService);
  readonly loadingService = inject(LoadingService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly appLauncherOpen = signal<boolean>(false);
  readonly branchMenuOpen = signal<boolean>(false);
  readonly notificationsOpen = signal<boolean>(false);
  readonly userMenuOpen = signal<boolean>(false);
  readonly omniSearchOpen = signal<boolean>(false);

  readonly currentUser = this.authService.currentUser;

  // Horizontal Quick Tabs
  readonly quickTabs: QuickTab[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Inventory', route: '/inventory' },
    { label: 'Catalog', route: '/catalog' },
    { label: 'Purchasing', route: '/purchasing' },
    { label: 'Sales', route: '/sales' },
    { label: 'Reports', route: '/reports' }
  ];

  // Odoo Module Grid
  readonly appModules: ModuleAppItem[] = [
    { id: 'dash', name: 'Dashboard', description: 'KPIs & Command Pulse', route: '/dashboard', icon: '📊', color: 'bg-gradient-to-tr from-sky-500 to-cyan-400', category: 'Core' },
    { id: 'inv', name: 'Inventory', description: 'On-hand & Transfers', route: '/inventory', icon: '📦', color: 'bg-gradient-to-tr from-emerald-500 to-teal-400', category: 'Operations' },
    { id: 'cat', name: 'Catalog', description: 'Product Master & SKUs', route: '/catalog', icon: '🏷️', color: 'bg-gradient-to-tr from-indigo-500 to-blue-400', category: 'Operations' },
    { id: 'pur', name: 'Purchasing', description: 'POs & Supplier Receipts', route: '/purchasing', icon: '🛒', color: 'bg-gradient-to-tr from-amber-500 to-orange-400', category: 'Operations' },
    { id: 'sal', name: 'Sales', description: 'Invoices & Dispatch', route: '/sales', icon: '💰', color: 'bg-gradient-to-tr from-emerald-600 to-teal-500', category: 'Operations' },
    { id: 'rep', name: 'Reports', description: 'Valuation & Turnover', route: '/reports', icon: '📈', color: 'bg-gradient-to-tr from-purple-500 to-pink-500', category: 'Finance' },
    { id: 'cus', name: 'Customers', description: 'Profiles & Credit Limit', route: '/customers', icon: '👥', color: 'bg-gradient-to-tr from-cyan-500 to-blue-400', category: 'Core' },
    { id: 'sup', name: 'Suppliers', description: 'Vendor Directory', route: '/suppliers', icon: '🏭', color: 'bg-gradient-to-tr from-orange-500 to-amber-400', category: 'Core' },
    { id: 'aud', name: 'Audit Logs', description: 'Security Timeline', route: '/audit', icon: '🛡️', color: 'bg-gradient-to-tr from-slate-600 to-slate-800', category: 'Admin' },
    { id: 'usr', name: 'Users', description: 'Account Directory', route: '/users', icon: '👤', color: 'bg-gradient-to-tr from-blue-500 to-indigo-400', category: 'Admin' },
    { id: 'rol', name: 'Roles', description: 'RBAC Authorization', route: '/roles', icon: '🔑', color: 'bg-gradient-to-tr from-rose-500 to-red-400', category: 'Admin' },
    { id: 'uom', name: 'Units (UoM)', description: 'Units of Measure', route: '/units', icon: '📐', color: 'bg-gradient-to-tr from-teal-600 to-teal-800', category: 'Admin' }
  ];

  // Available Branches
  readonly branches: BranchItem[] = [
    { id: 'branch-hq', code: 'WH-HQ', name: 'Phnom Penh HQ', location: 'Central Warehouse #1', isDefault: true },
    { id: 'branch-sr', code: 'WH-SR', name: 'Siem Reap Depot', location: 'North Warehouse #2' },
    { id: 'branch-btb', code: 'WH-BTB', name: 'Battambang Hub', location: 'West Distribution Center' }
  ];

  readonly activeBranch = signal<BranchItem>(this.branches[0]);

  // Notifications
  readonly notifications = signal<NotificationItem[]>([
    { id: 'n1', title: 'Low Stock Alert: SKU-COFFEE-01', description: 'Available stock is 8 units (Min threshold is 20 units).', time: '10m ago', type: 'danger', route: '/inventory', unread: true },
    { id: 'n2', title: 'Purchase Order Approved: PO-2026-004', description: 'Supplier Angkor Supplies marked PO ready for delivery.', time: '1h ago', type: 'info', route: '/purchasing', unread: true },
    { id: 'n3', title: 'Stock Discrepancy Detected', description: 'Audit discrepancy recorded in Phnom Penh HQ.', time: '3h ago', type: 'warning', route: '/inventory', unread: false }
  ]);

  readonly unreadCount = computed(() => this.notifications().filter(n => n.unread).length);

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcuts(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.omniSearchOpen.set(true);
    }
    if (e.key === 'Escape') {
      this.closeAllDropdowns();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event?: MouseEvent): void {
    this.closeAllDropdowns();
  }

  toggleAppLauncher(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.appLauncherOpen();
    this.closeAllDropdowns();
    this.appLauncherOpen.set(!current);
  }

  toggleBranchMenu(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.branchMenuOpen();
    this.closeAllDropdowns();
    this.branchMenuOpen.set(!current);
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.notificationsOpen();
    this.closeAllDropdowns();
    this.notificationsOpen.set(!current);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.userMenuOpen();
    this.closeAllDropdowns();
    this.userMenuOpen.set(!current);
  }

  closeAllDropdowns(): void {
    this.appLauncherOpen.set(false);
    this.branchMenuOpen.set(false);
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(false);
  }

  selectBranch(branch: BranchItem): void {
    this.activeBranch.set(branch);
    this.tenantService.setActiveTenant(branch.id);
    this.branchMenuOpen.set(false);
  }

  markAllNotificationsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, unread: false })));
  }

  handleNotificationClick(n: NotificationItem): void {
    n.unread = false;
    this.notificationsOpen.set(false);
    if (n.route) {
      this.router.navigate([n.route]);
    }
  }

  userInitials(): string {
    const username = this.currentUser()?.username || 'AU';
    return username.substring(0, 2).toUpperCase();
  }

  primaryRole(): string {
    const roles = this.currentUser()?.roles;
    if (roles && roles.length > 0) return roles[0];
    return 'Operations';
  }

  isRouteActive(route: string): boolean {
    const currentUrl = this.router.url.split('?')[0];
    if (route === '/dashboard') {
      return currentUrl === '/dashboard' || currentUrl === '/';
    }
    return currentUrl.startsWith(route);
  }

  logout(): void {
    this.closeAllDropdowns();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
