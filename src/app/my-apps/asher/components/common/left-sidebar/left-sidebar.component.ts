import {
  Component,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';
import {
  ChildActivationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import {
  LeftPanelService,
  PanelState,
} from '@app/common/services/left-panel.service';
import { UIService } from '@app/common/services/ui.service';
import { Subscription, take } from 'rxjs';
import { AuthService } from 'src/app/common/services/auth.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
const lookupModules = [
  'users',
  'roles',
  'departments',
  'vendors',
  'lifecycles',
  'configurations',
];
@Component({
  selector: 'app-asher-left-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgbTooltipModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
})
export class LeftSidebarComponent {
  @Output() slidebar = new EventEmitter<boolean>();

  routeChangeEventSubscription: Subscription | undefined;
  currentTab: string = 'asor';
  sidebar: PanelState = 'EXPANDED';
  isLookupMenuOpen = true;
  sidebarOpen = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private leftPanelService: LeftPanelService,
    private uiService: UIService,
  ) {
    // Subscribes to router events to detect when a child route is activated.
    // Checks if the activated route matches any of the lookup modules.
    // If matched, it sets `isLookupMenuOpen` to true to control UI behavior.
    this.routeChangeEventSubscription = this.router.events.subscribe({
      next: (value) => {
        if (value instanceof ChildActivationEnd && !this.isLookupMenuOpen) {
          const activatedRouteSnapshot = value?.snapshot as any;
          const routeSegments =
            activatedRouteSnapshot?.['_routerState']?.url?.split('/');
          const currentRoute =
            routeSegments?.length > 2 ? routeSegments?.[3] : '';
          this.isLookupMenuOpen = lookupModules.includes(currentRoute)
            ? true
            : false;
        }
      },
    });
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    this.sidebar = this.leftPanelService.getPanelState();
    this.onResize(new Event('init'));
  }
  /**
   * Checks if the user has access to the specified module.
   * - If the module is `lookup_tables`, iterates through all lookup modules to verify permissions.
   * - For all other modules, directly checks the permission using `authService`.
   *
   * @param {string} module - The module name to check access for.
   * @param {boolean} [strictMode] - Optional flag to enforce strict permission checks.
   * @returns {boolean} - True if access is permitted, false otherwise.
   */
  hasAccessToModule(module: string, strictMode?: boolean) {
    if (module === 'lookup_tables') {
      for (const lookupModule of lookupModules) {
        if (
          this.authService.hasPermissionToAccessModule({
            appSlug: 'asher',
            moduleSlug: lookupModule,
            permissionSlug: 'list',
            strictMode: (lookupModule=='roles')? false: true,
            ignoreRedirection: true,
          })
        ) {
          return true;
        }
      }
      return false;
    }
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: module,
      permissionSlug: 'list',
      strictMode,
      ignoreRedirection: true,
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      this.sidebarOpen = isMobile ? false : true;
    });
  }

  goToFirstLookup() {
    for (const lookupModule of lookupModules) {
      if (
        this.authService.hasPermissionToAccessModule({
          appSlug: 'asher',
          moduleSlug: lookupModule,
          permissionSlug: 'list',
          strictMode: (lookupModule=='roles')? false: true,
          ignoreRedirection: true,
        })
      ) {
        return `/asher/${lookupModule}`;
      }
    }
    return ``;
  }

  //This function is to check if the logged in user hass access to roles module in ssp
  hasAccessToRoleModule() {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'xapps_admin',
      moduleSlug: 'roles',
      permissionSlug: 'view',
      ignoreRedirection: true,
    });
  }

  toggleSidebarMobile() {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      if (isMobile) {
        this.toggleSidebar();
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.uiService.toggleMainSidebar(this.sidebarOpen);
  }

  isLookupSubRouteActive(): boolean {
    const lookupRoutes = [
      '/asher/users',
      '/asher/roles',
      '/asher/departments',
      '/asher/vendors',
      '/asher/lifecycles',
      '/asher/configurations'
    ];
    return lookupRoutes.includes(this.router.url);
  }

  ngOnDestroy(): void {
    if (this.routeChangeEventSubscription) {
      this.routeChangeEventSubscription.unsubscribe();
    }
  }
}
