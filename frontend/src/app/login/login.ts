import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mekong-auth min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans">
      <div class="w-full max-w-md">
        <!-- Brand Emblem & Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 mb-3.5">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900">
            Mekong <span class="text-indigo-600">Stock</span>
          </h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            Inventory command centre
          </p>
        </div>

        <!-- Crisp White Card -->
        <div class="bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-200/90">
          <!-- Notification / Error Banner -->
          @if (errorMessage()) {
            <div class="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5 animate-fade-in">
              <svg class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div class="flex-1 leading-relaxed">
                <div class="font-bold">{{ errorMessage() }}</div>
                @if (lockoutTimer() > 0) {
                  <div class="mt-1 font-mono font-medium text-rose-600">
                    Retry allowed in: <span class="font-bold underline">{{ lockoutTimer() }}s</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- PHASE 1: Username & Password Authentication -->
          @if (!requiresTwoFactor()) {
            <form (ngSubmit)="signIn()" class="space-y-4">
              <!-- Username -->
              <div>
                <label for="username" class="block text-xs font-bold text-slate-700 mb-1.5">
                  Associate ID / Username
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    class="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    class="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm placeholder-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    (click)="showPassword.update(v => !v)"
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
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

              <!-- Quick Demo Pill -->
              <div class="flex items-center justify-between pt-1">
                <button
                  type="button"
                  (click)="fillDemoAdmin()"
                  class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>Fill Demo Admin</span>
                </button>

                <a routerLink="/register" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
                  Create account →
                </a>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="isLoading() || lockoutTimer() > 0"
                class="w-full mt-5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                @if (isLoading()) {
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                } @else {
                  <span>Sign In</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- PHASE 2: Two-Factor Authentication TOTP Code -->
          @if (requiresTwoFactor()) {
            <form (ngSubmit)="verifyTwoFactor()" class="space-y-4 animate-fade-in">
              <div class="text-center mb-5">
                <div class="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2 border border-indigo-100 shadow-xs">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.099.99-4.328.99-6.632a13.95 13.95 0 00-2.17-7.484M3.05 11c0-1.664.303-3.257.86-4.725M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                </div>
                <h2 class="text-lg font-bold text-slate-900 font-sans">Two-Factor Challenge</h2>
                <p class="text-xs text-slate-500 mt-1">
                  Enter the 6-digit TOTP code from your mobile authenticator.
                </p>
              </div>

              <div>
                <label for="twoFactorCode" class="block text-xs font-bold text-slate-700 mb-2 text-center">
                  Verification Code
                </label>
                <input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  required
                  [(ngModel)]="twoFactorCode"
                  placeholder="000000"
                  autofocus
                  class="glass-input w-full text-center tracking-[0.4em] font-mono text-2xl py-3 rounded-2xl font-black placeholder-slate-300"
                />
              </div>

              <div class="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  (click)="cancelTwoFactor()"
                  class="text-slate-500 hover:text-slate-700 transition font-medium"
                >
                  ← Back to login
                </button>
              </div>

              <button
                type="submit"
                [disabled]="isLoading() || twoFactorCode.length < 6"
                class="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                @if (isLoading()) {
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying Code...</span>
                } @else {
                  <span>Confirm & Sign In</span>
                }
              </button>
            </form>
          }
        </div>

        <div class="mt-6 text-center text-xs text-slate-400 font-medium">
          Mekong Stock · Protected workspace
        </div>
      </div>
    </div>
  `
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly credentials = {
    username: '',
    password: ''
  };

  readonly showPassword = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly requiresTwoFactor = signal<boolean>(false);
  readonly lockoutTimer = signal<number>(0);

  challengeToken = '';
  twoFactorCode = '';

  fillDemoAdmin(): void {
    this.credentials.username = 'admin';
    this.credentials.password = 'Password123!';
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
          const msg = err.error?.message || 'Account is temporarily locked.';
          this.errorMessage.set(msg);
          this.startLockoutCountdown(60);
        } else {
          this.errorMessage.set(err.error?.message || 'Invalid username or password.');
        }
      }
    });
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
        this.errorMessage.set(err.error?.message || 'Invalid two-factor code.');
      }
    });
  }

  cancelTwoFactor(): void {
    this.requiresTwoFactor.set(false);
    this.twoFactorCode = '';
    this.challengeToken = '';
  }

  private startLockoutCountdown(seconds: number): void {
    this.lockoutTimer.set(seconds);
    const interval = setInterval(() => {
      this.lockoutTimer.update(t => {
        if (t <= 1) {
          clearInterval(interval);
          this.errorMessage.set(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }
}
