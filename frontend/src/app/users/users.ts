import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../services/users.service';
import { RolesService } from '../services/roles.service';
import { PermissionsService } from '../services/permissions.service';
import { NavigationService } from '../layout/app-sidebar/navigation.service';
import { AuthService } from '../login/auth.service';
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
          <h1 class="text-[22px] font-black tracking-tight" style="color:#173b3a;">User Management &amp; Permissions</h1>
          <p class="text-[12px] mt-1 font-medium" style="color:#6c8582;">
            Create accounts, manage credentials, and assign role-based &amp; direct access permissions.
          </p>
        </div>

        @if (canCreate()) {
          <button
            type="button"
            (click)="openCreateModal()"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-teal-600 text-teal-700 hover:text-white border-2 border-teal-600 text-[12.5px] font-bold shadow-sm transition hover:scale-[1.02] active:scale-[0.97]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            <span>Create New User</span>
          </button>
        }
      </div>

      <!-- Quick Metrics Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Total Accounts -->
        <div class="mekong-kpi-card">
          <div>
            <div class="mekong-kpi-label">Total Accounts</div>
            <div class="mekong-kpi-value" style="color:#173b3a;">{{ users().length }}</div>
          </div>
          <div class="mekong-kpi-icon mekong-metric-icon--teal">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>

        <!-- Active Staff -->
        <div class="mekong-kpi-card">
          <div>
            <div class="mekong-kpi-label">Active Staff</div>
            <div class="mekong-kpi-value" style="color:#078d72;">{{ activeUsersCount() }}</div>
          </div>
          <div class="mekong-kpi-icon" style="background:linear-gradient(135deg,#d0f4e8,#e4faf3); color:#078d72;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <!-- Available Roles -->
        <div class="mekong-kpi-card">
          <div>
            <div class="mekong-kpi-label">Available Roles</div>
            <div class="mekong-kpi-value" style="color:#6d3fc4;">{{ allRoles().length }}</div>
          </div>
          <div class="mekong-kpi-icon" style="background:linear-gradient(135deg,#ede8fc,#f5f2ff); color:#6d3fc4;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Controls Filter Bar -->
      <div class="glass-panel rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3" style="border-color: #d5e8e3;">
        <div class="relative w-full sm:w-72">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style="color:#96b8b4;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search username or email…"
            class="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-[12.5px] font-medium"
          />
        </div>

        <div class="text-[11.5px] font-medium" style="color:#7aa49e;">
          Showing <span class="font-bold" style="color:#2d5652;">{{ filteredUsers().length }}</span> of {{ users().length }} users
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
      <div class="overflow-hidden" style="background:white; border:1px solid #d9ece8; border-radius:1rem; box-shadow:0 4px 20px -10px rgba(12,70,66,0.14);">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead style="background:#f5faf8; border-bottom:1px solid #e4eeeb;">
              <tr>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">User</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Email</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Assigned Roles</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Direct Permissions</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Status</th>
                @if (canEdit()) {
                  <th class="px-5 py-3.5 text-right text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user.id) {
                <tr style="border-bottom:1px solid #edf3f0; transition:background 0.12s ease;" class="hover:bg-[#f6fbf9]">
                  <!-- User Avatar + Name -->
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style="background:linear-gradient(135deg,#d5f0ea,#e8faf5); border:1px solid #bce4d8; color:#0f766e;">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="text-[13px] font-bold" style="color:#1e3e3b;">{{ user.username }}</div>
                        <div class="text-[10.5px] font-mono mt-0.5" style="color:#9ab8b4;">ID #{{ user.id }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Email -->
                  <td class="px-5 py-3.5 text-[12.5px]" style="color:#4a6b67;">{{ user.email }}</td>

                  <!-- Assigned Roles -->
                  <td class="px-5 py-3.5">
                    <div class="flex flex-wrap gap-1">
                      @for (role of user.roles; track role) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold"
                          style="background:linear-gradient(135deg,#e0f6f1,#ecfcf7); border:1px solid #b2e4d9; color:#0c6861;">
                          {{ role }}
                        </span>
                      } @empty {
                        <span class="text-[11.5px] italic" style="color:#afc9c4;">No roles</span>
                      }
                    </div>
                  </td>

                  <!-- Direct Permissions -->
                  <td class="px-5 py-3.5">
                    @if (user.directPermissionIds && user.directPermissionIds.length > 0) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold"
                        style="background:linear-gradient(135deg,#d0f4e8,#e4faf3); border:1px solid #a8e2ce; color:#09775e;">
                        +{{ user.directPermissionIds.length }} direct
                      </span>
                    } @else {
                      <span class="text-[11.5px] italic" style="color:#afc9c4;">Role-only</span>
                    }
                  </td>

                  <!-- Status -->
                  <td class="px-5 py-3.5">
                    @if (user.isActive) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style="background:linear-gradient(135deg,#d4f5e8,#e8fdf4); border:1px solid #a2ddc4; color:#09765e;">
                        <span class="w-1.5 h-1.5 rounded-full" style="background:#22c67f;"></span>
                        Active
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style="background:#f4f6f5; border:1px solid #dce5e3; color:#7a9490;">
                        <span class="w-1.5 h-1.5 rounded-full" style="background:#b0c4c0;"></span>
                        Disabled
                      </span>
                    }
                  </td>

                  <!-- Actions -->
                  @if (canEdit()) {
                    <td class="px-5 py-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          (click)="openPermissionsModal(user)"
                          class="px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition hover:scale-[1.03]"
                          style="background:linear-gradient(135deg,#e2f5f0,#ecfaf7); border:1px solid #b8e2d8; color:#0c6861;"
                        >
                          Set Roles
                        </button>
                        <button
                          type="button"
                          (click)="toggleUserStatus(user)"
                          class="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition"
                          style="background:#f4f6f5; border:1px solid #dce5e3; color:#7a9490;"
                        >
                          {{ user.isActive ? 'Disable' : 'Enable' }}
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="canEdit() ? 6 : 5" class="px-5 py-14 text-center text-[12.5px]" style="color:#96b8b4;">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      No users found matching your search.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Drawer 1: Create New User -->
      @if (showCreateModal() && canCreate()) {
        <div (click)="showCreateModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer">
            <!-- Header -->
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">Create New User</div>
                  <div class="mk-modal-subtitle">Add a new team member to Mekong Stock</div>
                </div>
              </div>
              <button (click)="showCreateModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <!-- Body -->
            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Username</label>
                <input type="text" [(ngModel)]="createForm.username" placeholder="e.g. warehouse_manager" class="mk-input"/>
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Email Address</label>
                <input type="email" [(ngModel)]="createForm.email" placeholder="e.g. manager@stockhub.com" class="mk-input"/>
              </div>
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Temporary Password</label>
                <input type="password" [(ngModel)]="createForm.password" placeholder="••••••••••••" class="mk-input"/>
              </div>

              <!-- Roles -->
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Assign System Roles</label>
                <div class="mk-scroll-area space-y-2" style="max-height:10rem;">
                  @for (role of allRoles(); track role.id) {
                    <label
                      class="mk-check-card"
                      [class.mk-check-card--selected]="isRoleSelected(role.id)"
                    >
                      <input
                        type="checkbox"
                        class="mk-checkbox"
                        [checked]="isRoleSelected(role.id)"
                        (change)="toggleRoleSelection(role.id)"
                      />
                      <div>
                        <div style="font-size:0.8rem;font-weight:700;color:#1a3e3a;">{{ role.name }}</div>
                        <div style="font-size:0.65rem;font-family:var(--font-mono);color:#0c9982;font-weight:600;">{{ role.code }}</div>
                      </div>
                    </label>
                  }
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="mk-drawer-footer">
              <button type="button" (click)="showCreateModal.set(false)" class="mk-btn-cancel">Cancel</button>
              <button
                type="button"
                (click)="saveNewUser()"
                [disabled]="!createForm.username || !createForm.email || !createForm.password"
                class="mk-btn-primary"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Create User
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Drawer 2: Set Roles & Direct Permissions -->
      @if (showPermissionsModal() && canEdit()) {
        <div (click)="showPermissionsModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer mk-drawer--wide">
            <!-- Header -->
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">
                    Set Permissions —
                    <span style="font-family:var(--font-mono);color:#0f766e;font-size:0.85rem;">{{ selectedUser?.username }}</span>
                  </div>
                  <div class="mk-modal-subtitle">Assign roles and direct access permissions for this account</div>
                </div>
              </div>
              <button (click)="showPermissionsModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <!-- Body -->
            <div class="mk-drawer-body space-y-5">

              <!-- Section 1: System Roles -->
              <div>
                <div class="mk-section-label" style="border-top:none;padding-top:0;">
                  <span class="mk-section-badge">1</span>
                  Assign System Roles
                  <span style="margin-left:auto;font-size:0.64rem;font-weight:500;color:#96b8b4;text-transform:none;letter-spacing:0;">Roles grant inherited page access</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  @for (role of allRoles(); track role.id) {
                    <label
                      class="mk-check-card"
                      [class.mk-check-card--selected]="isEditRoleSelected(role.id)"
                    >
                      <input
                        type="checkbox"
                        class="mk-checkbox"
                        [checked]="isEditRoleSelected(role.id)"
                        (change)="toggleEditRoleSelection(role.id)"
                      />
                      <div class="min-w-0">
                        <div style="font-size:0.8rem;font-weight:700;color:#1a3e3a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ role.name }}</div>
                        <div style="font-size:0.64rem;font-family:var(--font-mono);color:#0c9982;font-weight:600;">{{ role.code }}</div>
                        @if (role.description) {
                          <div style="font-size:0.67rem;color:#7aa49e;margin-top:0.15rem;">{{ role.description }}</div>
                        }
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- Section 2: Direct Permissions -->
              <div>
                <div class="mk-section-label">
                  <span class="mk-section-badge">2</span>
                  Direct / Custom Permissions
                  <span style="margin-left:auto;font-size:0.64rem;font-weight:500;color:#96b8b4;text-transform:none;letter-spacing:0;">Override for this user only</span>
                </div>
                <div class="mk-scroll-area space-y-2 mt-2" style="max-height:13rem;">
                  @for (group of groupedPermissions(); track group.pageName) {
                    <div class="mk-perm-group">
                      <div class="mk-perm-group-head">
                        <span class="mk-perm-group-dot"></span>
                        {{ group.pageName }}
                        <span class="mk-perm-group-page">({{ group.pageCode }})</span>
                      </div>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-0.5 p-1.5">
                        @for (perm of group.permissions; track perm.id) {
                          <label class="mk-perm-row">
                            <input
                              type="checkbox"
                              class="mk-checkbox"
                              style="width:0.85rem;height:0.85rem;"
                              [checked]="isEditDirectPermSelected(perm.id)"
                              (change)="toggleEditDirectPermSelection(perm.id)"
                            />
                            <span class="mk-perm-code">{{ perm.code }}</span>
                          </label>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Section 3: Effective Permissions Preview -->
              <div>
                <div class="mk-section-label">
                  <span class="mk-section-badge">✓</span>
                  Effective Permissions Preview
                  <span class="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                    style="background:linear-gradient(135deg,#e0f6f1,#ecfdf7);border:1px solid #b2e4d9;color:#0c6861;">
                    {{ computedEffectivePermissions().length }} active
                  </span>
                </div>
                <div class="mt-2 p-3 rounded-xl" style="background:#f5faf8;border:1px solid #d9ece8;min-height:3.5rem;">
                  @if (computedEffectivePermissions().length === 0) {
                    <div style="font-size:0.72rem;color:#96b8b4;font-style:italic;text-align:center;padding:0.5rem 0;">
                      No roles or permissions selected — user will have no access.
                    </div>
                  } @else {
                    <div class="flex flex-wrap gap-1.5">
                      @for (code of computedEffectivePermissions(); track code) {
                        <span class="mk-eff-chip">{{ code }}</span>
                      }
                    </div>
                  }
                </div>
              </div>

            </div>

            <!-- Footer -->
            <div class="mk-drawer-footer">
              <button type="button" (click)="showPermissionsModal.set(false)" class="mk-btn-cancel">Cancel</button>
              <button type="button" (click)="saveUserRoles()" class="mk-btn-primary">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
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
  private readonly navService = inject(NavigationService);
  private readonly authService = inject(AuthService);

  readonly userPermissions = signal<string[]>([]);
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
    roleIds: [],
    directPermissionIds: []
  };

  selectedUser: UserDto | null = null;
  selectedUserRoleIds: number[] = [];
  selectedUserDirectPermIds: number[] = [];

  ngOnInit(): void {
    this.permissionsService.getMyPermissions(true).subscribe({
      next: codes => this.userPermissions.set(codes || []),
      error: () => {}
    });
    this.loadUsers();
    this.loadRoles();
    this.loadPermissions();
  }

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRATOR');
  });

  canCreate = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('users.create');
  });

  canEdit = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('users.edit') || this.userPermissions().includes('users.delete');
  });

  activeUsersCount(): number {
    return this.users().filter(u => u.isActive).length;
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

  openCreateModal(): void {
    if (!this.canCreate()) return;
    this.createForm = { username: '', email: '', password: '', roleIds: [], directPermissionIds: [] };
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
    if (!this.canCreate() || !this.createForm.username || !this.createForm.email || !this.createForm.password) return;

    this.usersService.createUser(this.createForm).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.successMessage.set('User created successfully.');
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
    if (!this.canEdit()) return;
    this.selectedUser = user;
    this.selectedUserRoleIds = [...user.roleIds];
    this.selectedUserDirectPermIds = [...(user.directPermissionIds || [])];
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

  isEditDirectPermSelected(permId: number): boolean {
    return this.selectedUserDirectPermIds.includes(permId);
  }

  toggleEditDirectPermSelection(permId: number): void {
    if (this.selectedUserDirectPermIds.includes(permId)) {
      this.selectedUserDirectPermIds = this.selectedUserDirectPermIds.filter(id => id !== permId);
    } else {
      this.selectedUserDirectPermIds.push(permId);
    }
  }

  computedEffectivePermissions(): string[] {
    const roles = this.allRoles().filter(r => this.selectedUserRoleIds.includes(r.id));
    const isAdmin = roles.some(r => r.code.toUpperCase() === 'ADMIN');

    if (isAdmin) {
      return this.allPermissions().map(p => p.code);
    }

    const set = new Set<string>();

    for (const role of roles) {
      if (role.permissionIds) {
        for (const pId of role.permissionIds) {
          const perm = this.allPermissions().find(p => p.id === pId);
          if (perm) set.add(perm.code);
        }
      }
    }

    for (const pId of this.selectedUserDirectPermIds) {
      const perm = this.allPermissions().find(p => p.id === pId);
      if (perm) set.add(perm.code);
    }

    return Array.from(set);
  }

  saveUserRoles(): void {
    if (!this.canEdit() || !this.selectedUser) return;

    this.usersService.updateRoles(this.selectedUser.id, {
      roleIds: this.selectedUserRoleIds,
      directPermissionIds: this.selectedUserDirectPermIds
    }).subscribe({
      next: () => {
        this.showPermissionsModal.set(false);
        this.successMessage.set('User roles and direct permissions updated successfully.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadUsers();
        this.permissionsService.getMyPermissions(true).subscribe({ error: () => {} });
        this.navService.getNavigation(true).subscribe({ error: () => {} });
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Failed to update roles & permissions.');
        setTimeout(() => this.errorMessage.set(null), 3500);
      }
    });
  }

  toggleUserStatus(user: UserDto): void {
    if (!this.canEdit()) return;
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
