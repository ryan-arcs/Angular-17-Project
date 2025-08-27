import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription, take } from 'rxjs';
import { NavigationStart } from '@angular/router';
import { IappGlobalDataService } from '@app/my-apps/iapp/services/iapp-global-data.service';
import { UIService } from 'src/app/common/services/ui.service';
import { AuthService } from 'src/app/common/services/auth.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-iapp-left-sidebar',
  standalone: true,
  imports: [RouterLink, NgbTooltipModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
})
export class LeftSidebarComponent implements OnDestroy {
  @Output() slidebar = new EventEmitter<boolean>();
  @Input() environmentProjects1: any = [];

  routeChangeEventSubscription: Subscription | undefined;
  currentTab: string = '';
  sidebarOpen: boolean = true;

  constructor(
    private uiService: UIService,
    private route: Router,
    private iappGlobalDataService: IappGlobalDataService,
    private authService: AuthService,
  ) {
    this.setInitialTab();
    this.setTabOnRouteChange();
  }
  ngOnInit() {
    this.onResize(new Event('init'));
  }

  // Method to subscribe to route changes and update the current tab
  setTabOnRouteChange() {
    this.routeChangeEventSubscription = this.route.events.subscribe({
      next: (value) => {
        if (value instanceof NavigationStart) {
          this.iappGlobalDataService.resetErrorBlock();
        }
        if (value instanceof NavigationEnd) {
          const urlSegements = value.url.split('/');
          const tab = urlSegements[urlSegements.length - 1];
          this.uiService.setSelectedTab(tab);
          this.currentTab = tab;
          this.iappGlobalDataService.updateErrorBlock(tab);
        }
      },
    });
  }

  setInitialTab() {
    const urlSegments = this.route.url.split('/');
    const tab = urlSegments[urlSegments.length - 1];
    this.uiService.setSelectedTab(tab);
    this.currentTab = tab;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      this.sidebarOpen = isMobile ? false : true;
    });
  }


  /**
   * Handle tab change event
   * @param {string} newTab
   */

  onTabChange(newTab: string) {
    this.slidebar.emit(false);
    if (newTab !== this.currentTab) {
      this.uiService.setSelectedTab(newTab);
    }
  }

  toggleSidebarMobile() {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      if (isMobile) {
        this.toggleSidebar();
      }
    });
  }

  hasAccessToModule(module: string) {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'iapp',
      moduleSlug: module,
      permissionSlug: 'view',
      ignoreRedirection: true,
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.uiService.toggleMainSidebar(this.sidebarOpen)
  }

  // Lifecycle hook that is called before the component is destroyed
  ngOnDestroy(): void {
    if (this.routeChangeEventSubscription) {
      this.routeChangeEventSubscription.unsubscribe();
    }
  }
}
