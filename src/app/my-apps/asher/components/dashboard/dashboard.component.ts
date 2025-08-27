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
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
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
import {
  recordsPerPage,
  hostingLocationOptions,
} from '@app/my-apps/asher/constants/global.constant';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { AgChartsAngular } from 'ag-charts-angular';
import { ErrorComponent } from '../common/error/error.component';
import { DownloadApplicationComponent } from '../../applications/download-application/download-application.component';
import { AuthService } from '@app/common/services/auth.service';

import { Router } from '@angular/router';
import { AddEditVendorsComponent } from '../lookups/vendors/add-edit-vendors/add-edit-vendors.component';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  providers: [DatePipe],
  imports: [
    DataGridComponent,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    NgbDropdownModule,
    NgxDatatableModule,
    CommonModule,
    AgChartsAngular,
    ErrorComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent
  extends ScreenAware
  implements OnInit, AfterViewInit
{
  @ViewChild('userNameTemplate') userNameTemplate!: TemplateRef<any>;
  @ViewChild('applicationNameTemplate')
  applicationNameTemplate!: TemplateRef<any>;
  @ViewChild('applicationIdTemplate') applicationIdTemplate!: TemplateRef<any>;
  @ViewChild('userApprover1Template') userApprover1Template!: TemplateRef<any>;
  @ViewChild('userApprover2Template') userApprover2Template!: TemplateRef<any>;
  @ViewChild('hostingLocationTemplate')
  hostingLocationTemplate!: TemplateRef<any>;
  @ViewChild('gxpSoxTemplate') gxpSoxTemplate!: TemplateRef<any>;
  @ViewChild('defaultValueTemplate') defaultValueTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;

  @ViewChild('vendorIdTemplate') vendorIdTemplate!: TemplateRef<any>;
  @ViewChild('staleTerminatedTemplate')
  staleTerminatedTemplate!: TemplateRef<any>;

  searchForm!: FormGroup;
  searchTerm: string = '';

  columns: Array<GridColumn> = [];
  errorMessage = '';
  columnFilters: ColumnFilter[] = [];
  isChartLoading: boolean = true;
  modalRefSubscription: Subscription | undefined;

  gridName = 'dashboard-application';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };

  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  defaultDateFormat = environment.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  subscriptions: Subscription = new Subscription();
  selectedTheme: string = '';
  selectedCategory: string | null = null;
  applicationsData: any = [];
  applicationsDataBKP: any = [];
  applicationsFiltersData: any = [];
  isLoading: boolean = false;

  pieChartOfStaleRecordsData: any = [
    {
      statusLabel: 'Stale Records',
      statusCode: 1001,
      count: 0,
      percentage: 0,
    },
    {
      statusLabel: 'Current Records',
      statusCode: 1001,
      count: 0,
      percentage: 0,
    },
  ];

  pieChartOfUserRecordsData: any = [
    {
      statusLabel: 'Current Users Apps',
      statusCode: 1001,
      count: 0,
      percentage: 0,
    },
    {
      statusLabel: 'Terminated Users Apps',
      statusCode: 1001,
      count: 0,
      percentage: 0,
    },
  ];

  staleRecordsFilter: string = 'All';
  userRecordsFilter: string = 'All';

 
  pieChartStaleRecordsOptions: any;
  pieChartUsersRecordsOptions: any;
  selectedFilterOption =  'all';
  staleFilterOptions = [{label:'Current Records', code: 'true'}, {label:'Stale Records', code: 'false'}];
  userFilterOptions = [ {label:'Active Users Apps', code: 'false'}, {label:'Terminated Users Apps', code: 'true'}]
  
  constructor(
    private uiService: UIService,
    private asherGlobalDataService: AsherGlobalDataService,
    private dataGridHelper: DataGridHelper,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private authService: AuthService,
    private router: Router,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
  }
  

  ngOnInit(): void {
    this.subscriptions.add(
      this.uiService.activatedTheme$.subscribe({
        next: (theme) => {
          this.selectedTheme = theme;
          this.configureChartOptions();
        }
      })
      );
      this.subscriptions.add(
        this.asherGlobalDataService.dashboardDetails$.subscribe({
          next:(data)=>{
            this.applicationsData = data?.rows || [];
            const { startIndex, pageSize, totalCount } = data?.pagination;
            this.pagination.totalCount = totalCount || 0;
            this.pagination.pageNumber = startIndex;
            this.pagination.pageSize = pageSize;
            this.setGlobalSearch(data?.searchText);
            this.setInitialSorts(data?.sorting);
            this.columnFilters = data?.columnFilters || [];
            this.errorMessage = data.loaded && !totalCount ? 'Oops! We couldn’t find any records.' : '';
            this.analyzeDashboardRecords(data.staleRecordsCount, data.terminatedUsersCount);
        }
      })
    )

    this.subscriptions.add(
      this.asherGlobalDataService.isChartLoading$.subscribe({
        next: (isChartLoading: boolean) => {
          this.isChartLoading = isChartLoading;
        },
      }),
    );
  }

  ngAfterViewInit(): void {
    this.setTableColumns();
    this.cdr.detectChanges();
  }

  analyzeDashboardRecords(staleRecords: number, termRecords: number){
    const totalRecords = this.pagination.totalCount || 0;
   
    // --- Stale Records Pie Chart ---
    const nonStaleRecords = totalRecords - staleRecords;
  
    this.pieChartOfStaleRecordsData[1].count = nonStaleRecords;
    this.pieChartOfStaleRecordsData[0].count = staleRecords;
  
    // Percentages
    this.pieChartOfStaleRecordsData[1].percentage = totalRecords ? (nonStaleRecords / totalRecords) * 100 : 0;
    this.pieChartOfStaleRecordsData[0].percentage = totalRecords ? (staleRecords / totalRecords) * 100 : 0;
   
    // --- Terminated User Records Pie Chart ---
    const activeUserRecords = totalRecords - termRecords;
  
    this.pieChartOfUserRecordsData[0].count = activeUserRecords;
    this.pieChartOfUserRecordsData[1].count = termRecords;
  
    // Percentages
    this.pieChartOfUserRecordsData[0].percentage = totalRecords ? (activeUserRecords / totalRecords) * 100 : 0;
    this.pieChartOfUserRecordsData[1].percentage = totalRecords ? (termRecords / totalRecords) * 100 : 0;
   
    this.configureChartOptions();
  }

  onSelectedFilter(option: string, type: string) {
    if (type == 'user') {
      this.userRecordsFilter = option;
    } else {
      this.staleRecordsFilter = option;
    }

    if (this.userRecordsFilter == 'All') {
      this.columnFilters = this.columnFilters.filter(
        (filter) => filter.columnName != 'has_terminated_user',
      );
    }

    if (this.staleRecordsFilter == 'All') {
      this.columnFilters = this.columnFilters.filter(
        (filter) => filter.columnName != 'is_record_stale',
      );
    }

    if (this.userRecordsFilter != 'All') {
      this.columnFilters = this.columnFilters.filter(
        (filter) => filter.columnName != 'has_terminated_user',
      );
      const hasTerminatedUser: ColumnFilter = {
        filterType: 'multi-text',
        columnName: 'has_terminated_user',
        operator: null,
        conditions: [
          { type: 'contains', searchTags: [this.userRecordsFilter] },
        ],
      };
      this.columnFilters.push(hasTerminatedUser);
    }

    if (this.staleRecordsFilter != 'All') {
      this.columnFilters = this.columnFilters.filter(
        (filter) => filter.columnName != 'is_record_stale',
      );
      const isRecordState: ColumnFilter = {
        filterType: 'multi-text',
        columnName: 'is_record_stale',
        operator: null,
        conditions: [
          {
            type: 'contains',
            searchTags: [this.staleRecordsFilter == 'true' ? 'false' : 'true'],
          },
        ],
      };
      this.columnFilters.push(isRecordState);
    }
    // this.selectedFilterOption = option;
    this.fetchData();
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

  configureChartOptions(){
    this.pieChartStaleRecordsOptions = {
      title: {
        text: 'Applications by Stale Records',
        color: this.getThemeVariableForCanvasText(this.selectedTheme),
        fontWeight: 400, 
        fontSize: 18,
      },
      background: {
        fill: this.getThemeVariableForCanvas(this.selectedTheme),
      },
      legend: {
        position: 'bottom',
        item: {
          label: {
            fontSize: 13,
            color: this.getThemeVariableForCanvasText(this.selectedTheme),
          },
          marker: { size: 15, shape: 'circle' },
        },
      },
      data: this.pieChartOfStaleRecordsData,
      series: [
        {
          type: 'pie',
          angleKey: 'percentage',
          legendItemKey: 'statusLabel',
          calloutLabelKey: 'statusLabel',
          sectorLabelKey: 'count',
          sectorLabel: { color: 'white' },
          fills: ['#FAAD14', '#099138'],
          calloutLabel: {
            enabled: true,
            color: this.getThemeVariableForCanvasText(this.selectedTheme),
            formatter: (params: any) => {
              return params?.datum?.percentage?.toFixed(2)
                ? `${params.datum.statusLabel}: ${params?.datum?.percentage?.toFixed(2)}%`
                : '';
            },
          },
          tooltip: {
            renderer: (params: any) => {
              const formattedValue = this.roundValue(params.datum.percentage);
              return formattedValue !== false
                ? {
                    content: `<b>Total:</b> ${this.pagination.totalCount} <br>
                         <b>${params.datum.statusLabel}:</b> ${params.datum.count} (${params.datum.percentage}%) <br>`,
                  }
                : '';
            },
          },
        },
      ],
    };

    this.pieChartUsersRecordsOptions = {
      title: {
        text: 'Application by Terminated Users',
        color: this.getThemeVariableForCanvasText(this.selectedTheme),
        fontWeight: 400, 
        fontSize: 18,
      },
      background: {
        fill: this.getThemeVariableForCanvas(this.selectedTheme),
      },
      legend: {
        position: 'bottom',
        item: {
          label: {
            fontSize: 13,
            color: this.getThemeVariableForCanvasText(this.selectedTheme),
          },
          marker: { size: 15, shape: 'circle' },
        },
      },
      data: this.pieChartOfUserRecordsData,
      series: [
        {
          type: 'pie',
          angleKey: 'percentage',
          legendItemKey: 'statusLabel',
          calloutLabelKey: 'statusLabel',
          sectorLabelKey: 'count',
          sectorLabel: { color: 'white' },
          fills: ['#099138', '#D72300'],
          calloutLabel: {
            enabled: true,
            color: this.getThemeVariableForCanvasText(this.selectedTheme),
            formatter: (params: any) => {
              return params?.datum?.percentage?.toFixed(2)
                ? `${params.datum.statusLabel}: ${params?.datum?.percentage?.toFixed(2)}%`
                : '';
            },
          },
          tooltip: {
            renderer: (params: any) => {
              const formattedValue = params.datum.percentage;
              return formattedValue !== false
                ? {
                    content: `<b>Total:</b> ${this.pagination.totalCount} <br>
                         <b>${params.datum.statusLabel}:</b> ${params.datum.count} (${params.datum.percentage}%) <br>`,
                  }
                : '';
            },
          },
        },
      ],
    };
  }

  getThemeVariableForCanvasText(activatedTheme: string) {
    if (activatedTheme.includes('dark')) {
      return '#FFFFFF';
    }
    return '#000000';
  }

  // get theme color for canvas
  getThemeVariableForCanvas(activatedTheme: string) {
    if (activatedTheme.includes('dark')) {
      return '#2c2c2c';
    }
    return '#f6f7fb';
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
        cellTemplate: this.defaultValueTemplate,
        width: 175,
        searchConfig: {
          enableOperator: true,
        },
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
        prop: 'has_terminated_user',
        name: 'Terminated',
        width: 150,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.staleTerminatedTemplate,
      },
      {
        prop: 'is_record_stale',
        name: 'Stale',
        width: 150,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.staleTerminatedTemplate,
      },
      {
        prop: 'created_at',
        name: 'Created Date',
        hidden: true,
        width: 190,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.dateTemplate,
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
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.dateTemplate,
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


  // Fetches dashboard data based on search, sort, filters, and pagination
  private fetchData(): void {
    const searchValue = this.searchForm.get('filter')?.value?.trim() || '';
    this.asherGlobalDataService.getDashBoardData({
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
    this.searchTerm = this.searchForm.get('filter')?.value?.trim() || '';
    this.fetchData();
  }

  // Refreshes the department list based on search, sort, filters, and pagination
  refreshDashboardData() {
    this.asherGlobalDataService.getDashBoardData({
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
    this.userRecordsFilter = this.staleRecordsFilter = 'All';
    this.fetchData();
  }

  // Updates column filters and fetches filtered data
  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;
    this.fetchData();
  }

  roundValue(value: number) {
    if (value <= 0) {
      return false;
    }

    if (value >= 10) {
      return Math.floor(value); // Round to whole number
    } else if (value >= 1) {
      return Math.floor(value * 10) / 10;
    } else {
      return Math.floor(value * 100) / 100;
    }
  }

  // Checks if the user has permission for a specific configuration action
  isActionPermitted(action: string = '', moduleSlug: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: moduleSlug,
      permissionSlug: action,
      ignoreRedirection: true,
    });
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

  // Navigates to user details page if user has permission
  goToUser(email: string) {
    if (!this.isActionPermitted('details', 'users')) {
      return;
    }
    this.router.navigate([`/asher/users/${email}/user-details`]);
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

  downloadTableData() {
    const tableColumns = this.dataGridHelper._tableColumns.getValue();
    const orderedColumnsString = (tableColumns?.['application-dashboard'] || [])
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
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    };

    const modalRef = this.modalService.open(DownloadApplicationComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static',
    });
    modalRef.componentInstance.defaultName = `Dashboard-${this.asherGlobalDataService.currentDate()}`;

    this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
      if (data.action === 'SUBMIT') {
        this.asherGlobalDataService.downloadDashBoardTableData({
          ...payload,
          fileName: data.fileName,
          orderedColumns: orderedColumnsString,
        });
        if (this.searchForm.get('filter')?.value?.trim() != this.searchTerm) {
          this.asherGlobalDataService.getDashBoardData(payload);
        }
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.modalRefSubscription?.unsubscribe();
  }
}
