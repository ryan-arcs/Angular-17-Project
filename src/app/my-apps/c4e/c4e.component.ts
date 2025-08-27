import { Component, HostListener, OnInit, Renderer2, TemplateRef, ViewChild} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { LeftSidebarComponent } from '../c4e/components/left-sidebar/left-sidebar.component';
import { UIService } from '@app/common/services/ui.service';

@Component({
  selector: 'app-c4e',
  standalone: true,
  imports: [RouterOutlet, LeftSidebarComponent],
  templateUrl: './c4e.component.html',
  styleUrl: './c4e.component.scss'
})
export class C4eComponent implements OnInit {
  sidebar: boolean = true;
  bodyClass: string = 'c4e-outer';
  bodyClass1: string = 'c4e';
  sidebarClass = 'sidebar-open-outer';
  @ViewChild('leftPanelContent') leftPanelContent!: TemplateRef<any>;

  constructor(
    private renderer: Renderer2,
    private localStorageService: LocalStorageService,
        private uiService: UIService,
  ) {
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, this.bodyClass);
    this.renderer.addClass(document.body, this.bodyClass1);
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = (appConfig?.isLeftPanelOpen !== undefined) ? appConfig?.isLeftPanelOpen : true;
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
    this.uiService.updateleftPanelContent(null)
    this.renderer.removeClass(document.body, this.bodyClass);
    this.renderer.removeClass(document.body, this.bodyClass1);
  }
}
