import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import { DataGridHelper } from '@app/common/components/data-grid/helpers/data-grid.helper';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { AuthService } from '@app/common/services/auth.service';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { recordsPerPage } from '@app/my-apps/asher/constants/global.constant';
import { environment } from '@environments/environment';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-configurations',
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
  templateUrl: './configurations.component.html',
  styleUrl: './configurations.component.scss',
})
export class ConfigurationsComponent extends ScreenAware {
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  modalRefSubscription: Subscription | undefined;
  columns: Array<GridColumn> = [];
  searchForm: FormGroup;
  errorMessage = '';
  columnFilters: ColumnFilter[] = [];
  searchTerm = '';

  gridName = 'Configurations';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };
  subscriptions: Subscription = new Subscription();

  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  defaultDateFormat = environment.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  configurationsList: any = [];

  constructor(
    private asherGlobalDataService: AsherGlobalDataService,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
  }

  /**
   * Initializes the component by subscribing to the vendors data stream.
   * - Fetches vendor data from `asherGlobalDataService.configurations$` and populates `configurations`.
   * - Sets pagination values (total count, page number, page size).
   * - Applies global search, sorting, and column filters.
   * - Displays an error message if no vendors are found.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.asherGlobalDataService.configurationsResults$.subscribe({
        next: (data) => {
          this.configurationsList = data?.rows || [];
          const { startIndex, pageSize, totalCount } = data?.pagination;
          this.pagination.totalCount = totalCount;
          this.pagination.pageNumber = startIndex;
          this.pagination.pageSize = pageSize;
          this.setGlobalSearch(data?.searchText);
          this.setInitialSorts(data?.sorting);
          this.columnFilters = data?.columnFilters || [];
          this.errorMessage =
            data.loaded && !this.configurationsList.length
              ? 'Oops! We couldn’t find any records.'
              : '';
        },
      }),
    );
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
        prop: 'id',
        name: 'ID',
        width: 50,
        frozenLeft: true,
      },
      {
        prop: 'notification_event',
        name: 'Notification Event',
        width: 160,
        frozenLeft: true,
      },
      {
        prop: 'initial_trigger_days',
        name: 'Counter',
        width: 150,
      },
      {
        prop: 'repeat_frequency_days',
        name: 'Repeat Frequency (Days)',
        width: 180,
      },
      {
        prop: 'threshold',
        name: 'Threshold',
        width: 120,
      },
      {
        name: 'Admin Email',
        prop: 'admin_email',
        width: 150,
      },
      {
        prop: 'email_to',
        name: 'Email To',
        width: 150,
      },
      {
        prop: 'email_cc',
        name: 'Email CC',
        width: 150,
      },
      {
        prop: 'email_bcc',
        name: 'Email BCC',
        width: 150,
      },
      {
        prop: 'email_subject',
        name: 'Email Subject',
        width: 150,
        hidden: true,
      },
      {
        prop: 'email_body',
        name: 'Email Body',
        width: 150,
        hidden: true,
      },
      {
        prop: 'email_reminder_subject',
        name: 'Email Reminder Subject',
        width: 150,
        hidden: true,
      },
      {
        prop: 'email_reminder_body',
        name: 'Email Reminder Body',
        width: 150,
        hidden: true,
      },
      {
        prop: 'attribute_1',
        name: 'Attribute 1',
        width: 100,
        hidden: true,
      },
      {
        prop: 'attribute_2',
        name: 'Attribute 2',
        width: 100,
        hidden: true,
      },
      {
        prop: 'attribute_3',
        name: 'Attribute 3',
        width: 100,
        hidden: true,
      },
      {
        prop: 'attribute_4',
        name: 'Attribute 4',
        width: 100,
        hidden: true,
      },
      {
        prop: 'attribute_5',
        name: 'Attribute 5',
        width: 100,
        hidden: true,
      },
      {
        prop: 'record_status',
        name: 'Record Status',
        width: 130,
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
        width: 120,
        hidden: true,
      },
      {
        prop: 'last_modified_at',
        name: 'Updated Date',
        width: 190,
        cellTemplate: this.dateTemplate,
        hidden: true,
      },
      {
        prop: 'last_modified_by_preferred_name',
        name: 'Updated By',
        width: 190,
        hidden: true,
      },
    ];
  }

  // Fetches department data based on search, sort, filters, and pagination
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.asherGlobalDataService.getConfigurations({
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

  // Opens modal for adding or editing a configuration
  editRow(row: any) {
    this.router.navigate([`asher/configurations/${row.id}/edit`]);
  }

  // Refreshes the configuration list based on search, sort, filters, and pagination
  refreshAsherList() {
    this.asherGlobalDataService.getConfigurations({
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

  // Checks if the user has permission for a specific configuration action
  isActionPermitted(action: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: 'configurations',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
