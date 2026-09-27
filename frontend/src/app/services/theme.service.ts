import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'mekong_theme_mode';

  // Default to sleek enterprise dark mode
  readonly currentTheme = signal<ThemeMode>('dark');

  constructor() {
    // Read persisted theme or default to dark
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    const initialTheme: ThemeMode = saved === 'light' ? 'light' : 'dark';
    this.currentTheme.set(initialTheme);
    this.applyTheme(initialTheme);

    // Watch for theme changes and persist
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  toggleTheme(): void {
    this.currentTheme.update(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  private applyTheme(mode: ThemeMode): void {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#070a13';
      document.body.style.color = '#f1f5f9';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#f8faf9';
      document.body.style.color = '#0f172a';
    }
  }
}
