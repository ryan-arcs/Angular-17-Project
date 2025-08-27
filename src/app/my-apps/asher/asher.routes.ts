// Application route definitions with lazy loading and access guards
import { Routes } from '@angular/router';
import { accessGuard } from './guards/access.guard';

export const routes: Routes = [
    {
        path: '404',
        loadComponent: () =>
            import(
                '../../common/components/page-not-found/page-not-found.component'
            ).then((c) => c.PageNotFoundComponent),
    },
    {
        path: '',
        redirectTo: 'applications',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        loadComponent : () => import('./components/dashboard/dashboard.component').then((c) => c.DashboardComponent),
        canActivate: [accessGuard],
    },
    {
        path: 'applications',
        loadChildren: () =>
        import('./applications/applications.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },

    {
        path: 'users',
        loadChildren: () =>
        import('./components/lookups/users/users.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },

    {
        path: 'lifecycles',
        loadChildren: () =>
        import('./components/lookups/lifecycles/lifecycles.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'vendors',
        loadChildren: () =>
        import('./components/lookups/vendors/vendors.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'departments',
        loadChildren: () =>
        import('./components/lookups/departments/departments.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'configurations',
        loadChildren: () =>
        import('./components/lookups/configurations/configurations.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'roles',
        loadChildren: () => import('../../common/components/roles/roles.routes').then((c) => c.routes),
        data: { 
            application: 'asher',
            suppressedActions: ['add', 'edit', 'manage_permissions', 'delete'] 
        },
    },
    {
        path: '**',
        redirectTo: '/404',
    },
];
