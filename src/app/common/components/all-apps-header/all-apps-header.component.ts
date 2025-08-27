import { AfterViewInit, Component, ElementRef, ViewChild, EventEmitter, HostListener, Output, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { PermittedApplication } from '@app/common/interfaces/global.interface';
import { PermittedApplicationService } from '@app/common/services/permitted-appolication.service';
import { UIService } from '@app/common/services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-all-apps-header',
  standalone: true,
  imports: [],
  templateUrl: './all-apps-header.component.html',
  styleUrl: './all-apps-header.component.scss'
})
export class AllAppsHeaderComponent implements AfterViewInit {
  @ViewChild('popupContainer') popupContainerRef!: ElementRef<HTMLElement>;
  @Output() toggleDropDown = new EventEmitter<void>();
  apps: Array<PermittedApplication> = [];
  permittedApplicationsSubscription: Subscription | undefined;
  currentRunningApp: any;

  constructor(
    private router: Router,
    private uiService: UIService,
    private renderer: Renderer2,
    private permittedApplicationService: PermittedApplicationService
  ){}

  ngOnInit(): void {
    this.permittedApplicationsSubscription =
    this.permittedApplicationService.permittedApplications$.subscribe({
      next: (applications) => {
        this.setApplications(applications || []);
      },
    });
    this.uiService.currentRouteDetails$.subscribe((value)=>{
      this.currentRunningApp = value?.url;
    })
  }

  ngAfterViewInit(): void {
    this.updateVerticalScrollClass();
  }
 
  setApplications(applications: PermittedApplication[]) {
    this.apps = applications?.sort((a: any, b: any) => {
      if (a.sortOrder < b.sortOrder) return -1;
      if (a.sortOrder > b.sortOrder) return 1;
      return 0;
    }) || [];
  }

  navigateToApps(app: PermittedApplication): void {
    const appSlug = app.slug.toLowerCase().replace(/[_ ]/g, '-');
    if(this.currentRunningApp.includes(appSlug)){
      this.router.navigate([
        `${appSlug}`,
      ]);
    }
    else{
      window.open(`${appSlug === 'ubi' ? 'ubi' : appSlug}`, '_blank');
    }
    this.toggleDropDown.emit();
  }

  isNameIsLarger(app: any){
    return app?.name?.length && app?.name?.length > 10;
  }

  updateVerticalScrollClass(): void {
    const popupContainer: any = this.popupContainerRef?.nativeElement;
    if (!popupContainer) return;
    const hasVerticalScroll = popupContainer.scrollHeight > popupContainer.clientHeight;
    if (!hasVerticalScroll) {
      this.renderer.addClass(popupContainer, 'without-scroll');
    } else {
      this.renderer.removeClass(popupContainer, 'without-scroll');
    }
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.updateVerticalScrollClass();
  }


  ngOnDestroy(): void {
    if (this.permittedApplicationsSubscription) {
      this.permittedApplicationsSubscription.unsubscribe();
    }
  }
}
