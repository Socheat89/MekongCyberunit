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

// Modules mapping to backend microservices
import { InventoryListComponent } from './modules/inventory/inventory-list.component';
import { CatalogComponent } from './modules/catalog/catalog.component';
import { PurchasingComponent } from './modules/purchasing/purchasing.component';
import { SalesComponent } from './modules/sales/sales.component';
import { ReportsComponent } from './modules/reports/reports.component';
import { CustomersComponent } from './modules/customers/customers.component';
import { SuppliersComponent } from './modules/suppliers/suppliers.component';
import { AuditComponent } from './modules/audit/audit.component';

// Legacy stock components for deep link backward compatibility
import { StockItemsComponent } from './stock/stock-items/stock-items';
import { StockInComponent } from './stock/stock-in/stock-in';
import { StockOutComponent } from './stock/stock-out/stock-out';
import { StockAdjustmentsComponent } from './stock/stock-adjustments/stock-adjustments';
import { StockMovementsComponent } from './stock/stock-movements/stock-movements';
import { StockAlertsComponent } from './stock/stock-alerts/stock-alerts';

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

  // Protected Application Shell Routes (Full-Width, Odoo-Inspired Top Navigation)
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
      // Backend Modules Feature Routes
      {
        path: 'inventory',
        component: InventoryListComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-items' }
      },
      {
        path: 'catalog',
        component: CatalogComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-items' }
      },
      {
        path: 'purchasing',
        component: PurchasingComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-in' }
      },
      {
        path: 'sales',
        component: SalesComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-out' }
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-alerts' }
      },
      {
        path: 'customers',
        component: CustomersComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-out' }
      },
      {
        path: 'suppliers',
        component: SuppliersComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-in' }
      },
      {
        path: 'audit',
        component: AuditComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-movements' }
      },

      // Administration & Organization
      {
        path: 'users',
        component: UserList,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'users' }
      },
      {
        path: 'units',
        component: UnitList,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'units' }
      },
      {
        path: 'roles',
        component: RoleList,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'roles' }
      },
      {
        path: 'permissions',
        component: PermissionList,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'permissions' }
      },
      {
        path: 'profile',
        component: Profile
      },

      // Stock Redirect & Deep-link Compatibility
      {
        path: 'stock',
        redirectTo: 'inventory',
        pathMatch: 'full'
      },
      {
        path: 'stock/items',
        component: StockItemsComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-items' }
      },
      {
        path: 'stock/in',
        component: StockInComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-in' }
      },
      {
        path: 'stock/out',
        component: StockOutComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-out' }
      },
      {
        path: 'stock/adjustments',
        component: StockAdjustmentsComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-adjustments' }
      },
      {
        path: 'stock/movements',
        component: StockMovementsComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-movements' }
      },
      {
        path: 'stock/alerts',
        component: StockAlertsComponent,
        canActivate: [pageAccessGuard],
        data: { pageCode: 'stock-alerts' }
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
