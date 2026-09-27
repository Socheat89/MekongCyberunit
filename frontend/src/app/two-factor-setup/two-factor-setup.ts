import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../login/auth.service';
import { TwoFactorSetupResponse } from '../models/auth.models';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mekong-auth min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">

      <!-- Ambient Floating Orbs -->
      <div class="mekong-auth-orb mekong-auth-orb--1" aria-hidden="true"></div>
      <div class="mekong-auth-orb mekong-auth-orb--2" aria-hidden="true"></div>
      <div class="mekong-auth-orb mekong-auth-orb--3" aria-hidden="true"></div>

      <!-- Subtle background radial grid -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: radial-gradient(rgba(26, 181, 161, 0.08) 1px, transparent 1px); background-size: 32px 32px;" aria-hidden="true"></div>

      <div class="w-full max-w-lg relative z-10 animate-fade-in">

        <!-- Brand & Page Header -->
        <div class="text-center mb-7">
          <div class="inline-flex flex-col items-center gap-3">
            <div
              class="animate-logo-entrance inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white"
              style="background: linear-gradient(145deg, #1ec4af, #0a6860); box-shadow: 0 12px 32px -8px rgba(15,118,110,0.7), 0 0 0 1px rgba(30,196,175,0.3), inset 0 1px 0 rgba(255,255,255,0.18);"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.099.99-4.328.99-6.632a13.95 13.95 0 00-2.17-7.484M3.05 11c0-1.664.303-3.257.86-4.725M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-black tracking-tight" style="color: #e8fefb; letter-spacing: -0.03em;">
                Two-Factor <span style="color: #3de8d4;">Setup</span>
              </h1>
              <p class="text-xs font-medium mt-1" style="color: rgba(168,197,193,0.75);">
                Link your authenticator app (Google Authenticator / 1Password) to secure your account.
              </p>
            </div>
          </div>
        </div>

        <!-- Glass Container -->
        <div class="mekong-auth-card p-7 sm:p-8 space-y-6">

          <!-- Alert Banners -->
          @if (errorMessage()) {
            <div class="p-3.5 rounded-2xl flex items-start gap-3 animate-fade-in"
              style="background: rgba(220,38,38,0.14); border: 1px solid rgba(220,38,38,0.28); color: #fca5a5;">
              <svg class="w-4 h-4 shrink-0 mt-0.5" style="color: #f87171;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span class="text-xs leading-relaxed font-semibold">{{ errorMessage() }}</span>
            </div>
          }

          @if (successMessage()) {
            <div class="p-3.5 rounded-2xl flex items-center gap-3 animate-fade-in"
              style="background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.28); color: #6ee7b7;">
              <svg class="w-4 h-4 shrink-0" style="color: #34d399;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-xs leading-relaxed font-bold">{{ successMessage() }}</span>
            </div>
          }

          @if (isLoading()) {
            <div class="py-14 flex flex-col items-center justify-center space-y-3">
              <svg class="animate-spin w-8 h-8" style="color: #3de8d4;" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-xs font-semibold" style="color: rgba(168,197,193,0.7);">Generating encrypted 2FA key...</span>
            </div>
          } @else if (setupData()) {
            <div class="space-y-6">

              <!-- Step 1 Box: Scan QR Code -->
              <div class="p-4 rounded-2xl space-y-3" style="background: rgba(12,45,41,0.55); border: 1px solid rgba(30,196,175,0.25);">
                <div class="flex items-center gap-2 mb-1">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
                    style="background: #3de8d4; color: #0a3d37;">1</span>
                  <span class="text-xs font-bold uppercase tracking-wider" style="color: #3de8d4;">Scan QR Code</span>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-4">
                  <div class="p-2 bg-white rounded-2xl shrink-0 shadow-lg" style="box-shadow: 0 0 20px rgba(30,196,175,0.2);">
                    <img
                      [src]="setupData()?.qrCodeDataUrl"
                      alt="Two-factor QR Code"
                      class="w-32 h-32 object-contain rounded-xl"
                    />
                  </div>

                  <div class="flex-1 space-y-1.5 text-center sm:text-left">
                    <h3 class="text-sm font-bold" style="color: #e8fefb;">Authenticator App</h3>
                    <p class="text-xs leading-relaxed" style="color: rgba(168,197,193,0.75);">
                      Open Google Authenticator, Microsoft Authenticator, or 1Password and scan this QR code.
                    </p>
                  </div>
                </div>

                <!-- Copyable Secret Input -->
                <div class="pt-3 border-t" style="border-color: rgba(30,196,175,0.15);">
                  <label class="block text-[11px] font-bold mb-1.5" style="color: rgba(168,197,193,0.85);">
                    Or enter secret key manually:
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      readonly
                      [value]="setupData()?.secret"
                      class="mekong-auth-input flex-1 px-3 py-2 rounded-xl font-mono text-xs tracking-wider font-bold select-all"
                      style="color: #3de8d4;"
                    />
                    <button
                      type="button"
                      (click)="copySecret()"
                      class="px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0"
                      style="background: rgba(30,196,175,0.18); border: 1px solid rgba(30,196,175,0.35); color: #3de8d4;"
                    >
                      {{ copied() ? '✓ Copied' : 'Copy Key' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Step 2: Confirmation Code Form -->
              <form (ngSubmit)="enableTwoFactor()" class="space-y-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
                      style="background: #3de8d4; color: #0a3d37;">2</span>
                    <label for="code" class="text-xs font-bold uppercase tracking-wider" style="color: #3de8d4;">
                      Enter 6-Digit Confirmation Code
                    </label>
                  </div>

                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    required
                    [(ngModel)]="verificationCode"
                    (ngModelChange)="onCodeChange($event)"
                    placeholder="000 000"
                    class="mekong-auth-input w-full text-center tracking-[0.5em] font-mono text-2xl py-3.5 rounded-2xl font-black"
                  />
                </div>

                <div class="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    [disabled]="isSubmitting() || verificationCode.length < 6"
                    class="mekong-auth-btn flex-1"
                  >
                    @if (isSubmitting()) {
                      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Activating 2FA…</span>
                    } @else {
                      <span>Activate &amp; Finish</span>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                  </button>

                  <a
                    routerLink="/profile"
                    class="px-4 py-3 rounded-xl text-xs font-bold transition-colors text-center"
                    style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(168,197,193,0.8);"
                  >
                    Back to Profile
                  </a>
                </div>
              </form>
            </div>
          }
        </div>

        <p class="mt-6 text-center text-xs font-semibold" style="color: rgba(130,165,160,0.45); letter-spacing: 0.04em;">
          Mekong Stock · Authenticator Protection
        </p>
      </div>
    </div>
  `
})
export class TwoFactorSetup implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly setupData = signal<TwoFactorSetupResponse | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly copied = signal<boolean>(false);

  verificationCode = '';

  ngOnInit(): void {
    this.authService.setupTwoFactor().subscribe({
      next: res => {
        this.setupData.set(res);
        this.isLoading.set(false);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to initialize 2FA setup. Please try again.');
      }
    });
  }

  copySecret(): void {
    const secret = this.setupData()?.secret;
    if (secret && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(secret);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  onCodeChange(val: string): void {
    const cleanCode = (val || '').replace(/\D/g, '');
    if (cleanCode.length === 6 && !this.isSubmitting()) {
      this.verificationCode = cleanCode;
      this.enableTwoFactor();
    }
  }

  enableTwoFactor(): void {
    if (this.verificationCode.length < 6) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.enableTwoFactor({ twoFactorCode: this.verificationCode }).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        this.successMessage.set(res.message || 'Two-Factor Authentication successfully enabled!');
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 1200);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid verification code. Please check your authenticator and try again.');
      }
    });
  }
}
