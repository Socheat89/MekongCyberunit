import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../services/permissions.service';
import {
  PermissionResponse,
  CreatePermissionRequest,
  UpdatePermissionRequest
} from '../models/role-permission.models';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2.5">
            <h1 class="text-2xl font-black tracking-tight text-slate-900">System Permissions</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Settings / Permissions
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Fine-grained action-level authorization rules mapped to application pages.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition hover:scale-[1.02] active:scale-[0.98] inline-flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Create Permission</span>
        </button>
      </div>

      <!-- Search & Controls Bar -->
      <div class="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200">
        <div class="relative w-full sm:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search code, page, or action..."
            class="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs placeholder-slate-400 font-medium"
          />
        </div>

        <div class="text-xs text-slate-500 font-medium">
          Total Rules: <span class="text-slate-900 font-bold font-mono">{{ filteredPermissions().length }}</span>
        </div>
      </div>

      <!-- Alert Banners -->
      @if (errorMessage()) {
        <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 shadow-xs">
          <span>{{ errorMessage() }}</span>
        </div>
      }
      @if (successMessage()) {
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 shadow-xs">
          <span>{{ successMessage() }}</span>
        </div>
      }

      <!-- Permissions Table -->
      <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th class="px-6 py-4">ID</th>
                <th class="px-6 py-4">Permission Code</th>
                <th class="px-6 py-4">Assigned Page</th>
                <th class="px-6 py-4">Action</th>
                <th class="px-6 py-4">Description</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (perm of filteredPermissions(); track perm.id) {
                <tr class="hover:bg-slate-50/70 transition-colors group">
                  <td class="px-6 py-4 font-mono text-slate-400">#{{ perm.id }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-xs">
                      {{ perm.code }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                      {{ perm.pageName }} ({{ perm.pageCode }})
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      [class.bg-emerald-50]="perm.action.toLowerCase() === 'view'"
                      [class.text-emerald-700]="perm.action.toLowerCase() === 'view'"
                      [class.border-emerald-200]="perm.action.toLowerCase() === 'view'"
                      [class.bg-sky-50]="perm.action.toLowerCase() === 'create'"
                      [class.text-sky-700]="perm.action.toLowerCase() === 'create'"
                      [class.border-sky-200]="perm.action.toLowerCase() === 'create'"
                      [class.bg-amber-50]="perm.action.toLowerCase() === 'update' || perm.action.toLowerCase() === 'edit'"
                      [class.text-amber-700]="perm.action.toLowerCase() === 'update' || perm.action.toLowerCase() === 'edit'"
                      [class.border-amber-200]="perm.action.toLowerCase() === 'update' || perm.action.toLowerCase() === 'edit'"
                      [class.bg-rose-50]="perm.action.toLowerCase() === 'delete'"
                      [class.text-rose-700]="perm.action.toLowerCase() === 'delete'"
                      [class.border-rose-200]="perm.action.toLowerCase() === 'delete'"
                      class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border"
                    >
                      {{ perm.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-500">{{ perm.description || '—' }}</td>
                  <td class="px-6 py-4">
                    @if (perm.isActive) {
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
                      (click)="openEditModal(perm)"
                      class="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition px-2.5 py-1 rounded-lg hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-6 py-10 text-center text-slate-400 font-medium">
                    No permissions found matching criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Modal -->
      @if (showCreateModal()) {
        <div (click)="showCreateModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-slate-900 font-sans">Create Permission</h2>
              <button (click)="showCreateModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Target Page ID</label>
                <input
                  type="number"
                  [(ngModel)]="createForm.pageId"
                  placeholder="1"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
                <p class="text-[11px] text-slate-500 mt-1 font-mono">1: Dashboard, 2: Units, 3: Settings</p>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Action Code</label>
                <input
                  type="text"
                  [(ngModel)]="createForm.action"
                  placeholder="e.g. view, create, edit, delete"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs lowercase font-mono font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  [(ngModel)]="createForm.description"
                  rows="3"
                  placeholder="Description of what this rule permits..."
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs resize-none font-medium"
                ></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                (click)="showCreateModal.set(false)"
                class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveNewPermission()"
                [disabled]="!createForm.pageId || !createForm.action"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit Modal -->
      @if (showEditModal()) {
        <div (click)="showEditModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-slate-900 font-sans">Edit: {{ editingPermission?.code }}</h2>
              <button (click)="showEditModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  [(ngModel)]="editForm.description"
                  rows="3"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs resize-none font-medium"
                ></textarea>
              </div>
              <div class="flex items-center space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isActivePerm"
                  [(ngModel)]="editForm.isActive"
                  class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label for="isActivePerm" class="text-xs text-slate-800 font-bold cursor-pointer">
                  Permission is Active
                </label>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                (click)="showEditModal.set(false)"
                class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveEditPermission()"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PermissionList implements OnInit {
  private readonly permissionsService = inject(PermissionsService);

  readonly permissions = signal<PermissionResponse[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  searchQuery = '';
  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  createForm: CreatePermissionRequest = {
    pageId: 1,
    action: 'view',
    description: ''
  };

  editingPermission: PermissionResponse | null = null;
  editForm: UpdatePermissionRequest = {
    description: '',
    isActive: true
  };

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.permissionsService.getAll().subscribe({
      next: list => {
        this.permissions.set(list || []);
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to load permissions.');
      }
    });
  }

  filteredPermissions(): PermissionResponse[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.permissions();

    return this.permissions().filter(
      p =>
        p.code.toLowerCase().includes(q) ||
        p.pageName.toLowerCase().includes(q) ||
        p.pageCode.toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q)
    );
  }

  openCreateModal(): void {
    this.createForm = { pageId: 1, action: 'view', description: '' };
    this.showCreateModal.set(true);
  }

  saveNewPermission(): void {
    this.permissionsService.create(this.createForm).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.successMessage.set('Permission created successfully.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadPermissions();
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to create permission.');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  openEditModal(perm: PermissionResponse): void {
    this.editingPermission = perm;
    this.editForm = {
      description: perm.description || '',
      isActive: perm.isActive
    };
    this.showEditModal.set(true);
  }

  saveEditPermission(): void {
    if (!this.editingPermission) return;

    this.permissionsService.update(this.editingPermission.id, this.editForm).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.successMessage.set('Permission updated.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadPermissions();
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to update permission.');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }
}
