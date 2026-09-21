import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../services/permissions.service';
import { AuthService } from '../login/auth.service';
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
          <div class="flex items-center gap-2.5">
            <h1 class="text-[22px] font-black tracking-tight" style="color:#173b3a;">System Permissions</h1>
            <span class="mk-page-badge">Settings / Permissions</span>
          </div>
          <p class="text-[12px] mt-1 font-medium" style="color:#6c8582;">
            Fine-grained action-level authorization rules mapped to application pages.
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
            <span>Create Permission</span>
          </button>
        }
      </div>

      <!-- Search & Controls Bar -->
      <div class="glass-panel rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3" style="border-color:#d5e8e3;">
        <div class="relative w-full sm:w-72">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style="color:#96b8b4;">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search code, page, or action…"
            class="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-[12.5px] font-medium"
          />
        </div>

        <div class="text-[11.5px] font-medium" style="color:#7aa49e;">
          Total Rules: <span class="font-bold font-mono" style="color:#2d5652;">{{ filteredPermissions().length }}</span>
        </div>
      </div>

      <!-- Alert Banners -->
      @if (errorMessage()) {
        <div class="mk-alert-error">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>
      }
      @if (successMessage()) {
        <div class="mk-alert-success">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ successMessage() }}</span>
        </div>
      }

      <!-- Permissions Table -->
      <div class="overflow-hidden" style="background:white; border:1px solid #d9ece8; border-radius:1rem; box-shadow:0 4px 20px -10px rgba(12,70,66,0.14);">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead style="background:#f5faf8; border-bottom:1px solid #e4eeeb;">
              <tr>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">ID</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Permission Code</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Assigned Page</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Action</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Description</th>
                <th class="px-5 py-3.5 text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Status</th>
                @if (canEdit()) {
                  <th class="px-5 py-3.5 text-right text-[10.5px] font-black uppercase tracking-[0.09em]" style="color:#6f8e8a;">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (perm of filteredPermissions(); track perm.id) {
                <tr style="border-bottom:1px solid #edf3f0; transition:background 0.12s ease;" class="hover:bg-[#f6fbf9]">
                  <td class="px-5 py-3.5 font-mono text-[11px]" style="color:#96b8b4;">#{{ perm.id }}</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold font-mono"
                      style="background:linear-gradient(135deg,#e0f6f1,#ecfcf7); border:1px solid #b2e4d9; color:#0c6861;">
                      {{ perm.code }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold"
                      style="background:#f2f7f5; border:1px solid #d5e8e3; color:#2d5652;">
                      {{ perm.pageName }} ({{ perm.pageCode }})
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span
                      [style.background]="perm.action.toLowerCase()==='view' ? 'linear-gradient(135deg,#e8f5e9,#f1fbf2)' :
                                          perm.action.toLowerCase()==='create' ? 'linear-gradient(135deg,#e3f2fd,#eef8ff)' :
                                          perm.action.toLowerCase()==='edit' || perm.action.toLowerCase()==='update' ? 'linear-gradient(135deg,#fffde7,#fffff4)' :
                                          'linear-gradient(135deg,#fce4ec,#fff0f5)'"
                      [style.border-color]="perm.action.toLowerCase()==='view' ? '#a5d6a7' :
                                            perm.action.toLowerCase()==='create' ? '#90caf9' :
                                            perm.action.toLowerCase()==='edit' || perm.action.toLowerCase()==='update' ? '#fff176' :
                                            '#f48fb1'"
                      [style.color]="perm.action.toLowerCase()==='view' ? '#2e7d32' :
                                     perm.action.toLowerCase()==='create' ? '#1565c0' :
                                     perm.action.toLowerCase()==='edit' || perm.action.toLowerCase()==='update' ? '#f57f17' :
                                     '#c62828'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase border"
                    >
                      {{ perm.action }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-[12px]" style="color:#7aa49e;">{{ perm.description || '—' }}</td>
                  <td class="px-5 py-3.5">
                    @if (perm.isActive) {
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
                        (click)="openEditModal(perm)"
                        class="px-2.5 py-1 rounded-lg text-[11.5px] font-bold transition hover:scale-[1.03]"
                        style="background:linear-gradient(135deg,#e2f5f0,#ecfaf7); border:1px solid #b8e2d8; color:#0c6861;"
                      >
                        Edit
                      </button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="canEdit() ? 7 : 6" class="px-5 py-14 text-center text-[12.5px]" style="color:#96b8b4;">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                      </svg>
                      No permissions found matching criteria.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Permission Drawer -->
      @if (showCreateModal() && canCreate()) {
        <div (click)="showCreateModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">Create Permission</div>
                  <div class="mk-modal-subtitle">Define a new authorization rule</div>
                </div>
              </div>
              <button (click)="showCreateModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Target Application Page</label>
                <select [(ngModel)]="createForm.pageId" class="mk-select">
                  <option [ngValue]="1">1: Dashboard (dashboard)</option>
                  <option [ngValue]="2">2: Users &amp; Permissions (users)</option>
                  <option [ngValue]="3">3: Units of Measure (units)</option>
                  <option [ngValue]="4">4: System Roles (roles)</option>
                  <option [ngValue]="5">5: System Permissions (permissions)</option>
                  <option [ngValue]="6">6: Settings (settings)</option>
                </select>
              </div>

              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Action Code</label>
                <select [(ngModel)]="createForm.action" class="mk-select" style="font-family:var(--font-mono);">
                  <option value="view">view (Read Access)</option>
                  <option value="create">create (Creation Access)</option>
                  <option value="edit">edit (Modification Access)</option>
                  <option value="delete">delete (Deletion / Disable Access)</option>
                </select>
              </div>

              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Description <span style="font-weight:400;color:#96b8b4;">(optional)</span></label>
                <textarea
                  [(ngModel)]="createForm.description"
                  rows="3"
                  placeholder="Description of what this rule permits…"
                  class="mk-input mk-input--textarea"
                ></textarea>
              </div>
            </div>

            <div class="mk-drawer-footer">
              <button type="button" (click)="showCreateModal.set(false)" class="mk-btn-cancel">Cancel</button>
              <button
                type="button"
                (click)="saveNewPermission()"
                [disabled]="!createForm.pageId || !createForm.action"
                class="mk-btn-primary"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Create Permission
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Edit Permission Drawer -->
      @if (showEditModal() && canEdit()) {
        <div (click)="showEditModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title">Edit Permission</div>
                  <div class="mk-modal-subtitle">
                    <span style="font-family:var(--font-mono);color:#0f766e;">{{ editingPermission?.code }}</span>
                  </div>
                </div>
              </div>
              <button (click)="showEditModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <div>
                <label class="mk-label"><span class="mk-label-dot"></span> Description</label>
                <textarea
                  [(ngModel)]="editForm.description"
                  rows="3"
                  class="mk-input mk-input--textarea"
                  placeholder="Describe what this permission allows…"
                ></textarea>
              </div>

              <label class="mk-toggle-row cursor-pointer" style="display:flex;">
                <input
                  type="checkbox"
                  id="isActivePerm"
                  [(ngModel)]="editForm.isActive"
                  class="mk-checkbox"
                  style="flex-shrink:0;"
                />
                <div>
                  <div class="mk-toggle-label">Permission is Active</div>
                  <div class="mk-toggle-hint">Inactive permissions are excluded from access checks</div>
                </div>
              </label>
            </div>

            <div class="mk-drawer-footer">
              <button type="button" (click)="showEditModal.set(false)" class="mk-btn-cancel">Cancel</button>
              <button type="button" (click)="saveEditPermission()" class="mk-btn-primary">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Update Permission
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
  private readonly authService = inject(AuthService);

  readonly userPermissions = signal<string[]>([]);
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
    this.permissionsService.getMyPermissions(true).subscribe({
      next: codes => this.userPermissions.set(codes || []),
      error: () => {}
    });
    this.loadPermissions();
  }

  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRATOR');
  });

  canCreate = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('permissions.create');
  });

  canEdit = computed(() => {
    return this.isAdmin() || this.userPermissions().includes('permissions.edit');
  });

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
    if (!this.canCreate()) return;
    this.createForm = { pageId: 1, action: 'view', description: '' };
    this.showCreateModal.set(true);
  }

  saveNewPermission(): void {
    if (!this.canCreate()) return;
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
    if (!this.canEdit()) return;
    this.editingPermission = perm;
    this.editForm = {
      description: perm.description || '',
      isActive: perm.isActive
    };
    this.showEditModal.set(true);
  }

  saveEditPermission(): void {
    if (!this.canEdit() || !this.editingPermission) return;

    this.permissionsService.update(this.editingPermission.id, this.editForm).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.successMessage.set('Permission updated successfully.');
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
