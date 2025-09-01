// Interceptor to add authorization token to proxy url of the APIs
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, mergeMap } from 'rxjs/operators';
import { from, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfileService } from '../services/user-profile.service';
import { PermittedApplicationService } from '../services/permitted-appolication.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const userProfileService = inject(UserProfileService);
  const permittedApplicationService = inject(PermittedApplicationService);
  const token = localStorage.getItem('auth_token');
  // Attach token if exists
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 403) {
        localStorage.removeItem('auth_token');
        userProfileService.clearLoggedInUserData();
        permittedApplicationService.clearPermittedApplications();

        // Only redirect if not already on login page
        if (router.url !== '/login') {
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
