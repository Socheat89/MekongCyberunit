import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../login/auth.service';
import { TenantService } from '../tenancy/tenant.service';
import { PermissionsService } from '../services/permissions.service';
import { PermissionResponse } from '../models/role-permission.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 font-sans animate-fade-in">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-[22px] font-black tracking-tight" style="color:#173b3a;">Account &amp; Security</h1>
            <span class="mk-page-badge">Security Profile</span>
          </div>
          <p class="text-[12px] mt-1 font-medium" style="color:#6c8582;">
            Personal identity credentials, session policies, and authorized system permissions.
          </p>
        </div>
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold" style="background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46;">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Account Verified</span>
        </div>
      </div>

      <!-- Alert Banners -->
      @if (errorMessage()) {
        <div class="mk-alert-error animate-fade-in">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>
      }
      @if (successMessage()) {
        <div class="mk-alert-success animate-fade-in">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          <span>{{ successMessage() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Column: User Profile Card (4 cols) -->
        <div class="lg:col-span-4 space-y-5">
          <!-- Profile Card -->
          <div class="glass-panel rounded-2xl p-6 text-center space-y-4 shadow-sm" style="border-color:#dbe9e5;">
            <!-- Avatar with Glow Ring -->
            <div class="relative w-20 h-20 mx-auto">
              <div
                class="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-md"
                style="background: linear-gradient(145deg, #1ec4af, #0d766f); box-shadow: 0 8px 20px -6px rgba(13,118,111,0.5);"
              >
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <span
                class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style="background:#10b981; box-shadow:0 0 0 2px rgba(16,185,129,0.3);"
                title="Active Session"
              ></span>
            </div>

            <div>
              <h2 class="text-base font-extrabold tracking-tight" style="color:#173b3a;">
                {{ authService.currentUser()?.username || 'Stock Manager' }}
              </h2>
              <div class="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider" style="background:#e0f6f1; color:#0c6861; border:1px solid #b2e4d9;">
                <span class="w-1.5 h-1.5 rounded-full" style="background:#0f766e;"></span>
                {{ primaryRole() }}
              </div>
            </div>

            <!-- Identity Info List -->
            <div class="pt-3.5 border-t space-y-2.5 text-left text-xs font-medium" style="border-color:#e6f0ed;">
              <div class="flex justify-between items-center py-1">
                <span style="color:#6c8582;">Account ID</span>
                <span class="font-mono font-bold px-2 py-0.5 rounded" style="background:#f0faf7; color:#0f766e; border:1px solid #d5ede7;">
                  #{{ authService.currentUser()?.id || '1' }}
                </span>
              </div>

              <div class="flex justify-between items-center py-1">
                <span style="color:#6c8582;">Tenant Domain</span>
                <span class="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold" style="background:#f1f5f9; color:#334155; border:1px solid #e2e8f0;">
                  {{ tenantService.activeTenant() || 'default-tenant' }}
                </span>
              </div>

              <div class="flex justify-between items-center py-1">
                <span style="color:#6c8582;">Session Standard</span>
                <span class="font-bold flex items-center gap-1.5" style="color:#059669;">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  JWT Bearer
                </span>
              </div>

              <div class="flex justify-between items-center py-1">
                <span style="color:#6c8582;">Security Standard</span>
                <span class="font-semibold flex items-center gap-1" style="color:#173b3a;">
                  <svg class="w-3.5 h-3.5" style="color:#0f766e;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  Mekong Protected
                </span>
              </div>
            </div>
          </div>

          <!-- Security Health Card -->
          <div class="glass-panel rounded-2xl p-5 shadow-sm space-y-3" style="border-color:#dbe9e5;">
            <div class="flex items-center justify-between">
              <h3 class="text-[11px] font-black uppercase tracking-wider" style="color:#2d5652;">Security Health</h3>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded" style="background:#e8faf5; color:#0d766f;">3 Active</span>
            </div>
            <ul class="space-y-2 text-xs font-medium" style="color:#335c57;">
              <li class="flex items-center gap-2.5 p-2 rounded-xl" style="background:#f7fbf9; border:1px solid #e5f1ee;">
                <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background:#dcfce7; color:#15803d;">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span>Password hashing via BCrypt</span>
              </li>
              <li class="flex items-center gap-2.5 p-2 rounded-xl" style="background:#f7fbf9; border:1px solid #e5f1ee;">
                <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background:#dcfce7; color:#15803d;">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span>Tenant isolation guard enabled</span>
              </li>
              <li class="flex items-center gap-2.5 p-2 rounded-xl" style="background:#f7fbf9; border:1px solid #e5f1ee;">
                <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background:#dcfce7; color:#15803d;">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span>RFC 6238 TOTP engine ready</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right Column: Security Controls & RBAC (8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          <!-- Two-Factor Authentication Box -->
          <div class="glass-panel rounded-2xl p-6 shadow-sm space-y-4" style="border-color:#dbe9e5;">
            <div class="flex items-center justify-between border-b pb-3.5" style="border-color:#e6f0ed;">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white" style="background: linear-gradient(135deg, #1ab5a1, #0f766e); box-shadow: 0 4px 12px -3px rgba(15,118,110,0.45);">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-sm font-bold" style="color:#173b3a;">Two-Factor Authentication (TOTP)</h2>
                  <p class="text-xs font-medium" style="color:#6c8582;">High-assurance protection using time-based 6-digit TOTP codes</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono" style="background:#eaf8f4; color:#0c7067; border:1px solid #c2e9de;">
                RFC 6238
              </span>
            </div>

            <div class="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="background:#f6faf8; border:1px solid #dbeae5;">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="text-xs font-bold" style="color:#173b3a;">Authenticator Engine</span>
                </div>
                <p class="text-[11px] font-medium leading-relaxed" style="color:#6c8582;">
                  Enforce a second authentication layer upon login via Google Authenticator or 1Password.
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <a
                  routerLink="/2fa-setup"
                  class="mk-btn-primary"
                  style="font-size:0.75rem; padding:0.5rem 0.95rem;"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>Setup / Enable 2FA</span>
                </a>

                <button
                  type="button"
                  (click)="showDisableModal.set(true)"
                  class="mk-btn-cancel"
                  style="font-size:0.75rem; padding:0.5rem 0.9rem;"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          </div>

          <!-- Role-Based Access Control (RBAC) -->
          <div class="glass-panel rounded-2xl p-6 shadow-sm space-y-5" style="border-color:#dbe9e5;">
            <div class="flex items-center justify-between border-b pb-3.5" style="border-color:#e6f0ed;">
              <div>
                <h2 class="text-sm font-bold" style="color:#173b3a;">Role-Based Access Control (RBAC)</h2>
                <p class="text-xs font-medium" style="color:#6c8582;">Authorized roles and permission matrix for this account.</p>
              </div>
              <a
                routerLink="/users"
                class="inline-flex items-center gap-1 text-xs font-bold transition hover:underline"
                style="color:#0f766e;"
              >
                <span>Manage Staff &amp; Roles</span>
                <span class="text-sm">→</span>
              </a>
            </div>

            <!-- Assigned Roles -->
            <div>
              <h3 class="text-[11px] font-bold uppercase tracking-wider mb-2.5" style="color:#5a8278;">Your Assigned Roles</h3>
              <div class="flex flex-wrap gap-2">
                @for (role of authService.currentUser()?.roles; track role) {
                  <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold" style="background:#e0f6f1; color:#0c6861; border:1px solid #a8e0d4;">
                    <span class="w-2 h-2 rounded-full" style="background:#0f766e;"></span>
                    {{ role }}
                  </span>
                } @empty {
                  <span class="text-xs italic" style="color:#94a3b8;">No roles assigned to this account.</span>
                }
              </div>
            </div>

            <!-- Categorized Permissions by Module -->
            <div class="pt-3 border-t" style="border-color:#e6f0ed;">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-[11px] font-bold uppercase tracking-wider" style="color:#5a8278;">
                  Available Permissions by Module
                </h3>
                <span class="text-[11px] font-mono font-semibold" style="color:#0f766e;">
                  {{ permissions().length }} rules total
                </span>
              </div>

              <!-- Clean Grouped Module Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                @for (group of groupedPermissions(); track group.pageName) {
                  <div class="rounded-xl p-3 bg-white border transition hover:border-[#a0c8c0]" style="border-color:#dceee9; box-shadow:0 1px 3px rgba(12,70,66,0.03);">
                    <div class="flex items-center justify-between pb-2 mb-2 border-b" style="border-color:#f0f7f5;">
                      <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full" style="background:#1ab5a1;"></span>
                        <span class="text-xs font-bold" style="color:#173b3a;">{{ group.pageName }}</span>
                      </div>
                      <span class="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded" style="background:#f2faf7; color:#5a8278;">
                        {{ group.pageCode }}
                      </span>
                    </div>

                    <div class="flex flex-wrap gap-1.5">
                      @for (perm of group.permissions; track perm.id) {
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition font-mono"
                          [ngClass]="getActionBadgeClass(perm.action)"
                          [title]="perm.description || perm.code"
                        >
                          {{ perm.action | uppercase }}
                        </span>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="col-span-2 py-6 text-center text-xs italic" style="color:#94a3b8;">
                    Loading system permissions…
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disable 2FA Drawer -->
      @if (showDisableModal()) {
        <div (click)="showDisableModal.set(false)" class="mk-drawer-overlay">
          <div (click)="$event.stopPropagation()" class="mk-drawer">
            <div class="mk-drawer-head">
              <div class="flex items-center gap-3">
                <div class="mk-modal-head-icon" style="background: linear-gradient(135deg, #ef4444, #b91c1c); box-shadow: 0 4px 12px -4px rgba(220, 38, 38, 0.45);">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  <div class="mk-modal-title" style="color: #991b1b;">Disable Two-Factor Auth</div>
                  <div class="mk-modal-subtitle">Confirm identity with your 6-digit TOTP code</div>
                </div>
              </div>
              <button (click)="showDisableModal.set(false)" class="mk-close-btn">✕</button>
            </div>

            <div class="mk-drawer-body space-y-4">
              <p class="text-xs leading-relaxed" style="color:#4b5563;">
                To disable two-factor authentication, please enter the current 6-digit TOTP verification code from your authenticator app.
              </p>

              <div>
                <label class="mk-label"><span class="mk-label-dot" style="background:#ef4444;"></span> 6-Digit Authenticator Code</label>
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  [(ngModel)]="disableCode"
                  placeholder="123456"
                  class="mk-input text-center text-lg font-bold"
                  style="letter-spacing: 0.35em; font-family: var(--font-mono);"
                />
              </div>
            </div>

            <div class="mk-drawer-footer">
              <button
                type="button"
                (click)="showDisableModal.set(false)"
                class="mk-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="disableTwoFactor()"
                [disabled]="disableCode.length < 6 || isDisabling()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition disabled:opacity-50"
                style="background: linear-gradient(135deg, #ef4444, #b91c1c); box-shadow: 0 4px 12px -3px rgba(220,38,38,0.4);"
              >
                @if (isDisabling()) {
                  <span>Disabling…</span>
                } @else {
                  <span>Confirm Disable</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class Profile implements OnInit {
  readonly authService = inject(AuthService);
  readonly tenantService = inject(TenantService);
  private readonly permissionsService = inject(PermissionsService);

  readonly permissions = signal<PermissionResponse[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showDisableModal = signal<boolean>(false);
  readonly isDisabling = signal<boolean>(false);

  disableCode = '';

  readonly groupedPermissions = computed(() => {
    const list = this.permissions();
    const groups: { [key: string]: { pageName: string; pageCode: string; permissions: PermissionResponse[] } } = {};
    for (const p of list) {
      const pageKey = p.pageName || p.pageCode || 'General';
      if (!groups[pageKey]) {
        groups[pageKey] = {
          pageName: p.pageName || p.pageCode || 'General',
          pageCode: p.pageCode || '',
          permissions: []
        };
      }
      groups[pageKey].permissions.push(p);
    }
    return Object.values(groups);
  });

  ngOnInit(): void {
    this.permissionsService.getAll().subscribe({
      next: data => this.permissions.set(data || []),
      error: () => {}
    });
  }

  primaryRole(): string {
    const roles = this.authService.currentUser()?.roles;
    if (roles && roles.length > 0) {
      return roles[0];
    }
    return 'User';
  }

  getActionBadgeClass(action: string): string {
    const act = (action || '').toLowerCase();
    if (act.includes('view')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('create')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (act.includes('edit')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act.includes('delete')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  disableTwoFactor(): void {
    if (this.disableCode.length < 6) return;

    this.isDisabling.set(true);
    this.errorMessage.set(null);

    this.authService.disableTwoFactor({ twoFactorCode: this.disableCode }).subscribe({
      next: res => {
        this.isDisabling.set(false);
        this.showDisableModal.set(false);
        this.disableCode = '';
        this.successMessage.set(res.message || 'Two-Factor Authentication disabled successfully.');
        setTimeout(() => this.successMessage.set(null), 3500);
      },
      error: err => {
        this.isDisabling.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid confirmation code.');
        setTimeout(() => this.errorMessage.set(null), 3500);
      }
    });
  }
}
