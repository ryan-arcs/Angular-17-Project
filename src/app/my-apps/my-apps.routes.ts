import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    /**
     * The default route that loads the MyAppsComponent.
     * @type {string}
     */
    path: '',
    loadComponent: () =>
      import('./my-apps.component').then((c) => c.MyAppsComponent),
  }
];
