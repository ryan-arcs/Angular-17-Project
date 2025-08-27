import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  TemplateRef,
  AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ResourceTrackerGlobalDataService,
  OnboardingRowCountByStatus,
} from '../services/resource-tracker-global-data.service';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { messages, recordsPerPage } from '../constants';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/common/services/toast.service';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import { DataGridHelper } from '@app/common/components/data-grid/helpers/data-grid.helper';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  providers: [DatePipe],
  imports: [
    DataGridComponent,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    CommonModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent
  extends ScreenAware
  implements OnInit, AfterViewInit
{
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('progessTemplate') progessTemplate!: TemplateRef<any>;

  gridName = 'Onboarding';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };
  gridSort: GridSort = {
    dir: 'desc',
    prop: 'formatted_updated_date',
  };

  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  errorMessage = '';
  sidebar: boolean = true;
  onboardingListSubscription: Subscription | undefined;
  getOnboardingFilterSubscription: Subscription | undefined;
  onboardingRowCountByStatusSubscription: Subscription | undefined;
  selectedOnboardingStatus = '';
  onboardingRowCountByStatus?: OnboardingRowCountByStatus;
  columns: Array<GridColumn> = [];
  onboardingParentTickets: any[] = [];
  instanceCopyright: string = environment.instanceCopyright;
  gridDataOverlay = this.uiService.getUioverlayNoRowsTemplate(
    messages.success.onboarding.noRowFound,
  );
  fields: any[] = [];
  isColumnFilterActive = false;
  searchText: string = '';
  isGridLoading: boolean = false;
  searchForm: FormGroup;
  resourceFilterOption = ['My Resources', 'All Resources'];
  selectedResourceFilter = 'All Resources';
  statusFilters: Array<string> = [];
  bodyClass = 'on-boarding-outer';
  columnFilters: ColumnFilter[] = [];

  constructor(
    private route: ActivatedRoute,
    private resourceTrackerGlobalDataService: ResourceTrackerGlobalDataService,
    private toastService: ToastService,
    private uiService: UIService,
    private fb: FormBuilder,
    private router: Router,
    private renderer: Renderer2,
    private dataGridHelper: DataGridHelper,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, this.bodyClass);

    const selectedResourceFilter =
      localStorage.getItem('onboardingResourceType') || '';
    if (selectedResourceFilter) {
      this.selectedResourceFilter = selectedResourceFilter;
      //this.resourceTrackerGlobalDataService.setOnboardingResourceType(selectedResourceFilter);
    }
    this.onboardingListSubscription =
      this.resourceTrackerGlobalDataService.onboardingList$.subscribe({
        next: (onboardingList: any) => {
          const { startIndex, pageSize, totalCount } =
            onboardingList?.pagination;
          this.onboardingParentTickets = onboardingList?.data || [];

          this.pagination.totalCount = totalCount;
          this.pagination.pageNumber = startIndex;
          this.pagination.pageSize = pageSize;

          this.searchText = onboardingList?.searchText || '';
          this.searchForm.patchValue({
            filter: this.searchText,
          });

          this.statusFilters = onboardingList?.selectedOnboardingStatuses || [];
          this.columnFilters = onboardingList?.columnFilters || [];
          this.setInitialSorts(onboardingList?.sorting);
        },
      });

    this.onboardingRowCountByStatusSubscription =
      this.resourceTrackerGlobalDataService.onboardingRowCountByStatus$.subscribe(
        {
          next: (onboardingRowCountByStatus: OnboardingRowCountByStatus) => {
            this.onboardingRowCountByStatus = onboardingRowCountByStatus;
          },
        },
      );
  }

  ngAfterViewInit() {
    this.setTableColumns();
  }

  setInitialSorts(gridSort?: GridSort) {
    if (gridSort?.prop) {
      this.gridSort = gridSort;
    }
  }

  setTableColumns() {
    this.columns = [
      {
        prop: 'employee_id',
        name: 'Employee Id',
        frozenLeft: true,
      },
      {
        prop: 'status',
        name: 'Status',
        cellTemplate: this.statusTemplate,
        frozenLeft: true,
        width: 120,
      },
      {
        prop: 'completed_percentage',
        name: 'Progress',
        cellTemplate: this.progessTemplate,
        frozenLeft: true,
        width: 130,
      },
      {
        prop: 'first_name',
        name: 'First Name',
      },
      {
        prop: 'last_name',
        name: 'Last Name',
      },
      {
        prop: 'preferred_name',
        name: 'Preferred Name',
        width: 170,
      },
      {
        prop: 'formatted_start_date',
        name: 'Start Date',
      },
      {
        prop: 'job_title',
        name: 'Job Title',
      },
      {
        prop: 'department_name',
        name: 'Department Name',
      },
      {
        prop: 'supervisor_name',
        name: 'Supervisor Name',
      },
      {
        prop: 'supervisor_email',
        name: 'Supervisor Email',
      },
      {
        prop: 'employment_type',
        name: 'Employment Type',
      },
      {
        prop: 'job_grade',
        name: 'Job Grade',
      },
      {
        prop: 'hr_business_partner',
        name: 'Hr Business Partner',
      },
      {
        name: 'Is Returning Employee',
        prop: 'is_returning_employee',
      },
      {
        name: 'Contract End Date',
        prop: 'contract_end_date',
      },
      {
        name: 'Work Location',
        prop: 'work_location',
      },
      {
        name: 'Work State',
        prop: 'work_state',
      },
      {
        name: 'Work State Name',
        prop: 'work_state_name',
      },
      {
        name: 'Primary Address',
        prop: 'primary_address',
      },
      {
        name: 'Zip Code',
        prop: 'zip_code',
      },
      {
        name: 'Is Backfill',
        prop: 'is_backfill',
      },
      {
        name: 'Company Code',
        prop: 'company_code',
      },
      {
        name: 'Requisition No',
        prop: 'requisition_no',
      },
      {
        name: 'Created Date',
        prop: 'formatted_created_date',
      },
      {
        name: 'Created By',
        prop: 'created_by',
      },
      {
        name: 'Updated Date',
        prop: 'formatted_updated_date',
      },
      {
        name: 'Updated By',
        prop: 'updated_by',
      },
    ];
  }

  fetchData() {
    this.resourceTrackerGlobalDataService.getOnboardingParentTickets(
      this.pagination.pageNumber,
      this.pagination.pageSize,
      this.searchText,
      this.statusFilters,
      this.gridSort.dir,
      this.gridSort.prop,
      this.columnFilters,
    );
  }

  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.fetchData();
  }

  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.fetchData();
  }

  onSort(sort: any) {
    this.pagination.pageNumber = 1;
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.fetchData();
  }

  reInitializeListing() {}

  // Clears the search bar.
  clearSearch(): void {
    this.resourceTrackerGlobalDataService.setOnboardingSearchFilter('');
  }

  // Opening the onboarding details page on double click of row according to response_ticket_number.
  onCellClicked(params: any, action: any): void {
    const id = params?.data?.response_ticket_number;
    const status = params?.data?.status || '';
    const statusMessage = params?.data?.status_message || '';

    if (
      status.toLowerCase() === 'invalid' ||
      status.toLowerCase() === 'not started'
    ) {
      this.toastService.fire({
        type: 'error',
        message: `${status}: ${statusMessage}`,
      });
      return;
    }

    if (!id) {
      this.toastService.fire({
        type: 'error',
        message: messages.error.onboarding.invalidId,
      });
      return;
    }

    switch (action) {
      case 'onboarding-detail':
        this.router.navigate([
          `resource-tracker/onboarding/${id}/details`,
        ]);

        break;
    }
  }

  // Getting the table data from API using table name.
  getOnboardingParentTickets(tableName?: string | null) {
    this.isGridLoading = true;
    if (!tableName) {
      tableName = this.route.snapshot.paramMap.get('tableName') || '';
    }

    this.resourceTrackerGlobalDataService.onboardingRowCountByStatus(
      this.searchText,
    );
    this.resourceTrackerGlobalDataService.getOnboardingParentTickets(
      this.pagination.currentPage,
      this.pagination.pageSize,
      this.searchText,
      this.statusFilters,
      this.gridSort.dir,
      this.gridSort.prop,
      this.columnFilters,
    );
    this.isGridLoading = false;
  }

  shootSearch() {
    this.pagination.pageNumber = 1;
    this.resourceTrackerGlobalDataService.setOnboardingSearchFilter(
      this.searchForm.get('filter')?.value || '',
    );
    this.onSearchFilter(this.searchText);
  }

  // Getting the searched data
  onSearchFilter(searchText: string): void {
    this.resourceTrackerGlobalDataService.onboardingRowCountByStatus(
      this.searchText,
      this.columnFilters,
    );
    this.resourceTrackerGlobalDataService.getOnboardingParentTickets(
      1,
      100,
      searchText,
      this.statusFilters,
      this.gridSort.dir,
      this.gridSort.prop,
      this.columnFilters,
    );
  }

  clearFilters() {
    this.searchForm.reset();
    this.resourceTrackerGlobalDataService.clearOnboardingFilters();
    this.resourceTrackerGlobalDataService.onboardingRowCountByStatus(
      this.searchText,
    );
    this.dataGridHelper.clearColumnFilters();
  }

  onPageSizeChange(pageSize: number) {
    if (this.isGridLoading) return;
    this.isGridLoading = true;
    this.pagination.pageNumber = 1;
    this.pagination.currentPage = 1;
    this.pagination.pageSize = Number(pageSize);
    this.getTableData();
  }

  getTableData(tableName?: string | null) {
    this.isGridLoading = true;
    if (!tableName) {
      tableName = this.route.snapshot.paramMap.get('tableName') || '';
    }
    this.resourceTrackerGlobalDataService.getOnboardingParentTickets(
      this.pagination.pageNumber,
      this.pagination.pageSize,
      this.searchText,
      this.statusFilters,
      this.gridSort.dir,
      this.gridSort.prop,
    );
    this.isGridLoading = false;
  }

  onPageChange(currentPage: number) {
    if (this.isGridLoading) return;
    this.isGridLoading = true;
    this.pagination.currentPage = currentPage;
    this.getTableData();
  }

  filterGridData(option: string) {
    this.resourceTrackerGlobalDataService.setOnboardingResourceType(option);
    this.selectedResourceFilter = option;
    this.resourceTrackerGlobalDataService.onboardingRowCountByStatus(
      this.searchText,
    );
    this.pagination.pageNumber = 1;
    this.fetchData();
  }

  setStatusFilter(status: string) {
    this.pagination.pageNumber = 1;
    this.resourceTrackerGlobalDataService.setOnboardingStatus(status);
    this.fetchData();
  }

  getColorCodeForProgressBar(status: string) {
    let colorCode = {
      empty_color: '#EBF4FF',
      filled_color: '#0074F2',
    };
    switch (status?.toLowerCase()) {
      case 'in progress':
        colorCode.empty_color = '#EBF4FF';
        colorCode.filled_color = '#0074F2';
        break;
      case 'completed':
        colorCode.empty_color = '#DAEADF';
        colorCode.filled_color = '#008000';
        break;
      case 'invalid':
        colorCode.empty_color = '#FFEFF2';
        colorCode.filled_color = '';
        break;
      case 'not started':
        colorCode.empty_color = '#FFF5E3';
        colorCode.filled_color = '';
        break;
      default:
        break;
    }
    return colorCode;
  }

  viewOnboardingDetails(event: any) {
    const id = event?.response_ticket_number;
    const status = event?.status || '';
    const statusMessage = event?.status_message || '';

    if (
      status.toLowerCase() === 'invalid' ||
      status.toLowerCase() === 'not started'
    ) {
      this.toastService.fire({
        type: 'error',
        message: `${status}: ${statusMessage}`,
      });
      return;
    }

    if (!id) {
      this.toastService.fire({
        type: 'error',
        message: messages.error.onboarding.invalidId,
      });
      return;
    }

    this.router.navigate([`resource-tracker/onboarding/${id}/details`]);
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;
    this.pagination.pageNumber = 1;
    this.resourceTrackerGlobalDataService.onboardingRowCountByStatus(
      this.searchText,
      this.columnFilters,
    );
    this.fetchData();
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, this.bodyClass);
    this.onboardingListSubscription?.unsubscribe();
    this.getOnboardingFilterSubscription?.unsubscribe();
    this.onboardingRowCountByStatusSubscription?.unsubscribe();
  }
}
