import { ChangeDetectorRef, Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { TableauGlobalDataServiceNew } from '../services';
import { EnvironmentProject, FilterState, TableauView } from '../interfaces';
import { ActivatedRoute } from '@angular/router';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FilterComponent } from '../components/filter/filter/filter.component';
import { FormsModule } from '@angular/forms';
import { ViewTileComponent } from '../components/view-tile/view-tile.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    NgbTooltipModule,
    NgbDropdownModule,
    ViewTileComponent,
    FormsModule,
    CommonModule,
    HeaderComponent
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit {
  project?: EnvironmentProject;
  projectBkp?: EnvironmentProject;
  views: Array<TableauView> = [];
  sidebar: boolean = true;
  sidebarClass = 'sidebar-open-outer';
  environmentProjectId?: string;
  errorMessage = '';
  errorDescription = '';
  projectFilterState: FilterState = {
    globalSearch: '',
    dateFilters: {
      modifiedAfter: '',
      modifiedBefore: '',
      createdAfter: '',
      createdBefore: ''
    },
    sorting: {
      dir: 'asc',
      prop: 'name'
    }
  }
  viewCount = 4;
  isLeftSliderOpen:boolean=false
  constructor(
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private localStorageService: LocalStorageService,
    private modalService: NgbModal
  ) {
    this.tableauGlobalDataService.leftsiderbar$.subscribe(state => {
      this.isLeftSliderOpen = state;
    });
   }

  /**
   * Checks permissions and subscribes to application results.
   */

  async ngOnInit(): Promise<void> {
    if (this.tableauGlobalDataService.reloadData('initial-package')) {
      await this.tableauGlobalDataService.loadInitialPackage();
    }
    this.route.params.subscribe(async (params) => {
      this.views = [];
      this.environmentProjectId = params['id'];
      if (this.environmentProjectId) {

        const project = this.tableauGlobalDataService.getLocalEnvironmentProject({
          projectId: this.environmentProjectId,
        });
        if (project) {
          this.project = project;
          this.projectBkp = structuredClone(this.project);
        }
        this.views = this.project?.views || [];
        const projectFilterState = this.tableauGlobalDataService.getFilterStateForProject(this.environmentProjectId || '');
        this.projectFilterState = projectFilterState || {
          globalSearch: '',
          dateFilters: {
            modifiedAfter: '',
            modifiedBefore: '',
            createdAfter: '',
            createdBefore: ''
          },
          sorting: {
            dir: 'asc',
            prop: 'name'
          }
        };
        // Apply filters based on the current state
        this.applyFilters(this.projectFilterState);

        this.errorMessage = this.views && !this.views?.length ? 'No reports found!' : '';
        this.errorDescription = this.views && !this.views?.length ? 'No matching reports found or available to you.' : '';
        this.cdr.detectChanges();
      }
    });
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = appConfig?.isLeftPanelOpen ?? true;
    this.renderer[this.sidebar ? 'addClass' : 'removeClass'](document.body, this.sidebarClass);
    this.tableauGlobalDataService.toggleSubLeftSlider(false);
  }

  // Returns the thumbnail URL for the given view or a default image if not present.
  displayThumbnail(view?: TableauView) {
    return view?.thumbnail || 'assets/images/tableau.png';
  }

  // Handles sidebar visibility on window resize events
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

  // Toggles the visibility of the sidebar and updates the body class accordingly
  sidebarToggle() {
    this.sidebar = !this.sidebar;
    this.localStorageService.updateLocalStorage({ isLeftPanelOpen: this.sidebar });
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  // Centralized method to apply filters
  private applyFilters(filterState?: any) {
    if (!this.projectBkp) return;

    this.views = this.projectBkp.views || [];
    // Apply global search
    this.views = this.tableauGlobalDataService.applyFilter(this.views, filterState);

    // Update project with filtered views
    this.project = {
      ...this.projectBkp,
      views: this.views,
    };

    // Update error message
    this.errorMessage = !this.views.length ? 'No reports found!' : '';
  }

  onFilter() {
    const modalRef = this.modalService.open(FilterComponent,
      {
        windowClass: 'sidebar-small',
      },
    );
    modalRef.componentInstance.dateFilter = this.projectFilterState.dateFilters;
    modalRef.closed.subscribe((result) => {
      if (result.action === 'SUBMIT') {
        this.tableauGlobalDataService.updateFilterState(
          this.environmentProjectId || '',
          {
            dateFilters: result.data.dateFilters,
            globalSearch: this.projectFilterState.globalSearch,
            sorting: this.projectFilterState.sorting
          }
        );
        this.projectFilterState = {
          ...this.projectFilterState,
          dateFilters: result.data.dateFilters
        };
        // Apply filters
        this.applyFilters({
          dateFilters: result.data.dateFilters,
          globalSearch: this.projectFilterState.globalSearch,
          sorting: this.projectFilterState.sorting
        });
      }
    });
  }

  onSorting(direction: 'asc' | 'desc' = 'asc') {
    const sortingState = {
      dir: direction,
      prop: 'name'
    };
    // Update filter state
    this.tableauGlobalDataService.updateFilterState(
      this.environmentProjectId || '',
      {
        sorting: sortingState,
        globalSearch: this.projectFilterState.globalSearch,
        dateFilters: this.projectFilterState.dateFilters
      }
    );
    // Update local state
    this.projectFilterState = {
      ...this.projectFilterState,
      sorting: sortingState
    };

    // Apply filters
    this.applyFilters({
      sorting: sortingState,
      globalSearch: this.projectFilterState.globalSearch,
      dateFilters: this.projectFilterState.dateFilters
    });
  }

  get isDateFilterActive(): boolean {
    const filters = this.projectFilterState.dateFilters;
    return !!(filters?.modifiedAfter || filters?.modifiedBefore || filters?.createdAfter || filters?.createdBefore);
  }
  getDateFilterLength() {
    const filters = this.projectFilterState.dateFilters || {};
    return Object.values(filters).filter((filter) => filter).length;
  }

  refreshProjects() {
    this.tableauGlobalDataService.loadInitialPackage();
  }

  cardCount(event: any) {
    this.viewCount = event;
  }

  filter(event: any){
    const globalSearch = (event?.globalSearch || '').toLowerCase();
 
    this.applyFilters(
      {
        sorting:{
          dir: event?.sortBy?.order,
          prop: event.sortBy?.sort
        },
        dateFilters: event?.dateFilters || {},
        globalSearch: globalSearch,
      }
    )

 
    this.tableauGlobalDataService.updateFilterState(this.environmentProjectId || '', {
      globalSearch: globalSearch,
      dateFilters: event?.dateFilters ,
      itemCount: this.viewCount,
      sorting:{
        dir: event?.sortBy?.order,
        prop: event.sortBy?.sort
      }
    })
  }

  toggleSubPanel() {
    this.localStorageService.updateLocalStorage({ isLeftPanelOpen: this.sidebar });
    this.tableauGlobalDataService.toggleSlider();
  }

  /**
   * Toggles the favorite status of a Tableau view.
   * 
   * - If the view is not currently a favorite, it will be added.
   * - If the view is already a favorite, it will be removed.
   * 
   * @param {TableauView} view - The Tableau view object to be added or removed from favorites.
   */
  toggleFavorite(view: TableauView) {
    this.tableauGlobalDataService.toggleFavorite(view);
  }
}
