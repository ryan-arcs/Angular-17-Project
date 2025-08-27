import { Component, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { TableauGlobalDataServiceNew } from '../services';
import { FilterState, TableauView } from '../interfaces';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { FormsModule } from '@angular/forms';
import { FilterComponent } from '../components/filter/filter/filter.component';
import { ViewTileComponent } from '../components/view-tile/view-tile.component';
import { HeaderComponent } from '../components/header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recents',
  standalone: true,
  imports: [
    NgbTooltipModule,
    FormsModule,
    NgbDropdownModule,
    ViewTileComponent,
    HeaderComponent,
    CommonModule
],
  templateUrl: './recents.component.html',
  styleUrl: './recents.component.scss',
})
export class RecentsComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();
  sidebar: boolean = true;
  sidebarClass = 'sidebar-open-outer';
  recents: any[] = [];
  recentBkp: any[] = [];
  errorMessage = '';
  errorDescription = '';
  recentFilterState: FilterState = {
    globalSearch: '',
    dateFilters: {
      modifiedAfter: '',
      modifiedBefore: '',
      createdAfter: '',
      createdBefore: ''
    },
    sorting: {
      dir: '',
      prop: ''
    }
  }

  viewCount: number = 4;
  isLeftSliderOpen:boolean=false
  constructor(
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private router: Router,
    private renderer: Renderer2,
    private localStorageService: LocalStorageService,
    private modalService: NgbModal
  ) {}

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * 
   * - Subscribes to the user recents observable to populate the `recents` list with recent views
   *   that belong to a valid child project.
   * - Retrieves sidebar visibility preference from local storage and applies corresponding styles.
   */
  async ngOnInit(): Promise<void> {
    if (this.tableauGlobalDataService.reloadData('initial-package')) {
      await this.tableauGlobalDataService.loadInitialPackage();
    }
    if(this.tableauGlobalDataService.reloadData('user-recents')) {
      await this.tableauGlobalDataService.getRecentsOfUser();
    }
    const watchUserRecents =
      this.tableauGlobalDataService.userRecents$.subscribe({
        next: (recents) => {
          const environmentProjects = this.tableauGlobalDataService.getEnvironmentProjects();
          if(recents && environmentProjects){
            const views = Object.values(environmentProjects).flatMap(project => project.views);
            this.recents = recents?.reduce((acc: any, item) => {
              if (item.view?.id) {
                const thisView = views?.find(v => v?.id === item.view?.id);
                if (thisView?.id) {
                  acc.push(thisView);
                }
              }
              return acc;
            }, []) || [];
            this.recentBkp = structuredClone(this.recents);
            const recentFilterState = this.tableauGlobalDataService.getFilterStateForProject('recents');

            this.recentFilterState = recentFilterState || {
              globalSearch: '',
              dateFilters: {
                modifiedAfter: '',
                modifiedBefore: '',
                createdAfter: '',
                createdBefore: ''
              },
              sorting: {
                dir: '',
                prop: ''
              }
            };
            // Apply filters based on the current state
            if (!this.isObjectEmpty(this.recentFilterState)) {
              this.applyFilters(this.recentFilterState);
            }
          }
          if(recents && !this.recents?.length){
            this.errorMessage =  'No reports found!';
            this.errorDescription =  'No matching reports found or available to you.';
          }
        },
      });
    this.subscriptions.add(watchUserRecents);
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = (appConfig?.isLeftPanelOpen !== undefined) ? appConfig?.isLeftPanelOpen : true;
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
    this.tableauGlobalDataService.leftsiderbar$.subscribe(state => {
      this.isLeftSliderOpen = state;
    });
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
    this.localStorageService.updateLocalStorage({isLeftPanelOpen: this.sidebar});
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  // Refresh recents fetching data
  refreshRecents() {
    this.tableauGlobalDataService.getRecentsOfUser();
  }

  // Centralized method to apply filters
  private applyFilters(filterState?: any) {
    if (!this.recentBkp) return;

    this.recents = this.recentBkp || [];
    this.recents = this.tableauGlobalDataService.applyFilter(this.recentBkp || [], filterState);
    // Update error message
    this.errorMessage = !this.recents.length ? 'No reports found!' : '';
  }

  onSearchFilter(event: any): void {
    let searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    // Update filter state
    this.tableauGlobalDataService.updateFilterState(
      'recents', 
      { 
        globalSearch: searchTerm,
        dateFilters: this.recentFilterState.dateFilters,
        sorting: this.recentFilterState.sorting
      }
    );
    this.recentFilterState = {
      ...this.recentFilterState,
      globalSearch: searchTerm
    };
    // Apply filters
    this.applyFilters({ 
      globalSearch: searchTerm,
      dateFilters: this.recentFilterState.dateFilters,
      sorting: this.recentFilterState.sorting
    });
  }

  onFilter(){
    const modalRef = this.modalService.open(FilterComponent, 
      {
        windowClass: 'sidebar-small',
      },
    );
    modalRef.componentInstance.dateFilter = this.recentFilterState.dateFilters;
    modalRef.closed.subscribe((result) => {
      if (result.action === 'SUBMIT') {
        this.tableauGlobalDataService.updateFilterState(
          'recents', 
          { 
            dateFilters: result.data.dateFilters,
            globalSearch: this.recentFilterState.globalSearch,
            sorting: this.recentFilterState.sorting
          }
        );
        this.recentFilterState = {
          ...this.recentFilterState,
          dateFilters: result.data.dateFilters
        };
        // Apply filters
        this.applyFilters({ 
          dateFilters: result.data.dateFilters,
          globalSearch: this.recentFilterState.globalSearch,
          sorting: this.recentFilterState.sorting
        });
      }
    });
  }

  onSorting(direction: 'asc' | 'desc' = 'asc'){
    const sortingState = {
      dir: direction,
      prop : 'name'
    };
    // Update filter state
    this.tableauGlobalDataService.updateFilterState(
      'recents', 
      { 
        sorting: sortingState,
        globalSearch: this.recentFilterState.globalSearch,
        dateFilters: this.recentFilterState.dateFilters
      }
    );
    // Update local state
    this.recentFilterState = {
      ...this.recentFilterState,
      sorting: sortingState
    };

    // Apply filters
    this.applyFilters({ 
      sorting: sortingState,
      globalSearch: this.recentFilterState.globalSearch,
      dateFilters: this.recentFilterState.dateFilters
    });
  }

  get isDateFilterActive(): boolean {
    const filters = this.recentFilterState.dateFilters;
    return !!(filters?.modifiedAfter || filters?.modifiedBefore || filters?.createdAfter || filters?.createdBefore);
  }

  getDateFilterLength() {
    const filters = this.recentFilterState.dateFilters || {};
    return Object.values(filters).filter((filter) => filter).length;
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

  goToHomePage(){
    this.router.navigate(['ubi/home']);
  }

  expandAndCollapse(event: any){
  }

  cardCount(event: any){
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
        dateFilters: event.dateFilters,
        globalSearch: globalSearch,
      }
    )
 
    this.tableauGlobalDataService.updateFilterState("recents", {
      globalSearch: globalSearch,
      dateFilters: {
        modifiedAfter: '',
        modifiedBefore: '',
        createdAfter: '',
        createdBefore: '',
      },
      itemCount: this.viewCount,
      sorting:{
        dir: event?.sortBy?.order,
        prop: event.sortBy?.sort
      }
    })
  }
  
  toggleSubPanel() {
    // this.isLeftsidebaricon = !this.isLeftsidebaricon
    // this.localStorageService.updateLocalStorage({ isLeftPanelOpen: this.sidebar });
    this.tableauGlobalDataService.toggleSubLeftSlider();
  }

  /**
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }
}
