import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockService, StockItem, StockCategory, CreateStockItemRequest, UpdateStockItemRequest } from '../../services/stock.service';
import { PermissionsService } from '../../services/permissions.service';
import { AuthService } from '../../login/auth.service';

@Component({
  selector: 'app-stock-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Items Catalogue</h1>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              ទំនិញក្នុងស្តុក
            </span>
          </div>
          <p class="text-sm text-slate-600 mt-1.5 font-medium">
            Manage product catalogue, SKU codes, pricing, stock levels, and warehouse storage locations.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <a
            routerLink="/stock/in"
            class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold shadow-sm transition inline-flex items-center space-x-2"
          >
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
            <span>Stock In (នាំចូល)</span>
          </a>

          @if (canCreate()) {
            <button
              type="button"
              (click)="openCreateModal()"
              class="px-4 py-2.5 rounded-xl bg-white hover:bg-teal-600 text-teal-700 hover:text-white border-2 border-teal-600 text-sm font-bold shadow-sm transition hover:scale-[1.02] active:scale-[0.98] inline-flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Add New Item (បង្កើតទំនិញ)</span>
            </button>
          }
        </div>
      </div>

      <!-- Overview KPI Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products (សរុបទំនិញ)</div>
            <div class="text-3xl font-black text-slate-900 mt-1">{{ items().length }}</div>
            <div class="text-xs text-slate-500 font-medium mt-1">{{ totalQtyOnHand() }} units on hand</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Value (តម្លៃស្តុក)</div>
            <div class="text-3xl font-black text-teal-700 mt-1">$ {{ totalInventoryValue() | number:'1.2-2' }}</div>
            <div class="text-xs text-teal-700 font-semibold mt-1">Based on cost price</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock (ស្តុកទាប)</div>
            <div class="text-3xl font-black text-amber-600 mt-1">{{ lowStockCount() }}</div>
            <div class="text-xs text-amber-700 font-semibold mt-1">Under safety threshold</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Out of Stock (អស់ពីស្តុក)</div>
            <div class="text-3xl font-black text-rose-600 mt-1">{{ outOfStockCount() }}</div>
            <div class="text-xs text-rose-700 font-semibold mt-1">Immediate reorder needed</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Filters and Search Bar -->
      <div class="glass-panel rounded-2xl p-4.5 border border-slate-200 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div class="flex-1 w-full flex flex-col sm:flex-row gap-3 items-center">
          <div class="relative w-full sm:w-80">
            <svg class="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search SKU, item name, barcode..."
              class="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          <!-- Category filter -->
          <div class="w-full sm:w-56">
            <select
              [(ngModel)]="selectedCategory"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Categories (គ្រប់ប្រភេទ)</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.name">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Status filter -->
          <div class="w-full sm:w-48">
            <select
              [(ngModel)]="selectedStatus"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Status</option>
              <option value="InStock">In Stock (មានក្នុងស្តុក)</option>
              <option value="LowStock">Low Stock (ស្តុកទាប)</option>
              <option value="OutOfStock">Out of Stock (អស់ស្តុក)</option>
            </select>
          </div>
        </div>

        <div class="text-sm text-slate-600 font-medium">
          Showing <span class="font-bold text-slate-900">{{ filteredItems().length }}</span> items
        </div>
      </div>

      <!-- Items Table -->
      <div class="glass-panel rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th class="py-4 px-4.5">Item &amp; SKU</th>
                <th class="py-4 px-3.5">Category</th>
                <th class="py-4 px-3.5 text-right">Cost</th>
                <th class="py-4 px-3.5 text-right">Price</th>
                <th class="py-4 px-3.5 text-center">Stock Level</th>
                <th class="py-4 px-3.5">Location</th>
                <th class="py-4 px-3.5 text-center">Status</th>
                <th class="py-4 px-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (item of filteredItems(); track item.id) {
                <tr class="hover:bg-slate-50/70 transition group">
                  <td class="py-4 px-4.5">
                    <div class="flex items-center space-x-3.5">
                      <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                        {{ item.sku.substring(0, 2) }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">{{ item.name }}</div>
                        <div class="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>SKU: {{ item.sku }}</span>
                          @if (item.barcode) {
                            <span class="text-slate-300">|</span>
                            <span>{{ item.barcode }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="py-4 px-3.5">
                    <span class="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {{ item.categoryName || 'General' }}
                    </span>
                  </td>

                  <td class="py-4 px-3.5 text-right font-mono text-slate-600 text-sm font-medium">
                    $ {{ item.costPrice | number:'1.2-2' }}
                  </td>

                  <td class="py-4 px-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    $ {{ item.sellingPrice | number:'1.2-2' }}
                  </td>

                  <td class="py-4 px-3.5 text-center">
                    <div class="inline-flex flex-col items-center">
                      <span class="font-black text-base" [class.text-rose-600]="item.quantityOnHand === 0" [class.text-amber-600]="item.quantityOnHand > 0 && item.quantityOnHand <= item.minStockLevel" [class.text-teal-700]="item.quantityOnHand > item.minStockLevel">
                        {{ item.quantityOnHand }} <span class="text-xs font-normal text-slate-500">{{ item.unit }}</span>
                      </span>
                      <span class="text-xs text-slate-400 mt-0.5 font-medium">Min: {{ item.minStockLevel }}</span>
                    </div>
                  </td>

                  <td class="py-4 px-3.5 text-slate-600 text-sm font-medium">
                    {{ item.location || '—' }}
                  </td>

                  <td class="py-4 px-3.5 text-center">
                    @if (item.status === 'InStock') {
                      <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        In Stock
                      </span>
                    } @else if (item.status === 'LowStock') {
                      <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Low Stock
                      </span>
                    } @else {
                      <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Out of Stock
                      </span>
                    }
                  </td>

                  <td class="py-4 px-4.5 text-right">
                    <div class="flex items-center justify-end space-x-1.5">
                      <a
                        [routerLink]="['/stock/in']"
                        [queryParams]="{ itemId: item.id }"
                        title="Quick Stock In"
                        class="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                      </a>

                      @if (canEdit()) {
                        <button
                          type="button"
                          (click)="openEditModal(item)"
                          title="Edit Item"
                          class="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                      }

                      @if (canDelete()) {
                        <button
                          type="button"
                          (click)="deleteItem(item)"
                          title="Deactivate"
                          class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-14 text-slate-400">
                    <div class="flex flex-col items-center">
                      <svg class="w-12 h-12 mb-3 opacity-40 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      <p class="font-bold text-slate-700 text-base">No stock items found</p>
                      <p class="text-sm text-slate-400 mt-1">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Side Drawer Panel: Create Item -->
      @if (showCreateModal()) {
        <div (click)="closeCreateModal()" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div (click)="$event.stopPropagation()" class="w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200/80 flex flex-col animate-drawer-in z-50">
            <!-- Drawer Header -->
            <div class="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-white">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </div>
                <div>
                  <h3 class="text-lg font-black tracking-tight text-white">Add New Item</h3>
                  <p class="text-xs text-teal-100 font-medium">បង្កើតទំនិញថ្មីចូលក្នុងកាតាឡុក</p>
                </div>
              </div>
              <button (click)="closeCreateModal()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Drawer Form Body -->
            <form (ngSubmit)="submitCreateItem()" class="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">Item Identification</h4>
                
                <div>
                  <label class="block font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input type="text" [(ngModel)]="newItem.sku" name="sku" required placeholder="e.g. MK-PR-001" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Item Name (ឈ្មោះទំនិញ) *</label>
                  <input type="text" [(ngModel)]="newItem.name" name="name" required placeholder="e.g. Mekong Cold Brew 250ml" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Barcode / UPC</label>
                    <input type="text" [(ngModel)]="newItem.barcode" name="barcode" placeholder="e.g. 8851234567" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Category (ប្រភេទ)</label>
                    <select [(ngModel)]="newItem.categoryId" name="categoryId" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs">
                      <option [ngValue]="null">Select Category</option>
                      @for (cat of categories(); track cat.id) {
                        <option [ngValue]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                </div>
              </div>

              <div class="space-y-4 pt-2">
                <h4 class="text-xs font-bold text-teal-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">Stock &amp; Pricing Setup</h4>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Unit (ខ្នាត)</label>
                    <input type="text" [(ngModel)]="newItem.unit" name="unit" placeholder="PCS, BOX, KG" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono text-xs" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Initial Stock Level</label>
                    <input type="number" [(ngModel)]="newItem.initialQuantity" name="initialQuantity" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Cost Price ($)</label>
                    <input type="number" step="0.01" [(ngModel)]="newItem.costPrice" name="costPrice" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Selling Price ($)</label>
                    <input type="number" step="0.01" [(ngModel)]="newItem.sellingPrice" name="sellingPrice" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Min Alert Level</label>
                    <input type="number" [(ngModel)]="newItem.minStockLevel" name="minStockLevel" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Location (ទីតាំង)</label>
                    <input type="text" [(ngModel)]="newItem.location" name="location" placeholder="e.g. Shelf A-2" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  </div>
                </div>
              </div>

              <!-- Drawer Footer -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-auto">
                <button type="button" (click)="closeCreateModal()" class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-bold transition text-xs">Cancel</button>
                <button type="submit" class="px-6 py-2.5 rounded-xl bg-white hover:bg-teal-600 text-teal-700 hover:text-white border-2 border-teal-600 font-bold transition shadow-sm text-xs inline-flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span>Save Item (រក្សាទុក)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Side Drawer Panel: Edit Item -->
      @if (showEditModal()) {
        <div (click)="closeEditModal()" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div (click)="$event.stopPropagation()" class="w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200/80 flex flex-col animate-drawer-in z-50">
            <!-- Drawer Header -->
            <div class="px-6 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-white">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </div>
                <div>
                  <h3 class="text-lg font-black tracking-tight text-white">Edit Item Details</h3>
                  <p class="text-xs text-indigo-100 font-mono">SKU: {{ editingItem.sku }}</p>
                </div>
              </div>
              <button (click)="closeEditModal()" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Drawer Form Body -->
            <form (ngSubmit)="submitEditItem()" class="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
              <div class="space-y-4">
                <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">Item Properties</h4>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Item Name *</label>
                  <input type="text" [(ngModel)]="editingItem.name" name="editName" required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Category</label>
                    <select [(ngModel)]="editingItem.categoryId" name="editCategoryId" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs">
                      <option [ngValue]="null">None</option>
                      @for (cat of categories(); track cat.id) {
                        <option [ngValue]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Unit</label>
                    <input type="text" [(ngModel)]="editingItem.unit" name="editUnit" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono text-xs" />
                  </div>
                </div>
              </div>

              <div class="space-y-4 pt-2">
                <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">Pricing &amp; Reorder Thresholds</h4>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Cost Price ($)</label>
                    <input type="number" step="0.01" [(ngModel)]="editingItem.costPrice" name="editCostPrice" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Selling Price ($)</label>
                    <input type="number" step="0.01" [(ngModel)]="editingItem.sellingPrice" name="editSellingPrice" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Min Stock Alert Level</label>
                    <input type="number" [(ngModel)]="editingItem.minStockLevel" name="editMinStock" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
                  </div>
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Location</label>
                    <input type="text" [(ngModel)]="editingItem.location" name="editLocation" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                  </div>
                </div>
              </div>

              <!-- Drawer Footer -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 mt-auto">
                <button type="button" (click)="closeEditModal()" class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-bold transition text-xs">Cancel</button>
                <button type="submit" class="px-6 py-2.5 rounded-xl bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border-2 border-indigo-600 font-bold transition shadow-sm text-xs inline-flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span>Save Changes (រក្សាទុក)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class StockItemsComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly authService = inject(AuthService);

  readonly items = signal<StockItem[]>([]);
  readonly categories = signal<StockCategory[]>([]);
  readonly userPermissions = signal<string[]>([]);

  searchQuery = '';
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';

  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  newItem: CreateStockItemRequest = {
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: undefined,
    unit: 'PCS',
    costPrice: 0,
    sellingPrice: 0,
    initialQuantity: 0,
    minStockLevel: 10,
    location: ''
  };

  editingItem: StockItem = {} as StockItem;

  ngOnInit(): void {
    this.loadData();
    this.permissionsService.getMyPermissions(true).subscribe({
      next: p => this.userPermissions.set(p || []),
      error: () => {}
    });
  }

  loadData(): void {
    this.stockService.getItems().subscribe({
      next: data => this.items.set(data),
      error: err => console.error('Failed to load stock items', err)
    });

    this.stockService.getCategories().subscribe({
      next: data => this.categories.set(data),
      error: err => console.error('Failed to load categories', err)
    });
  }

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRATOR' || r.toUpperCase() === 'MANAGER');
  });

  canCreate = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('stock.create') || this.userPermissions().includes('items.create') || this.userPermissions().some(p => p.toLowerCase().includes('create'));
  });

  canEdit = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('stock.edit') || this.userPermissions().includes('items.edit') || this.userPermissions().some(p => p.toLowerCase().includes('edit'));
  });

  canDelete = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('stock.delete') || this.userPermissions().includes('items.delete') || this.userPermissions().some(p => p.toLowerCase().includes('delete'));
  });

  totalQtyOnHand = computed(() => this.items().reduce((acc, i) => acc + i.quantityOnHand, 0));
  totalInventoryValue = computed(() => this.items().reduce((acc, i) => acc + (i.quantityOnHand * i.costPrice), 0));
  lowStockCount = computed(() => this.items().filter(i => i.status === 'LowStock').length);
  outOfStockCount = computed(() => this.items().filter(i => i.status === 'OutOfStock').length);

  filteredItems(): StockItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    const cat = this.selectedCategory;
    const stat = this.selectedStatus;

    return this.items().filter(item => {
      const matchesSearch =
        !q ||
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q));

      const matchesCat = cat === 'ALL' || item.categoryName === cat;
      const matchesStat = stat === 'ALL' || item.status === stat;

      return matchesSearch && matchesCat && matchesStat;
    });
  }

  openCreateModal(): void {
    const autoSku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    this.newItem = {
      sku: autoSku,
      barcode: '',
      name: '',
      description: '',
      categoryId: undefined,
      unit: 'PCS',
      costPrice: 0,
      sellingPrice: 0,
      initialQuantity: 0,
      minStockLevel: 10,
      location: ''
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreateItem(): void {
    if (!this.newItem.name || !this.newItem.name.trim()) {
      alert('សូមបញ្ចូលឈ្មោះទំនិញ (Item Name is required)');
      return;
    }
    if (!this.newItem.sku || !this.newItem.sku.trim()) {
      this.newItem.sku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    }
    this.stockService.createItem(this.newItem).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadData();
      },
      error: err => alert(err?.error?.message || 'Error creating item')
    });
  }

  openEditModal(item: StockItem): void {
    this.editingItem = { ...item };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  submitEditItem(): void {
    if (!this.editingItem.name || !this.editingItem.name.trim()) {
      alert('សូមបញ្ចូលឈ្មោះទំនិញ (Item Name is required)');
      return;
    }
    const updateReq: UpdateStockItemRequest = {
      name: this.editingItem.name.trim(),
      description: this.editingItem.description,
      categoryId: this.editingItem.categoryId ? Number(this.editingItem.categoryId) : undefined,
      unit: this.editingItem.unit || 'PCS',
      costPrice: Number(this.editingItem.costPrice) || 0,
      sellingPrice: Number(this.editingItem.sellingPrice) || 0,
      minStockLevel: Number(this.editingItem.minStockLevel) || 10,
      location: this.editingItem.location,
      isActive: this.editingItem.isActive !== undefined ? this.editingItem.isActive : true
    };

    this.stockService.updateItem(this.editingItem.id, updateReq).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadData();
      },
      error: err => alert(err?.error?.message || 'Error updating item')
    });
  }

  deleteItem(item: StockItem): void {
    if (!confirm(`Are you sure you want to deactivate ${item.name} (${item.sku})?`)) return;
    this.stockService.deleteItem(item.id).subscribe({
      next: () => this.loadData(),
      error: err => alert(err?.error?.message || 'Error deactivating item')
    });
  }
}
