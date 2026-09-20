import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="w-full max-w-md text-center">
        <div class="glass-panel rounded-2xl p-8 border border-slate-800 backdrop-blur-xl space-y-5">
          <!-- Shield Icon -->
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10 mb-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>

          <div class="space-y-1">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              403 Forbidden
            </span>
            <h1 class="text-2xl font-bold tracking-tight text-white pt-2">Access Restricted</h1>
            <p class="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Your account role does not have the required permissions to access this page or resource.
            </p>
          </div>

          @if (deniedPageCode()) {
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              Denied Resource Code: <span class="font-mono text-rose-400 font-semibold">{{ deniedPageCode() }}</span>
            </div>
          }

          <div class="pt-2">
            <a
              routerLink="/dashboard"
              class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition inline-flex items-center justify-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Back to Dashboard</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Forbidden {
  private readonly route = inject(ActivatedRoute);

  deniedPageCode(): string | null {
    return this.route.snapshot.queryParamMap.get('code');
  }
}
