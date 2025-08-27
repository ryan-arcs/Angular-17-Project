import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { AuthService } from 'src/app/common/services/auth.service';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss',
})
export class LeftPanelComponent implements OnDestroy {
  @Output() slidebar = new EventEmitter<boolean>();
  constructor(
    private uiService: UIService,
    private route: Router,
    private authService: AuthService,
  ) {
    this.setTabOnRouteChange();
  }

  routeChangeEventSubscription: Subscription | undefined;
  currentTab: string = '';
  sidebar: boolean = false;

  /**
   * Sets the current tab based on route changes.
   */
  setTabOnRouteChange() {
    this.routeChangeEventSubscription = this.route.events.subscribe({
      next: (value) => {
        if (value instanceof NavigationEnd) {
          const urlSegments = value.url.split('/');

          const desiredPath = urlSegments[3];
          let tab = desiredPath ?? 'onboarding';

          this.uiService.setSelectedTab(tab);
          this.currentTab = tab;
        }
      },
    });
  }

  /**
   * Emits the event to close the sidebar and updates the selected tab if it's different from the current tab.
   * @param newTab - The new tab to switch to.
   */

  onTabChange(newTab: string) {
    this.slidebar.emit(false);
    if (newTab !== this.currentTab) {
      this.uiService.setSelectedTab(newTab);
    }
  }

  /**
   * Unsubscribes from route change events to prevent memory leaks.
   */

  ngOnDestroy(): void {
    if (this.routeChangeEventSubscription) {
      this.routeChangeEventSubscription.unsubscribe();
    }
  }

  hasAccessToModule(module: string) {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'resource_tracker',
      moduleSlug: module,
      permissionSlug: 'view',
      ignoreRedirection: true,
    });
  }
}
