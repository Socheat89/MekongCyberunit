import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../services/permissions.service';
import { AuthService } from '../login/auth.service';

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

        @if (canCreate()) {
          <button
            type="button"
            (click)="openModal()"
            class="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border-2 border-indigo-600 text-xs font-bold shadow-sm transition hover:scale-[1.02] active:scale-[0.98] inline-flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Add New Unit</span>
          </button>
        }
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
                @if (canEdit() || canDelete()) {
                  <th class="px-6 py-4 text-right">Actions</th>
                }
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
                  @if (canEdit() || canDelete()) {
                    <td class="px-6 py-4 text-right flex items-center justify-end space-x-2">
                      @if (canEdit()) {
                        <button
                          type="button"
                          (click)="openEditModal(unit)"
                          class="text-xs font-bold transition px-2.5 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                      }
                      @if (canDelete()) {
                        <button
                          type="button"
                          (click)="toggleStatus(unit)"
                          [class.text-rose-600]="unit.isActive"
                          [class.text-emerald-600]="!unit.isActive"
                          class="text-xs font-bold transition px-2.5 py-1 rounded-lg hover:bg-slate-100"
                        >
                          {{ unit.isActive ? 'Deactivate' : 'Activate' }}
                        </button>
                      }
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="(canEdit() || canDelete()) ? 6 : 5" class="px-6 py-10 text-center text-slate-400 font-medium">
                    No measurement units matching your criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Unit Drawer -->
      @if (showModal() && canCreate()) {
        <div (click)="closeModal()" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">Add Measurement Unit</div>
                  <div class="mk-modal-subtitle">Define a new unit for inventory tracking</div>
                </div>
              </div>
              <button (click)="closeModal()" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Unit Code</label>
                <input
                  type="text"
                  [(ngModel)]="newUnit.code"
                  placeholder="e.g. KG"
                  class="mk-input mk-input--mono"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Unit Name</label>
                <input
                  type="text"
                  [(ngModel)]="newUnit.name"
                  placeholder="e.g. Kilogram"
                  class="mk-input"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Display Symbol</label>
                <input
                  type="text"
                  [(ngModel)]="newUnit.symbol"
                  placeholder="e.g. kg"
                  class="mk-input"
                  style="font-family:var(--font-mono);"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Category</label>
                <select [(ngModel)]="newUnit.category" class="mk-select">
                  <option value="Weight">Weight</option>
                  <option value="Volume">Volume</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Length">Length</option>
                </select>
              </div>
            </div>

            <div class="mk-drawer-footer">
              <button type="button" (click)="closeModal()" class="mk-btn-cancel">Cancel</button>
              <button
                type="button"
                (click)="saveUnit()"
                [disabled]="!newUnit.code || !newUnit.name"
                class="mk-btn-primary"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Save Unit
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit Unit Drawer -->
      @if (showEditModal() && canEdit()) {
        <div (click)="closeEditModal()" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">Edit Measurement Unit</div>
                  <div class="mk-modal-subtitle">Update unit details and category</div>
                </div>
              </div>
              <button (click)="closeEditModal()" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Unit Code</label>
                <input
                  type="text"
                  [(ngModel)]="editingUnit.code"
                  placeholder="e.g. KG"
                  class="mk-input mk-input--mono"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Unit Name</label>
                <input
                  type="text"
                  [(ngModel)]="editingUnit.name"
                  placeholder="e.g. Kilogram"
                  class="mk-input"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Display Symbol</label>
                <input
                  type="text"
                  [(ngModel)]="editingUnit.symbol"
                  placeholder="e.g. kg"
                  class="mk-input"
                  style="font-family:var(--font-mono);"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Category</label>
                <select [(ngModel)]="editingUnit.category" class="mk-select">
                  <option value="Weight">Weight</option>
                  <option value="Volume">Volume</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Length">Length</option>
                </select>
              </div>
            </div>

            <div class="mk-drawer-footer">
              <button type="button" (click)="closeEditModal()" class="mk-btn-cancel">Cancel</button>
              <button
                type="button"
                (click)="saveEditUnit()"
                [disabled]="!editingUnit.code || !editingUnit.name"
                class="mk-btn-primary"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UnitList implements OnInit {
  private readonly permissionsService = inject(PermissionsService);
  private readonly authService = inject(AuthService);

  readonly userPermissions = signal<string[]>([]);

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
  showEditModal = signal<boolean>(false);

  newUnit = {
    code: '',
    name: '',
    symbol: '',
    category: 'Weight'
  };

  editingUnit: UnitItem = {
    id: 0,
    code: '',
    name: '',
    symbol: '',
    category: 'Weight',
    isActive: true
  };

  ngOnInit(): void {
    this.permissionsService.getMyPermissions(true).subscribe({
      next: codes => this.userPermissions.set(codes || []),
      error: () => {}
    });
  }

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRATOR');
  });

  canCreate = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('units.create');
  });

  canEdit = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('units.edit');
  });

  canDelete = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('units.delete');
  });

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
    if (!this.canCreate()) return;
    this.newUnit = { code: '', name: '', symbol: '', category: 'Weight' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveUnit(): void {
    if (!this.canCreate() || !this.newUnit.code || !this.newUnit.name) return;
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

  openEditModal(unit: UnitItem): void {
    if (!this.canEdit()) return;
    this.editingUnit = { ...unit };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  saveEditUnit(): void {
    if (!this.canEdit() || !this.editingUnit.code || !this.editingUnit.name) return;
    const updated = {
      ...this.editingUnit,
      code: this.editingUnit.code.toUpperCase()
    };
    this.units.update(list => list.map(u => (u.id === updated.id ? updated : u)));
    this.closeEditModal();
  }

  toggleStatus(unit: UnitItem): void {
    if (!this.canDelete()) return;
    this.units.update(list =>
      list.map(u => (u.id === unit.id ? { ...u, isActive: !u.isActive } : u))
    );
  }
}
