import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { UIService } from 'src/app/common/services/ui.service';
import { Subscription } from 'rxjs';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { DataGridHelper } from '@app/common/components/data-grid/helpers/data-grid.helper';
import { AuthService } from '@app/common/services/auth.service';
import { AddEditLifeCyclesComponent } from './add-edit-lifecycles/add-edit-lifecycles.component';
import { environment } from '@environments/environment';
import { ConfirmationModalComponent } from '@app/common/modals/confirmation-modal/confirmation-modal.component';
import { ToastService } from '@app/common/services/toast.service';
import { recordsPerPage } from '@app/my-apps/asher/constants/global.constant';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { ScreenAware } from '@app/common/super/ScreenAware';

interface LifeCycle {
  id?: number;
  code?: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-lifecycles',
  standalone: true,
  providers: [DatePipe],
  imports: [
    DataGridComponent,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgxDatatableModule,
    CommonModule,
    NgbTooltip,
  ],
  templateUrl: './lifecycles.component.html',
  styleUrl: './lifecycles.component.scss',
})
export class LifeCycleComponent
  extends ScreenAware
  implements OnInit, AfterViewInit
{
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;

  lifeCycleSubscription: Subscription | undefined;
  modalRefSubscription: Subscription | undefined;
  lifeCycleList: any = [];
  columns: Array<GridColumn> = [];
  searchForm: FormGroup;
  advanceFilterForm!: FormGroup;
  errorMessage = '';
  columnFilters: ColumnFilter[] = [];
  searchTerm = '';
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  gridName = 'lifeCycle';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };
  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };

  gridDataOverlay =
    this.uiService.getUioverlayNoRowsTemplate('No data available!');
  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;

  constructor(
    private uiService: UIService,
    private asherGlobalDataService: AsherGlobalDataService,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private authService: AuthService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });

    this.advanceFilterForm = this.fb.group({
      filters: this.fb.array([]),
    });
  }

  /**
   * Initializes the component by subscribing to the `lifecycleResults$` observable from `asherGlobalDataService`.
   * - Updates the `lifeCycleList` with formatted creation and modification dates.
   * - Extracts and sets pagination details: `totalCount`, `pageNumber`, and `pageSize`.
   * - Applies global search text and initial sorting from the received data.
   * - Sets column filters and handles empty result scenarios by displaying an appropriate message.
   */
  ngOnInit(): void {
    this.lifeCycleSubscription =
      this.asherGlobalDataService.lifecycleResults$.subscribe({
        next: (data) => {
          this.lifeCycleList = data.rows;
          const { startIndex, pageSize, totalCount } = data.pagination;
          this.pagination.totalCount = totalCount;
          this.pagination.pageNumber = startIndex;
          this.pagination.pageSize = pageSize;
          this.setGlobalSearch(data?.searchText);
          this.setInitialSorts(data?.sorting);
          this.columnFilters = data?.columnFilters || [];
          this.errorMessage =
            data.loaded && !this.lifeCycleList.length ? 'Oops! We couldn’t find any records.' : '';
        },
      });
  }

  /**
   * Lifecycle hook that runs after the component’s view has been fully initialized.
   * - Initializes the table columns.
   * - Triggers change detection to ensure the view reflects the latest updates.
   */
  ngAfterViewInit(): void {
    this.setTableColumns();
    this.cdr.detectChanges();
  }

  // Sets the initial sorting state if provided
  setInitialSorts(gridSort?: GridSort) {
    if (gridSort?.prop) {
      this.gridSort = gridSort;
    }
  }

  // Sets the global search term in the form and internal variable
  setGlobalSearch(searchText: string) {
    if (searchText) {
      this.searchForm.get('filter')?.setValue(searchText);
      this.searchTerm = searchText;
    }
  }

  /**
   * Sets the column definitions for the data grid.
   * Each column is defined with properties such as `prop`, `name`, `frozenLeft`, `width`, and `cellTemplate`.
   */
  setTableColumns() {
    this.columns = [
      {
        prop: 'code',
        name: 'Code',
        frozenLeft: true,
        width: 300,
      },
      {
        prop: 'name',
        name: 'Name',
        width: 300,
      },
      {
        prop: 'description',
        name: 'Description',
        width: 400,
      },
      {
        prop: 'created_at',
        name: 'Created Date',
        hidden: true,
        width: 190,
        cellTemplate: this.dateTemplate,
      },
      {
        prop: 'created_by_preferred_name',
        name: 'Created By',
        hidden: true,
      },
      {
        prop: 'last_modified_at',
        name: 'Updated Date',
        hidden: true,
        width: 190,
        cellTemplate: this.dateTemplate,
      },
      {
        prop: 'last_modified_by_preferred_name',
        name: 'Updated By',
        hidden: true,
      },
    ];
  }

  // Fetches lifecycle data based on search, sort, filters, and pagination
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.asherGlobalDataService.getLifeCyclesList({
      globalSearch: searchValue,
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters,
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Handles sorting event and triggers data fetch with new sort order
  onSort(sort: any) {
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.pagination.pageNumber = 1;
    this.fetchData();
  }

  // Executes search action and fetches data
  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchTerm = this.searchForm.get('filter')?.value?.trim() || '';
    this.fetchData();
  }

  // Opens modal for adding or editing a lifecycle
  addEditLifeCyle(lifeCycle?: LifeCycle) {
    const modalRef = this.modalService.open(AddEditLifeCyclesComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static',
    });
    modalRef.componentInstance.code = lifeCycle?.code || '';
  }

  // Opens confirmation modal for deleting a lifecycle
  async deleteLifeCyle(lifeCycle: LifeCycle) {
    if (!lifeCycle?.code || !lifeCycle.name) {
      this.toastService.fire({
        type: 'error',
        message: 'Invalid action!',
      });
      return;
    }

    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.action = 'delete';
    modalRef.componentInstance.entity = 'Life Cycle';
    modalRef.componentInstance.HTMLInputElement = true;
    modalRef.componentInstance.app_name = lifeCycle?.name;
    this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
      if (data === 'CONFIRM') {
        await this.asherGlobalDataService.deleteLifeCycle({
          id: lifeCycle.id as number,
        });
      }
    });
  }

  // Refreshes the lifecycle list with the current search/sort/filter state
  refreshAsherList() {
    this.asherGlobalDataService.getLifeCyclesList({
      globalSearch: this.searchTerm,
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters,
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Checks if the user has permission for a specific lifecycle action
  isActionPermitted(action: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: 'lifecycles',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  // Handles change in page size and fetches updated data
  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.fetchData();
  }

  // Handles page number change and fetches updated data
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.fetchData();
  }

  // Clears search input and column filters
  clearFilters() {
    this.searchTerm = '';
    this.searchForm.reset();
    this.dataGridHelper.clearColumnFilters();
  }

  // Updates column filters and fetches filtered data
  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;
    this.fetchData();
  }

  ngOnDestroy() {
    // Unsubscribe from the lifeCycleSubscription to prevent memory leaks
    if (this.lifeCycleSubscription) {
      this.lifeCycleSubscription.unsubscribe();
    }
  }
}
