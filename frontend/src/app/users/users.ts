import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { RolesService } from '../services/roles.service';
import { PermissionsService } from '../services/permissions.service';
import { UserDto, CreateUserWithRolesRequest } from '../models/user-management.models';
import { RoleResponse, PermissionResponse } from '../models/role-permission.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900">User Management & Permissions</h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Create user accounts, manage security credentials, and assign role-based access permissions.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition inline-flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          <span>Create New User</span>
        </button>
      </div>

      <!-- Quick Metrics Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-panel rounded-2xl p-4.5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5">{{ users().length }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-4.5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</div>
            <div class="text-2xl font-black text-emerald-600 mt-0.5">{{ activeUsersCount() }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <div class="glass-panel rounded-2xl p-4.5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Roles</div>
            <div class="text-2xl font-black text-violet-600 mt-0.5">{{ allRoles().length }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Controls Filter Bar -->
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
            placeholder="Search by username or email..."
            class="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs placeholder-slate-400 font-medium"
          />
        </div>

        <div class="text-xs text-slate-500 font-medium">
          Showing <span class="font-bold text-slate-800">{{ filteredUsers().length }}</span> users
        </div>
      </div>

      <!-- Notifications -->
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

      <!-- Users Table -->
      <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th class="px-6 py-4">User</th>
                <th class="px-6 py-4">Email</th>
                <th class="px-6 py-4">Assigned Roles</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Created Date</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-medium">
              @for (user of filteredUsers(); track user.id) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <!-- User Avatar with User Icon -->
                  <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-sm font-sans">{{ user.username }}</div>
                        <div class="text-[10px] text-slate-400 font-mono">ID: #{{ user.id }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Email -->
                  <td class="px-6 py-4 text-slate-600">{{ user.email }}</td>

                  <!-- Assigned Roles -->
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1.5">
                      @for (role of user.roles; track role) {
                        <span class="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                          {{ role }}
                        </span>
                      } @empty {
                        <span class="text-slate-400 text-xs italic">No roles</span>
                      }
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4">
                    @if (user.isActive) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Disabled
                      </span>
                    }
                  </td>

                  <!-- Created Date -->
                  <td class="px-6 py-4 text-slate-500 font-mono text-[11px]">
                    {{ user.createdAtUtc | date:'shortDate' }}
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 text-right space-x-2">
                    <button
                      type="button"
                      (click)="openPermissionsModal(user)"
                      class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition"
                    >
                      Set Roles & Permissions
                    </button>

                    <button
                      type="button"
                      (click)="toggleUserStatus(user)"
                      class="px-2 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    >
                      {{ user.isActive ? 'Disable' : 'Enable' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal 1: Create New User -->
      @if (showCreateModal()) {
        <div (click)="showCreateModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-slate-900 font-sans">Create New User</h2>
              <button (click)="showCreateModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <div class="space-y-3.5">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  [(ngModel)]="createForm.username"
                  placeholder="e.g. warehouse_manager"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="createForm.email"
                  placeholder="e.g. manager@stockhub.com"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  [(ngModel)]="createForm.password"
                  placeholder="••••••••••••"
                  class="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Assign System Roles</label>
                <div class="space-y-2 max-h-36 overflow-y-auto p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  @for (role of allRoles(); track role.id) {
                    <label class="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-indigo-600">
                      <input
                        type="checkbox"
                        [checked]="isRoleSelected(role.id)"
                        (change)="toggleRoleSelection(role.id)"
                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span class="font-bold">{{ role.name }}</span>
                      <span class="text-slate-400 font-mono text-[11px]">({{ role.code }})</span>
                    </label>
                  }
                </div>
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
                (click)="saveNewUser()"
                [disabled]="!createForm.username || !createForm.email || !createForm.password"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal 2: Set Roles & Permissions -->
      @if (showPermissionsModal()) {
        <div (click)="showPermissionsModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-lg p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 class="text-base font-bold text-slate-900 font-sans">
                  Set Permissions for: {{ selectedUser?.username }}
                </h2>
                <p class="text-xs text-slate-500">Assign roles to grant dynamic access permissions across the system.</p>
              </div>
              <button (click)="showPermissionsModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <!-- Role Checkboxes -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">Assign Roles</label>
              <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                @for (role of allRoles(); track role.id) {
                  <label class="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer p-1.5 rounded-lg hover:bg-white transition">
                    <input
                      type="checkbox"
                      [checked]="isEditRoleSelected(role.id)"
                      (change)="toggleEditRoleSelection(role.id)"
                      class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div>{{ role.name }}</div>
                      <div class="text-[10px] text-slate-400 font-mono">{{ role.code }}</div>
                    </div>
                  </label>
                }
              </div>
            </div>

            <!-- Permissions Impact Preview -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700">Effective Permissions Preview</label>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 max-h-40 overflow-y-auto">
                @if (selectedUserRoleIds.length === 0) {
                  <div class="text-xs text-slate-400 italic">No roles selected. User will have no access permissions.</div>
                } @else {
                  <div class="flex flex-wrap gap-1.5">
                    @for (perm of allPermissions(); track perm.id) {
                      <span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-700">
                        {{ perm.code }}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                (click)="showPermissionsModal.set(false)"
                class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveUserRoles()"
                class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UserList implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly permissionsService = inject(PermissionsService);

  readonly users = signal<UserDto[]>([]);
  readonly allRoles = signal<RoleResponse[]>([]);
  readonly allPermissions = signal<PermissionResponse[]>([]);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  searchQuery = '';
  showCreateModal = signal<boolean>(false);
  showPermissionsModal = signal<boolean>(false);

  createForm: CreateUserWithRolesRequest = {
    username: '',
    email: '',
    password: '',
    roleIds: []
  };

  selectedUser: UserDto | null = null;
  selectedUserRoleIds: number[] = [];

  activeUsersCount(): number {
    return this.users().filter(u => u.isActive).length;
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadPermissions();
  }

  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: data => this.users.set(data || []),
      error: err => this.errorMessage.set(err.error?.message || 'Failed to load users.')
    });
  }

  loadRoles(): void {
    this.rolesService.getRoles({ pageSize: 50 }).subscribe({
      next: res => this.allRoles.set(res.items || []),
      error: () => {}
    });
  }

  loadPermissions(): void {
    this.permissionsService.getAll().subscribe({
      next: data => this.allPermissions.set(data || []),
      error: () => {}
    });
  }

  filteredUsers(): UserDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(
      u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  openCreateModal(): void {
    this.createForm = { username: '', email: '', password: '', roleIds: [] };
    this.showCreateModal.set(true);
  }

  isRoleSelected(roleId: number): boolean {
    return this.createForm.roleIds.includes(roleId);
  }

  toggleRoleSelection(roleId: number): void {
    if (this.createForm.roleIds.includes(roleId)) {
      this.createForm.roleIds = this.createForm.roleIds.filter(id => id !== roleId);
    } else {
      this.createForm.roleIds.push(roleId);
    }
  }

  saveNewUser(): void {
    if (!this.createForm.username || !this.createForm.email || !this.createForm.password) return;

    this.usersService.createUser(this.createForm).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.successMessage.set('User created and permissions assigned successfully.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadUsers();
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to create user.');
        setTimeout(() => this.errorMessage.set(null), 3500);
      }
    });
  }

  openPermissionsModal(user: UserDto): void {
    this.selectedUser = user;
    this.selectedUserRoleIds = [...user.roleIds];
    this.showPermissionsModal.set(true);
  }

  isEditRoleSelected(roleId: number): boolean {
    return this.selectedUserRoleIds.includes(roleId);
  }

  toggleEditRoleSelection(roleId: number): void {
    if (this.selectedUserRoleIds.includes(roleId)) {
      this.selectedUserRoleIds = this.selectedUserRoleIds.filter(id => id !== roleId);
    } else {
      this.selectedUserRoleIds.push(roleId);
    }
  }

  saveUserRoles(): void {
    if (!this.selectedUser) return;

    this.usersService.updateRoles(this.selectedUser.id, { roleIds: this.selectedUserRoleIds }).subscribe({
      next: () => {
        this.showPermissionsModal.set(false);
        this.successMessage.set('User roles and permissions updated successfully.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadUsers();
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to update roles.');
        setTimeout(() => this.errorMessage.set(null), 3500);
      }
    });
  }

  toggleUserStatus(user: UserDto): void {
    this.usersService.toggleStatus(user.id).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => (u.id === updated.id ? updated : u)));
        this.successMessage.set(`User status updated to ${updated.isActive ? 'Active' : 'Disabled'}.`);
        setTimeout(() => this.successMessage.set(null), 2500);
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to update status.');
        setTimeout(() => this.errorMessage.set(null), 3000);
      }
    });
  }
}
