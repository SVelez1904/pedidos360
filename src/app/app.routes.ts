import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/order-list.component').then(m => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/orders/order-detail.component').then(m => m.OrderDetailComponent)
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog-list.component').then(m => m.CatalogListComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Operator'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
