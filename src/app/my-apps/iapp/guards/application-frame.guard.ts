/**
 * This guard checks if the global application name is set in the IappGlobalDataService.
 */
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { IappGlobalDataService } from '../services';

export const applicationFrameGuard: CanActivateFn = (route) => {
  const iappGlobalDataService = inject(IappGlobalDataService);

  iappGlobalDataService.globalApplicationName$.subscribe({
    next: (value) => {
      if (value === '') {
        const applicationName = route.paramMap.get('id') as string;
        iappGlobalDataService.setGlobalApplicationName(applicationName);
      }
    },
  });
  return true;
};
