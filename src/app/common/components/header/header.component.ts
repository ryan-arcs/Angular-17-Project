import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { ClickOutsideDirective } from '../../directives/click-outside/click-outside.directive';
import { Subject, takeUntil } from 'rxjs';
import { PermittedApplication, UserProfile } from '../../interfaces/global.interface';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UIService } from '../../services/ui.service';
import { UserProfileService } from '../../services/user-profile.service';
import { environment } from 'src/environments/environment';
import { Title } from '@angular/platform-browser';
import { HeaderService } from '@app/common/services/header.service';
import { CommonModule } from '@angular/common';
import { AllAppsHeaderComponent } from '../all-apps-header/all-apps-header.component';
import { PermittedApplicationService } from '@app/common/services/permitted-appolication.service';
 
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DropdownComponent, ClickOutsideDirective, NgbDropdownModule, CommonModule, AllAppsHeaderComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMobile: boolean = false;
  selectedSubApplication?: PermittedApplication;
  isMainPage = false;
  enviromentOptions = [
    {
      type: 'Dev',
      url: environment.devUrl,
    },
    {
      type: 'UAT',
      url: environment.uatUrl,
    },
    {
      type: 'Prod',
      url: environment.prodUrl,
    },
  ];
 
  private destroy$ = new Subject<void>();

  userData: UserProfile | undefined;
  showProfileDropdown = false;
  showAllAppsDropdown = false
  showHeader = false;
  dropdownContent?: TemplateRef<any> | null;
  permittedApplications: Array<PermittedApplication> = [];
  isMyAppsPage = false;
 
  constructor(
    private userProfileService: UserProfileService,
    private router: Router,
    private uiService: UIService,
    private titleService: Title,
    private headerService: HeaderService,
    private permittedApplicationService: PermittedApplicationService
  ) {
  }
 
  async ngOnInit(): Promise<void> {
    this.uiService.currentRouteDetails$.pipe(takeUntil(this.destroy$)).subscribe((routeDetails) => {
      
      if(routeDetails?.url) {
        this.showHeader = routeDetails?.pathParams?.['projectId']?.value && routeDetails?.pathParams?.['selectedViews']?.value ? false : true;
        this.isMyAppsPage = routeDetails?.url?.trim() === '/my-apps' ? true : false;

      }
    });
    

    this.headerService.dropdownContent$.pipe(takeUntil(this.destroy$)).subscribe((content)=>{
        this.dropdownContent = content;
    });

    this.userProfileService.loggedInUserData$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.userData = data;
      },
    });

    this.uiService.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
        this.isMobile = data;
      });

    this.permittedApplicationService.selectedSubApplication$.pipe(takeUntil(this.destroy$)).subscribe((subApplication) => {
      this.selectedSubApplication = subApplication || undefined;
      this.titleService.setTitle(this.selectedSubApplication?.name || 'XApps');
      this.setFavicon();
    });

    this.permittedApplicationService.permittedApplications$.pipe(takeUntil(this.destroy$)).subscribe((permittedApplications) => {
      this.permittedApplications = permittedApplications || [];
    });
  }

  setFavicon() {
    let faviconElement = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
    if (!faviconElement) {
      faviconElement = document.createElement('link');
      faviconElement.rel = 'icon';
      document.head.appendChild(faviconElement);
    }
    faviconElement.href = this.getSubApplicationLogo(this.selectedSubApplication?.logo);
  }

  toggleShowProfileDropdown() {
    if (!this.userData) return;
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  toggleShowAllAppsDropdown(){
    this.showAllAppsDropdown = !this.showAllAppsDropdown;
  }
 
  onClickOutsideProfileDropdown() {
    this.showProfileDropdown = false;
  }

  onClickOutsideAllAppsDropdown(){
    this.showAllAppsDropdown = false
  }
 
  navigateToMainPage() {
    
    if(this.selectedSubApplication?.slug){
      this.router.navigate([
        `${this.selectedSubApplication?.slug?.toLowerCase().replace(/[_ ]/g, '-')}`,
      ]);
      return;
    }
    this.router.navigate(['']);
  }
 
  getSubApplicationLogo(logo?: string){
    return `../../assets/images/${logo || 'xapps.svg'}`;
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  checkRoute() {
    return this.isMobile && window.location.pathname == '/iapp/applications';
  }
}