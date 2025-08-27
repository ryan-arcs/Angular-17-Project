import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { AgChartsAngular } from 'ag-charts-angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from 'src/environments/environment';
import { ErrorComponent } from 'src/app/my-apps/iapp/components/error/error.component';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import {
  Option,
  StatusDetails,
} from 'src/app/my-apps/iapp/interfaces/dashboardInterface';
import { getStatusesToInclude, statusDetails } from './utils';
import { LoaderComponent } from '../../../../../common/components/loader/loader.component';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DashboardFilters } from 'src/app/my-apps/iapp/interfaces/global-data.interface';
import { UIService } from 'src/app/common/services/ui.service';
import { IappGlobalDataService } from '@app/my-apps/iapp/services/iapp-global-data.service';
import { recordsPerPage } from '../../../constants/global.constant';
import { messages } from '../../../constants';
import { PayloadModalComponent } from './payload-modal/payload-modal.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { ScreenAware } from '@app/common/super/ScreenAware';

const defaultPieChartData = [
  {
    statusLabel: 'Started',
    statusCode: 1001,
    count: 0,
    percentage: 0,
  },
  {
    statusLabel: 'In-progress',
    statusCode: 1002,
    count: 0,
    percentage: 0,
  },
  {
    statusLabel: 'Exception',
    statusCode: 1003,
    count: 0,
    percentage: 0,
  },
  {
    statusLabel: 'Completed',
    statusCode: 1004,
    count: 0,
    percentage: 0,
  },
  {
    statusLabel: 'Error',
    statusCode: 1005,
    count: 0,
    percentage: 0,
  },
];

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    AgChartsAngular,
    CommonModule,
    ErrorComponent,
    NgbDropdownModule,
    LoaderComponent,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    DataGridComponent,
    NgbTooltip,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DatePipe],
})
export class DashboardComponent
  extends ScreenAware
  implements OnInit, OnDestroy
{
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('detailsStatusMsgTemplate')
  detailsStatusMsgTemplate!: TemplateRef<any>;
  @ViewChild('statusMsgTemplate') statusMsgTemplate!: TemplateRef<any>;
  @ViewChild('payloadTemplate') payloadTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;

  defaultSize = recordsPerPage.defaultSize;
  errorMessage = '';
  paginationPageSizeSelector = recordsPerPage.sizes;
  bodyClass: string = 'dashboard-outer';
  public chartOptions: any;
  columns: Array<GridColumn> = [];
  dashboardDetails: any;
  dashboardGridData?: any[] = [];
  searchForm: FormGroup;
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  columnFilters: ColumnFilter[] = [];
  isPopupVisible: boolean = false;
  popupContent: string = '';
  totalPieCount: number = 0;
  instanceCopyright: string = environment.instanceCopyright;
  statusesToInclude: string[] = getStatusesToInclude();
  selectedMonth: string = 'One-Week';
  transformedData: any[] = [];
  dashboardChartData?: any[] = [];
  isPayloadChecked: boolean = false;
  startIndex: number = 0;
  pageSize: number = 10;
  // gridOptions!: GridOptions;
  prevPageSize: number = this.pageSize;
  prevStartIndex: number = this.startIndex;
  isChartLoading: boolean = false;
  isGridLoading: boolean = false;
  isColumnFilterActive = false;
  durationOptions = [
    {
      value: 1,

      option: 'Today',
    },

    {
      value: 7,

      option: 'One-Week',
    },

    {
      value: 30,

      option: '1 Month',
    },

    {
      value: 90,

      option: '3 Months',
    },

    {
      value: 180,

      option: '6 Months',
    },

    {
      value: 180,

      option: 'All',
    },
  ];
  selectedDuration: any = {
    value: 7,
    option: 'One-week',
  };

  gridDataOverlay = this.uiService.getUioverlayNoRowsTemplate(
    messages.success.dashboard.noRowFound,
  );

  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  closePopup() {
    this.isPopupVisible = true;
    this.popupContent = '';
  }

  options: any;
  selectedTheme: string = '';

  pieChartData = [...defaultPieChartData];
  applicationName: string = '';
  isLoadingDashboard: boolean = false;
  @ViewChild('searchBox') searchBox: any;
  searchString = '';
  includePayload: boolean = false;
  subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private iappGlobalDataService: IappGlobalDataService,
    private uiService: UIService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
      includePayload: [false],
    });
  }

  gridSort: GridSort = {
    dir: '',
    prop: '',
  };

  setTableColumns() {
    this.columns = [
      {
        name: 'Intf Log Id',
        prop: 'intf_log_id',
        frozenLeft: true,
      },
      {
        name: 'Interface Id',
        prop: 'interface_id',
      },
      {
        name: 'Project Name',
        prop: 'project_name',
      },
      {
        name: 'Flow Name',
        prop: 'flow_name',
      },
      {
        name: 'Execution Id',
        prop: 'execution_id',
      },
      {
        name: 'Status Code',
        prop: 'status_code',
      },
      {
        name: 'Status Message',
        prop: 'status_message',
        cellTemplate: this.statusMsgTemplate,
      },
      {
        name: 'Message Details',
        prop: 'message_details',
      },
      {
        name: 'Details Status Code',
        prop: 'details_status_code',
      },
      {
        name: 'Details Status Message',
        prop: 'details_status_message',
        cellTemplate: this.detailsStatusMsgTemplate,
      },
      {
        name: 'Transaction Id',
        prop: 'transaction_id',
      },
      {
        name: 'Key 1',
        prop: 'key1',
      },
      {
        name: 'Value 1',
        prop: 'value1',
      },
      {
        name: 'Key 2',
        prop: 'key2',
      },
      {
        name: 'Value 2',
        prop: 'value2',
      },
      {
        name: 'Key 3',
        prop: 'key3',
      },
      {
        name: 'Value 3',
        prop: 'value3',
      },
      {
        name: 'Key 4',
        prop: 'key4',
      },
      {
        name: 'Value 4',
        prop: 'value4',
      },
      {
        name: 'Key 5',
        prop: 'key5',
      },
      {
        name: 'Value 5',
        prop: 'value5',
      },
      {
        name: 'Key 6',
        prop: 'key6',
      },
      {
        name: 'Value 6',
        prop: 'value6',
      },
      {
        name: 'Key 7',
        prop: 'key7',
      },
      {
        name: 'Value 7',
        prop: 'value7',
      },
      {
        name: 'Key 8',
        prop: 'key8',
      },
      {
        name: 'Value 8',
        prop: 'value8',
      },
      {
        name: 'Key 9',
        prop: 'key9',
      },
      {
        name: 'Value 9',
        prop: 'value9',
      },
      {
        name: 'Key 10',
        prop: 'key10',
      },
      {
        name: 'Value 10',
        prop: 'value10',
      },
      {
        name: 'Created Date',
        prop: 'created_date',
        cellTemplate: this.dateTemplate,
      },
      {
        name: 'Updated Date',
        prop: 'intf_log_updated_date',
        cellTemplate: this.dateTemplate,
      },
    ];

    // payload visible on condition
    if (this.isPayloadChecked) {
      this.columns.splice(11, 0, {
        name: 'Payload',
        prop: 'payload',
        cellTemplate: this.payloadTemplate,
      });
    } else {
      this.columns.splice(11, 1);
    }
    
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.iappGlobalDataService.globalApplicationName$.subscribe({
        next: (value) => {
          if (value) {
            this.applicationName = value;
          }
        },
      }),
    );

    this.subscriptions.add(
      this.iappGlobalDataService.dashboardGraphResults$.subscribe({
        next: (data: any) => {
          this.dashboardChartData = data;
          this.transformedData = this.transformBarGraph();
          this.setUpPieChartData();
          this.configureChartOptions();
        },
      }),
    );

    this.subscriptions.add(
      this.uiService.activatedTheme$.subscribe({
        next: (theme) => {
          this.selectedTheme = theme;
          this.setUpPieChartData();
          this.configureChartOptions();
          // this.renderGraph(this.onboardingResource?.parentTicket?.childTickets);
        },
      }),
    );

    this.subscriptions.add(
      this.iappGlobalDataService.dashboardGridResults$.subscribe({
        next: (res: any) => {
          const { data } = res;
          this.dashboardGridData = data || [];
          this.pagination.totalCount = res?.totalCount || 0;
          this.errorMessage = !this.pagination.totalCount
            ? 'Oops! We couldn’t find any records.'
            : '';
        },
      }),
    );

    this.subscriptions.add(
      this.iappGlobalDataService.dashboardFilters$.subscribe({
        next: (res: DashboardFilters) => {
          const {
            duration,
            pagination,
            searchText,
            columnFilters,
            sortColumn,
            sortDirection,
          } = res;
          this.selectedDuration.value = duration;
          this.selectedMonth =
            this.durationOptions.find((option) => option.value === duration)
              ?.option || 'One-Week';
          this.pagination.pageNumber = pagination.startIndex;
          this.pagination.pageSize = pagination.pageSize;
          this.searchForm.get('filter')?.setValue(searchText);
          this.columnFilters = columnFilters;
          this.gridSort.prop = sortColumn;
          this.gridSort.dir = sortDirection;
        },
      }),
    );

    this.subscriptions.add(
      this.iappGlobalDataService.isChartLoading$.subscribe({
        next: (isChartLoading: any) => {
          this.isChartLoading = isChartLoading;
        },
      }),
    );

    this.subscriptions.add(
      this.iappGlobalDataService.isGridLoading$.subscribe({
        next: (isGridLoading: any) => {
          this.isGridLoading = isGridLoading;
        },
      }),
    );
    this.renderer.removeClass(document.body, 'schedules-outer');
    this.renderer.addClass(document.body, this.bodyClass);
    this.iappGlobalDataService.getDashboardGridData();
    this.iappGlobalDataService.getDashboardGraphData();
  }

  ngAfterViewInit() {
    this.setTableColumns();
    this.cdr.detectChanges();
  }

  onCellClicked(value: any) {
    if (value) {
      this.isPopupVisible = true;
      this.popupContent = value;
      const columnsModalRef = this.modalService.open(PayloadModalComponent, {
        windowClass: 'sidebar-small right-side-popup payload-data-popup-iapp',
      });
      columnsModalRef.componentInstance.payloadContent = value;
    }
  }

  onFilterChanged() {}

  clearFilters() {
    this.columnFilters = [];
    this.searchString = '';
    this.searchForm.reset();
    this.shootSearch();
  }

  refreshData() {
    this.getDashboardGridData();
    this.getDashboardGraphData();
  }

  calculateTotalCount(
    statusData: { statusCode: number; statusMessage: string; count: number }[],
  ): number {
    return statusData.reduce((sum, status) => sum + status.count, 0);
  }

  initializeRowWithStatuses(month: string): { [key: string]: any } {
    const row: { [key: string]: any } = { month };
    this.statusesToInclude.forEach((status) => {
      row[status] = 0;
    });
    return row;
  }

  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchString = this.searchForm.get('filter')?.value;
    this.getDashboardGridData();
  }

  populateRowWithData(
    row: { [key: string]: any },
    statusData: { statusMessage: string; count: number }[],
    totalCount: number,
  ): void {
    statusData.forEach((status) => {
      if(row[status.statusMessage]){
        row[status.statusMessage]+=
          totalCount > 0 ? (status.count / totalCount) * 100 : 0;
      }else{
        row[status.statusMessage] =
          totalCount > 0 ? (status.count / totalCount) * 100 : 0;
      }
    });
  }

  transformBarGraph() {
    return (
      this.dashboardChartData?.map((data: any) => {
        const totalCount = this.calculateTotalCount(data.statusData);
        const row = this.initializeRowWithStatuses(data.month);
        this.populateRowWithData(row, data.statusData, totalCount);
        return row;
      }) || []
    );
  }

  navigateToApplications() {
    this.router.navigate(['iapp/projects']);
  }

  getDashboardGraphData() {
    this.iappGlobalDataService.getDashboardGraphData(
      this.selectedDuration.value,
    );
  }

  getPayloadData(event: Event) {
    this.isPayloadChecked = (event.target as HTMLInputElement).checked;
    this.pagination.pageNumber = 1;
    this.getDashboardGridData();
    this.setTableColumns();
  }

  getDashboardGridData() {
    this.iappGlobalDataService.getDashboardGridData(
      this.selectedDuration.value,
      this.pagination.pageNumber,
      this.pagination.pageSize,
      this.searchString || '',
      this.isPayloadChecked,
      this.gridSort.prop,
      this.gridSort.dir,
      this.columnFilters,
    );
  }

  setUpPieChartData() {
    this.pieChartData = JSON.parse(JSON.stringify(defaultPieChartData));
    const totalCounts: { [key: string]: number } = {};
    this.dashboardChartData?.forEach((data: any) => {
      // Calculate the total count for this month's status data
      totalCounts[data.month] = data.statusData.reduce(
        (sum: number, status: any) => sum + status.count,
        0,
      );

      // Update pieChartData with the counts from the current month's status data
      data.statusData.forEach((status: any) => {
        const pieData = this.pieChartData.find(
          (p) => p.statusCode === status.statusCode,
        );
        if (pieData) {
          pieData.count += status.count; // Aggregate the count
        }
      });
    });

    // Calculate percentages based on the total count of all statuses

    const grandTotalCount = this.pieChartData.reduce(
      (sum, pieData) => sum + pieData.count,
      0,
    );
    this.totalPieCount = 0;
    if (grandTotalCount > 0) {
      this.pieChartData.forEach((pieData) => {
        pieData.percentage = Number((pieData.count / grandTotalCount) * 100);
        this.totalPieCount += pieData.count;
      });
    }
  }

  updateMonthStatusData(monthData: any, currentStatusCode: string): void {
    if (currentStatusCode && currentStatusCode !== undefined) {
      const statusData = monthData.month.statusData.find(
        (statusData: any) => statusData.statusCode == currentStatusCode,
      );
      if (statusData) {
        statusData.count++;
      }
    }
  }

  getColorForStatusCode(statusLabel: string): string {
    const status = statusDetails.find((status: StatusDetails) => {
      return (
        status.statusLabel.toLowerCase().trim() ===
        statusLabel.toLowerCase().trim()
      );
    });
    return status.statusColor;
  }
  noDataOverlay = () => {
    return [
      `
      <div style="display: flex; justify-content: center; align-items: center; height: inherit">
        <div class="wrapper-no-data">
          <div class="no-data-avl" style="text-align: center;">
            <img src="assets/images/no-records-found.svg" />
            <h6 style="margin-top: 24px;">No Data Available For Charts. Select another Duration!</h6>
          </div>
        </div>
      </div>
 
      `,
    ].join('\n');
  };

  filterBarData(data: any) {
    return [
      {
        month: data['month'],
        ...Object.fromEntries(
          Object?.entries(data)
            ?.filter(
              ([key, value]) =>
                key !== 'month' && typeof value == 'number' && value > 0,
            )
            ?.map(([key, value]) => [key, Number(value).toFixed(2)]),
        ),
      },
    ];
  }

  getThemeVariableForCanvasText(activatedTheme: string) {
    switch (activatedTheme) {
      case 'dark':
        return '#ffffff';
      default:
        return '#464646';
    }
  }

  // get theme color for canvas
  getThemeVariableForCanvas(activatedTheme: string) {
    switch (activatedTheme) {
      case 'dark':
        return '#2c2c2c';
      default:
        return '#F6F7FB';
    }
  }

  configureChartOptions(): void {
    if (this.totalPieCount <= 0) {
      this.pieChartData = [];
    }
    this.options = [
      {
        title: { text: '' },
        data: this.transformedData,
        background: {
          fill: this.getThemeVariableForCanvas(this.selectedTheme),
        },
        series: this.statusesToInclude.map((status) => ({
          type: 'bar',
          xKey: 'month',
          yKey: status,
          yName: status,
          cornerRadius: 10,
          fill: this.getColorForStatusCode(status),
          label: {
            // Updated formatter to handle values between 0 and 1
            formatter: (params: any) => {
              const formattedValue = this.roundValue(params.value);
              return formattedValue !== false ? `${formattedValue}%` : '';
            },
            placement: 'outside',
            color: this.getThemeVariableForCanvasText(this.selectedTheme),
          },
          tooltip: {
            renderer: (params: any) => {
              const monthData = this.dashboardChartData?.find(
                (data: any) => data.month === params.datum.month,
              );

              const statusKey = params.yKey;
              const totalCount = this.calculateTotalCount(monthData.statusData);

              // const specificStatus = monthData.statusData.find(
              //   (status: any) => status.statusMessage === statusKey,
              // );
              // const specificStatusCount = specificStatus
              //   ? specificStatus.count
              //   : 0;

              const specificStatus = monthData.statusData.reduce((acc: any, item: any) => {
                acc[item.statusMessage] = (acc[item.statusMessage] || 0) + item.count;
                return acc;
              }, {});

              const specificStatusCount = specificStatus[statusKey] || 0

              // Handle percentage formatting
              const percentage = params.datum[statusKey];
              if (specificStatusCount > 0) {
                return {
                  content: `<b>Total: </b> ${totalCount}<br>
                            <b>${statusKey}: </b> ${specificStatusCount} (${percentage}%)<br>
                            <b>Month: </b> ${params.datum.month}<br>`,
                };
              } else {
                return '';
              }
            },
          },
        })),
        axes:
          this.transformedData.length > 0
            ? [
                {
                  type: 'category',
                  position: 'bottom',
                  label: {
                    rotation: 30,
                    color: this.getThemeVariableForCanvasText(
                      this.selectedTheme,
                    ),
                  },
                },
                {
                  type: 'number',
                  position: 'left',
                  title: { text: 'Percentage' },
                  label: {
                    formatter: (params: any) => {
                      const formattedValue = this.roundValue(params.value);
                      return formattedValue !== false
                        ? `${formattedValue}%`
                        : '';
                    },
                    color: this.getThemeVariableForCanvasText(
                      this.selectedTheme,
                    ),
                  },
                },
              ]
            : [],
        legend:
          this.transformedData.length > 0
            ? {
                position: 'bottom',
                item: {
                  marker: { shape: 'circle' },
                  label: {
                    color: this.getThemeVariableForCanvasText(
                      this.selectedTheme,
                    ),
                  },
                },
              }
            : null,
        overlays: {
          noData: {
            renderer: this.noDataOverlay,
          },
        },
      },
      {
        title: { text: '' },
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
        data: this.pieChartData,
        series: [
          {
            type: 'pie',
            angleKey: 'percentage',
            legendItemKey: 'statusLabel',
            calloutLabelKey: 'statusLabel',
            sectorLabelKey: 'count',
            sectorLabel: { color: 'white' },
            calloutLabel: {
              enabled: true,
              color: this.getThemeVariableForCanvasText(this.selectedTheme),
              formatter: (params: any) => {
                const formattedValue = this.roundValue(
                  params?.datum?.percentage,
                );
                return formattedValue !== false
                  ? `${params.datum.statusLabel}: ${formattedValue}%`
                  : '';
              },
            },
            tooltip: {
              renderer: (params: any) => {
                const formattedValue = this.roundValue(params.datum.percentage);
                return formattedValue !== false
                  ? {
                      content: `<b>Total:</b> ${this.totalPieCount} <br>
                           <b>${params.datum.statusLabel}:</b> ${params.datum.count} (${params.datum.percentage}%) <br>`,
                    }
                  : '';
              },
            },
            fills: this.pieChartData.map((data) =>
              this.getColorForStatusCode(data.statusLabel),
            ),
          },
        ],
        overlays: {
          noData: {
            renderer: this.noDataOverlay,
          },
        },
      },
    ];

    this.chartOptions = this.options;
    this.initializePieChartData();
  }

  initializePieChartData() {
    this.pieChartData = defaultPieChartData;
  }

  filterChartData(option: Option) {
    this.iappGlobalDataService.getDashboardGraphData(option.value);
    this.iappGlobalDataService.getDashboardGridData(
      option.value,
      this.pagination.pageNumber,
      this.pagination.pageSize,
      this.searchString,
      this.isPayloadChecked,
      this.gridSort.prop,
      this.gridSort.dir,
      this.columnFilters,
    );
  }

  onPageChange(currentPage: number) {
    if (this.isGridLoading) return;
    this.pagination.currentPage = currentPage;
    this.getDashboardGridData();
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

  onSort(sort: any) {
    this.pagination.pageNumber = 1;
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.getDashboardGridData();
  }

  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.getDashboardGridData();
  }

  // Handles pagination change and fetches data for the selected page
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.getDashboardGridData();
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.pagination.pageNumber = 1;
    this.columnFilters = columnFilters;
    this.getDashboardGridData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
