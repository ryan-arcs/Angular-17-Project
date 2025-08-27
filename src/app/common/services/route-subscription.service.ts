import { Injectable } from '@angular/core';
import { UIService } from './ui.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { CurrentRoutePathParam, CurrentRouteQueryParam } from '../interfaces/global.interface';

@Injectable({
  providedIn: 'root'
})
export class RouteSubscriptionService {

  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  initiate(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$)).subscribe(() => {
      // Get deepest child route
      let route = this.activatedRoute;
      while (route.firstChild) route = route.firstChild;
      const pathParams: Record<string, CurrentRoutePathParam> = {};
      const queryParams: Record<string, CurrentRouteQueryParam> = {};

      Object.keys(route.snapshot.params).forEach(key => 
        pathParams[key] = { value: route.snapshot.params[key] }
      );
      
      Object.keys(route.snapshot.queryParams).forEach(key => 
        queryParams[key] = { value: route.snapshot.queryParams[key] }
      );

      this.uiService.setCurrentRouteDetails({
        url: this.router.url,
        ...(Object.keys(pathParams).length && { pathParams }),
        ...(Object.keys(queryParams).length && { queryParams }),
        component: route.snapshot.component ? route.snapshot.component.name : undefined
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
