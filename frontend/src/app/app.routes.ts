import { Routes } from '@angular/router';
import { authGuard } from './login/auth.guard';
import { pageAccessGuard } from './login/page-access.guard';
import { Login } from './login/login';
import { Register } from './register/register';
import { TwoFactorSetup } from './two-factor-setup/two-factor-setup';
import { Forbidden } from './forbidden/forbidden';
import { AppLayout } from './layout/app-layout';
import { Dashboard } from './dashboard/dashboard';
import { UnitList } from './units/units';
import { RoleList } from './roles/roles';
import { PermissionList } from './permissions/permissions';
import { Profile } from './profile/profile';
import { UserList } from './users/users';

export const routes: Routes = [
  // Public Authentication Routes
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: '2fa-setup',
    component: TwoFactorSetup,
    canActivate: [authGuard]
  },
  {
    path: 'forbidden',
    component: Forbidden
  },

  // Protected Application Shell Routes
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'dashboard' }
      },
      {
        path: 'users',
        component: UserList
      },
      {
        path: 'units',
        component: UnitList,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'units' }
      },
      {
        path: 'roles',
        component: RoleList
      },
      {
        path: 'permissions',
        component: PermissionList
      },
      {
        path: 'profile',
        component: Profile
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback Catch-all
  {
    path: '**',
    redirectTo: '/login'
  }
];
