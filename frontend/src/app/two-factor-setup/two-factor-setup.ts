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
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <!-- Background subtle decoration -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl pointer-events-none opacity-60"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl pointer-events-none opacity-60"></div>

      <div class="w-full max-w-lg relative z-10 animate-fade-in">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-3">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900">
            Two-Factor Authentication Setup
          </h1>
          <p class="text-xs text-slate-500 mt-1 font-medium max-w-sm mx-auto">
            Enhance your Mekong Stock account security using an RFC 6238 TOTP Authenticator app.
          </p>
        </div>

        <!-- White Card -->
        <div class="glass-panel rounded-3xl p-7 sm:p-8 shadow-sm space-y-6 border border-slate-200">
          <!-- Alert Banners -->
          @if (errorMessage()) {
            <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fade-in">
              <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="font-medium">{{ errorMessage() }}</span>
            </div>
          }

          @if (successMessage()) {
            <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 animate-fade-in">
              <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span class="font-bold">{{ successMessage() }}</span>
            </div>
          }

          @if (isLoading()) {
            <div class="py-14 flex flex-col items-center justify-center space-y-3">
              <svg class="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-xs text-slate-500 font-medium">Generating encrypted 2FA key...</span>
            </div>
          } @else if (setupData()) {
            <div class="space-y-5">
              <!-- Step 1 Container -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div class="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200">
                  <img
                    [src]="setupData()?.qrCodeDataUrl"
                    alt="Two-factor QR Code"
                    class="w-32 h-32 object-contain"
                  />
                </div>

                <div class="flex-1 space-y-1 text-center sm:text-left">
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Step 1: Scan QR Code
                  </span>
                  <h3 class="text-sm font-bold text-slate-900">Authenticator App</h3>
                  <p class="text-xs text-slate-500 leading-relaxed font-medium">
                    Open Google Authenticator, Microsoft Authenticator, or 1Password and scan the QR code.
                  </p>
                </div>
              </div>

              <!-- Copyable Secret Input -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Or enter secret key manually:
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    type="text"
                    readonly
                    [value]="setupData()?.secret"
                    class="glass-input flex-1 px-3 py-2 rounded-xl font-mono text-xs text-indigo-700 tracking-wider font-bold select-all"
                  />
                  <button
                    type="button"
                    (click)="copySecret()"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
                  >
                    {{ copied() ? '✓ Copied' : 'Copy' }}
                  </button>
                </div>
              </div>

              <!-- Step 2: Confirmation Form -->
              <form (ngSubmit)="enableTwoFactor()" class="pt-3 border-t border-slate-200 space-y-4">
                <div>
                  <label for="code" class="block text-xs font-bold text-slate-700 mb-1">
                    Step 2: Enter 6-digit confirmation code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    required
                    [(ngModel)]="verificationCode"
                    placeholder="000000"
                    class="glass-input w-full text-center tracking-[0.4em] font-mono text-2xl py-2.5 rounded-xl font-black placeholder-slate-300"
                  />
                </div>

                <div class="flex items-center space-x-3 pt-1">
                  <button
                    type="submit"
                    [disabled]="isSubmitting() || verificationCode.length < 6"
                    class="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    @if (isSubmitting()) {
                      <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Activating 2FA...</span>
                    } @else {
                      <span>Activate & Finish</span>
                    }
                  </button>

                  <a
                    routerLink="/profile"
                    class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 text-center"
                  >
                    Back to Profile
                  </a>
                </div>
              </form>
            </div>
          }
        </div>
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
