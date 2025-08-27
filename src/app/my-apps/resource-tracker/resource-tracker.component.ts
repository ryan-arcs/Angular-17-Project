import { Component, HostListener, Renderer2 } from '@angular/core';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { LocalStorageService } from '@app/common/services/local-storage.service';
@Component({
  selector: 'app-resource-tracker',
  standalone: true,
  imports: [LeftPanelComponent, RouterOutlet, NgClass],
  templateUrl: './resource-tracker.component.html',
  styleUrl: './resource-tracker.component.scss',
})
export class ResourceTrackerComponent {
  sidebar: boolean = true;
  bodyClass = 'resource-tracker-outer';
  sidebarClass = 'sidebar-open-outer';
  bodyClass2 = "asher-sidebar-open";
  constructor(
    private renderer: Renderer2,
    private localStorageService: LocalStorageService,
    ) {}

  ngOnInit(): void {
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = (appConfig?.isLeftPanelOpen !== undefined) ? appConfig?.isLeftPanelOpen : true;
    this.renderer.addClass(document.body, this.bodyClass);
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  /**
   * Toggles the visibility of the sidebar.
   */
  sidebarToggle() {
    this.sidebar = !this.sidebar;
    this.localStorageService.updateLocalStorage({isLeftPanelOpen: this.sidebar});
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
    this.updateSidebarClass();
  }

  private updateSidebarClass() {
    if (this.sidebar && window.innerWidth <= 992) {
      this.renderer.addClass(document.body, this.bodyClass2);
    } else {
      this.renderer.removeClass(document.body, this.bodyClass2);
    }
  }
  
  /**
   * Hides or shows the sidebar based on the screen width and user action.
   * @param event - Boolean value indicating if the sidebar should be shown or hidden.
   */
  hideLeftBar(event: boolean) {
    if (window.innerWidth <= 992) {
      this.sidebar = event;
      if (this.sidebar) {
        this.renderer.addClass(document.body, this.sidebarClass);
      } else {
        this.renderer.removeClass(document.body, this.sidebarClass);
      }
    }
  }

  /**
   * Adjusts the sidebar visibility based on window resize events.
   * @param event - The resize event containing the new window size.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 993) {
      this.renderer.removeClass(document.body, this.sidebarClass);
      this.sidebar = false;
    } else {
      this.renderer.addClass(document.body, this.sidebarClass);
      this.sidebar = true;
    }
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
