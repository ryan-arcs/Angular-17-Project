import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { UserProfile } from '@app/common/interfaces/global.interface';
import { UserProfileService } from '@app/common/services/user-profile.service';
import { TableauGlobalDataServiceNew } from '../services';
import { Subscription } from 'rxjs';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import {
  EnvironmentProject,
  FilterState,
  TableauPersona,
  TableauProject,
  TableauView,
} from '../interfaces';
import { Router } from '@angular/router';
import { AuthService } from '@app/common/services/auth.service';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { FormsModule } from '@angular/forms';
import { ViewTileComponent } from '../components/view-tile/view-tile.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header/header.component';

const defaultEnvProjectFilterState = {
  globalSearch: '',
  dateFilters: {
    modifiedAfter: '',
    modifiedBefore: '',
    createdAfter: '',
    createdBefore: '',
  },
  sorting: {
    dir: 'asc',
    prop: 'name',
  },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgbTooltipModule,
    NgbDropdownModule,
    FormsModule,
    HeaderComponent,
    ViewTileComponent,
    CommonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnDestroy, OnInit {
  userProfile?: UserProfile;
  isBannerExpanded = false;
  sidebar: boolean = false;
  sidebarClass = 'sidebar-open-outer';
  tableauPersonas?: Array<TableauPersona>;
  selectedTableauPersonaFull?: any;
  selectedTableauPersonaFullBkp?: any;
  selectedTableauPersona?: string;
  personaErrorMessage = '';
  personaErrorDescription = '';
  errorMessage = '';
  errorDescription = '';
  environmentProjects?: Record<string, EnvironmentProject>;
  environmentProjectsBKP?: Record<string, EnvironmentProject>;
  envProjectFilterState: FilterState = defaultEnvProjectFilterState;
  calwindowheight: number = 0
  
  private subscriptions: Subscription = new Subscription();
  @ViewChild('myElement') myElement!: ElementRef;

  viewCount: number = 4
  constructor(
    private userProfileService: UserProfileService,
    private renderer: Renderer2,
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private router: Router,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    private modalService: NgbModal,
  ) { }

  /**
   * Angular lifecycle hook that is called after the component's data-bound properties are initialized.
   * Initializes sidebar state, retrieves user and persona data, and subscribes to project and global view observables.
   * Updates the UI and internal state based on received data streams.
   */
  async ngOnInit(): Promise<void> {

    if (this.tableauGlobalDataService.reloadData('initial-package')) {
      await this.tableauGlobalDataService.loadInitialPackage();
    }
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = appConfig?.isLeftPanelOpen ?? true;
    this.isBannerExpanded = appConfig?.isBannerExpanded ?? true;
    if (this.sidebar && !this.selectedTableauPersonaFull?.id) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }

    this.userProfile = this.userProfileService.getLoggedInUserDetails();
    const watchEnvironmentProjects =
      this.tableauGlobalDataService.environmentProjects$.subscribe({
        next: (environmentProjects) => {
          
          this.environmentProjects = this.environmentProjectsBKP = {};
          if (environmentProjects) {
            this.environmentProjects = environmentProjects;
            this.environmentProjectsBKP = structuredClone(
              this.environmentProjects,
            );
            this.errorMessage = '';
            this.errorDescription = '';
            this.watchTableauPersonas();
            if (
              environmentProjects &&
              !Object.keys(this.environmentProjects)?.length
            ) {
              this.errorMessage = 'No reports found!';
              this.errorDescription =
                'No matching reports found or available to you.';
            }
            this.expandAndCollapse({
              expandAll: true,
              collapseAll: false
            })

          }
        },
      });

    this.subscriptions.add(watchEnvironmentProjects);
    const watchSelectedTableauPersona =
      this.userProfileService.loggedInUserData$.subscribe({
        next: () => {
          this.selectedTableauPersona =
            this.tableauGlobalDataService.retrieveTableauPersona() as string;
          if (this.selectedTableauPersona != 'Home') {
            this.tableauGlobalDataService.toggleSlider(false);
          }
          this.watchTableauPersonas();
        },
      });
    this.subscriptions.add(watchSelectedTableauPersona);

    this.subscriptions.add(
      this.userProfileService.loggedInUserData$.subscribe(() => {
        this.actionsPerformedOnEnvironmentChange();
      }),
    );
    this.tableauGlobalDataService.toggleSlider(false)
    window.addEventListener('load', () => {
      this.checkWindowHeight();
    });
    this.tableauGlobalDataService.toggleSubLeftSlider(false);
    // const defaultState = {
    //   "dateFilters": {
    //     "modifiedAfter": "",
    //     "modifiedBefore": "",
    //     "createdAfter": "",
    //     "createdBefore": ""
    //   },
    //   "globalSearch": "",
    //   "sortBy": {
    //     "order": "Ascending",
    //     "sort": "name"
    //   }
    // }
    // this.filter(defaultState);
  }

  ngAfterViewInit() {
    this.checkWindowHeight();
  }

  isObjectEmpty(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!this.isObjectEmpty(obj[key])) {
          return false;
        }
      } else if (obj[key]) {
        return false;
      }
    }
    return true;
  }

  getEnvironmentProjectNames() {
    return Object.keys(this.environmentProjects || {}) || [];
  }

  /**
   * Subscribes to the tableauPersonas$ observable from the global data service.
   * When personas are available, it filters and maps reports within the selected persona,
   * enriching them with name and workbook data from local views.
   * Sets the selected full persona and manages sidebar visibility based on persona state.
   */
  watchTableauPersonas(){
    const watchTableauPersonas =
      this.tableauGlobalDataService.tableauPersonas$.subscribe({
        next: (tableauPersonas) => {
          if(tableauPersonas){
            this.tableauPersonas = structuredClone(tableauPersonas) ;
            if (this.selectedTableauPersona && this.selectedTableauPersona !== 'Home') {
              const thisPersona = this.tableauPersonas?.find(
                (persona) => persona.name === this.selectedTableauPersona,
              );
              if (thisPersona?.name) {
                let views = Object.values(this.environmentProjectsBKP || {}).flatMap(project => project.views) || [];
                const personaReports = thisPersona?.reports as Array<string> || [];
                thisPersona.fullReports = views.filter((view): view is TableauView => {
                  return !!(view && personaReports?.includes(view.id));
                }) || [];
                this.selectedTableauPersonaFull = thisPersona;
  
                this.selectedTableauPersonaFullBkp = structuredClone(this.selectedTableauPersonaFull);
               
                this.personaErrorMessage = this.personaErrorDescription = '';
                if(!this.selectedTableauPersonaFull?.fullReports?.length){
                  this.personaErrorMessage =  'No reports found!';
                  this.personaErrorDescription =  'No matching reports found or available to you.';
                }
              }
            }
 
            const envProjectFilterState = this.tableauGlobalDataService.getFilterStateForProject(this?.selectedTableauPersona || '');
            this.envProjectFilterState = envProjectFilterState || defaultEnvProjectFilterState;
           
            // Apply filters based on the current state
            if (!this.isObjectEmpty(this.envProjectFilterState)) {
              this.applyFilters(this.envProjectFilterState);
            }
          }
        },
      });
    this.subscriptions.add(watchTableauPersonas);
  }

  /**
   * Centralized method to apply filters to the environment projects
   * Handles global search, date filters, and sorting
   */
  private applyFilters(filterState?: any) {
    if (this.selectedTableauPersona?.toLowerCase() === 'home') {
      if (!this.environmentProjectsBKP) return;
      this.environmentProjects = structuredClone(this.environmentProjectsBKP);
      const result: Record<string, EnvironmentProject> = {};

      Object.entries(this.environmentProjectsBKP).forEach(([key, project]) => {
        const filteredViews = this.tableauGlobalDataService.applyFilter(
          project.views || [],
          filterState,
        );
        if (filteredViews.length > 0) {
          result[key] = {
            ...project,
            views: filteredViews,
          };
        }
      });
      this.environmentProjects = result;
      // Update error message
      this.errorMessage = !Object.keys(this.environmentProjects).length
        ? 'No reports found!'
        : '';
    } else {
      if (!this.selectedTableauPersonaFullBkp) return;
      this.selectedTableauPersonaFull = structuredClone(
        this.selectedTableauPersonaFullBkp,
      );
      let tableauPersonaReports = {};
      const filteredViews = this.tableauGlobalDataService.applyFilter(
        this.selectedTableauPersonaFullBkp?.fullReports || [],
        filterState,
      );
      if (filteredViews.length > 0) {
        tableauPersonaReports = {
          ...this.selectedTableauPersonaFull,
          fullReports: filteredViews,
        };
      }
      this.selectedTableauPersonaFull = tableauPersonaReports;
      // Update error message
      this.personaErrorMessage = !this.selectedTableauPersonaFull?.fullReports
        ?.length
        ? 'No reports found!'
        : '';
    }
  }

  // Handles search input event to filter displayed projects and views
  onSearchFilter(event: any): void {
    const searchTerm = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();

    // Update filter state
    this.tableauGlobalDataService.updateFilterState(
      this.selectedTableauPersona || '',
      {
        globalSearch: searchTerm,
        dateFilters: this.envProjectFilterState.dateFilters,
        sorting: this.envProjectFilterState.sorting,
      },
    );

    // Update local state
    this.envProjectFilterState = {
      ...this.envProjectFilterState,
      globalSearch: searchTerm,
    };

    // Apply filters
    this.applyFilters({
      globalSearch: searchTerm,
      dateFilters: this.envProjectFilterState.dateFilters,
      sorting: this.envProjectFilterState.sorting,
    });
  }

  // Checks if a project has more than 4 views to allow "See All" functionality
  canSeeAllViews(envPrName: string) {
    const thisViews = this.environmentProjects?.[envPrName]?.views || [];
    return thisViews?.length > 4;
  }

  handleCanSeeAll(event: Event, envPrName: string) {
    event.stopPropagation();
    if (
      this.environmentProjects?.[envPrName] &&
      this.environmentProjectsBKP?.[envPrName]
    ) {
      this.environmentProjects[envPrName].seeAll =
        !this.environmentProjects?.[envPrName]?.seeAll;
      this.environmentProjectsBKP[envPrName].seeAll =
        !this.environmentProjectsBKP?.[envPrName]?.seeAll;
    }
  }

  // Returns the thumbnail image for a view, or a default image if not available
  displayThumbnail(view?: TableauView) {
    return view?.thumbnail || '/assets/images/ubi.svg';
  }

  // Handles window resize to automatically collapse sidebar on small screens
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkWindowHeight();
    if (event.target.innerWidth < 993) {
      this.renderer.removeClass(document.body, this.sidebarClass);
      this.sidebar = false;
    }
  }

  // Toggles the sidebar visibility and updates local storage
  sidebarToggle(forceAction?: boolean) {
    this.sidebar = forceAction !== undefined ? forceAction : !this.sidebar;
    this.localStorageService.updateLocalStorage({
      isLeftPanelOpen: this.sidebar,
    });
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  // Navigates to the project details page
  navigateToProjects(project: TableauProject) {
    this.router.navigate([`ubi/projects/${project.id}`]);
  }

  // Checks if the current user has permission to access a given module
  hasAccessToModule(module: string) {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'ubi',
      moduleSlug: module,
      permissionSlug: 'view',
      ignoreRedirection: true,
    });
  }

  /**
   * Opens the filter modal and applies date filters upon submission
   */
  // onFilter() {
  //   const modalRef = this.modalService.open(FilterComponent, {
  //     windowClass: 'sidebar-small',
  //   });
  //   modalRef.componentInstance.dateFilter =
  //     this.envProjectFilterState.dateFilters;
  //   modalRef.closed.subscribe((result) => {
  //     if (result.action === 'SUBMIT') {
  //       this.tableauGlobalDataService.updateFilterState(
  //         this.selectedTableauPersona || '',
  //         {
  //           dateFilters: result.data.dateFilters,
  //           globalSearch: this.envProjectFilterState.globalSearch,
  //           sorting: this.envProjectFilterState.sorting,
  //         },
  //       );

  //       // Update local state
  //       this.envProjectFilterState = {
  //         ...this.envProjectFilterState,
  //         dateFilters: result.data.dateFilters,
  //       };

  //       // Apply filters
  //       this.applyFilters({
  //         dateFilters: result.data.dateFilters,
  //         globalSearch: this.envProjectFilterState.globalSearch,
  //         sorting: this.envProjectFilterState.sorting,
  //       });
  //     }
  //   });
  // }

  /**
   * Applies sorting to the environment projects
   * @param direction The sort direction ('asc' or 'desc')
   */
  onSorting(direction: 'asc' | 'desc' = 'asc') {
    const sortingState = {
      dir: direction,
      prop: direction === 'asc' ? 'Ascending' : 'Descending',
    };

    // Update filter state
    this.tableauGlobalDataService.updateFilterState(
      this.selectedTableauPersona || '',
      {
        sorting: sortingState,
        dateFilters: this.envProjectFilterState.dateFilters,
        globalSearch: this.envProjectFilterState.globalSearch,
      },
    );

    // Update local state
    this.envProjectFilterState = {
      ...this.envProjectFilterState,
      sorting: sortingState,
    };

    // Apply filters
    this.applyFilters({
      sorting: sortingState,
      dateFilters: this.envProjectFilterState.dateFilters,
      globalSearch: this.envProjectFilterState.globalSearch,
    });
  }

  get isDateFilterActive(): boolean {
    const filters = this.envProjectFilterState.dateFilters;
    return !!(
      filters?.modifiedAfter ||
      filters?.modifiedBefore ||
      filters?.createdAfter ||
      filters?.createdBefore
    );
  }

  getBannerState() {
    this.isBannerExpanded = !this.isBannerExpanded;
    this.localStorageService.updateLocalStorage({
      isBannerExpanded: this.isBannerExpanded,
    });
  }

  getDateFilterLength() {
    const filters = this.envProjectFilterState.dateFilters || {};
    return Object.values(filters).filter((filter) => filter).length;
  }

  actionsPerformedOnEnvironmentChange() {
    const envProjectFilterState =
      this.tableauGlobalDataService.getFilterStateForProject(
        this?.selectedTableauPersona || '',
      );
    this.envProjectFilterState =
      envProjectFilterState || defaultEnvProjectFilterState;
  }

  refreshHome() {
    this.tableauGlobalDataService.loadInitialPackage();
  }

  isPersonaSelected() {
    return !(!this.selectedTableauPersona || (this.selectedTableauPersona && this.selectedTableauPersona?.toLowerCase() === 'home')
    );
  }

  onPersonaChange(selectedTableauPersona: string) {
    const envProjectFilterState =
      this.tableauGlobalDataService.getFilterStateForProject(
        selectedTableauPersona || '',
      );
    this.envProjectFilterState =
      envProjectFilterState || defaultEnvProjectFilterState;
  }

  cardCount(cardCount: number) {
    this.viewCount = cardCount
  }

  expandAndCollapse(event: any) {
    if (this.environmentProjects && this.environmentProjectsBKP) {
      if (event?.expandAll) {
        Object.keys(this.environmentProjects).forEach((key: string) => {
          if (this.environmentProjects?.[key] && this.environmentProjectsBKP?.[key]) {
            this.environmentProjectsBKP[key].showViews = true
            this.environmentProjects[key].showViews = true;
          }
        });
      }
      if (event?.collapseAll) {
        Object.keys(this.environmentProjects).forEach((key: string) => {
          if (this.environmentProjects?.[key] && this.environmentProjectsBKP?.[key]) {
            this.environmentProjects[key].showViews = false;
            this.environmentProjectsBKP[key].showViews = true
          }
        });
      }
    }
  }

  filter(event: any) {
    const globalSearch = (event?.globalSearch || '').toLowerCase();
    this.applyFilters(
      {
        sorting:{
          dir: event?.sortBy?.order,
          prop: event.sortBy?.sort
        },
        dateFilters: event?.dateFilters || {},
        globalSearch: event?.globalSearch || '',
      }
    )
 
    this.tableauGlobalDataService.updateFilterState(this.selectedTableauPersona || '', 
    {
      globalSearch: globalSearch,
      dateFilters: event?.dateFilters || {},
      itemCount: this.viewCount,
      sorting:{
        dir: event?.sortBy?.order,
        prop: event.sortBy?.sort
      }
    })
  }

  toggleExpand(projectName: string) {
    if (
      this.environmentProjects?.[projectName] &&
      this.environmentProjectsBKP?.[projectName]
    ) {
      const newState = !this.environmentProjects[projectName].showViews;
      this.environmentProjects[projectName].showViews = this.environmentProjectsBKP[projectName].showViews = newState;
    }
  }


  checkWindowHeight() {
    this.calwindowheight = this.myElement?.nativeElement?.offsetHeight;
  }

  getLengthofView(views?: TableauView[]) {
    return views?.length as number > 4;
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.unsubscribe();
  }
}
