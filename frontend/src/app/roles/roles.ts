import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../services/roles.service';
import { RoleResponse, RolePageResponse, CreateRoleRequest, UpdateRoleRequest } from '../models/role-permission.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2.5">
            <h1 class="text-2xl font-black tracking-tight text-slate-900">System Roles</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Settings / Roles
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Configure system authorization roles and permission profiles.
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
          <span>Create New Role</span>
        </button>
      </div>

      <!-- Filter Controls Bar -->
      <div class="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200">
        <!-- Search -->
        <div class="relative w-full sm:w-80">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChanged()"
            placeholder="Search roles by code or name..."
            class="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs placeholder-slate-400 font-medium"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex items-center space-x-2 w-full sm:w-auto">
          <span class="text-xs text-slate-500 font-bold whitespace-nowrap">Status:</span>
          <select
            [(ngModel)]="statusFilter"
            (ngModelChange)="loadRoles()"
            class="glass-input px-3 py-2 rounded-xl text-xs bg-white border border-slate-300 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <!-- Alert Banners -->
      @if (errorMessage()) {
        <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <span>{{ errorMessage() }}</span>
        </div>
      }
      @if (successMessage()) {
        <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
          <span>{{ successMessage() }}</span>
        </div>
      }

      <!-- Roles Table -->
      <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th class="px-6 py-4">ID</th>
                <th class="px-6 py-4">Role Code</th>
                <th class="px-6 py-4">Role Name</th>
                <th class="px-6 py-4">Description</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (role of pageData()?.items; track role.id) {
                <tr class="hover:bg-slate-50/70 transition-colors group">
                  <td class="px-6 py-4 font-mono text-slate-400">#{{ role.id }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold text-xs">
                      {{ role.code }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-900 font-bold text-sm font-sans">{{ role.name }}</td>
                  <td class="px-6 py-4 text-slate-500">{{ role.description || '—' }}</td>
                  <td class="px-6 py-4">
                    @if (role.isActive) {
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
                      (click)="openEditModal(role)"
                      class="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition px-2.5 py-1 rounded-lg hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-10 text-center text-slate-400">
                    No roles found matching criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        @if (pageData(); as data) {
          <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div>
              Showing <span class="font-bold text-slate-800">{{ data.items.length }}</span> of
              <span class="font-bold text-slate-800">{{ data.totalCount }}</span> roles
            </div>
            <div class="flex items-center space-x-2">
              <button
                type="button"
                [disabled]="currentPage <= 1"
                (click)="goToPage(currentPage - 1)"
                class="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition font-bold"
              >
                Previous
              </button>
              <span class="text-slate-700 px-2 font-bold">Page {{ currentPage }} / {{ data.totalPages || 1 }}</span>
              <button
                type="button"
                [disabled]="currentPage >= (data.totalPages || 1)"
                (click)="goToPage(currentPage + 1)"
                class="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition font-bold"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Create Role Modal -->
      @if (showCreateModal()) {
        <div (click)="showCreateModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-slate-900 font-sans">Create New Role</h2>
              <button (click)="showCreateModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Role Code</label>
                <input
                  type="text"
                  [(ngModel)]="createForm.code"
                  placeholder="e.g. AUDITOR"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs uppercase font-mono font-bold"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Role Name</label>
                <input
                  type="text"
                  [(ngModel)]="createForm.name"
                  placeholder="e.g. System Auditor"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  [(ngModel)]="createForm.description"
                  rows="3"
                  placeholder="Permissions and access duties of this role..."
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
                (click)="saveNewRole()"
                [disabled]="!createForm.code || !createForm.name"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit Role Modal -->
      @if (showEditModal()) {
        <div (click)="showEditModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-slate-900 font-sans">Edit Role: {{ editingRole?.code }}</h2>
              <button (click)="showEditModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Role Name</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.name"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>
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
                  id="isActiveRole"
                  [(ngModel)]="editForm.isActive"
                  class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label for="isActiveRole" class="text-xs text-slate-800 font-bold cursor-pointer">
                  Role is Active
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
                (click)="saveEditRole()"
                [disabled]="!editForm.name"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RoleList implements OnInit {
  private readonly rolesService = inject(RolesService);

  readonly pageData = signal<RolePageResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  currentPage = 1;
  pageSize = 10;
  searchQuery = '';
  statusFilter = '';

  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);

  createForm: CreateRoleRequest = {
    code: '',
    name: '',
    description: ''
  };

  editingRole: RoleResponse | null = null;
  editForm: UpdateRoleRequest = {
    name: '',
    description: '',
    isActive: true
  };

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.rolesService.getRoles({
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchQuery || undefined,
      status: this.statusFilter || undefined
    }).subscribe({
      next: res => {
        this.pageData.set(res);
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to load roles.');
      }
    });
  }

  onSearchChanged(): void {
    this.currentPage = 1;
    this.loadRoles();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadRoles();
  }

  openCreateModal(): void {
    this.createForm = { code: '', name: '', description: '' };
    this.showCreateModal.set(true);
  }

  saveNewRole(): void {
    this.rolesService.createRole(this.createForm).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.successMessage.set('Role successfully created.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadRoles();
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to create role.');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }

  openEditModal(role: RoleResponse): void {
    this.editingRole = role;
    this.editForm = {
      name: role.name,
      description: role.description || '',
      isActive: role.isActive
    };
    this.showEditModal.set(true);
  }

  saveEditRole(): void {
    if (!this.editingRole) return;

    this.rolesService.updateRole(this.editingRole.id, this.editForm).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.successMessage.set('Role updated successfully.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadRoles();
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to update role.');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }
}
