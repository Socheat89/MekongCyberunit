import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from './inventory.service';
import { SubHeaderService } from '../../layout/sub-header/sub-header.service';
import { NotificationService } from '../../services/notification.service';
import { StatusBadgeComponent } from '../common/status-badge/status-badge.component';
import { SkeletonTableComponent } from '../common/skeleton-loader/skeleton-table.component';
import { SkeletonCardsComponent } from '../common/skeleton-loader/skeleton-cards.component';
import { EmptyStateComponent } from '../common/empty-state/empty-state.component';
import { StockAdjustmentModalComponent } from './components/stock-adjustment-modal.component';
import { StockTransferModalComponent } from './components/stock-transfer-modal.component';
import {
  WarehouseStockDto,
  CreateAdjustmentRequest,
  CreateTransferRequest
} from '../../models/inventory.models';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StatusBadgeComponent,
    SkeletonTableComponent,
    SkeletonCardsComponent,
    EmptyStateComponent,
    StockAdjustmentModalComponent,
    StockTransferModalComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">

      <!-- ══════════════════════════════════════════════════════════
           TOP KPI METRICS WIDGETS (CYBER-EXECUTIVE VISUAL DESIGN)
           ══════════════════════════════════════════════════════════ -->
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5" aria-label="Inventory Metrics">

        <!-- Card 1: Catalogued SKUs -->
        <article class="bg-[#0c1222]/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.18)] transition-all duration-300 relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <div class="flex items-start justify-between">
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></span>
                Catalogued SKUs
              </span>
              <div class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 tracking-tight font-mono pt-1">
                @if (store.loading() && !store.hasData()) {
                  <div class="h-9 w-20 bg-white/[0.08] rounded-xl animate-pulse"></div>
                } @else {
                  {{ store.totalCount() }}
                }
              </div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-110 transition-transform duration-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="pt-3.5 mt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span class="font-medium text-cyan-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Active SKU tracking
            </span>
            <span class="font-bold text-slate-300 font-mono">100% Synced</span>
          </div>
        </article>

        <!-- Card 2: Total On Hand -->
        <article class="bg-[#0c1222]/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)] transition-all duration-300 relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <div class="flex items-start justify-between">
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                Total Units On-Hand
              </span>
              <div class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 tracking-tight font-mono pt-1">
                @if (store.loading() && !store.hasData()) {
                  <div class="h-9 w-24 bg-white/[0.08] rounded-xl animate-pulse"></div>
                } @else {
                  {{ totalOnHandQuantity() }}
                }
              </div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-110 transition-transform duration-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
          <div class="pt-3.5 mt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span class="font-medium text-emerald-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Physical inventory
            </span>
            <span class="font-bold text-slate-300 font-mono">{{ store.items().length }} warehouse lines</span>
          </div>
        </article>

        <!-- Card 3: Reserved in Sales -->
        <article class="bg-[#0c1222]/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.18)] transition-all duration-300 relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <div class="flex items-start justify-between">
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse"></span>
                Reserved In Orders
              </span>
              <div class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300 tracking-tight font-mono pt-1">
                @if (store.loading() && !store.hasData()) {
                  <div class="h-9 w-16 bg-white/[0.08] rounded-xl animate-pulse"></div>
                } @else {
                  {{ totalReservedQuantity() }}
                }
              </div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:scale-110 transition-transform duration-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div class="pt-3.5 mt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span class="font-medium text-amber-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Committed sales
            </span>
            <span class="font-bold text-slate-300 font-mono">{{ totalReservedQuantity() > 0 ? 'Pending dispatch' : 'Zero lock' }}</span>
          </div>
        </article>

        <!-- Card 4: Critical Alerts -->
        <article class="bg-[#0c1222]/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-rose-500/40 hover:shadow-[0_0_25px_rgba(244,63,94,0.18)] transition-all duration-300 relative overflow-hidden group">
          <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <div class="flex items-start justify-between">
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"></span>
                Low Stock Risks
              </span>
              <div class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-300 tracking-tight font-mono pt-1">
                @if (store.loading() && !store.hasData()) {
                  <div class="h-9 w-14 bg-white/[0.08] rounded-xl animate-pulse"></div>
                } @else {
                  {{ lowStockCount() }}
                }
              </div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)] group-hover:scale-110 transition-transform duration-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div class="pt-3.5 mt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span class="font-medium text-rose-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Under reorder threshold
            </span>
            <span class="font-bold text-rose-400 font-mono">Action needed</span>
          </div>
        </article>

      </section>

      <!-- ══════════════════════════════════════════════════════════
           MAIN CONTENT AREA: TABLE OR KANBAN
           ══════════════════════════════════════════════════════════ -->

      <!-- Loading State: Realistic Skeleton Table / Cards -->
      @if (store.loading() && !store.hasData()) {
        @if (store.viewMode() === 'table') {
          <app-skeleton-table [rows]="6"></app-skeleton-table>
        } @else {
          <app-skeleton-cards [count]="8"></app-skeleton-cards>
        }
      }

      <!-- Empty State -->
      @else if (store.isEmpty()) {
        <app-empty-state
          title="No inventory records found"
          description="We couldn't find any warehouse stock items matching your active search and filter criteria."
          icon="search"
          actionLabel="Clear All Filters"
          (actionClicked)="resetFilters()"
        ></app-empty-state>
      }

      <!-- DATA TABLE VIEW MODE -->
      @else if (store.viewMode() === 'table') {
        <div class="w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1222]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <!-- Table Head -->
              <thead>
                <tr class="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th scope="col" class="py-4 px-6">Product & SKU</th>
                  <th scope="col" class="py-4 px-4">Warehouse Facility</th>
                  <th scope="col" class="py-4 px-4 text-right">On Hand</th>
                  <th scope="col" class="py-4 px-4 text-right">Reserved</th>
                  <th scope="col" class="py-4 px-4 text-right">Available</th>
                  <th scope="col" class="py-4 px-4 text-center">Stock Level Status</th>
                  <th scope="col" class="py-4 px-4 text-slate-500">Updated</th>
                  <th scope="col" class="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>

              <!-- Table Body -->
              <tbody class="divide-y divide-white/[0.04] text-slate-300">
                @for (item of store.items(); track item.id) {
                  <tr class="hover:bg-white/[0.03] transition-colors group">
                    <!-- SKU & Product Name -->
                    <td class="py-4 px-6">
                      <div class="flex items-center gap-3.5">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-mono font-black text-xs flex-shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                          {{ item.productSku.substring(0, 2) }}
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="font-mono font-bold text-emerald-300 text-xs tracking-tight bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                              {{ item.productSku }}
                            </span>
                            <button
                              type="button"
                              (click)="copySku(item.productSku)"
                              class="text-slate-500 hover:text-emerald-400 p-0.5 transition cursor-pointer"
                              title="Copy SKU to clipboard"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                              </svg>
                            </button>
                          </div>
                          <div class="font-bold text-white text-sm truncate max-w-xs sm:max-w-md mt-1 group-hover:text-emerald-300 transition-colors">
                            {{ item.productName }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Warehouse Name -->
                    <td class="py-4 px-4">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span class="font-semibold text-slate-200">{{ item.warehouseName }}</span>
                      </div>
                    </td>

                    <!-- On Hand -->
                    <td class="py-4 px-4 text-right font-bold text-white font-mono text-sm">
                      {{ item.quantityOnHand }}
                    </td>

                    <!-- Reserved -->
                    <td class="py-4 px-4 text-right font-semibold text-amber-400 font-mono text-sm">
                      {{ item.reservedQuantity > 0 ? item.reservedQuantity : '-' }}
                    </td>

                    <!-- Available with Mini Visual Gauge -->
                    <td class="py-4 px-4 text-right">
                      <div class="flex flex-col items-end gap-1.5">
                        <span
                          class="font-black font-mono text-sm leading-tight"
                          [ngClass]="item.availableQuantity > 10 ? 'text-emerald-400' : item.availableQuantity > 0 ? 'text-amber-400' : 'text-rose-400'"
                        >
                          {{ item.availableQuantity }}
                        </span>
                        <!-- Mini visual indicator bar -->
                        <div class="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-300"
                            [ngClass]="item.availableQuantity > 10 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : item.availableQuantity > 0 ? 'bg-amber-400' : 'bg-rose-500'"
                            [style.width.%]="calcGaugePercentage(item)"
                          ></div>
                        </div>
                      </div>
                    </td>

                    <!-- Status Pill Badge -->
                    <td class="py-4 px-4 text-center">
                      <app-status-badge [status]="resolveStockStatus(item)"></app-status-badge>
                    </td>

                    <!-- Updated At -->
                    <td class="py-4 px-4 text-slate-500 text-[11px] whitespace-nowrap font-mono">
                      {{ formatDate(item.updatedAtUtc) }}
                    </td>

                    <!-- Actions -->
                    <td class="py-4 px-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <!-- Quick Adjust Action -->
                        <button
                          type="button"
                          (click)="openAdjustmentModal(item)"
                          class="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition shadow-xs hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer"
                          title="Record Stock Adjustment / Physical Audit"
                        >
                          Adjust
                        </button>

                        <!-- Quick Transfer Action -->
                        <button
                          type="button"
                          (click)="openTransferModal(item)"
                          class="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-bold border border-white/10 transition shadow-xs hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] cursor-pointer"
                          title="Transfer Stock to another facility"
                        >
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               TABLE FOOTER & PAGINATION BAR
               ══════════════════════════════════════════════════════════ -->
          <div class="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="text-slate-400 font-medium">
              Showing <span class="font-bold text-white font-mono">{{ store.rangeLabel() }}</span>
            </div>

            <!-- Page Size & Controls -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-1.5 text-slate-400">
                <span>Per page:</span>
                <select
                  [ngModel]="store.pageSize()"
                  (ngModelChange)="onPageSizeChange($event)"
                  class="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none shadow-xs"
                >
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                  <option [value]="100">100</option>
                </select>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="store.previousPage(); reloadStocks()"
                  [disabled]="!store.hasPreviousPage()"
                  class="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
                >
                  Previous
                </button>

                <span class="px-3 font-bold text-white font-mono">
                  {{ store.page() }} / {{ store.totalPages() }}
                </span>

                <button
                  type="button"
                  (click)="store.nextPage(); reloadStocks()"
                  [disabled]="!store.hasNextPage()"
                  class="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           KANBAN CARDS VIEW MODE
           ══════════════════════════════════════════════════════════ -->
      @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (item of store.items(); track item.id) {
            <article class="bg-[#0c1222]/85 backdrop-blur-2xl rounded-3xl p-5 border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)] transition-all duration-300 flex flex-col justify-between group">
              <div>
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-2 mb-3">
                  <span class="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30">
                    {{ item.productSku }}
                  </span>
                  <app-status-badge [status]="resolveStockStatus(item)"></app-status-badge>
                </div>

                <!-- Product Name -->
                <h4 class="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 mb-1.5 leading-snug">
                  {{ item.productName }}
                </h4>
                <p class="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{{ item.warehouseName }}</span>
                </p>

                <!-- Stock Gauge Progress Bar -->
                <div class="space-y-1.5 mb-4 p-3 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-400 font-medium">Available Ratio</span>
                    <span class="font-extrabold text-white font-mono">{{ item.availableQuantity }} / {{ item.quantityOnHand }} units</span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      [ngClass]="item.availableQuantity > 10 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : item.availableQuantity > 0 ? 'bg-amber-400' : 'bg-rose-500'"
                      [style.width.%]="calcGaugePercentage(item)"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Card Bottom Actions -->
              <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <span class="text-[10px] text-slate-500 font-mono">
                  {{ formatDate(item.updatedAtUtc) }}
                </span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="openAdjustmentModal(item)"
                    class="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition cursor-pointer shadow-xs"
                  >Adjust</button>
                  <button
                    type="button"
                    (click)="openTransferModal(item)"
                    class="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer shadow-xs"
                  >Transfer</button>
                </div>
              </div>
            </article>
          }
        </div>
      }

      <!-- Stock Adjustment Modal -->
      <app-stock-adjustment-modal
        [isOpen]="isAdjustmentModalOpen()"
        [stockItem]="selectedStockItem()"
        [isSubmitting]="inventoryService.isActionSubmitting()"
        (closed)="isAdjustmentModalOpen.set(false)"
        (submitted)="handleAdjustmentSubmit($event)"
      ></app-stock-adjustment-modal>

      <!-- Stock Transfer Modal -->
      <app-stock-transfer-modal
        [isOpen]="isTransferModalOpen()"
        [stockItem]="selectedStockItem()"
        [warehouses]="inventoryService.warehouses()"
        [isSubmitting]="inventoryService.isActionSubmitting()"
        (closed)="isTransferModalOpen.set(false)"
        (submitted)="handleTransferSubmit($event)"
      ></app-stock-transfer-modal>

    </div>
  `
})
export class InventoryListComponent implements OnInit, OnDestroy {
  readonly inventoryService = inject(InventoryService);
  readonly subHeaderService = inject(SubHeaderService);
  readonly notification = inject(NotificationService);

  readonly store = this.inventoryService.store;

  readonly isAdjustmentModalOpen = signal<boolean>(false);
  readonly isTransferModalOpen = signal<boolean>(false);
  readonly selectedStockItem = signal<WarehouseStockDto | null>(null);

  // Derived KPI aggregates
  readonly totalOnHandQuantity = computed(() => {
    return this.store.items().reduce((acc, curr) => acc + (curr.quantityOnHand || 0), 0);
  });

  readonly totalReservedQuantity = computed(() => {
    return this.store.items().reduce((acc, curr) => acc + (curr.reservedQuantity || 0), 0);
  });

  readonly lowStockCount = computed(() => {
    return this.store.items().filter(i => i.availableQuantity <= 10).length;
  });

  constructor() {
    // Keep SubHeader subtitle reactively in sync with real SKU count
    effect(() => {
      const count = this.store.totalCount();
      this.subHeaderService.updateConfig({
        subtitle: `${count} SKUs Recorded · Live`
      });
    });
  }

  ngOnInit(): void {
    this.configureSubHeader();
    this.inventoryService.loadWarehouses();
    this.inventoryService.loadStockAlerts();
    this.reloadStocks();
  }

  ngOnDestroy(): void {}

  private configureSubHeader(): void {
    this.subHeaderService.setConfig({
      title: 'Inventory & Warehouse Stock',
      subtitle: `${this.store.totalCount()} SKUs Recorded · Live`,
      breadcrumbs: [
        { label: 'Mekong Stock', route: '/dashboard' },
        { label: 'Inventory', route: '/inventory' },
        { label: 'Stock On Hand' }
      ],
      actions: [
        {
          id: 'new-adjustment',
          label: '+ New Adjustment',
          variant: 'primary',
          action: () => {
            const first = this.store.items()[0] || null;
            if (first) this.openAdjustmentModal(first);
          }
        },
        {
          id: 'transfer',
          label: 'Transfer Stock',
          variant: 'secondary',
          action: () => {
            const first = this.store.items()[0] || null;
            if (first) this.openTransferModal(first);
          }
        },
        {
          id: 'export',
          label: 'Export CSV',
          variant: 'secondary',
          action: () => this.exportCsv()
        },
        {
          id: 'refresh',
          label: 'Refresh',
          variant: 'ghost',
          action: () => this.reloadStocks(true)
        }
      ],
      filterChips: [
        { id: 'ALL', label: 'All Items' },
        { id: 'IN_STOCK', label: 'In Stock' },
        { id: 'LOW_STOCK', label: 'Low Stock Risks' },
        { id: 'OUT_OF_STOCK', label: 'Out of Stock' }
      ],
      activeChipId: 'ALL',
      showSearch: true,
      searchPlaceholder: 'Search SKU, product, barcode...',
      showViewToggle: true,
      viewMode: this.store.viewMode(),
      onChipSelect: chipId => {
        this.store.setFilter('status', chipId);
        this.reloadStocks();
      },
      onSearchChange: term => {
        this.store.setSearch(term);
        this.reloadStocks();
      },
      onViewModeChange: mode => {
        this.store.setViewMode(mode);
      }
    });
  }

  reloadStocks(showProgress = false): void {
    this.inventoryService.loadStocks(showProgress);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(Number(size));
    this.reloadStocks();
  }

  resetFilters(): void {
    this.store.clearFilters();
    this.subHeaderService.selectChip('ALL');
    this.subHeaderService.setSearchValue('');
    this.reloadStocks();
  }

  resolveStockStatus(item: WarehouseStockDto): string {
    if (item.availableQuantity <= 0) return 'OutOfStock';
    if (item.availableQuantity <= 10) return 'LowStock';
    return 'InStock';
  }

  calcGaugePercentage(item: WarehouseStockDto): number {
    if (item.quantityOnHand <= 0) return 0;
    return Math.min(100, Math.round((item.availableQuantity / item.quantityOnHand) * 100));
  }

  formatDate(utcStr: string): string {
    if (!utcStr) return 'Just now';
    try {
      const d = new Date(utcStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return utcStr;
    }
  }

  copySku(sku: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sku).then(() => {
        this.notification.success('Copied to Clipboard', `SKU ${sku} copied.`);
      });
    }
  }

  openAdjustmentModal(item: WarehouseStockDto): void {
    this.selectedStockItem.set(item);
    this.isAdjustmentModalOpen.set(true);
  }

  openTransferModal(item: WarehouseStockDto): void {
    this.selectedStockItem.set(item);
    this.isTransferModalOpen.set(true);
  }

  handleAdjustmentSubmit(req: CreateAdjustmentRequest): void {
    this.inventoryService.recordAdjustment(req).subscribe({
      next: () => {
        this.isAdjustmentModalOpen.set(false);
      }
    });
  }

  handleTransferSubmit(req: CreateTransferRequest): void {
    this.inventoryService.createTransfer(req).subscribe({
      next: () => {
        this.isTransferModalOpen.set(false);
      }
    });
  }

  exportCsv(): void {
    const items = this.store.items();
    if (items.length === 0) return;

    const headers = ['SKU', 'Product Name', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Updated'];
    const rows = items.map(i => [
      `"${i.productSku}"`,
      `"${i.productName}"`,
      `"${i.warehouseName}"`,
      i.quantityOnHand,
      i.reservedQuantity,
      i.availableQuantity,
      `"${i.updatedAtUtc}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_stocks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
