// auth guard
/**
 * This guard checks the authentication of the users and redirects to login if the user is not authenticated. .
 */
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UIService } from '../services/ui.service';
import { GlobalDataService } from '../services/global-data.service';
import { firstValueFrom } from 'rxjs';
 

export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const uiService = inject(UIService);
  const router = inject(Router);
  const globalDataService = inject(GlobalDataService);
  try {
    // await getCurrentUser();
    const token = localStorage.getItem('auth_token');

    if (!token) {
      router.navigate(['/login']);
      return false;
    }
 
    //Redirect the URL if previous Path and current path not same
    // const redirectRoute = localStorage.getItem('redirectURL');
    // localStorage.removeItem('redirectURL');
    // if (redirectRoute && redirectRoute != state.url) {
    //   router.navigateByUrl(decodeURIComponent(redirectRoute));
    //   return false
    // }
 
    const response = await authService.handleAuthentication(token, route, state);
    return response;
  } catch (error) {
    // localStorage.setItem('redirectURL', state.url);
    console.error('Auth Guard Error:', error);
    router.navigate(['/login']);
    return false;
  }
};

