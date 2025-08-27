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
        redirectTo: 'users',
        pathMatch: 'full',
    },
    {
        path: 'users',
        loadChildren: () =>
        import('./components/users/users.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'applications',
        loadChildren: () =>
        import('./components/applications/applications.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
     {
        path: 'roles',
        loadChildren: () => import('../../common/components/roles/roles.routes').then((c) => c.routes),
        data: { application: '' },
        canActivate: [accessGuard],
    },
    {
        path: 'modules',
        loadChildren: () =>
        import('./components/modules/modules.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'submodules',
        loadChildren: () =>
        import('./components/submodules/submodules.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'permissions',
        loadChildren: () =>
        import('./components/permissions/permissions.routes').then((c) => c.routes),
        canActivate: [accessGuard],
    },
    {
        path: 'roles',
        loadChildren: () => import('../../common/components/roles/roles.routes').then((c) => c.routes),
        data: { application: '' },
        canActivate: [accessGuard],
    },
    {
        path: '**',
        redirectTo: '/404',
    },
];
