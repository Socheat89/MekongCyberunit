import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TenantInfo {
  id: string;
  name: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly apiUrl = environment.apiUrl;
  private readonly storageKey = environment.tenantKey;

  readonly activeTenant = signal<string | null>(this.getStoredTenant());

  constructor(private http: HttpClient) {}

  getStoredTenant(): string | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(this.storageKey);
    }
    return null;
  }

  setActiveTenant(tenantId: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(this.storageKey, tenantId);
    }
    this.activeTenant.set(tenantId);
  }

  clearTenant(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(this.storageKey);
    }
    this.activeTenant.set(null);
  }

  ensureSelected(): Observable<string> {
    const existing = this.getStoredTenant();
    if (existing) {
      this.activeTenant.set(existing);
      return of(existing);
    }

    return this.http.get<TenantInfo | TenantInfo[]>(`${this.apiUrl}/tenants/me`).pipe(
      map(res => {
        let tenantId = 'default-tenant';
        if (Array.isArray(res) && res.length > 0) {
          tenantId = res[0].id || res[0].code || 'default-tenant';
        } else if (res && typeof res === 'object' && 'id' in res) {
          tenantId = (res as TenantInfo).id || 'default-tenant';
        }
        this.setActiveTenant(tenantId);
        return tenantId;
      }),
      catchError(() => {
        const fallback = 'default-tenant';
        this.setActiveTenant(fallback);
        return of(fallback);
      })
    );
  }
}
