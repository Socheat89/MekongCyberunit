import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NavigationItem } from '../../models/navigation.models';
import { TenantService } from '../../tenancy/tenant.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly apiUrl = `${environment.apiUrl}/navigation`;

  readonly navigationItems = signal<NavigationItem[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private tenantService: TenantService
  ) {}

  getNavigation(forceRefresh = false): Observable<NavigationItem[]> {
    if (!forceRefresh && this.navigationItems().length > 0) {
      return of(this.navigationItems());
    }

    this.isLoading.set(true);

    return this.tenantService.ensureSelected().pipe(
      switchMap(() => this.http.get<NavigationItem[]>(`${this.apiUrl}/me`)),
      tap(items => {
        this.navigationItems.set(items || []);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.navigationItems.set([]);
        throw err;
      })
    );
  }

  clearNavigation(): void {
    this.navigationItems.set([]);
  }

  hasPageCode(items: NavigationItem[], pageCode: string): boolean {
    const target = pageCode.toLowerCase();
    for (const item of items) {
      if (item.code && item.code.toLowerCase() === target) {
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (this.hasPageCode(item.children, pageCode)) {
          return true;
        }
      }
    }
    return false;
  }
}
