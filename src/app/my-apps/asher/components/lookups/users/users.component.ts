import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { UIService } from 'src/app/common/services/ui.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/common/services/auth.service';
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
import { environment } from '@environments/environment';
import { recordsPerPage } from '@app/my-apps/asher/constants/global.constant';
import { UserList } from '@app/my-apps/asher/interfaces/global.interface';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-users',
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent
  extends ScreenAware
  implements OnInit, AfterViewInit, OnDestroy
{
  usersSubscription: Subscription | undefined;
  modalRefSubscription: Subscription | undefined;
  usersList: UserList[] = [];
  columns: Array<GridColumn> = [];
  searchForm: FormGroup;
  advanceFilterForm!: FormGroup;
  errorMessage = '';
  columnFilters: ColumnFilter[] = [];
  searchTerm = '';
  gridName = 'users';
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';

  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };

  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('userTemplate') userTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;

  /**
   * Navigates to the user details page for the selected row.
   * @param row - The row object containing the user data, including its unique email.
   */
  viewDetails(row: any) {
    this.router.navigate([`asher/users/${row.email}/user-details`]);
  }

  gridDataOverlay =
    this.uiService.getUioverlayNoRowsTemplate('No data available!');

  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;

  constructor(
    private uiService: UIService,
    private asherGlobalDataService: AsherGlobalDataService,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private cdr: ChangeDetectorRef,
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
   * Subscribes to `asherUserResults$` observable to get the list of ASHER users along with their pagination and filtering metadata.
   * - Transforms and formats each user's `fullname_preferred`, `firstname`, `lastname` to title case.
   * - Formats the `date_entered` field to a readable datetime string.
   * - Updates pagination state from the response.
   * - Sets the global search text and initial column sorting based on the received data.
   * - Updates the local column filters.
   * - Displays an error message if no users are found after data is loaded.
   */
  ngOnInit(): void {
    this.usersSubscription = this.asherGlobalDataService.users$.subscribe({
      next: (data) => {
        this.usersList = data.rows;
        const { startIndex, pageSize, totalCount } = data.pagination;
        this.pagination.totalCount = totalCount;
        this.pagination.pageNumber = startIndex;
        this.pagination.pageSize = pageSize;
        this.setGlobalSearch(data?.searchText);
        this.setInitialSorts(data?.sorting);
        this.columnFilters = data?.columnFilters || [];
        this.errorMessage =
          data.loaded && !this.usersList.length ? 'Oops! We couldn’t find any records.' : '';
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

  // Sets the initial sorting configuration for the grid if a sort property is provided.
  setInitialSorts(gridSort?: GridSort) {
    if (gridSort?.prop) {
      this.gridSort = gridSort;
    }
  }

  // Sets the global search value in the search form and assigns it to the local variable.
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
        prop: 'network_id',
        name: 'Network Id',
        frozenLeft: true,
        cellClass: this.isActionPermitted('details') ? 'hyperlink-cell' : '',
        cellTemplate: this.userTemplate,
      },
      {
        prop: 'fullname_preferred',
        name: 'Full Name',
        frozenLeft: true,
        cellClass: this.isActionPermitted('details') ? 'hyperlink-cell' : '',
        cellTemplate: this.userTemplate,
      },
      {
        prop: 'email',
        name: 'Email',
      },
      {
        prop: 'firstname',
        name: 'First Name',
        cellTemplate: this.nameTemplate,
      },
      {
        prop: 'middlename',
        name: 'Middle Name',
        cellTemplate: this.nameTemplate,
      },
      {
        prop: 'lastname',
        name: 'Last Name',
        cellTemplate: this.nameTemplate,
      },
      {
        prop: 'nickname',
        name: 'Nickname',
        cellTemplate: this.nameTemplate,
      },
      {
        prop: 'job_title',
        name: 'Job Title',
      },
      {
        prop: 'empl_status',
        name: 'Employment Status',
        width: 170,
      },
      {
        prop: 'manager_name',
        name: 'Manager Name',
      },
      {
        prop: 'manager_email',
        name: 'Manager Email',
      },
      {
        prop: 'manager_user_id',
        name: 'Manager Network Id',
        width: 175,
      },
      {
        prop: 'department',
        name: 'Department',
        hidden: true,
      },
      {
        prop: 'division',
        name: 'Division',
        hidden: true,
      },
      {
        prop: 'costcenter_code',
        name: 'Cost Center Code',
        hidden: true,
      },
      {
        prop: 'costcenter_desc',
        name: 'Cost Center Description',
        width: 190,
        hidden: true,
      },
      {
        prop: 'employeetype',
        name: 'Employee Type',
        hidden: true,
      },
      {
        prop: 'local_remote',
        name: 'Location',
        hidden: true,
      },
      {
        prop: 'office',
        name: 'Office',
        hidden: true,
      },
      {
        prop: 'building',
        name: 'Building',
        hidden: true,
      },

      {
        prop: 'work_address_line1',
        name: 'Work Address Line 1',
        width: 190,
        hidden: true,
      },
      {
        prop: 'work_address_line2',
        name: 'Work Address Line 2',
        width: 190,
        hidden: true,
      },
      {
        prop: 'work_city',
        name: 'Work City',
        width: 140,
        hidden: true,
      },
      {
        prop: 'work_state',
        name: 'Work State',
        hidden: true,
      },
      {
        prop: 'work_zip',
        name: 'Work ZIP',
        hidden: true,
      },
      {
        prop: 'work_country',
        name: 'Work Country',
        hidden: true,
      },
      {
        prop: 'date_entered',
        name: 'Last Updated Date',
        hidden: true,
        width: 190,
        cellTemplate: this.dateTemplate,
      },
    ];
  }

  // Checks if the user has permission to perform a specific action on the users module.
  isActionPermitted(action: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: 'users',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  // Fetches ASHER user data based on the current search, sorting, filters, and pagination.
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.asherGlobalDataService.getApplicationUsers({
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

  // Updates grid sort state and triggers data fetch from the first page.
  onSort(sort: any) {
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.pagination.pageNumber = 1;
    this.fetchData();
  }

  // Initiates search and resets pagination to the first page.
  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchTerm = this.searchForm.get('filter')?.value?.trim() || '';
    this.fetchData();
  }

  // Navigates to the add new ASHER application page.
  navigateToaddApplication() {
    this.router.navigate(['asher/applications/add']);
  }

  // Refreshes the list of ASHER users with the current search, sort, and filter state.
  refreshAsherList() {
    this.asherGlobalDataService.getApplicationUsers({
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

  // Navigates to the user details page if permission is granted.
  goToUserDetails(email: any) {
    if (!this.isActionPermitted('details')) {
      return;
    }
    this.router.navigate([`/asher/users/${email}/user-details`]);
  }

  // Updates pagination and page size, and fetches data for the new configuration.
  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.fetchData();
  }

  // Updates page number for pagination and fetches corresponding data.
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.fetchData();
  }

  // Clears all search and column filters and resets the search form.
  clearFilters() {
    this.searchTerm = '';
    this.searchForm.reset();
    this.dataGridHelper.clearColumnFilters();
  }

  // Updates the column filters and triggers data fetch.
  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;
    this.fetchData();
  }

  ngOnDestroy() {
    // Unsubscribe from the usersSubscription to prevent memory leaks
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }
}
