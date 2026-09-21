import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../services/roles.service';
import { PermissionsService } from '../services/permissions.service';
import { AuthService } from '../login/auth.service';
import { RoleResponse, RolePageResponse, CreateRoleRequest, UpdateRoleRequest, PermissionResponse } from '../models/role-permission.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-[22px] font-black tracking-tight" style="color:#173b3a;">System Roles</h1>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style="background:linear-gradient(135deg,#e0f6f1,#edfdf7); border:1px solid #b0e4d8; color:#0c6861;">
              Settings / Roles
            </span>
          </div>
          <p class="text-[12px] mt-1 font-medium" style="color:#6c8582;">
            Configure system authorization roles and permission profiles.
          </p>
        </div>

        @if (canCreate()) {
          <button
            type="button"
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-teal-600 text-teal-700 hover:text-white border-2 border-teal-600 text-[12.5px] font-bold shadow-sm transition hover:scale-[1.02] active:scale-[0.97]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Create New Role</span>
          </button>
        }
      </div>

      <!-- Filter Controls Bar -->
      <div class="glass-panel rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3" style="border-color:#d5e8e3;">
        <!-- Search -->
        <div class="relative w-full sm:w-72">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style="color:#96b8b4;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChanged()"
            placeholder="Search roles by code or name…"
            class="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-[12.5px] font-medium"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-[11.5px] font-bold whitespace-nowrap" style="color:#7aa49e;">Status:</span>
          <select
            [(ngModel)]="statusFilter"
            (ngModelChange)="loadRoles()"
            class="glass-input px-3 py-2 rounded-lg text-[12.5px] font-medium"
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
      <div class="overflow-hidden" style="background:white; border:1px solid #d9ece8; border-radius:1rem; box-shadow:0 4px 20px -10px rgba(12,70,66,0.14);">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead style="background:#f5faf8; border-bottom:1px solid #e4eeeb;">
              <tr>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">ID</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Role Code</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Role Name</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Description</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Permissions</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Status</th>
                @if (canEdit()) {
                  <th class="px-5 py-3.5 text-right text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (role of pageData()?.items; track role.id) {
                <tr style="border-bottom:1px solid #edf3f0; transition:background 0.12s ease;" class="hover:bg-[#f6fbf9]">
                  <td class="px-5 py-3.5 font-mono text-[11px]" style="color:#96b8b4;">#{{ role.id }}</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold font-mono"
                      style="background:linear-gradient(135deg,#e0f6f1,#ecfcf7); border:1px solid #b2e4d9; color:#0c6861;">
                      {{ role.code }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-[13px] font-bold" style="color:#1e3e3b;">{{ role.name }}</td>
                  <td class="px-5 py-3.5 text-[12px]" style="color:#7aa49e;">{{ role.description || '\u2014' }}</td>
                  <td class="px-5 py-3.5">
                    @if (role.code === 'ADMIN') {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold"
                        style="background:linear-gradient(135deg,#eee8fc,#f6f2ff); border:1px solid #c8b8f0; color:#6d3fc4;">
                        Full System Access
                      </span>
                    } @else if (role.permissionIds && role.permissionIds.length > 0) {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold"
                        style="background:linear-gradient(135deg,#d0f4e8,#e4faf3); border:1px solid #a8e2ce; color:#09775e;">
                        {{ role.permissionIds.length }} Permissions
                      </span>
                    } @else {
                      <span class="text-[11.5px] italic" style="color:#afc9c4;">No permissions</span>
                    }
                  </td>
                  <td class="px-5 py-3.5">
                    @if (role.isActive) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style="background:linear-gradient(135deg,#d4f5e8,#e8fdf4); border:1px solid #a2ddc4; color:#09765e;">
                        <span class="w-1.5 h-1.5 rounded-full" style="background:#22c67f;"></span>
                        Active
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style="background:#f4f6f5; border:1px solid #dce5e3; color:#7a9490;">
                        <span class="w-1.5 h-1.5 rounded-full" style="background:#b0c4c0;"></span>
                        Inactive
                      </span>
                    }
                  </td>
                  @if (canEdit()) {
                    <td class="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        (click)="openEditModal(role)"
                        class="px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition hover:scale-[1.03]"
                        style="background:linear-gradient(135deg,#e2f5f0,#ecfaf7); border:1px solid #b8e2d8; color:#0c6861;"
                      >
                        Edit &amp; Permissions
                      </button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="canEdit() ? 7 : 6" class="px-5 py-14 text-center text-[12.5px]" style="color:#96b8b4;">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                      No roles found matching criteria.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        @if (pageData(); as data) {
          <div class="px-5 py-3 flex items-center justify-between text-[11.5px] font-medium" style="background:#f8fbfa; border-top:1px solid #e4eeeb;">
            <div style="color:#7aa49e;">
              Showing <span class="font-bold" style="color:#2d5652;">{{ data.items.length }}</span> of
              <span class="font-bold" style="color:#2d5652;">{{ data.totalCount }}</span> roles
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                [disabled]="currentPage <= 1"
                (click)="goToPage(currentPage - 1)"
                class="px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-40"
                style="background:white; border:1px solid #d5e8e3; color:#2d5652;"
              >
                Previous
              </button>
              <span class="px-2.5 font-bold" style="color:#2d5652;">{{ currentPage }} / {{ data.totalPages || 1 }}</span>
              <button
                type="button"
                [disabled]="currentPage >= (data.totalPages || 1)"
                (click)="goToPage(currentPage + 1)"
                class="px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-40"
                style="background:white; border:1px solid #d5e8e3; color:#2d5652;"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Create Role Drawer -->
      @if (showCreateModal() && canCreate()) {
        <div (click)="showCreateModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer mk-drawer--wide">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">Create New Role</div>
                  <div class="mk-modal-subtitle">Configure system authorization role and permissions</div>
                </div>
              </div>
              <button (click)="showCreateModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Role Code</label>
                <input
                  type="text"
                  [(ngModel)]="createForm.code"
                  placeholder="e.g. AUDITOR"
                  class="mk-input mk-input--mono"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Role Name</label>
                <input
                  type="text"
                  [(ngModel)]="createForm.name"
                  placeholder="e.g. System Auditor"
                  class="mk-input"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Description <span style="font-weight:400;color:#96b8b4;">(optional)</span></label>
                <textarea
                  [(ngModel)]="createForm.description"
                  rows="2"
                  placeholder="Permissions and access duties of this role…"
                  class="mk-input mk-input--textarea"
                ></textarea>
              </div>

              <!-- Permission Checkboxes for Role Creation -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="mk-label mb-0"><span class="mk-label-dot"></span> Assign Role Permissions</label>
                  <span class="text-[11px] font-mono font-bold" style="color:#0f766e;">{{ createForm.permissionIds?.length || 0 }} selected</span>
                </div>
                <div class="space-y-2.5 p-2 rounded-xl" style="background:#f5faf8; border:1px solid #dceee9;">
                  @for (group of groupedPermissions(); track group.pageName) {
                    <div class="mk-perm-group">
                      <div class="mk-perm-group-head">
                        <span class="mk-perm-group-dot"></span>
                        <span>{{ group.pageName }}</span>
                        <span class="mk-perm-group-page">({{ group.pageCode }})</span>
                      </div>
                      <div class="grid grid-cols-2 gap-1.5 p-2 bg-white">
                        @for (perm of group.permissions; track perm.id) {
                          <label class="mk-perm-row">
                            <input
                              type="checkbox"
                              [checked]="isCreatePermSelected(perm.id)"
                              (change)="toggleCreatePermSelection(perm.id)"
                              class="mk-checkbox"
                            />
                            <span class="mk-perm-code">{{ perm.code }}</span>
                          </label>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="mk-drawer-footer">
              <button
                type="button"
                (click)="showCreateModal.set(false)"
                class="mk-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveNewRole()"
                [disabled]="!createForm.code || !createForm.name"
                class="mk-btn-primary"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Save Role
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit Role Drawer -->
      @if (showEditModal() && canEdit()) {
        <div (click)="showEditModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer mk-drawer--wide">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">
                    Edit Role: <span style="color:#0f766e; font-family:var(--font-mono);">{{ editingRole?.code }}</span>
                  </div>
                  <div class="mk-modal-subtitle">Update role metadata and permission assignments</div>
                </div>
              </div>
              <button (click)="showEditModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Role Name</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.name"
                  class="mk-input"
                />
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Description <span style="font-weight:400;color:#96b8b4;">(optional)</span></label>
                <textarea
                  [(ngModel)]="editForm.description"
                  rows="2"
                  class="mk-input mk-input--textarea"
                ></textarea>
              </div>

              <!-- Permission Checkboxes for Role Editing -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="mk-label mb-0"><span class="mk-label-dot"></span> Assign Role Permissions</label>
                  <span class="text-[11px] font-mono font-bold" style="color:#0f766e;">{{ editForm.permissionIds?.length || 0 }} selected</span>
                </div>
                <div class="space-y-2.5 p-2 rounded-xl" style="background:#f5faf8; border:1px solid #dceee9;">
                  @for (group of groupedPermissions(); track group.pageName) {
                    <div class="mk-perm-group">
                      <div class="mk-perm-group-head">
                        <span class="mk-perm-group-dot"></span>
                        <span>{{ group.pageName }}</span>
                        <span class="mk-perm-group-page">({{ group.pageCode }})</span>
                      </div>
                      <div class="grid grid-cols-2 gap-1.5 p-2 bg-white">
                        @for (perm of group.permissions; track perm.id) {
                          <label class="mk-perm-row">
                            <input
                              type="checkbox"
                              [checked]="isEditPermSelected(perm.id)"
                              (change)="toggleEditPermSelection(perm.id)"
                              class="mk-checkbox"
                            />
                            <span class="mk-perm-code">{{ perm.code }}</span>
                          </label>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="mk-toggle-row">
                <input
                  type="checkbox"
                  id="isActiveRole"
                  [(ngModel)]="editForm.isActive"
                  class="mk-checkbox"
                />
                <label for="isActiveRole" class="mk-toggle-label">
                  Role is Active
                </label>
                <span class="mk-toggle-hint">Members can inherit permissions from this role</span>
              </div>
            </div>

            <div class="mk-drawer-footer">
              <button
                type="button"
                (click)="showEditModal.set(false)"
                class="mk-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveEditRole()"
                [disabled]="!editForm.name"
                class="mk-btn-primary"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Update Role & Permissions
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
  private readonly permissionsService = inject(PermissionsService);
  private readonly authService = inject(AuthService);

  readonly userPermissions = signal<string[]>([]);
  readonly pageData = signal<RolePageResponse | null>(null);
  readonly allPermissions = signal<PermissionResponse[]>([]);
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
    description: '',
    permissionIds: []
  };

  editingRole: RoleResponse | null = null;
  editForm: UpdateRoleRequest = {
    name: '',
    description: '',
    isActive: true,
    permissionIds: []
  };

  ngOnInit(): void {
    this.permissionsService.getMyPermissions(true).subscribe({
      next: codes => this.userPermissions.set(codes || []),
      error: () => {}
    });
    this.loadRoles();
    this.loadPermissions();
  }

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRATOR');
  });

  canCreate = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('roles.create');
  });

  canEdit = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('roles.edit') || this.userPermissions().includes('roles.delete');
  });

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

  loadPermissions(): void {
    this.permissionsService.getAll().subscribe({
      next: list => this.allPermissions.set(list || []),
      error: () => {}
    });
  }

  groupedPermissions(): { pageName: string; pageCode: string; permissions: PermissionResponse[] }[] {
    const map = new Map<string, { pageName: string; pageCode: string; permissions: PermissionResponse[] }>();

    for (const perm of this.allPermissions()) {
      if (!perm.isActive) continue;
      const key = perm.pageName || perm.pageCode || 'General';
      if (!map.has(key)) {
        map.set(key, { pageName: key, pageCode: perm.pageCode, permissions: [] });
      }
      map.get(key)!.permissions.push(perm);
    }

    return Array.from(map.values());
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
    if (!this.canCreate()) return;
    this.createForm = { code: '', name: '', description: '', permissionIds: [] };
    this.showCreateModal.set(true);
  }

  isCreatePermSelected(permId: number): boolean {
    return (this.createForm.permissionIds || []).includes(permId);
  }

  toggleCreatePermSelection(permId: number): void {
    if (!this.createForm.permissionIds) this.createForm.permissionIds = [];
    if (this.createForm.permissionIds.includes(permId)) {
      this.createForm.permissionIds = this.createForm.permissionIds.filter(id => id !== permId);
    } else {
      this.createForm.permissionIds.push(permId);
    }
  }

  saveNewRole(): void {
    if (!this.canCreate()) return;
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
    if (!this.canEdit()) return;
    this.editingRole = role;
    this.editForm = {
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
      permissionIds: [...(role.permissionIds || [])]
    };
    this.showEditModal.set(true);
  }

  isEditPermSelected(permId: number): boolean {
    return (this.editForm.permissionIds || []).includes(permId);
  }

  toggleEditPermSelection(permId: number): void {
    if (!this.editForm.permissionIds) this.editForm.permissionIds = [];
    if (this.editForm.permissionIds.includes(permId)) {
      this.editForm.permissionIds = this.editForm.permissionIds.filter(id => id !== permId);
    } else {
      this.editForm.permissionIds.push(permId);
    }
  }

  saveEditRole(): void {
    if (!this.canEdit() || !this.editingRole) return;

    this.rolesService.updateRole(this.editingRole.id, this.editForm).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.successMessage.set('Role and assigned permissions updated successfully.');
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
