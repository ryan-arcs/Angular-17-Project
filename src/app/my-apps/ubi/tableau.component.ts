import { AfterViewInit, Component, ElementRef, HostListener, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderService } from '@app/common/services/header.service';
import { TableauGlobalDataServiceNew } from './services';
import { Subscription } from 'rxjs';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { UserProfileService } from '@app/common/services/user-profile.service';
import { ReportSidebarComponent } from './components/report-sidebar/report-sidebar.component';
import { UIService } from '@app/common/services/ui.service';
import { AuthService } from '@app/common/services/auth.service';
import { FormsModule } from '@angular/forms';
import { EnvironmentProject } from './interfaces';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
@Component({
  selector: 'app-tableau',
  standalone: true,
  imports: [RouterOutlet, NgbDropdownModule, ReportSidebarComponent, NgbTooltipModule, FormsModule, CommonModule, LeftSidebarComponent],
  templateUrl: './tableau.component.html',
  styleUrl: './tableau.component.scss',
})
export class TableauComponent implements AfterViewInit {
  @ViewChild('personaSelectionDropdown') personaSelectionDropdown!: TemplateRef<any>;
  @ViewChild('leftPanelContent') leftPanelContent!: TemplateRef<any>;
  @ViewChildren('myElement') myElement!: QueryList<ElementRef>;

  environmentProjects?: Record<string, EnvironmentProject>;
  sidebar: boolean = true;
  bodyClass = 'tableau-outer';
  newDesignBodyClass = 'tableau-new-design'
  subscriptions = new Subscription();
  environments: string[] = [];
  selectedEnvironment = '';
  subLeftPanelState = '';
  selectedTableauPersona = '';
  isLeftsidebaricon = true;
  addellipsis = false
  addellipsisMap: { [key: string]: boolean } = {};
  constructor(
    private renderer: Renderer2,
    private headerService: HeaderService,
    public tableauGlobalDataService: TableauGlobalDataServiceNew,
    private userProfileService: UserProfileService,
    private uiService: UIService,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {
    this.tableauGlobalDataService.sliderState$.subscribe(state => {
      this.isLeftsidebaricon = state;
    });
  }

  ngOnInit(): void {

    this.subscriptions.add(
      this.router.events.subscribe((value) => {
        if (value instanceof NavigationEnd) {
          //for home and projects page
          this.setSubLeftpanelState(value.url);
        }
      })
    );
    // on refresh check route
    this.setSubLeftpanelState(this.router.url);

    this.subscriptions.add(
      this.userProfileService.loggedInUserData$.subscribe({
        next: () => {
          this.selectedTableauPersona = this.tableauGlobalDataService.retrieveTableauPersona() as string;
        },
      })
    )

    this.subscriptions.add(
      this.tableauGlobalDataService.environments$.subscribe({
        next: (environments) => {
          if (environments) {
            this.environments = environments;
          }
        },
      })
    )

    this.subscriptions.add(
      this.tableauGlobalDataService.environmentProjects$.subscribe((environmentProjects) => {
        this.environmentProjects = environmentProjects || undefined;
      })
    );


    this.subscriptions.add(
      this.userProfileService.loggedInUserData$.subscribe(() => {
        const selectedEnvironment = this.userProfileService.getAppConfig('ubi')?.environment;
        if (selectedEnvironment) {
          this.selectedEnvironment = selectedEnvironment;
        }
      })
    )

    // Add a class to the document body for styling
    // const theme = localStorage.getItem('app-theme') || 'nds-light-blue';
    const font = localStorage.getItem('font-size') || 'font-medium';
    // this.renderer.addClass(document.body, theme);
    this.renderer.addClass(document.body, font);
    this.renderer.addClass(document.body, this.bodyClass);
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = appConfig?.isLeftPanelOpen ?? true;
    this.renderer.addClass(document.body, this.newDesignBodyClass);
    this.tableauGlobalDataService.toggleSubLeftSlider(false);
  }

  // Update the header dropdown content after the view is initialized
  ngAfterViewInit(): void {
    this.headerService.updateDropdownContent(this.personaSelectionDropdown);
    this.uiService.updateleftPanelContent(this.leftPanelContent);
    this.checkWidth()
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

  setSubLeftpanelState(url: string) {
    this.subLeftPanelState = '';
    if (url.includes('/ubi/home') || (url.includes('/ubi/projects/') && !url.includes('/views/'))) {
      this.subLeftPanelState = 'home';
    }
    if ((url.includes('/ubi/projects/') && url.includes('/views/'))) {
      this.subLeftPanelState = 'view';
    }

    // hide for other routes
    if (!this.subLeftPanelState) {
      this.tableauGlobalDataService.toggleSlider(false);
    }
  }

  // toggleSubPanel() {
  //   this.localStorageService.updateLocalStorage({ isLeftPanelOpen: this.sidebar });
  //   this.tableauGlobalDataService.toggleSlider();
  //   this.checkWidth()
  // }

  @HostListener('window:resize')
  onResize() {
    this.checkWidth(); // Check again when window resizes
  }

  checkWidth() {
    this.myElement.forEach((el, index) => {
      const width = el.nativeElement.offsetWidth;
      this.addellipsisMap[index] = width >= 160;
    });
  }


  // Remove body class, clear dropdown, and unsubscribe to avoid memory leaks
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, this.bodyClass);
    this.renderer.removeClass(document.body, this.newDesignBodyClass);
    this.headerService.updateDropdownContent(null);
    this.uiService.updateleftPanelContent(null)
    this.subscriptions.unsubscribe();
  }
}
