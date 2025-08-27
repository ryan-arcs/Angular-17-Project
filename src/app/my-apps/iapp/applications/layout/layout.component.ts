import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { IappGlobalDataService } from 'src/app/my-apps/iapp/services';
import { LeftSidebarComponent } from '../../components/left-sidebar/left-sidebar.component';
import { UIService } from '@app/common/services/ui.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, LeftSidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebar: boolean = true;
  bodyClass: string = 'custom-oh';
  @ViewChild('leftPanelContent') leftPanelContent!: TemplateRef<any>;
  
  constructor(
    private route: ActivatedRoute,
    private iappGlobalDataService: IappGlobalDataService,
    private renderer: Renderer2,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.bodyClass);
    } else {
      this.renderer.removeClass(document.body, this.bodyClass);
    }
    this.renderer.addClass(document.body, 'font-medium');
  }

  // Update the header dropdown content after the view is initialized
  ngAfterViewInit(): void {
    this.uiService.updateleftPanelContent(this.leftPanelContent);
  }

  // Toggles the sidebar visibility
  sidebarToggle() {
    this.sidebar = !this.sidebar;
    if (!this.sidebar) {
      this.renderer.removeClass(document.body, this.bodyClass);
    } else {
      this.renderer.addClass(document.body, this.bodyClass);
    }
  }

  // Hides the sidebar if the window width is 992px or less
  hideLeftBar(event: boolean) {
    if (window.innerWidth <= 992) {
      this.sidebar = event;
      this.renderer.removeClass(document.body, this.bodyClass);
    } else if (window.innerWidth > 992) {
      this.renderer.addClass(document.body, this.bodyClass);
    }
  }

  // Adjusts sidebar visibility based on window resize events

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 993) {
      this.sidebar = false;
      this.renderer.removeClass(document.body, this.bodyClass);
    } else {
      this.sidebar = true;
      this.renderer.addClass(document.body, this.bodyClass);
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, this.bodyClass);
    this.uiService.updateleftPanelContent(null)
  }
}
