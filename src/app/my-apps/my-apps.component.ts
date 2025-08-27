import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import {
  PermittedApplication,
} from '../common/interfaces/global.interface';
import { UIService } from '../common/services/ui.service';
import { AuthService } from '../common/services/auth.service';
import { CommonModule } from '@angular/common';
import { NoDataFoundComponent } from '../common/components/no-data-found/no-data-found.component';
import { PermittedApplicationService } from '../common/services/permitted-appolication.service';
@Component({
  selector: 'app-my-apps',
  standalone: true,
  imports: [NgbDropdownModule, NoDataFoundComponent, CommonModule],
  templateUrl: './my-apps.component.html',
  styleUrl: './my-apps.component.scss',
})
export class MyAppsComponent implements OnInit, OnDestroy {

  apps: Array<PermittedApplication> = [];
  filteredApps: Array<PermittedApplication> = [];
  permittedApplicationsSubscription: Subscription | undefined;
  bodyClass: string = 'my-apps-outer';
  info: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private renderer: Renderer2,
    private uiService: UIService,
    private permittedApplicationService: PermittedApplicationService
  ) {}

  /**
   * Subscribes to the logged-in user data and retrieves app details on initialization.
   * @returns {Promise<void>}
   */

  async ngOnInit(): Promise<void> {
    this.renderer.addClass(document.body, this.bodyClass);
    this.permittedApplicationsSubscription =
      this.permittedApplicationService.permittedApplications$.subscribe({
        next: (applications) => {
          this.setApplications(applications || []);
        },
      });
    this.permittedApplicationService.removeApplicationName();
    const font = localStorage.getItem('font-size') || 'font-medium';
    this.renderer.addClass(document.body, font);

  }

  async setApplications(applications: PermittedApplication[]) {
    this.filteredApps = this.apps = applications?.sort((a: any, b: any) => {
      if (a.sortOrder < b.sortOrder) return -1;
      if (a.sortOrder > b.sortOrder) return 1;
      return 0;
    }) || [];

    this.info = this.filteredApps.length < 1 ? 'No Applications Found!' : '';
    this.uiService.setLoader(false);
  }

  navigateToReqestAccess() {
    this.router.navigate([`app-access-requests`]);
  }
  navigateToCompTraining(){
    this.router.navigate([`compliance-training`]);
  }
  /**
   * Navigates to the application details page based on the application's slug.
   * @param {SspApplication} app - The application object containing details like slug.
   * @returns {void}
   */

  navigateToApps(app: PermittedApplication): void {
    this.router.navigate([
      `${app.slug.toLowerCase() === 'ubi' ? 'ubi' : app.slug.toLowerCase().replace(/[_ ]/g, '-')}`,
    ]);
  }

  onSearchFilter(event: Event): void {
    this.filteredApps = [...this.apps];
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredApps = this.apps.filter(
      (app: any) =>
        app.name.toLowerCase().includes(input) ||
        app.slug.toLowerCase().includes(input),
    );
    this.info = this.filteredApps.length < 1 ? 'No Applications Found!' : '';
  }

  ngOnDestroy(): void {
    if (this.permittedApplicationsSubscription) {
      this.permittedApplicationsSubscription.unsubscribe();
    }
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
