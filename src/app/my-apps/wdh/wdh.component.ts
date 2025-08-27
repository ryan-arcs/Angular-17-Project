import { Component, HostListener, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UIService } from '@app/common/services/ui.service';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { LeftSidebarComponent } from '@app/my-apps/wdh/components/left-sidebar/left-sidebar.component'

@Component({
  selector: 'app-wdh',
  standalone: true,
  imports: [RouterOutlet, LeftSidebarComponent],
  templateUrl: './wdh.component.html',
  styleUrl: './wdh.component.scss',
})
export class WdhComponent implements OnInit {
  sidebar: boolean = true;
  bodyClass: string = 'wdh-outer';
  sidebarClass = 'sidebar-open-outer';
  @ViewChild('leftPanelContent') leftPanelContent!: TemplateRef<any>;

  constructor(
    private renderer: Renderer2,
    private localStorageService: LocalStorageService,
    private uiService: UIService,

  ) {
    // this.globalService.getUsers();
  }

  ngOnInit(): void {
    // this.globalService.getUsers(tableName);
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = (appConfig?.isLeftPanelOpen !== undefined) ? appConfig?.isLeftPanelOpen : true;
    this.renderer.removeClass(document.body, 'schedules-outer');
    this.renderer.addClass(document.body, this.bodyClass);
      const font = localStorage.getItem('font-size') || 'font-medium';
    this.renderer.addClass(document.body, font);
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }
  ngAfterViewInit(): void {
    this.uiService.updateleftPanelContent(this.leftPanelContent);
  }


  sidebarToggle() {
    this.sidebar = !this.sidebar;
    this.localStorageService.updateLocalStorage({isLeftPanelOpen: this.sidebar});
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

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
    this.uiService.updateleftPanelContent(null)

  }
}
