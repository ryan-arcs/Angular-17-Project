import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/common/modals/confirmation-modal/confirmation-modal.component';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/common/services/auth.service';
import { ToastService } from 'src/app/common/services/toast.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from 'src/environments/environment';
import { messages, recordsPerPage } from './constants';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { DataGridHelper } from '../data-grid/helpers/data-grid.helper';
import { DataGridComponent } from '../data-grid/data-grid.component';
import {
  RoleList,
  XAppsAdminGlobalDataService,
} from '@app/my-apps/xapps-admin/services';
import { ScreenAware } from '@app/common/super/ScreenAware';

interface Application {
  id: string;
  application_name: string;
}
@Component({
  selector: 'app-global-roles',
  standalone: true,
  imports: [
    NgbDropdownModule,
    FormsModule,
    ReactiveFormsModule,
    DataGridComponent,
    CommonModule,
    NgbTooltipModule,
    NgbTooltip,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class GlobalRolesComponent
  extends ScreenAware
  implements OnInit, AfterViewInit, OnDestroy
{
  // Template references
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('creatorTemplate') creatorTemplate!: TemplateRef<any>;
  @ViewChild('updatorTemplate') updatorTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;

  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  modalRefSubscription: Subscription | undefined;
  isRolesListLoading: boolean = false;

  instanceCopyright: string = environment.instanceCopyright;
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  application?: string;
  searchTerm = '';
  errorMessage = '';
  columns: Array<GridColumn> = [];
  columnFilters: ColumnFilter[] = [];
  applications: any[] = [];
  searchForm: FormGroup;

  // Grid configuration
  gridName = 'roles';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize || 25,
    totalCount: 0,
    totalPages: 1,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'updated_at',
  };

  rolesList: any[] = [];
  roleData: any[] = [];
  suppressedActions: Array<string> = [];
  isLoading: boolean = false;

  selectedApplication?: Application = {
    id: 'all',
    application_name: 'All',
  };

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private cdr: ChangeDetectorRef,
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
  }

  /**
   * Initialize the component by subscribing to roles and application data.
   */
  async ngOnInit(): Promise<void> {
    this.application = this.route.snapshot.data['application'];
    this.suppressedActions =
      this.route.snapshot.data['suppressedActions'] || [];

    this.xAppsAdminGlobalDataService.rolesResults$.subscribe({
      next: (data) => {
        this.rolesList = data.rows;
        const { startIndex, pageSize, totalCount } = data.pagination;
        this.pagination.totalCount = totalCount;
        this.pagination.pageNumber = startIndex;
        this.pagination.pageSize = pageSize;
        this.setGlobalSearch(data?.searchText);
        this.setInitialSorts(data?.sorting);
        this.columnFilters = data?.columnFilters || [];
        this.errorMessage =
          data.loaded && !this.rolesList.length ? 'Oops! We couldn’t find any records.' : '';
      },
    });
    this.applications =
      await this.xAppsAdminGlobalDataService.getApplicationLookup();
  }

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
   * Set the column definitions for the data grid
   */
  setTableColumns() {
    this.columns = [
      {
        prop: 'role_name',
        name: 'Name',
        width: 140,
      },
      {
        prop: 'description',
        name: 'Description',
        width: 140,
      },
      {
        prop: 'is_active',
        name: 'Status',
        width: 120,
        cellTemplate: this.statusTemplate,
      },
      {
        prop: 'created_at',
        name: 'Created Date',
        width: 190,
        cellTemplate: this.dateTemplate,
        hidden: true,
      },
      {
        prop: 'created_by',
        name: 'Created By',
        width: 150,
        hidden: true,
      },
      {
        prop: 'updated_at',
        name: 'Updated Date',
        width: 190,
        cellTemplate: this.dateTemplate,
        hidden: true,
      },
      {
        prop: 'updated_by',
        name: 'Updated By',
        width: 150,
        hidden: true,
      },
    ];
  }

  /**
   * Check if the user has permission to access a role.
   */
  isActionPermitted(action: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: this.application || 'xapps_admin',
      moduleSlug: 'roles',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  // Refreshes the list of ASHER users with the current search, sort, and filter state.
  refreshRolesList() {
    this.xAppsAdminGlobalDataService.getRoles({
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

  // Fetches ASHER user data based on the current search, sorting, filters, and pagination.
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.xAppsAdminGlobalDataService.getRoles({
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

  /**
   * Handle search form submission
   */
  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchTerm = this.searchForm.get('filter')?.value?.trim() || '';

    // Re-slice the data with the new filter
    this.fetchData();
  }

  /**
   * Handle grid sorting
   */
  onSort(sort: any) {
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.pagination.pageNumber = 1;
  }

  /**
   * Handle page size change
   */
  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber = 1;
    this.pagination.pageSize = event.pageSize;
    // Update total pages
    this.pagination.totalPages = Math.ceil(
      this.rolesList.length / this.pagination.pageSize,
    );
    this.fetchData();
  }

  /**
   * Handle page change
   */
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    // Re-slice the data for the new page
    this.fetchData();
  }

  /**
   * Handle column filter change
   */
  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;
    this.pagination.pageNumber = 1;

    // Re-slice the data with the new filters
    this.fetchData();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.searchTerm = '';
    this.searchForm.reset();
    this.dataGridHelper.clearColumnFilters();
    this.columnFilters = [];
    this.fetchData();
  }

  /**
   * Handle cell click events in the grid and perform actions based on the clicked cell.
   * @param params The cell click event parameters.
   * @param action The action to perform based on the clicked cell.
   */
  onCellClicked(params: RoleList, action: any): void {
    const id = params?.id;

    if (!id) {
      this.toastService.fire({
        type: 'error',
        message: messages.error.role.invalidId,
      });
      return;
    }
    switch (action) {
      case 'manage-permissions':
        this.router.navigate([
          `${this.application ? this.application?.toLowerCase().replace(/[_ ]/g, '-') : 'xapps-admin'}/roles/${id}/manage-permissions`,
        ]);
        break;
      case 'manage-users':
        this.router.navigate([
          `${this.application ? this.application?.toLowerCase().replace(/[_ ]/g, '-') : 'xapps-admin'}/roles/${id}/manage-users`,
        ]);
        break;
      case 'edit-role':
        this.router.navigate([
          `${this.application ? this.application?.toLowerCase().replace(/[_ ]/g, '-') : 'xapps-admin'}/roles/${id}/edit`,
        ]);
        break;
      case 'delete-role':
        const modalRef = this.modalService.open(ConfirmationModalComponent);
        modalRef.componentInstance.action = 'delete';
        modalRef.componentInstance.entity = 'Role';
        modalRef.componentInstance.HTMLInputElement = true;
        modalRef.componentInstance.app_name = params?.role_name;
        this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
          if (data === 'CONFIRM') {
            this.xAppsAdminGlobalDataService.deleteRole({
              id: params?.id.toString(),
            });
          }
        });
        break;
    }
  }

  isActionSuppressed(action: string) {
    return this.suppressedActions.includes(action);
  }

  /**
   * Navigate to the add roles page.
   */

  navigateToAddRoles() {
    this.router.navigate([`xapps-admin/roles/add`], {});
  }

  async onApplicationChange(option: Application) {
    this.selectedApplication = option;
    this.fetchData();
  }

  /**
   * Clean up subscriptions on component destruction.
   */
  ngOnDestroy(): void {
    if (this.modalRefSubscription) {
      this.modalRefSubscription.unsubscribe();
    }
  }
}
