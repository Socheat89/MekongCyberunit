import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TenantService } from '../tenancy/tenant.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  let modifiedReq = req;
  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.includes('/api/');

  if (isApiRequest) {
    const token = authService.accessToken();
    const tenant = tenantService.activeTenant();

    const headersConfig: { [name: string]: string } = {};
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }
    if (tenant) {
      headersConfig['X-Tenant-Id'] = tenant;
    }

    if (Object.keys(headersConfig).length > 0) {
      modifiedReq = req.clone({
        setHeaders: headersConfig
      });
    }
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // If 401 or 403 on authenticated call, reset session and redirect to login
        authService.clearToken();
        const msg = error.error?.message || '';
        if (msg.toLowerCase().includes('disabled')) {
          router.navigate(['/login'], { queryParams: { reason: 'disabled' } });
        } else {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
