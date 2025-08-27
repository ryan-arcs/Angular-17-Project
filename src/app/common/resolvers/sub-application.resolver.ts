import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { PermittedApplicationService } from '../services/permitted-appolication.service';

export const subApplicationResolver: ResolveFn<any> = (route, state) => {
  const permittedApplicationService = inject(PermittedApplicationService);
  const application = route.data['application'];
  permittedApplicationService.setSubApplication(application); 
  return true;
};