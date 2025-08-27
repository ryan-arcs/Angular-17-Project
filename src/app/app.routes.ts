import { Routes } from '@angular/router';
import { authGuard } from './common/guards/auth.guard';
import { nonAuthGuard } from './common/guards/non-auth.guard';

import { WdhComponent } from './my-apps/wdh/wdh.component';
import { C4eComponent } from './my-apps/c4e/c4e.component';
import { AccessGuard } from './my-apps/wdh/guards/access.guard';
import { ResourceTrackerComponent } from './my-apps/resource-tracker/resource-tracker.component';
import { C4eAccessGuard } from './my-apps/c4e/guards/access.guard';
import { AsherComponent } from './my-apps/asher/asher.component';
import { TableauComponent as TableauComponentNewDesign } from './my-apps/ubi/tableau.component';
import { XappsAdminComponent } from './my-apps/xapps-admin/xapps-admin.component';
import { subApplicationResolver } from './common/resolvers';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/my-apps',
    pathMatch: 'full',
  },
  {
    path: '',
    canActivate: [authGuard], //This auth guard will check if the user has a valid session or not (only authentication check)
    children: [
      {
        path: 'my-apps',
        loadChildren: () =>
          import('./my-apps/my-apps.routes').then((c) => c.routes),
      },
      {
        /**
         * Route for the 'iapp' path that lazily loads the application routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'iapp',
        loadChildren: () =>
          import('./my-apps/iapp/applications/applications.routes').then((c) => c.routes),
        data: { application: 'iapp' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      {
        /**
         * Route for the 'ssp-admin' path that loads the SSPAdminComponent and its child routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'ubi',
        component: TableauComponentNewDesign,
        loadChildren: () =>
          import('./my-apps/ubi/tableau.routes').then((c) => c.routes),
        data: { application: 'ubi' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      {
        /**
         * Route for the 'ssp-admin' path that loads the SSPAdminComponent and its child routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'resource-tracker',
        component: ResourceTrackerComponent,
        loadChildren: () =>
          import('./my-apps/resource-tracker/resource-tracker.routes').then(
            (c) => c.routes,
          ),
        data: { application: 'resource_tracker' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      {
        /**
         * Route for the 'wdh' path that loads the WdhComponent and its child routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'wdh',
        component: WdhComponent,
        canActivate: [AccessGuard],
        loadChildren: () => import('./my-apps/wdh/wdh.routes').then((c) => c.routes),
        data: { application: 'wdh' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      {
        /**
         * Route for the 'c4e' path that loads the C4eComponent and its child routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'c4e',
        component: C4eComponent,
        canActivate: [C4eAccessGuard],
        loadChildren: () => import('./my-apps/c4e/c4e.routes').then((c) => c.routes),
        data: { application: 'c4e' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      {
        /**
         * Route for the 'search-portal' path that loads the SSPAdminComponent and its child routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'asher',
        component: AsherComponent,
        loadChildren: () =>
          import('./my-apps/asher/asher.routes').then((c) => c.routes),
        data: { application: 'asher' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      {
        /**
         * Route for the 'search-portal' path that loads the SSPAdminComponent and its child routes.
         * @type {string}
         * @returns {Promise<Routes>}
         */
        path: 'xapps-admin',
        component: XappsAdminComponent,
        loadChildren: () =>
          import('./my-apps/xapps-admin/xapps-admin.routes').then((c) => c.routes),
        data: { application: 'xapps-admin' },
        resolve: {
          subApplicationResolved: subApplicationResolver
        }
      },
      // {
      //   path: 'reviews',
      //   loadComponent: () =>
      //     import('./reviews/reviews.component').then((c) => c.ReviewsComponent),
      // },
    ],
  },
  {
    path: 'logout',
    canActivate: [nonAuthGuard],
    loadComponent: () =>
      import(
        './common/components/logout/logout.component'
      ).then((c) => c.LogoutComponent),
  },
  {
    path: 'login',
    canActivate: [nonAuthGuard],
    loadComponent: () =>
      import(
        './common/components/login/login.component'
      ).then((c) => c.LoginComponent),
  },
  {
    path: '404',
    loadComponent: () =>
      import(
        './common/components/page-not-found/page-not-found.component'
      ).then((c) => c.PageNotFoundComponent),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];