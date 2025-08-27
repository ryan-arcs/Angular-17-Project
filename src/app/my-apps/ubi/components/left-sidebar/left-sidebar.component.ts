import { Component, HostListener } from '@angular/core';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EnvironmentProject } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { Subscription, take } from 'rxjs';
import { TableauGlobalDataServiceNew } from '@app/my-apps/ubi/services';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@app/common/services/auth.service';
import { UIService } from '@app/common/services/ui.service';
import { UserProfileService } from '@app/common/services/user-profile.service';
@Component({
  selector: 'app-ubi-left-sidebar',
  standalone: true,
  imports: [
    NgbModalModule,
    RouterLink,
    RouterLinkActive,
    NgbTooltipModule,
    NgbModule,
    CommonModule,
  ],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
})
export class LeftSidebarComponent {
  sidebarOpen = true;
  isConfigExpanded = true;
  isHomeExanded = true;
  environmentProjects?: Record<string, EnvironmentProject>;
  subscriptions: Subscription = new Subscription();
  ifHome = false;
  selectedTableauPersona: string = "";

  constructor(
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private authService: AuthService,
    private uiService: UIService,
    private userProfileService: UserProfileService,
    private router: Router

  ) { }

  ngOnInit(): void {
    this.onResize(new Event('init'));
    this.subscriptions.add(
      this.tableauGlobalDataService.environmentProjects$.subscribe(
        (environmentProjects) => {
          this.environmentProjects = environmentProjects || {};
        },
      ),
    );
    this.tableauGlobalDataService.isconfigExpanded$.subscribe((state) => {
      this.isConfigExpanded = state;
    })

    this.subscriptions.add(this.uiService.currentRouteDetails$.subscribe({
      next: (routeDetails) => {
        this.ifHome = false;
        if (routeDetails?.url && routeDetails?.url.includes('ubi/home')) {
          this.ifHome = true;
          return;
        }
      },
    }));

    this.subscriptions.add(
      this.userProfileService.loggedInUserData$.subscribe({
        next: () => {
          this.selectedTableauPersona = this.tableauGlobalDataService.retrieveTableauPersona() as string;
        },
      })
    )
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      this.sidebarOpen = isMobile ? false : true;
    });
  }

  toggleSidebarMobile() {
    this.subscriptions.add(
      this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
        if (isMobile) {
          this.toggleSidebar();
        }
      })
    );
  }

  changeHomeOptionState() {
    if (!this.ifHome) return;
    this.isHomeExanded = !this.isHomeExanded;
  }

  changeConfigOptionState() {
    this.isConfigExpanded = !this.isConfigExpanded;
    this.tableauGlobalDataService.setConfigOptionState(this.isConfigExpanded);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.uiService.toggleMainSidebar(this.sidebarOpen);
  }

  isPersonaSelected() {
    return !(!this.selectedTableauPersona ||
      (this.selectedTableauPersona && this.selectedTableauPersona?.toLowerCase() === "home"));
  }

  // Check if the user has access to a given module
  hasAccessToModule(module: string) {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'ubi',
      moduleSlug: module,
      permissionSlug: 'view',
      ignoreRedirection: true,
    });
  }
}
