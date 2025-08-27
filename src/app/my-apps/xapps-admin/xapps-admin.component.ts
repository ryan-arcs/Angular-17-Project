import { Component, HostListener, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UIService } from 'src/app/common/services/ui.service';
import { LeftPanelService, PanelState } from '@app/common/services/left-panel.service';
import { LeftSidebarComponent } from './components/common/left-sidebar/left-sidebar.component';
@Component({
  selector: 'app-xapps-admin',
  standalone: true,
  imports: [LeftSidebarComponent, RouterOutlet],
  templateUrl: './xapps-admin.component.html',
  styleUrl: './xapps-admin.component.scss'
})
export class XappsAdminComponent {
  sidebar: PanelState = 'EXPANDED';
  bodyClass1 = "xapps-admin-outer";
  bodyClass2 = "xapps-admin-sidebar-open";
  @ViewChild('leftPanelContent') leftPanelContent!: TemplateRef<any>;
  
  constructor(
    private renderer: Renderer2,
    private uiService: UIService,
    private leftPanelService: LeftPanelService,
    ) {
  }

  ngOnInit(): void {
    // this.uiService.refreshClassOnBody(this.renderer, this.bodyClass);
    this.renderer.addClass(document.body,this.bodyClass1);
    this.renderer.addClass(document.body,'font-medium');
    this.sidebar = this.leftPanelService.getPanelState();
    this.updateSidebarClass();
  }

   // Update the header dropdown content after the view is initialized
  ngAfterViewInit(): void {
    this.uiService.updateleftPanelContent(this.leftPanelContent);
  }

  /**
   * Toggles the visibility of the sidebar.
   */
   sidebarToggle() {
    this.sidebar = this.sidebar === 'EXPANDED' ? 'COLLAPSED' : 'EXPANDED';
    this.leftPanelService.setPanelState(this.sidebar);
    this.updateSidebarClass();
  }

  /**
   * Hides or shows the sidebar based on the screen width and user action.
   * @param event - Boolean value indicating if the sidebar should be shown or hidden.
   */
  hideLeftBar(event: boolean) {
    this.sidebar = event ? 'EXPANDED' : 'COLLAPSED';
    this.leftPanelService.setPanelState(this.sidebar);
    this.updateSidebarClass();
  }
  /**
   * Adjusts the sidebar visibility based on window resize events.
   * @param event - The resize event containing the new window size.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 993) {
      this.renderer.removeClass(document.body, this.bodyClass2);
      this.sidebar = 'COLLAPSED';
      this.updateSidebarClass();
    }
  }

  

  // Adds or removes a body class based on sidebar state and screen width (responsive behavior).
  private updateSidebarClass() {
    if (this.sidebar==='EXPANDED' && window.innerWidth <= 992) {
      this.renderer.addClass(document.body, this.bodyClass2);
    } else {
      this.renderer.removeClass(document.body, this.bodyClass2);
    }
  }


  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    this.renderer.removeClass(document.body,this.bodyClass1);
    this.renderer.removeClass(document.body,this.bodyClass2);
    this.uiService.updateleftPanelContent(null)

  }
}
