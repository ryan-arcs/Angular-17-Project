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
import {
  hostingLocationOptions,
  recordsPerPage,
} from '../constants/global.constant';
import { AsherGlobalDataService } from '../services';
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
import { Application } from '../interfaces/global.interface';
import { environment } from '@environments/environment';
import { ConfirmationModalComponent } from '@app/common/modals/confirmation-modal/confirmation-modal.component';
import { AddEditVendorsComponent } from '../components/lookups/vendors/add-edit-vendors/add-edit-vendors.component';
import { DownloadApplicationComponent } from './download-application/download-application.component';
import { LogsModalComponent } from '../components/common/logs-modal/logs-modal.component';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-applications',
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
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
})
export class ApplicationsComponent
  extends ScreenAware
  implements OnInit, AfterViewInit, OnDestroy
{
  asherResultsSubscription: Subscription | undefined;
  modalRefSubscription: Subscription | undefined;
  applications: Application[] = [];
  columns: Array<GridColumn> = [];
  searchForm: FormGroup;
  advanceFilterForm!: FormGroup;
  columnFilters: ColumnFilter[] = [];
  errorMessage = '';
  searchTerm = '';
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  gridName = 'applications';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('userNameTemplate') userNameTemplate!: TemplateRef<any>;
  @ViewChild('applicationNameTemplate')
  applicationNameTemplate!: TemplateRef<any>;
  @ViewChild('applicationIdTemplate') applicationIdTemplate!: TemplateRef<any>;
  @ViewChild('userApprover1Template') userApprover1Template!: TemplateRef<any>;
  @ViewChild('userApprover2Template') userApprover2Template!: TemplateRef<any>;
  @ViewChild('hostingLocationTemplate')
  hostingLocationTemplate!: TemplateRef<any>;
  @ViewChild('gxpSoxTemplate') gxpSoxTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('vendorIdTemplate') vendorIdTemplate!: TemplateRef<any>;
  @ViewChild('defaultValueTemplate') defaultValueTemplate!: TemplateRef<any>;

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };

  /**
   * Navigates to the application details page for the selected row.
   * @param row - The row object containing the application data, including its unique ID.
   */
  viewDetails(row: Application) {
    this.router.navigate([
      `asher/applications/${row.id}/application-details`,
    ]);
  }

  /**
   * Navigates to the edit page for the selected application.
   * @param row - The row object containing the application data, including its unique ID.
   */
  editRow(row: Application) {
    this.router.navigate([`asher/applications/${row.id}/edit`]);
  }

  /**
   * Delete application for the selected application.
   * @param row - The row object containing the application data, including its unique ID.
   */
  deleteRow(row: Application) {
    if (!row?.id || !row?.app_name) {
      this.toastService.fire({
        type: 'error',
        message: 'Invalid action!',
      });
      return;
    }

    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.action = 'delete';
    modalRef.componentInstance.entity = 'Application';
    modalRef.componentInstance.HTMLInputElement = true;
    modalRef.componentInstance.app_name = row?.app_name;
    this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
      if (data === 'CONFIRM') {
        this.asherGlobalDataService.deleteApplication({
          id: row?.id,
        });
      }
    });
  }

  gridDataOverlay = this.uiService.getUioverlayNoRowsTemplate(
    'No data available!', // need to change it
  );
  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;

  constructor(
    private uiService: UIService,
    private asherGlobalDataService: AsherGlobalDataService,
    private toastService: ToastService,
    private router: Router,
    private modalService: NgbModal,
    private authService: AuthService,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private cdr: ChangeDetectorRef,
    private gcHelper: DataGridHelper,
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
   * On component initialization:
   * - Subscribes to `asherResults$` observable from the AsherGlobalDataService to receive ASHER data.
   * - Processes each item in the list by:
   * - Converting boolean fields (`is_gxp`, `is_sox`) to human-readable values ('Yes'/'No').
   * - Formatting date fields (`created_at`, `last_modified_at`) using Angular's DatePipe.
   * - Stores the transformed data in `application`.
   * - Updates pagination values (total count, page number, page size).
   * - Applies global search term and initial sorting from the data object.
   * - Sets column filters and handles empty result messaging.
   */
  ngOnInit(): void {
    this.asherResultsSubscription =
      this.asherGlobalDataService.applications$.subscribe({
        next: (data) => {
          this.applications = data.rows;
          const { startIndex, pageSize, totalCount } = data.pagination;
          this.pagination.totalCount = totalCount;
          this.pagination.pageNumber = startIndex;
          this.pagination.pageSize = pageSize;
          this.setGlobalSearch(data?.searchText);
          this.setInitialSorts(data?.sorting);
          this.columnFilters = data?.columnFilters || [];
          this.errorMessage =
            data.loaded && !totalCount ? 'Oops! We couldn’t find any records.' : '';
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

  // Sets the initial sorting for the grid based on the provided `gridSort` object.
  setInitialSorts(gridSort?: GridSort) {
    if (gridSort?.prop) {
      this.gridSort = gridSort;
    }
  }

  // Sets the global search term in the form and updates the `searchTerm` property.
  setGlobalSearch(searchText: string) {
    if (searchText) {
      this.searchForm.get('filter')?.setValue(searchText);
      this.searchTerm = searchText;
    }
  }

  changeHostingLocationCodetoOption(hostingLocation: string) {
    // Find the hosting location option that matches the provided code
    const thisHostingLocation = hostingLocationOptions.find(
      (option) =>
        option.option === hostingLocation || option.code === hostingLocation,
    );
    if (thisHostingLocation?.option) {
      hostingLocation = thisHostingLocation?.option;
    }
    return hostingLocation;
  }

  /**
   * Sets the column definitions for the data grid.
   * Each column is defined with properties such as `prop`, `name`, `frozenLeft`, `width`, and `cellTemplate`.
   */
  setTableColumns() {
    this.columns = [
      {
        prop: 'app_id',
        name: 'App ID',
        frozenLeft: true,
        width: 100,
        hidden: true,
        cellClass: this.isActionPermitted("details", "applications") ? 'hyperlink-cell' : '',
        cellTemplate: this.applicationIdTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'app_name',
        name: 'Name',
        frozenLeft: true,
        width: 226,
        cellClass: this.isActionPermitted('details', 'applications')
          ? 'hyperlink-cell'
          : '',
        cellTemplate: this.applicationNameTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'aliases',
        name: 'Aliases',
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'lc_name',
        name: 'Life Cycle',
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'app_desc',
        name: 'Description',
        searchConfig: {
          enableOperator: true,
        },
        width: 195,
      },
      {
        prop: 'product_managers',
        name: 'Product Manager(s)',
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.userNameTemplate,
        width: 170,
      },
      {
        prop: 'product_owners',
        name: 'Product Owner(s)',
        searchable: true,
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        cellTemplate: this.userNameTemplate,
        width: 170,
      },
      {
        prop: 'business_owners',
        name: 'Business Owner(s)',
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.userNameTemplate,
        width: 170,
      },
      {
        prop: 'system_owners',
        name: 'System Owner(s)',
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.userNameTemplate,
        width: 170,
      },
      {
        prop: 'it_contacts',
        name: 'IT Contact(s)',
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.userNameTemplate,
        width: 170,
      },
      {
        prop: 'approver1_preferred_name',
        name: 'First Approver',
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.userApprover1Template,
        width: 157,
      },
      {
        prop: 'approver2_preferred_name',
        name: 'Second Approver',
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'users')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.userApprover2Template,
        hidden: true,
        width: 170,
      },
      {
        prop: 'hosting_location',
        name: 'Hosting Location',
        width: 165,
        cellTemplate: this.hostingLocationTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'vendor_name',
        name: 'Vendor',
        width: 145,
        cellTemplate: this.vendorIdTemplate,
        cellClass: (data: any) => {
          return data?.value?.length
            ? this.isActionPermitted('details', 'vendors')
              ? 'hyperlink-cell'
              : ''
            : '';
        },
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'funding_department_name',
        name: 'Funding Department',
        width: 175,
        cellTemplate: this.defaultValueTemplate,
        searchConfig:{
          enableOperator: true
        }
      },
      {
        prop: 'version',
        name: 'Version',
        width: 100,
        cellTemplate: this.defaultValueTemplate,
        searchConfig:{
          enableOperator: true
        }
      },
      {
        prop: 'is_gxp',
        name: 'GXP',
        width: 85,
        cellTemplate: this.gxpSoxTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'is_sox',
        name: 'SOX',
        width: 85,
        cellTemplate: this.gxpSoxTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'created_at',
        name: 'Created Date',
        hidden: true,
        width: 190,
        cellTemplate: this.dateTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'created_by_preferred_name',
        name: 'Created By',
        hidden: true,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'last_modified_at',
        name: 'Updated Date',
        hidden: true,
        width: 190,
        cellTemplate: this.dateTemplate,
        searchConfig: {
          enableOperator: true,
        },
      },
      {
        prop: 'last_modified_by_preferred_name',
        name: 'Updated By',
        hidden: true,
        width: 167,
        searchConfig: {
          enableOperator: true,
        },
      },
    ];
  }

  /**
   * Handles the row class for the data grid.
   * Sets the row class to 'selected' if the row is selected.
   * @return The row class name.
   */
  manageApplications(e: any) {
    const thisRow = this.applications.find(
      (item) => item.unique_key === e?.data?.unique_key,
    );
    if (thisRow?.unique_key) {
      thisRow.is_selected = !thisRow.is_selected;
    }
  }

  // Handles grid sorting and fetches sorted data with updated pagination and filters
  onSort(sort: any) {
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.pagination.pageNumber = 1;
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Triggers globalSearch with current filters, sorting, and resets to first page
  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchTerm = this.searchForm.get('filter')?.value?.trim() || '';
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchTerm,
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Navigates to the Add ASHER Application form
  navigateToAddApplication() {
    this.router.navigate(['asher/applications/add']);
  }

  // Refreshes the Application list with current search, sort, and filter values
  refreshApplication() {
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Checks if the user has permission for an application-level action
  isActionPermitted(action: string = '', moduleSlug = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: moduleSlug,
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  // Handles change in grid page size and fetches data accordingly
  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber = 1;
    this.pagination.pageSize = event.pageSize;
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: 1,
        pageSize: event.pageSize,
      },
    });
  }

  // Handles pagination change and fetches data for the selected page
  onGridPageChange(event: any) {
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: event.page || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Clears all applied filters and resets the search form
  clearFilters() {
    this.searchTerm = '';
    this.searchForm.reset();
    this.dataGridHelper.clearColumnFilters();
  }

  // Updates column filters and fetches filtered data
  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  // Navigates to user details page if user has permission
  goToUser(email: string) {
    if (!this.isActionPermitted('details', 'users')) {
      return;
    }
    this.router.navigate([`/asher/users/${email}/user-details`]);
  }

  downloadTableData() {
    const tableColumns = this.dataGridHelper._tableColumns.getValue();
    const orderedColumnsString = (tableColumns?.['applications'] || [])
      .filter((item) => item.prop !== 'action' && !item.hidden)
      .map((item) => `${item.prop}:${item.name}`)
      .join(',');

    const payload = {
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: 1,
        pageSize: this.pagination?.pageSize || recordsPerPage.defaultSize,
      },
    };
    const modalRef = this.modalService.open(DownloadApplicationComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static',
    });
    modalRef.componentInstance.defaultName = `applications-${this.asherGlobalDataService.currentDate()}`;

    this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
      if (data.action === 'SUBMIT') {
        this.asherGlobalDataService.downloadTableData({
          ...payload,
          fileName: data.fileName,
          orderedColumns: orderedColumnsString,
        });
        if (this.searchForm.get('filter')?.value?.trim() != this.searchTerm) {
          this.asherGlobalDataService.getApplicationList(payload);
        }
      }
    });
  }

  // Navigates to vendor details modal if user has permission
  goToVendor(id: number) {
    if (!this.isActionPermitted('details', 'vendors')) {
      return;
    }
    const modalRef = this.modalService.open(AddEditVendorsComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static',
    });
    modalRef.componentInstance.vendor_id = id;
    modalRef.componentInstance.mode = 'details';
  }

  // Navigates to application details page if user has permission
  goToApplication(id: number) {
    if (!this.isActionPermitted('details', 'applications')) {
      return;
    }
    this.router.navigate([
      `/asher/applications/${id}/application-details`,
    ]);
  }

  // actions logs displaying popup
  actionLogs(row: any) {
    const modalRef = this.modalService.open(LogsModalComponent, {
      windowClass: 'asher-application-logs mwl',
      backdropClass: 'asher-application-logs mwl',
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.row = row;
    modalRef.componentInstance.HTMLInputElement = true;
    this.modalRefSubscription = modalRef.closed.subscribe((data) => {});
  }

  ngOnDestroy() {
    // Unsubscribe from the asherResultsSubscription to prevent memory leaks
    if (this.asherResultsSubscription) {
      this.asherResultsSubscription.unsubscribe();
    }
  }
}
