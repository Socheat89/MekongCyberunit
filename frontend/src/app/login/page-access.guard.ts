import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { NavigationService } from '../layout/app-sidebar/navigation.service';

export const pageAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const navigationService = inject(NavigationService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const pageCode = route.data['pageCode'] as string | undefined;
  if (!pageCode) {
    return true;
  }

  return navigationService.getNavigation().pipe(
    map(items => {
      const allowed = navigationService.hasPageCode(items, pageCode);
      if (allowed) {
        return true;
      }
      router.navigate(['/forbidden'], { queryParams: { code: pageCode } });
      return false;
    }),
    catchError(error => {
      if (error?.status === 401) {
        router.navigate(['/login']);
      } else {
        router.navigate(['/forbidden'], { queryParams: { code: pageCode } });
      }
      return of(false);
    })
  );
};
