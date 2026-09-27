import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mekong-auth min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans">

      <!-- Floating Background Orbs -->
      <div class="mekong-auth-orb mekong-auth-orb--1" aria-hidden="true"></div>
      <div class="mekong-auth-orb mekong-auth-orb--2" aria-hidden="true"></div>
      <div class="mekong-auth-orb mekong-auth-orb--3" aria-hidden="true"></div>

      <!-- Grid dots overlay -->
      <div class="absolute inset-0 pointer-events-none" style="background-image: radial-gradient(rgba(26, 181, 161, 0.08) 1px, transparent 1px); background-size: 32px 32px;" aria-hidden="true"></div>

      <div class="w-full max-w-[420px] relative z-10">

        <!-- Brand Header -->
        <div class="text-center mb-7 animate-fade-in-up" style="animation-delay: 0ms;">
          <div class="inline-flex flex-col items-center gap-3">
            <!-- Logo mark -->
            <div
              class="animate-logo-entrance inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white"
              style="background: linear-gradient(145deg, #1ec4af, #0a6860); box-shadow: 0 12px 32px -8px rgba(15,118,110,0.7), 0 0 0 1px rgba(30,196,175,0.3), inset 0 1px 0 rgba(255,255,255,0.18);"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <div class="animate-fade-in-up" style="animation-delay: 100ms;">
              <h1 class="text-2xl font-black tracking-tight" style="color: #e8fefb; letter-spacing: -0.04em;">
                Mekong <span style="color: #3de8d4;">Stock</span>
              </h1>
              <p class="text-xs font-semibold mt-1" style="color: rgba(168,197,193,0.7); letter-spacing: 0.06em; text-transform: uppercase;">
                Inventory Command Centre
              </p>
            </div>
          </div>
        </div>

        <!-- Glass Auth Card -->
        <div class="mekong-auth-card p-7 sm:p-8">

          <!-- Error Banner -->
          @if (errorMessage()) {
            <div class="mb-5 p-3.5 rounded-2xl flex items-start gap-3 animate-fade-in"
              style="background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.25); color: #fca5a5;">
              <svg class="w-4 h-4 shrink-0 mt-0.5" style="color: #f87171;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div class="flex-1 text-xs leading-relaxed">
                <div class="font-bold" style="color: #fca5a5;">{{ errorMessage() }}</div>
                @if (lockoutTimer() > 0) {
                  <div class="mt-1 font-mono font-medium" style="color: rgba(252,165,165,0.8);">
                    Retry in: <span class="font-black underline">{{ formattedLockoutTimer() }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- ── PHASE 1: Username & Password ── -->
          @if (!requiresTwoFactor()) {
            <form (ngSubmit)="signIn()" class="space-y-5 animate-fade-in">

              <!-- Username -->
              <div>
                <label for="username" class="mekong-auth-label block">
                  Associate ID / Username
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: rgba(110,160,155,0.7);">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    [(ngModel)]="credentials.username"
                    placeholder="e.g. admin"
                    class="mekong-auth-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="mekong-auth-label block">
                  Password
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: rgba(110,160,155,0.7);">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    required
                    [(ngModel)]="credentials.password"
                    placeholder="••••••••••••"
                    class="mekong-auth-input w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium"
                  />
                  <button
                    type="button"
                    (click)="showPassword.update(v => !v)"
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                    style="color: rgba(110,160,155,0.65);"
                    title="Toggle password visibility"
                  >
                    @if (showPassword()) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <!-- Quick Demo + Register link -->
              <div class="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  (click)="fillDemoAdmin()"
                  class="mekong-demo-pill"
                  title="Fill Admin Credentials"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Fill Demo Admin</span>
                </button>
                <a
                  routerLink="/register"
                  class="text-xs font-bold transition-colors"
                  style="color: rgba(100,210,195,0.8);"
                >
                  Create account →
                </a>
              </div>

              <!-- Submit Button -->
              <button
                id="login-submit"
                type="submit"
                [disabled]="isLoading() || lockoutTimer() > 0"
                class="mekong-auth-btn mt-2"
              >
                @if (isLoading()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating…</span>
                } @else {
                  <span>Sign In</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- ── PHASE 2: Two-Factor Setup or Verification ── -->
          @if (requiresTwoFactor()) {
            <form (ngSubmit)="verifyTwoFactor()" class="space-y-5 animate-fade-in">
              <div class="text-center mb-4">
                <div class="inline-flex p-3.5 rounded-2xl mb-2.5"
                  style="background: rgba(26,181,161,0.12); border: 1px solid rgba(26,181,161,0.22);">
                  <svg class="w-7 h-7" style="color: #3de8d4;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.099.99-4.328.99-6.632a13.95 13.95 0 00-2.17-7.484M3.05 11c0-1.664.303-3.257.86-4.725M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                </div>
                <h2 class="text-lg font-black" style="color: #e8fefb; letter-spacing: -0.025em;">
                  {{ requiresSetup() ? 'Setup Two-Factor Authentication' : 'Two-Factor Verification' }}
                </h2>
                <p class="text-xs mt-1.5" style="color: rgba(168,197,193,0.75);">
                  {{ requiresSetup() ? 'Scan the QR code with your Authenticator app, then enter the 6-digit confirmation code.' : 'Enter the 6-digit TOTP code from your authenticator app.' }}
                </p>
              </div>

              <!-- Setup 2FA Container (Step 1: QR Code & Secret Key) -->
              @if (requiresSetup()) {
                <div class="p-4 rounded-2xl space-y-3" style="background: rgba(15,35,32,0.6); border: 1px solid rgba(30,196,175,0.25);">
                  <div class="flex items-center gap-3">
                    @if (qrCodeDataUrl()) {
                      <div class="p-1.5 bg-white rounded-xl shrink-0">
                        <img [src]="qrCodeDataUrl()" alt="2FA QR Code" class="w-24 h-24 object-contain" />
                      </div>
                    }
                    <div class="flex-1 min-w-0 text-xs leading-relaxed">
                      <div class="font-bold text-teal-300">1. Scan QR Code</div>
                      <div style="color: rgba(168,197,193,0.7);" class="text-[11px] mt-0.5">
                        Use Google Authenticator or 1Password to scan this QR code.
                      </div>
                    </div>
                  </div>

                  @if (secretKey()) {
                    <div class="pt-2 border-t border-teal-900/50">
                      <div class="text-[11px] font-bold text-teal-200/80 mb-1">Or enter Secret Key manually:</div>
                      <div class="flex items-center gap-1.5">
                        <input
                          type="text"
                          readonly
                          [value]="secretKey()"
                          class="mekong-auth-input py-1.5 px-2.5 text-xs font-mono font-bold tracking-wider text-teal-300 flex-1 select-all"
                        />
                        <button
                          type="button"
                          (click)="copySecret()"
                          class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          style="background: rgba(30,196,175,0.2); border: 1px solid rgba(30,196,175,0.35); color: #3de8d4;"
                        >
                          {{ copiedSecret() ? '✓ Copied' : 'Copy' }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Verification Code Input -->
              <div>
                <label for="twoFactorCode" class="mekong-auth-label block text-center">
                  {{ requiresSetup() ? 'Step 2: Enter 6-digit Code' : 'Verification Code' }}
                </label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  required
                  [(ngModel)]="twoFactorCode"
                  (ngModelChange)="onTwoFactorCodeChange($event)"
                  placeholder="000 000"
                  autofocus
                  class="mekong-auth-input w-full text-center tracking-[0.5em] font-mono text-2xl py-3.5 rounded-2xl font-black"
                />
              </div>

              <div class="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  (click)="cancelTwoFactor()"
                  class="font-semibold transition-colors"
                  style="color: rgba(140,190,185,0.7);"
                >
                  ← Back to login
                </button>
              </div>

              <button
                id="twofa-submit"
                type="submit"
                [disabled]="isLoading() || twoFactorCode.length < 6"
                class="mekong-auth-btn mt-1"
              >
                @if (isLoading()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ requiresSetup() ? 'Activating 2FA…' : 'Verifying…' }}</span>
                } @else {
                  <span>{{ requiresSetup() ? 'Activate 2FA & Finish' : 'Confirm & Sign In' }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
              </button>
            </form>
          }
        </div>

        <!-- Footer note -->
        <p class="mt-6 text-center text-xs font-semibold animate-fade-in" style="color: rgba(130,165,160,0.45); animation-delay: 300ms; letter-spacing: 0.04em;">
          Mekong Stock · Protected workspace · © {{ year }}
        </p>
      </div>
    </div>
  `
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly year = new Date().getFullYear();

  readonly credentials = {
    username: '',
    password: ''
  };

  readonly showPassword = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly requiresTwoFactor = signal<boolean>(false);
  readonly requiresSetup = signal<boolean>(false);
  readonly qrCodeDataUrl = signal<string | null>(null);
  readonly secretKey = signal<string | null>(null);
  readonly copiedSecret = signal<boolean>(false);
  readonly lockoutTimer = signal<number>(0);

  challengeToken = '';
  twoFactorCode = '';

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason === 'disabled') {
      this.errorMessage.set('គណនីរបស់អ្នកត្រូវបានផ្អាក (Account has been disabled). Please contact your system administrator.');
    }
  }

  fillDemoAdmin(): void {
    this.credentials.username = 'admin';
    this.credentials.password = 'Password123!';
  }

  copySecret(): void {
    const s = this.secretKey();
    if (s && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(s);
      this.copiedSecret.set(true);
      setTimeout(() => this.copiedSecret.set(false), 2000);
    }
  }

  signIn(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage.set('Please enter both username and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.credentials).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.requiresTwoFactor) {
          this.challengeToken = res.challengeToken || '';
          this.requiresSetup.set(!!res.requiresSetup);
          this.qrCodeDataUrl.set(res.qrCodeDataUrl || null);
          this.secretKey.set(res.secret || null);
          this.requiresTwoFactor.set(true);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: err => {
        this.isLoading.set(false);
        if (err.status === 0) {
          this.errorMessage.set('Cannot connect to the Mekong Stock server. Please make sure the backend is running.');
        } else if (err.status === 423) {
          const msg = err.error?.message || 'Account is locked for 30 minutes due to 5 failed login attempts.';
          this.errorMessage.set(msg);
          let seconds = 30 * 60;
          if (err.error?.lockoutEndUtc) {
            const diff = Math.ceil((new Date(err.error.lockoutEndUtc).getTime() - Date.now()) / 1000);
            if (diff > 0) seconds = diff;
          }
          this.startLockoutCountdown(seconds);
        } else {
          this.errorMessage.set(err.error?.message || 'Invalid username or password.');
        }
      }
    });
  }

  onTwoFactorCodeChange(val: string): void {
    const cleanCode = (val || '').replace(/\D/g, '');
    if (cleanCode.length === 6 && !this.isLoading()) {
      this.twoFactorCode = cleanCode;
      this.verifyTwoFactor();
    }
  }

  verifyTwoFactor(): void {
    if (!this.challengeToken || this.twoFactorCode.length < 6) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyTwoFactorLogin({
      challengeToken: this.challengeToken,
      twoFactorCode: this.twoFactorCode
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.isLoading.set(false);
        if (err.status === 423) {
          const msg = err.error?.message || 'Account is locked for 30 minutes due to 5 failed login attempts.';
          this.errorMessage.set(msg);
          this.requiresTwoFactor.set(false);
          let seconds = 30 * 60;
          if (err.error?.lockoutEndUtc) {
            const diff = Math.ceil((new Date(err.error.lockoutEndUtc).getTime() - Date.now()) / 1000);
            if (diff > 0) seconds = diff;
          }
          this.startLockoutCountdown(seconds);
        } else {
          this.errorMessage.set(err.error?.message || 'Invalid two-factor code.');
        }
      }
    });
  }

  cancelTwoFactor(): void {
    this.requiresTwoFactor.set(false);
    this.twoFactorCode = '';
    this.challengeToken = '';
  }

  formattedLockoutTimer(): string {
    const totalSeconds = this.lockoutTimer();
    if (totalSeconds <= 0) return '0s';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  }

  private lockoutInterval: ReturnType<typeof setInterval> | null = null;

  private startLockoutCountdown(seconds: number): void {
    if (this.lockoutInterval) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
    this.lockoutTimer.set(seconds);
    this.lockoutInterval = setInterval(() => {
      this.lockoutTimer.update(t => {
        if (t <= 1) {
          if (this.lockoutInterval) {
            clearInterval(this.lockoutInterval);
            this.lockoutInterval = null;
          }
          this.errorMessage.set(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }
}
