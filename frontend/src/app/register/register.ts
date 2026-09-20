import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mekong-auth min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans">
      <div class="w-full max-w-md">
        <!-- Same visual language as the login screen -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 mb-3.5">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900">
            Mekong <span class="text-indigo-600">Stock</span>
          </h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">Create your workspace account</p>
        </div>

        <div class="bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-200/90">
          <div class="mb-6">
            <h2 class="text-lg font-black tracking-tight text-slate-900">Create account</h2>
            <p class="text-xs text-slate-500 mt-1 font-medium">Set up your inventory workspace in a few details.</p>
          </div>

          @if (errorMessage()) {
            <div class="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5 animate-fade-in">
              <svg class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span class="font-bold">{{ errorMessage() }}</span>
            </div>
          }

          <form (ngSubmit)="signUp()" class="space-y-4">
            <div>
              <label for="username" class="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
              <input id="username" name="username" type="text" required [(ngModel)]="formData.username" placeholder="johndoe"
                class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder-slate-400 font-medium" />
            </div>

            <div>
              <label for="email" class="block text-xs font-bold text-slate-700 mb-1.5">Email address</label>
              <input id="email" name="email" type="email" required [(ngModel)]="formData.email" placeholder="john@example.com"
                class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder-slate-400 font-medium" />
            </div>

            <div>
              <label for="password" class="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <input id="password" name="password" type="password" required [(ngModel)]="formData.password" placeholder="••••••••"
                class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm placeholder-slate-400 font-medium" />
              <p class="text-[11px] text-slate-500 mt-1 font-medium">Use 8+ characters with uppercase letters and numbers.</p>
            </div>

            <button type="submit" [disabled]="isLoading()"
              class="w-full mt-5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              @if (isLoading()) {
                <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating account...</span>
              } @else {
                <span>Create account</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0-7 7m7-7H3"/>
                </svg>
              }
            </button>
          </form>

          <div class="mt-6 text-center text-xs text-slate-500 font-medium">
            Already have an account?
            <a routerLink="/login" class="text-indigo-600 hover:text-indigo-700 font-bold ml-1 transition">Sign in</a>
          </div>
        </div>

        <div class="mt-6 text-center text-xs text-slate-400 font-medium">Mekong Stock · Protected workspace</div>
      </div>
    </div>
  `
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly formData = {
    username: '',
    email: '',
    password: ''
  };

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  signUp(): void {
    if (!this.formData.username || !this.formData.email || !this.formData.password) {
      this.errorMessage.set('Please fill in all required fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Try a different username or email.');
      }
    });
  }
}
