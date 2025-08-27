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
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import { environment } from '@environments/environment';

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
import { recordsPerPage } from '@app/my-apps/asher/constants/global.constant';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { ScreenAware } from '@app/common/super/ScreenAware';

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
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss',
})
export class DepartmentsComponent
  extends ScreenAware
  implements OnInit, AfterViewInit
{
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;

  departmentSubscription: Subscription | undefined;
  modalRefSubscription: Subscription | undefined;
  departmentsList: any = [];
  columns: Array<GridColumn> = [];
  searchForm: FormGroup;
  advanceFilterForm!: FormGroup;
  errorMessage = '';
  columnFilters: ColumnFilter[] = [];
  searchTerm = '';

  gridName = 'department';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };

  gridDataOverlay = this.uiService.getUioverlayNoRowsTemplate(
    'No data available!', // need to change it
  );
  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  defaultDateFormat = environment.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';

  constructor(
    private uiService: UIService,
    private asherGlobalDataService: AsherGlobalDataService,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
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
   * Initializes the component by subscribing to the departments data stream.
   * - Fetches department data from `asherGlobalDataService.departmentsResults$` and populates `departmentsList`.
   * - Sets pagination values (total count, page number, page size).
   * - Applies global search, sorting, and column filters.
   * - Displays an error message if no departments are found.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.departmentSubscription =
      this.asherGlobalDataService.departmentsResults$.subscribe({
        next: (data) => {
          this.departmentsList = data.rows;
          const { startIndex, pageSize, totalCount } = data.pagination;
          this.pagination.totalCount = totalCount;
          this.pagination.pageNumber = startIndex;
          this.pagination.pageSize = pageSize;
          this.setGlobalSearch(data?.searchText);
          this.setInitialSorts(data?.sorting);
          this.columnFilters = data?.columnFilters || [];
          this.errorMessage =
            data.loaded && !this.departmentsList.length
              ? 'Oops! We couldn’t find any records.'
              : '';
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
   * Each column is defined with properties such as `prop`, `name`, and `frozenLeft`.
   */
  setTableColumns() {
    this.columns = [
      {
        prop: 'department_name',
        name: 'Department Name',
        frozenLeft: true,
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
        width: 167,
      },
    ];
  }

  // Fetches department data based on search, sort, filters, and pagination
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.asherGlobalDataService.getDepartmentList({
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

  // Refreshes the department list based on search, sort, filters, and pagination
  refreshAsherList() {
    this.asherGlobalDataService.getDepartmentList({
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

  // Handles change in page size and fetches updated data
  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.fetchData();
  }

  // Handles change in page number and fetches updated data
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
    // Unsubscribe from the departmentSubscription to prevent memory leaks
    if (this.departmentSubscription) {
      this.departmentSubscription.unsubscribe();
    }
  }
}
