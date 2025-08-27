import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { TableauGlobalDataServiceNew } from '../services';
import { FilterState, TableauView } from '../interfaces';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from '@app/common/services/local-storage.service';
import { FilterComponent } from '../components/filter/filter/filter.component';
import { FormsModule } from '@angular/forms';
import { ViewTileComponent } from '../components/view-tile/view-tile.component';
import { HeaderComponent } from '../components/header/header.component';
import { CommonModule } from '@angular/common';

const defaultFavoriteFilterState = {
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
@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    NgbTooltipModule,
    NgbDropdownModule,
    FormsModule,
    ViewTileComponent,
    HeaderComponent,
    CommonModule
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();
  sidebar: boolean = true;
  sidebarClass = 'sidebar-open-outer';
  favorites: any[] = [];
  favoriteBkp: any[] = [];
  errorMessage = '';
  errorDescription = '';
  favoritetFilterState: FilterState = defaultFavoriteFilterState;
  viewCount: number = 4;
  isLeftSliderOpen:boolean=false

  constructor(
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private router: Router,
    private renderer: Renderer2,
    private localStorageService: LocalStorageService,
    private modalService: NgbModal,
    private cdRef: ChangeDetectorRef
    
  ) { }

  /**
   * Angular lifecycle hook that is called after the component's data-bound properties are initialized.
   * Subscribes to the user's favorites and filters them based on valid views and child projects.
   * Initializes sidebar state based on local storage and applies the relevant CSS class.
   */
  async ngOnInit(): Promise<void> {
    if (this.tableauGlobalDataService.reloadData('initial-package')) {
      await this.tableauGlobalDataService.loadInitialPackage();
    }

    this.subscriptions.add(this.tableauGlobalDataService.environmentProjects$.subscribe((environmentProjects) => {
      this.favorites = Object.values(environmentProjects || {}).flatMap(project => project.views)?.filter((view) => view?.isFavorite) || [];
      this.favoriteBkp = structuredClone(this.favorites);
      const favoritetFilterState = this.tableauGlobalDataService.getFilterStateForProject('favorites');
  
      this.favoritetFilterState = favoritetFilterState || defaultFavoriteFilterState;
      // Apply filters based on the current state
      if (!this.isObjectEmpty(this.favoritetFilterState)) {
        this.applyFilters(this.favoritetFilterState);
      }
      this.errorMessage = this.errorDescription =  '';
      if(!this.favorites?.length){
        this.errorMessage =  'No reports found!';
        this.errorDescription =  'No matching reports found or available to you.';
      }
    }));
    
    const appConfig = this.localStorageService.getLocalStorage();
    this.sidebar = (appConfig?.isLeftPanelOpen !== undefined) ? appConfig?.isLeftPanelOpen : true;
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
    this.cdRef.detectChanges()
    this.tableauGlobalDataService.leftsiderbar$.subscribe(state => {
      this.isLeftSliderOpen = state;
    });
  }

  

  /**
   * Returns the thumbnail URL for a given Tableau view.
   * Falls back to a default image if no thumbnail is available.
   * 
   * @param view - Optional TableauView object
   * @returns Thumbnail image URL as a string
   */
  displayThumbnail(view?: TableauView) {
    return view?.thumbnail || 'assets/images/tableau.png';
  }

  /**
   * HostListener that handles window resize events.
   * Automatically toggles the sidebar based on window width.
   * 
   * @param event - The resize event from the window
   */
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

  /**
   * Toggles the visibility of the sidebar.
   * Updates the value in local storage and adjusts the DOM accordingly.
   */
  sidebarToggle() {
    this.sidebar = !this.sidebar;
    this.localStorageService.updateLocalStorage({ isLeftPanelOpen: this.sidebar });
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  // Refresh favorite fetching data
  refreshFavorites() {
    this.tableauGlobalDataService.getFavoritesOfUser();
  }

  // Centralized method to apply filters
  private applyFilters(filterState?: any) {
    if (!this.favoriteBkp) return;

    this.favorites = this.favoriteBkp || [];
    this.favorites = this.tableauGlobalDataService.applyFilter(this.favoriteBkp || [], filterState);
    // Update error message
    this.errorMessage = !this.favorites.length ? 'No reports found!' : '';
  }

  onSearchFilter(event: any): void {
    let searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    // Update filter state
    this.tableauGlobalDataService.updateFilterState(
      'favorites', 
      { 
        globalSearch: searchTerm,
        dateFilters: this.favoritetFilterState.dateFilters,
        sorting: this.favoritetFilterState.sorting
      }
    );
    this.favoritetFilterState = {
      ...this.favoritetFilterState,
      globalSearch: searchTerm
    };
    // Apply filters
    this.applyFilters({ 
      globalSearch: searchTerm,
      dateFilters: this.favoritetFilterState.dateFilters,
      sorting: this.favoritetFilterState.sorting
    });
  }

  onFilter(){
    const modalRef = this.modalService.open(FilterComponent, 
      {
        windowClass: 'sidebar-small',
      },
    );
    modalRef.componentInstance.dateFilter = this.favoritetFilterState.dateFilters;
    modalRef.closed.subscribe((result) => {
      if (result.action === 'SUBMIT') {
        this.tableauGlobalDataService.updateFilterState(
          'favorites', 
          { 
            dateFilters: result.data.dateFilters,
            globalSearch: this.favoritetFilterState.globalSearch,
            sorting: this.favoritetFilterState.sorting
          }
        );
        this.favoritetFilterState = {
          ...this.favoritetFilterState,
          dateFilters: result.data.dateFilters
        };
        // Apply filters
        this.applyFilters({ 
          dateFilters: result.data.dateFilters,
          globalSearch: this.favoritetFilterState.globalSearch,
          sorting: this.favoritetFilterState.sorting
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
      'favorites', 
      { 
        sorting: sortingState,
        globalSearch: this.favoritetFilterState.globalSearch,
        dateFilters: this.favoritetFilterState.dateFilters
      }
    );
    // Update local state
    this.favoritetFilterState = {
      ...this.favoritetFilterState,
      sorting: sortingState
    };

    // Apply filters
    this.applyFilters({ 
      sorting: sortingState,
      globalSearch: this.favoritetFilterState.globalSearch,
      dateFilters: this.favoritetFilterState.dateFilters
    });
  }

  get isDateFilterActive(): boolean {
    const filters = this.favoritetFilterState.dateFilters;
    return !!(filters?.modifiedAfter || filters?.modifiedBefore || filters?.createdAfter || filters?.createdBefore);
  }

  getDateFilterLength() {
    const filters = this.favoritetFilterState.dateFilters || {};
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
        dateFilters: event?.dateFilters || {},
        globalSearch: globalSearch,
      }
    )
 
    this.tableauGlobalDataService.updateFilterState("favorites", {
      globalSearch: globalSearch,
      dateFilters: event?.dateFilters || {},
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


  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  // Unsubscribe from all subscriptions to avoid memory leaks
  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }
}
