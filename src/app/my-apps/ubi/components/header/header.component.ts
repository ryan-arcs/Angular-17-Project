import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FilterComponent } from '../filter/filter/filter.component';
import { DateFilter, Filters, FilterState } from '../../interfaces';
import { Subscription } from 'rxjs';
import { TableauGlobalDataServiceNew } from '../../services';
import { UserProfileService } from '@app/common/services/user-profile.service';
import { Router } from '@angular/router';
import { ScreenAware } from '@app/common/super/ScreenAware';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'filter-app-header',
  standalone: true,
  imports: [FormsModule, NgbDropdownModule, NgbTooltipModule, NgbTooltip, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent extends ScreenAware implements OnInit, OnChanges {
  protected override setTableColumns(): void {}
  @Output() expandAndCollapse = new EventEmitter<{
    expandAll: boolean;
    collapseAll: boolean;
  }>();
  @Output() cardCount = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<boolean>();
  @Output() filter = new EventEmitter<Filters>();
  @Input() expandCollapseFeat: boolean = false;
  @Input() isDropdown = false;
  @Input() isRefresh = true;
  @Input() headerConfig?: FilterState = {}
  @Input() headerFor: string = '';
  subscriptions = new Subscription();
  tableauPersonas: any;
  selectedTableauPersona: string = 'Home';

  viewTileCount = 4;
  globalSearch: string = '';
  sortBy = {
    order: 'asc',
    sort: 'name',
  };

  dateFilters = {
    modifiedAfter: '',
    modifiedBefore: '',
    createdAfter: '',
    createdBefore: '',
  };
  // "Name",
  // "Projects",
  // "Workbooks",
  // "Created date",
  // "Updated date",

  sortOptions = [
    { title: 'Name', prop: 'name' },
    { title: 'Projects', prop: 'project' },
    { title: 'Workbooks', prop: 'workbook' },
    { title: 'Created date', prop: 'createdAt' },
    { title: 'Updated date', prop: 'updatedAt' },
  ];

  constructor(
    private modalService: NgbModal,
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private userProfileService: UserProfileService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.tableauGlobalDataService.tableauPersonas$.subscribe({
        next: (tableauPersonas) => {
          this.tableauPersonas = tableauPersonas;
          
        },
      }),
    );

    this.subscriptions.add(
      this.userProfileService.loggedInUserData$.subscribe({
        next: () => {
          this.selectedTableauPersona =
            this.tableauGlobalDataService.retrieveTableauPersona() as string;
        },
      }),
    );
    
    this.initializeHeaderConfig();

    this.tableauGlobalDataService.filterStates$.subscribe((value)=>{
      if(!value){
        this.resetHeaderConfig();
      }
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['headerConfig']) {
      this.initializeHeaderConfig();
    }
  }

  private initializeHeaderConfig(): void {
    this.globalSearch = this.headerConfig?.globalSearch ?? '';
    this.viewTileCount = this.headerConfig?.itemCount ?? 4;
    this.sortBy = {
      order: this.headerConfig?.sorting?.dir ?? 'asc',
      sort: this.headerConfig?.sorting?.prop ?? 'name',
    };
    this.dateFilters = this.headerConfig?.dateFilters ?? this.getDefaultDateFilters();
  }
  
  private resetHeaderConfig(): void {
    this.globalSearch = '';
    this.viewTileCount = 4;
    this.sortBy = { order: 'asc', sort: 'name' };
    this.dateFilters = this.getDefaultDateFilters();
  }
  
  private getDefaultDateFilters(): DateFilter {
    return {
      modifiedAfter: '',
      modifiedBefore: '',
      createdAfter: '',
      createdBefore: '',
    };
  }

  setHeaderValue(value: string) {
    const isExpand = value === 'expandAll';
    this.expandAndCollapse.emit({
      expandAll: isExpand,
      collapseAll: !isExpand,
    });
  }

  cardWidth(item: number) {
    this.viewTileCount = item;
    this.cardCount.emit(item);
  }

  refreshPage() {
    this.refresh.emit(true);
  }

  setOrder(value: string) {
    this.sortBy.order = value;
    this.filter.emit({
      dateFilters: this.dateFilters,
      globalSearch: this.globalSearch,
      sortBy: this.sortBy,
    });
  }

  setSort(value: string) {
    this.sortBy.sort = value;
    this.filter.emit({
      dateFilters: this.dateFilters,
      globalSearch: this.globalSearch,
      sortBy: this.sortBy,
    });
  }

  onSearchFilter(event: any): void {
    let searchTerm = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.globalSearch = searchTerm;
    this.filter.emit({
      dateFilters: this.dateFilters,
      globalSearch: this.globalSearch,
      sortBy: this.sortBy,
    });
  }

  onFilter() {
    const modalRef = this.modalService.open(FilterComponent, {
      windowClass: 'sidebar-small right-side-popup date-filter',
    });
    modalRef.componentInstance.dateFilter = this.dateFilters;
    modalRef.closed.subscribe((result) => {
      if (result.action === 'SUBMIT') {
        this.dateFilters = result.data.dateFilters;
        this.filter.emit({
          dateFilters: result.data.dateFilters,
          globalSearch: this.globalSearch,
          sortBy: this.sortBy,
        });
      }
    });
  }

  updateFilterState(){
    this.tableauGlobalDataService.updateFilterState(
      this.headerFor,
      {
        globalSearch: this.globalSearch,
      }
    )
  }

  setTableauPersona(name: string): void {
    const state = this.tableauGlobalDataService.getFilterStateForProject(name ?? '');
    this.globalSearch = state?.globalSearch ?? '';
    this.viewTileCount = state?.itemCount ?? 4;
    this.sortBy = {
      order: state?.sorting?.order ?? 'asc',
      sort: state?.sorting?.sort ?? 'name',
    };
    this.tableauGlobalDataService.setSelectedTableauPersona({ name, dbSync: true });
    this.router.navigate(['/ubi/home']);
  }

  get order() {
    return this?.sortBy?.order ?? '';
  }

  get sort() {
    return this?.sortBy?.sort ?? '';
  }
}
