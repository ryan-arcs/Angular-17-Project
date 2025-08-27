import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/common/services/toast.service';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
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
import { recordsPerPage } from '../../constants/global.constant';
import { Module, XAppsAdminGlobalDataService } from '../../services';
import { ConfirmationModalComponent } from '@app/common/modals/confirmation-modal/confirmation-modal.component';
import { ScreenAware } from '@app/common/super/ScreenAware';

interface Application {
  id: string;
  application_name: string;
}

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
  templateUrl: './modules.component.html',
  styleUrl: './modules.component.scss',
})
export class ModulesComponent
  extends ScreenAware
  implements OnInit, AfterViewInit, OnDestroy
{
  private subscriptions: Subscription = new Subscription();
  modalRefSubscription: Subscription | undefined;
  usersList: any[] = [];
  columns: Array<GridColumn> = [];
  searchForm: FormGroup;
  advanceFilterForm!: FormGroup;
  errorMessage = '';
  columnFilters: ColumnFilter[] = [];
  searchTerm = '';
  gridName = 'xapps-admin-modules';
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';

  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'updated_at',
  };

  selectedApplication?: Application = {
    id: 'all',
    application_name: 'All',
  };

  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('userTemplate') userTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;

  /**
   * Navigates to the user details page for the selected row.
   * @param row - The row object containing the user data, including its unique email.
   */
  // viewDetails(row: any) {
  //   this.router.navigate([`asher/users/${row.email}/user-details`]);
  // }

  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  applications: any[] = [];

  constructor(
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private toastService: ToastService,
    private router: Router,
    private modalService: NgbModal,
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
  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.xAppsAdminGlobalDataService.modulesResults$.subscribe({
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
      }),
    );
    this.applications =
      await this.xAppsAdminGlobalDataService.getApplicationLookup();
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
        name: 'Slug',
        prop: 'slug',
        width: 80,
        frozenLeft: true,
      },
      {
        name: 'Name',
        prop: 'module_name',
        width: 80,
        frozenLeft: true,
      },
      {
        name: 'Application',
        prop: 'app_name',
        width: 100,
      },
      {
        name: 'Description',
        prop: 'description',
        width: 160,
      },
      {
        name: 'Status',
        prop: 'is_active',
        width: 160,
        cellTemplate: this.statusTemplate,
      },
      {
        name: 'Created Date',
        prop: 'created_at',
        width: 250,
        hidden: true,
        cellTemplate: this.dateTemplate,
      },
      {
        name: 'Created By',
        prop: 'created_by',
        width: 250,
        hidden: true,
      },
      {
        name: 'Updated Date',
        prop: 'updated_at',
        width: 250,
        cellTemplate: this.dateTemplate,
        hidden: true,
      },
      {
        name: 'Updated By',
        prop: 'updated_by',
        width: 250,
        hidden: true,
      },
    ];
  }

  // Checks if the user has permission to perform a specific action on the users module.
  isActionPermitted(action: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'xapps_admin',
      moduleSlug: 'modules',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  // Fetches ASHER user data based on the current search, sorting, filters, and pagination.
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.xAppsAdminGlobalDataService.getModules({
      globalSearch: searchValue,
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters,
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
      applicationId:
        this.selectedApplication?.id === 'all'
          ? undefined
          : parseInt(this.selectedApplication?.id as string),
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
    // this.router.navigate(['asher/applications/add']);
  }

  // Refreshes the list of ASHER users with the current search, sort, and filter state.
  refreshModulesList() {
    this.xAppsAdminGlobalDataService.getModules({
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
    // this.router.navigate([`/asher/users/${email}/user-details`]);
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

  /**
   * Navigates to the edit page for the selected modules.
   * @param row - The row object containing the modules data, including its unique ID.
   */
  editRow(row: Module) {
    this.router.navigate([`xapps-admin/modules/${row.id}/edit`]);
  }

  /**
   * Delete modules for the selected modules.
   * @param row - The row object containing the modules data, including its unique ID.
   */
  deleteRow(row: Module) {
    if (!row?.id || !row?.app_name) {
      this.toastService.fire({
        type: 'error',
        message: 'Invalid action!',
      });
      return;
    }

    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.action = 'delete';
    modalRef.componentInstance.entity = 'Module';
    modalRef.componentInstance.HTMLInputElement = true;
    modalRef.componentInstance.app_name = row?.module_name;
    this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
      if (data === 'CONFIRM') {
        this.xAppsAdminGlobalDataService.deleteModule({
          id: row?.id.toString(),
        });
      }
    });
  }

  async onApplicationChange(option: Application) {
    this.selectedApplication = option;
    this.fetchData();
  }

  navigateToAddModule() {
    this.router.navigate([`xapps-admin/modules/add`]);
  }

  ngOnDestroy() {
    // Unsubscribe from the usersSubscription to prevent memory leaks
    this.subscriptions.unsubscribe();
  }
}
