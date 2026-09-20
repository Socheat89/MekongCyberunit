import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from './navigation.service';
import { AuthService } from '../../login/auth.service';
import { NavigationItem } from '../../models/navigation.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="mekong-sidebar fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0"
      [class.-translate-x-full]="!isOpen()"
    >
      <div class="mekong-sidebar__brand h-[86px] flex items-center px-5">
        <a routerLink="/dashboard" class="flex items-center space-x-3 group w-full">
          <div class="mekong-logo w-10 h-10 rounded-2xl flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-base font-black tracking-tight transition-colors font-sans">
              Mekong Stock
            </span>
            <span class="mekong-sidebar__tagline text-[10px] font-semibold uppercase tracking-wider">
              Inventory workspace
            </span>
          </div>
        </a>
      </div>

      <!-- Navigation Menu -->
      <div class="flex-1 overflow-y-auto px-3.5 py-6 space-y-7">
        <!-- Main Stock Navigation -->
        <div>
          <div class="mekong-sidebar__section px-2.5 mb-2 text-[10px] font-bold uppercase tracking-widest">
            Workspace
          </div>

          <nav class="space-y-1">
            <!-- Dashboard -->
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-xs"
              class="flex items-center space-x-3 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition group"
            >
              <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"/>
              </svg>
              <span>Dashboard</span>
            </a>

            <!-- Users & Permissions (Requested Feature) -->
            <a
              routerLink="/users"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-xs"
              class="flex items-center space-x-3 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition group"
            >
              <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span>Users & Permissions</span>
            </a>
          </nav>
        </div>

        <!-- Settings Group (Contains Units, Roles, Permissions) -->
        <div>
          <div class="mekong-sidebar__section px-2.5 mb-2 text-[10px] font-bold uppercase tracking-widest">
            Configuration
          </div>

          <div class="space-y-1">
            <button
              type="button"
              (click)="toggleSettings()"
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition group"
            >
              <div class="flex items-center space-x-3">
                <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <circle cx="12" cy="12" r="3" stroke-width="2"/>
                </svg>
                <span>Settings</span>
              </div>
              <svg
                class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
                [class.rotate-90]="isSettingsExpanded()"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <!-- Expanded Submenu: Units, Roles, Permissions -->
            @if (isSettingsExpanded()) {
              <div class="mt-1 pl-6 pr-1 space-y-1 border-l-2 border-slate-100 ml-4">
                <!-- 2. Units of Measurement (Inside Settings as requested!) -->
                <a
                  routerLink="/units"
                  routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-xs"
                  class="flex items-center space-x-2.5 px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <span>Units of Measure</span>
                </a>

                <!-- System Roles -->
                <a
                  routerLink="/roles"
                  routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-xs"
                  class="flex items-center space-x-2.5 px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  <span>System Roles</span>
                </a>

                <!-- System Permissions -->
                <a
                  routerLink="/permissions"
                  routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-xs"
                  class="flex items-center space-x-2.5 px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:text-slate-900 hover:bg-slate-50 transition"
                >
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                  <span>Permissions</span>
                </a>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom Profile Bar with User Icon (Clean, no API health badge) -->
      <div class="mekong-sidebar__profile p-3.5">
        <a
          routerLink="/profile"
          class="flex items-center space-x-3 p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition group shadow-xs"
        >
          <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-slate-800 truncate">
              {{ authService.currentUser()?.username || 'admin' }}
            </div>
            <div class="text-[10px] text-slate-500 truncate">
              View Profile & Security
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </aside>
  `
})
export class AppSidebar implements OnInit {
  readonly navService = inject(NavigationService);
  readonly authService = inject(AuthService);
  readonly isOpen = input<boolean>(false);

  readonly isSettingsExpanded = signal<boolean>(true);

  ngOnInit(): void {
    this.navService.getNavigation().subscribe({
      error: () => {}
    });
  }

  toggleSettings(): void {
    this.isSettingsExpanded.update(val => !val);
  }
}
