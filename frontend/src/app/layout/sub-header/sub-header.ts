import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubHeaderService, HeaderAction, FilterChip } from './sub-header.service';

@Component({
  selector: 'app-sub-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <section class="bg-[#0a0f1d]/75 backdrop-blur-2xl border-b border-white/[0.08] py-4 px-4 sm:px-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div class="max-w-[1720px] mx-auto flex flex-col gap-3.5">

        <!-- Upper Row: Dynamic Breadcrumbs + Title + Primary Action Buttons -->
        <div class="flex flex-wrap items-center justify-between gap-3">

          <!-- Left: Breadcrumb & Active View Title -->
          <div class="flex flex-col gap-1 min-w-0">
            <!-- Dynamic Breadcrumb Path -->
            <nav class="flex items-center gap-1.5 text-xs font-semibold text-slate-400" aria-label="Breadcrumb">
              <a
                routerLink="/dashboard"
                class="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] transition-colors"
                title="Return to Dashboard"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </a>

              @for (crumb of config().breadcrumbs; track $index) {
                <svg class="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                @if (crumb.route && $index < config().breadcrumbs.length - 1) {
                  <a [routerLink]="crumb.route" class="hover:text-emerald-400 text-slate-400 transition-colors">
                    {{ crumb.label }}
                  </a>
                } @else {
                  <span class="text-white font-bold">
                    {{ crumb.label }}
                  </span>
                }
              }
            </nav>

            <!-- Page Title & Optional Subtitle / Count Badge -->
            <div class="flex items-center gap-3">
              <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {{ config().title }}
              </h1>
              @if (config().subtitle) {
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {{ config().subtitle }}
                </span>
              }
            </div>
          </div>

          <!-- Right: Contextual Primary Action Buttons -->
          @if (config().actions && config().actions!.length > 0) {
            <div class="flex items-center gap-2.5 flex-wrap">
              @for (btn of config().actions; track btn.id) {
                <button
                  type="button"
                  [id]="'action-' + btn.id"
                  (click)="btn.action()"
                  [disabled]="btn.disabled"
                  class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                  [ngClass]="buttonClasses(btn)"
                >
                  @if (btn.icon) {
                    <span [innerHTML]="btn.icon"></span>
                  }
                  <span>{{ btn.label }}</span>
                </button>
              }
            </div>
          }

        </div>

        <!-- Lower Row: Filter Chips, Contextual Search, Grouping & View Mode Switcher -->
        @if (hasControls()) {
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">

            <!-- Filter Chips & Grouping -->
            <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              @if (config().filterChips && config().filterChips!.length > 0) {
                <div class="flex items-center gap-1 flex-wrap bg-slate-950/70 p-1 rounded-2xl border border-white/[0.08] shadow-inner">
                  @for (chip of config().filterChips; track chip.id) {
                    <button
                      type="button"
                      [id]="'chip-' + chip.id"
                      (click)="subHeaderService.selectChip(chip.id)"
                      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      [ngClass]="config().activeChipId === chip.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)] font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'"
                    >
                      <span>{{ chip.label }}</span>
                      @if (chip.count !== undefined) {
                        <span
                          class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                          [ngClass]="config().activeChipId === chip.id
                            ? 'bg-slate-950/30 text-slate-950'
                            : 'bg-white/10 text-slate-300'"
                        >
                          {{ chip.count }}
                        </span>
                      }
                    </button>
                  }
                </div>
              }

              <!-- Grouping Selector -->
              @if (config().groupOptions && config().groupOptions!.length > 0) {
                <div class="flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-white/[0.08]">
                  <span class="font-medium">Group by:</span>
                  <select
                    [ngModel]="config().activeGroupId"
                    (ngModelChange)="subHeaderService.selectGroup($event)"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none shadow-xs"
                  >
                    @for (grp of config().groupOptions; track grp.id) {
                      <option [value]="grp.id">{{ grp.label }}</option>
                    }
                  </select>
                </div>
              }
            </div>

            <!-- Right Controls: Inline Search + View Mode Switcher -->
            <div class="flex items-center gap-2.5 flex-shrink-0">

              <!-- Contextual Search Bar -->
              @if (config().showSearch !== false) {
                <div class="relative w-48 sm:w-64">
                  <svg class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    [placeholder]="config().searchPlaceholder || 'Filter in table...'"
                    [ngModel]="config().searchValue"
                    (ngModelChange)="subHeaderService.setSearchValue($event)"
                    class="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition shadow-inner"
                  />
                  @if (config().searchValue) {
                    <button
                      type="button"
                      (click)="subHeaderService.setSearchValue('')"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }
                </div>
              }

              <!-- View Mode Toggle: Table vs Kanban Cards (Segmented Switch) -->
              @if (config().showViewToggle) {
                <div class="flex items-center bg-slate-950/70 p-1 rounded-2xl border border-white/[0.08] text-slate-400 shadow-inner">
                  <!-- Table Mode -->
                  <button
                    type="button"
                    id="view-table-btn"
                    (click)="subHeaderService.setViewMode('table')"
                    class="p-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    [ngClass]="config().viewMode === 'table' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-black' : 'hover:text-white text-slate-400'"
                    title="Data Table View"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span class="hidden sm:inline">Table</span>
                  </button>

                  <!-- Kanban Mode -->
                  <button
                    type="button"
                    id="view-kanban-btn"
                    (click)="subHeaderService.setViewMode('kanban')"
                    class="p-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    [ngClass]="config().viewMode === 'kanban' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-black' : 'hover:text-white text-slate-400'"
                    title="Kanban Cards View"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                    </svg>
                    <span class="hidden sm:inline">Cards</span>
                  </button>
                </div>
              }

            </div>

          </div>
        }

      </div>
    </section>
  `
})
export class SubHeaderComponent {
  readonly subHeaderService = inject(SubHeaderService);
  readonly config = this.subHeaderService.config;

  buttonClasses(btn: HeaderAction): string {
    switch (btn.variant) {
      case 'primary':
        return 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)]';
      case 'secondary':
        return 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 border border-white/10 hover:border-emerald-500/40 shadow-md';
      case 'danger':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-950/40';
      default:
        return 'bg-white/[0.05] hover:bg-white/[0.1] text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 shadow-xs';
    }
  }

  hasControls(): boolean {
    const c = this.config();
    return !!(
      (c.filterChips && c.filterChips.length > 0) ||
      (c.groupOptions && c.groupOptions.length > 0) ||
      c.showSearch !== false ||
      c.showViewToggle
    );
  }
}
