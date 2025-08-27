/**
 * This guard checks the if user is already logged in then it doesn't allow the user to navigate to logout page.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GlobalDataService } from '../services/global-data.service';

export const nonAuthGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const globalDataService = inject(GlobalDataService);
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.navigate(['/my-apps']);
      return false; // Block access to login/logout page
    }
    return true; // Allow access to login page
  } catch (error) {
    return true;
  }
};

