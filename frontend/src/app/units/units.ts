import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface UnitItem {
  id: number;
  code: string;
  name: string;
  symbol: string;
  category: string;
  isActive: boolean;
}

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2.5">
            <h1 class="text-2xl font-black tracking-tight text-slate-900">Units of Measurement</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Settings / Units
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            System measurement catalog, conversion symbols, and packaging units for stock items.
          </p>
        </div>

        <button
          type="button"
          (click)="openModal()"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition hover:scale-[1.02] active:scale-[0.98] inline-flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Add New Unit</span>
        </button>
      </div>

      <!-- Overview Metric Pills -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="glass-panel rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Units</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5">{{ units().length }}</div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Units</div>
            <div class="text-2xl font-black text-emerald-600 mt-0.5">{{ activeUnitsCount() }}</div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categories</div>
            <div class="text-2xl font-black text-violet-600 mt-0.5">4</div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filtered</div>
            <div class="text-2xl font-black text-sky-600 mt-0.5">{{ filteredUnits().length }}</div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Controls: Category Filter Tabs & Search Bar -->
      <div class="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200">
        <!-- Category Tabs -->
        <div class="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          @for (cat of categories; track cat) {
            <button
              type="button"
              (click)="selectedCategory = cat"
              [class.bg-indigo-600]="selectedCategory === cat"
              [class.text-white]="selectedCategory === cat"
              [class.shadow-xs]="selectedCategory === cat"
              [class.text-slate-600]="selectedCategory !== cat"
              [class.hover:text-slate-900]="selectedCategory !== cat"
              [class.hover:bg-slate-100]="selectedCategory !== cat"
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
            >
              {{ cat }}
            </button>
          }
        </div>

        <!-- Search Bar -->
        <div class="relative w-full md:w-72">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search code, name, symbol..."
            class="glass-input w-full pl-10 pr-8 py-2 rounded-xl text-xs placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      <!-- Units Table -->
      <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th class="px-6 py-4">Unit Code</th>
                <th class="px-6 py-4">Unit Name</th>
                <th class="px-6 py-4">Symbol</th>
                <th class="px-6 py-4">Category</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (unit of filteredUnits(); track unit.id) {
                <tr class="hover:bg-slate-50/70 transition-colors group">
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-xs">
                      {{ unit.code }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-bold text-slate-900 text-sm font-sans">{{ unit.name }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs">
                      {{ unit.symbol }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      [class.bg-emerald-50]="unit.category === 'Weight'"
                      [class.text-emerald-700]="unit.category === 'Weight'"
                      [class.border-emerald-200]="unit.category === 'Weight'"
                      [class.bg-sky-50]="unit.category === 'Volume'"
                      [class.text-sky-700]="unit.category === 'Volume'"
                      [class.border-sky-200]="unit.category === 'Volume'"
                      [class.bg-amber-50]="unit.category === 'Packaging'"
                      [class.text-amber-700]="unit.category === 'Packaging'"
                      [class.border-amber-200]="unit.category === 'Packaging'"
                      [class.bg-violet-50]="unit.category === 'Length'"
                      [class.text-violet-700]="unit.category === 'Length'"
                      [class.border-violet-200]="unit.category === 'Length'"
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                    >
                      {{ unit.category }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    @if (unit.isActive) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Inactive
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      type="button"
                      (click)="toggleStatus(unit)"
                      [class.text-rose-600]="unit.isActive"
                      [class.text-emerald-600]="!unit.isActive"
                      class="text-xs font-bold transition px-2.5 py-1 rounded-lg hover:bg-slate-100"
                    >
                      {{ unit.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-10 text-center text-slate-400">
                    No measurement units matching your criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Unit Modal -->
      @if (showModal()) {
        <div (click)="closeModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-slate-900 font-sans">Add Measurement Unit</h2>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Unit Code</label>
                <input
                  type="text"
                  [(ngModel)]="newUnit.code"
                  placeholder="e.g. KG"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs uppercase font-mono font-bold"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Unit Name</label>
                <input
                  type="text"
                  [(ngModel)]="newUnit.name"
                  placeholder="e.g. Kilogram"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Display Symbol</label>
                <input
                  type="text"
                  [(ngModel)]="newUnit.symbol"
                  placeholder="e.g. kg"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  [(ngModel)]="newUnit.category"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs bg-white border border-slate-300 font-medium"
                >
                  <option value="Weight">Weight</option>
                  <option value="Volume">Volume</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Length">Length</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveUnit()"
                [disabled]="!newUnit.code || !newUnit.name"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Save Unit
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UnitList {
  readonly units = signal<UnitItem[]>([
    { id: 1, code: 'KG', name: 'Kilogram', symbol: 'kg', category: 'Weight', isActive: true },
    { id: 2, code: 'G', name: 'Gram', symbol: 'g', category: 'Weight', isActive: true },
    { id: 3, code: 'LTR', name: 'Liter', symbol: 'L', category: 'Volume', isActive: true },
    { id: 4, code: 'ML', name: 'Milliliter', symbol: 'mL', category: 'Volume', isActive: true },
    { id: 5, code: 'BOX', name: 'Standard Box', symbol: 'box', category: 'Packaging', isActive: true },
    { id: 6, code: 'PCS', name: 'Pieces', symbol: 'pcs', category: 'Packaging', isActive: true },
    { id: 7, code: 'MTR', name: 'Meter', symbol: 'm', category: 'Length', isActive: true }
  ]);

  readonly categories = ['ALL', 'Weight', 'Volume', 'Packaging', 'Length'];

  searchQuery = '';
  selectedCategory = 'ALL';
  showModal = signal<boolean>(false);

  newUnit = {
    code: '',
    name: '',
    symbol: '',
    category: 'Weight'
  };

  activeUnitsCount = computed(() => this.units().filter(u => u.isActive).length);

  filteredUnits(): UnitItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    const cat = this.selectedCategory;

    return this.units().filter(item => {
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.symbol.toLowerCase().includes(q);
      const matchesCat = cat === 'ALL' || item.category === cat;
      return matchesSearch && matchesCat;
    });
  }

  openModal(): void {
    this.newUnit = { code: '', name: '', symbol: '', category: 'Weight' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveUnit(): void {
    if (!this.newUnit.code || !this.newUnit.name) return;
    const newItem: UnitItem = {
      id: Date.now(),
      code: this.newUnit.code.toUpperCase(),
      name: this.newUnit.name,
      symbol: this.newUnit.symbol || this.newUnit.code.toLowerCase(),
      category: this.newUnit.category,
      isActive: true
    };
    this.units.update(list => [newItem, ...list]);
    this.closeModal();
  }

  toggleStatus(unit: UnitItem): void {
    this.units.update(list =>
      list.map(u => (u.id === unit.id ? { ...u, isActive: !u.isActive } : u))
    );
  }
}
