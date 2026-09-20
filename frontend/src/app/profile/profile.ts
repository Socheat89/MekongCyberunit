import { Component, OnInit, inject, signal } from '@angular/core';
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
    <div class="max-w-5xl mx-auto space-y-6 font-sans animate-fade-in">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900">Account & Security</h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Manage your personal profile, authentication credentials, security policies, and access roles.
          </p>
        </div>
        <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Account Verified</span>
        </div>
      </div>

      <!-- Alert Banners -->
      @if (errorMessage()) {
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5 animate-fade-in">
          <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="font-medium">{{ errorMessage() }}</span>
        </div>
      }
      @if (successMessage()) {
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2.5 animate-fade-in">
          <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span class="font-bold">{{ successMessage() }}</span>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column: User Profile Card with User Icon -->
        <div class="md:col-span-1 space-y-6">
          <div class="glass-panel rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-xs">
            <!-- SVG User Icon (Requested Feature) -->
            <div class="w-24 h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-sm relative group">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span class="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300"></span>
            </div>

            <div>
              <h2 class="text-lg font-black text-slate-900 font-sans">
                {{ authService.currentUser()?.username || 'Stock Manager' }}
              </h2>
              <div class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
                {{ primaryRole() }}
              </div>
            </div>

            <!-- Identity Info List -->
            <div class="pt-4 border-t border-slate-100 space-y-3 text-left text-xs font-medium">
              <div class="flex justify-between items-center py-1">
                <span class="text-slate-500">Account ID:</span>
                <span class="text-slate-800 font-mono font-bold">#{{ authService.currentUser()?.id || '1' }}</span>
              </div>

              <div class="flex justify-between items-center py-1">
                <span class="text-slate-500">Tenant Domain:</span>
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                  {{ tenantService.activeTenant() || 'Default' }}
                </span>
              </div>

              <div class="flex justify-between items-center py-1">
                <span class="text-slate-500">Session Type:</span>
                <span class="text-emerald-600 font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  JWT Bearer
                </span>
              </div>

              <div class="flex justify-between items-center py-1">
                <span class="text-slate-500">Security Standard:</span>
                <span class="text-slate-700 font-semibold">Mekong protected</span>
              </div>
            </div>
          </div>

          <!-- Quick Security Checklist -->
          <div class="glass-panel rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">Security Health</h3>
            <ul class="space-y-2 text-xs text-slate-600 font-medium">
              <li class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Password hashing via BCrypt</span>
              </li>
              <li class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Tenant isolation guard enabled</span>
              </li>
              <li class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>RFC 6238 TOTP engine ready</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right Column: Security & Authentication Controls -->
        <div class="md:col-span-2 space-y-6">
          <!-- Two-Factor Authentication Box -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900 font-sans">Two-Factor Authentication (TOTP)</h2>
                  <p class="text-xs text-slate-500 font-medium">Add high-assurance security protection to your account using 6-digit TOTP</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                RFC 6238
              </span>
            </div>

            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="text-xs font-bold text-slate-800">Two-Factor Authentication Engine</span>
                </div>
                <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Protect against unauthorized logins by requiring a time-based verification code.
                </p>
              </div>

              <div class="flex items-center space-x-2 shrink-0">
                <a
                  routerLink="/2fa-setup"
                  class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition inline-flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>Setup / Enable 2FA</span>
                </a>

                <button
                  type="button"
                  (click)="showDisableModal.set(true)"
                  class="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold border border-slate-200 hover:border-rose-200 transition shadow-xs"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          </div>

          <!-- Assigned Roles & Granted Permissions Card -->
          <div class="glass-panel rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 class="text-base font-bold text-slate-900 font-sans">Role-Based Access Control (RBAC)</h2>
                <p class="text-xs text-slate-500 font-medium">Your authorized system roles and permissions.</p>
              </div>
              <a
                routerLink="/users"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                Manage Staff & Roles →
              </a>
            </div>

            <!-- Assigned Roles -->
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Assigned Roles</h3>
              <div class="flex flex-wrap gap-2">
                @for (role of authService.currentUser()?.roles; track role) {
                  <span class="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                    {{ role }}
                  </span>
                } @empty {
                  <span class="text-xs text-slate-400 italic">No roles assigned to this account.</span>
                }
              </div>
            </div>

            <!-- Active Permissions Preview -->
            <div class="space-y-2 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Available System Permissions</h3>
                <span class="text-[11px] text-slate-400 font-mono">{{ permissions().length }} total</span>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-44 overflow-y-auto space-y-1">
                <div class="flex flex-wrap gap-1.5">
                  @for (perm of permissions(); track perm.id) {
                    <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-700">
                      {{ perm.code }}
                    </span>
                  } @empty {
                    <span class="text-xs text-slate-400 italic">Loading permissions...</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disable 2FA Modal -->
      @if (showDisableModal()) {
        <div (click)="showDisableModal.set(false)" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div (click)="$event.stopPropagation()" class="modal-card w-full max-w-md p-6  space-y-4">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 class="text-base font-bold text-rose-700 font-sans">Disable Two-Factor Authentication</h2>
              <button (click)="showDisableModal.set(false)" class="text-slate-400 hover:text-slate-700 transition">✕</button>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-medium">
              To disable two-factor authentication, please enter the current 6-digit TOTP code from your authenticator app to verify identity.
            </p>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">6-Digit Authenticator Code</label>
              <input
                type="text"
                inputmode="numeric"
                maxlength="6"
                [(ngModel)]="disableCode"
                placeholder="123456"
                class="glass-input w-full text-center tracking-[0.3em] font-mono text-xl py-2.5 rounded-xl font-bold"
              />
            </div>

            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                (click)="showDisableModal.set(false)"
                class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="disableTwoFactor()"
                [disabled]="disableCode.length < 6 || isDisabling()"
                class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Disable
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
