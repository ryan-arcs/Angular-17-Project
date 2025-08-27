import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from './common/components/header/header.component';
import { LoaderComponent } from './common/components/loader/loader.component';
import { UIService } from './common/services/ui.service';
import { CspService } from './common/services/csp.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { LeftPanelComponent } from './common/components/left-panel/left-panel.component';
import { InactivityService } from './common/services/inactivity.service';
import { TableauGlobalDataServiceNew } from './my-apps/ubi/services';
import { RouteSubscriptionService } from './common/services/route-subscription.service';
import { GraphqlMonitoringService } from './common/services/graphql-monitoring.service';
import { IappGlobalDataService } from './my-apps/iapp/services';
import { BroadcastService } from './common/services/broadcast.service';
import { ToggleButtonComponent } from './common/components/toggle-button/toggle-button.component';
import { environment } from '../environments/environment.development';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    LoaderComponent,
    LeftPanelComponent,
    ToggleButtonComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  showLoader = false;
  forceLoader = false;
  showTableauHeader = false;
  leftPanelContent: any;
  isTableau: boolean = false;
  tableauSliderState: boolean = false;
  isViewDetailsPage = false;
  sidebarOpen = {
    isSidebarOpenReport: false,
    isSidebarOpen :false
  }
  
  private destroy$ = new Subject<void>();

  constructor(
    private broadcastService: BroadcastService,
    private uiService: UIService,
    private cdr: ChangeDetectorRef,
    private cspService: CspService,
    private inactivityService: InactivityService,
    private router: Router,
    private sliderService: TableauGlobalDataServiceNew,
    private routeSubscriptionService: RouteSubscriptionService,
    private graphqlMonitoringService: GraphqlMonitoringService,
    private iappGlobalDataService : IappGlobalDataService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit(): Promise<void> {
    this.broadcastService.initiate();
    this.inactivityService.initiate();
    const thisRouteSnapshot = this.route.snapshot as any;
    this.isViewDetailsPage = this.checkIfViewDetailsPage(thisRouteSnapshot?.['_routerState']?.url);
    this.graphqlMonitoringService.initiate();
    this.routeSubscriptionService.initiate();
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value instanceof NavigationEnd) {
        if (value.url?.includes('/ubi')) {
          this.isTableau = true;
        }
        else {
          this.isTableau = false;
        }
        const thisRouteSnapshot = this.route.snapshot as any;
        this.isViewDetailsPage = this.checkIfViewDetailsPage(thisRouteSnapshot?.['_routerState']?.url);
      }
    });

    this.sliderService.sliderState$.pipe(takeUntil(this.destroy$)).subscribe((value: any) => {
      this.tableauSliderState = value;
    })
   

    this.uiService.loader$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.showLoader = value;
        this.cdr.detectChanges();
      },
    });

    this.uiService.forceLoader$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.forceLoader = value;
        this.cdr.detectChanges();
      },
    });

    if (environment?.cspPolicy) {
      this.cspService.setCSPPolicy(atob(environment.cspPolicy));
    }

    this.uiService.leftPanelContent$.pipe(takeUntil(this.destroy$)).subscribe((content) => {
      this.leftPanelContent = content;
      this.cdr.detectChanges();
    })

    // this.sliderService.sliderState$.subscribe(state => {
    //   this.sidebarOpen. = state
    // });

    this.uiService.$isSidebarOpen.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.sidebarOpen.isSidebarOpen = value;
      this.cdr.detectChanges();
    });

    this.sliderService.sliderState$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.sidebarOpen.isSidebarOpenReport = value;
      this.cdr.detectChanges();
    });
  }

  checkIfViewDetailsPage(pageUrl: string){
    const regex = /^\/ubi\/projects\/([^\/]+)\/views\/([^\/]+)(\/|$)/;
    if (pageUrl && regex.test(pageUrl)) {
      const match = pageUrl?.match(regex);
      const projectId = match?.[1];
      const viewId = match?.[2];
      return projectId && viewId ? true : false;
    }
    return false
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
