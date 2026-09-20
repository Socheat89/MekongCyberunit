import { Injectable, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly progress = signal<number>(0);
  readonly loadingMessage = signal<string>('កំពុងផ្ទុក... / Loading...');

  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private completeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.setupRouterEvents();
  }

  private setupRouterEvents(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.start('កំពុងរៀបចំទិន្នន័យ... / Loading page...');
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.complete();
      }
    });
  }

  start(message = 'កំពុងផ្ទុក... / Loading...'): void {
    this.clearTimers();
    this.loadingMessage.set(message);
    this.isLoading.set(true);
    this.progress.set(15);

    // Smoothly simulate progress up to 90%
    this.progressInterval = setInterval(() => {
      this.progress.update(prev => {
        if (prev < 50) return prev + Math.floor(Math.random() * 15) + 8;
        if (prev < 82) return prev + Math.floor(Math.random() * 8) + 4;
        if (prev < 92) return prev + 1;
        return prev;
      });
    }, 120);
  }

  complete(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    this.progress.set(100);

    this.completeTimeout = setTimeout(() => {
      this.isLoading.set(false);
      this.progress.set(0);
    }, 280);
  }

  private clearTimers(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.completeTimeout) {
      clearTimeout(this.completeTimeout);
      this.completeTimeout = null;
    }
  }
}
