import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import cronstrue from 'cronstrue';
import { CommonModule, DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import * as cronParser from 'cron-parser';
import { NgbDropdownModule, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from 'src/app/common/modals/confirmation-modal/confirmation-modal.component';
import { IappGlobalDataService } from 'src/app/my-apps/iapp/services';
import { AuthService } from 'src/app/common/services/auth.service';
import { environment } from 'src/environments/environment';
import { ApiLogs } from '../../../components/api-logs/api-logs.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import { GlobalDataService as CommonDataService} from '@app/common/services/global-data.service';
import { ScreenAware } from '@app/common/super/ScreenAware';


@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [DataGridComponent, CommonModule, NgbDropdownModule, FormsModule,NgbTooltip,
    ReactiveFormsModule,],
  providers: [DatePipe],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss',
})
export class SchedulerComponent
  extends ScreenAware
  implements OnInit, OnDestroy
{
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('applicationNameTemplate')
  applicationNameTemplate!: TemplateRef<any>;
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('scheduleHeaderTemplate')
  scheduleHeaderTemplate!: TemplateRef<any>;
  @ViewChild('idleTemplate') idleTemplate!: TemplateRef<any>;
  @ViewChild('schedularTemplate') schedularTemplate!: TemplateRef<any>;

  defaultSize = 25;
  errorMessage = '';
  paginationPageSizeSelector = [25, 50, 75, 100];
  columns: Array<GridColumn> = [];
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: 25,
  };
  gridSort: GridSort = {
    dir: '',
    prop: '',
  };
  columnFilters: ColumnFilter[] = [];
  globalSearch: string = '';
  searchTerm = ''

  bodyClass = 'schedules-outer';
  getSchedulersSubscription: Subscription | undefined;
  modifyScheduleSubscription: Subscription | undefined;
  canStopMonitoring = false;
  isloadingSchedules: boolean = false;
  applicationName: string = '';
  schedulerList: any[] = [];
  schedulerListBKP: any[] = [];
  updateApplicationsSubscription: Subscription | undefined;
  intervalSubscription: Subscription | undefined;
  projectMonitoringFrequency = environment.iAppProjectMonitoringFrequency
    ? Number(environment.iAppProjectMonitoringFrequency) * 1000
    : 2000;
  projectMonitoringMinDuration = environment.iAppProjectMonitoringMinDuration
    ? Number(environment.iAppProjectMonitoringMinDuration) * 1000
    : 10000;

  isColumnFilterActive: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private iappGlobalDataService: IappGlobalDataService,
    private authService: AuthService,
    private renderer: Renderer2,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private commonDataService: CommonDataService,
  ) {
    super();
  }

  /**
   * Initializes component data and subscriptions.
   * @returns {void}
   */

  ngOnInit(): void {
    // Subscribe to the global application name observable
    this.iappGlobalDataService.globalApplicationName$.subscribe({
      next: (value) => {
        if (value) {
          this.applicationName = value;
        }
      },
    });
    // Subscribe to the schedule results observable
    this.getSchedulersSubscription =
    this.iappGlobalDataService.scheduleResults$.subscribe({
      next: (data: any) => {
        this.setSchedules(data);
        if (
          data?.some((application: any) => {
            return application?.status?.toLowerCase() !== 'idle';
          })
        ) {
          this.monitorProjects();
        }
      },
    });
    
    this.updateApplicationsSubscription =
    this.iappGlobalDataService.updateScheduleResults$.subscribe({
      next: (applications) => {
        if (applications?.length) {
          if (
            !applications?.some((application: any) => {
              return application?.status?.toLowerCase() !== 'idle';
            })
          ) {
            this.stopMonitoringInterval();
          }
          this.updateSchedules(applications as []);
        }
      },
    });
    this.renderer.addClass(document.body, this.bodyClass);
    this.getSchedules()
  }

  setTableColumns() {
    this.columns = [
      {
        name: 'Name',
        prop: 'name',
        width: 350,
        cellTemplate: this.applicationNameTemplate,
      },
      {
        name: 'Last Run',
        prop: 'lastRun',
      },
      {
        name: 'Schedule (UTC)',
        prop: 'schedule',
        headerTemplate: this.scheduleHeaderTemplate,
        cellTemplate: this.schedularTemplate,
      },
      {
        name: 'Schedule Description',
        prop: 'scheduleDescription',
      },
      {
        name: 'Status',
        prop: 'status',
        cellTemplate: this.idleTemplate,
      },
    ];
  }

  ngAfterViewInit() {
    this.setTableColumns();
  }

  onSearchChange(event: any){
    this.searchTerm = (event.target as HTMLInputElement).value?.trim();
    this.pagination.pageNumber = 1;
    this.getScheduleData();
  }

  onFilterChanged() {
  }

  clearFilters() {
    this.columnFilters = [];
    this.searchTerm = '';
    this.getScheduleData();
  }

  valueWithLoader(value: string) {
    return `<div class="sell-outer"><span class="material-symbols-rounded loader">cycle</span><span>${value || ''}</span></div>`;
  }
  /**
   * Fetches the schedules from the global data service.
   * @returns {void}
   */
  getSchedules() {
    this.iappGlobalDataService.getSchedules();
  }

  setSchedules(data: any) {
    this.schedulerList = data.map(
      (item: {
        enabled: boolean;
        schedule: {
          cronExpression: string;
        };
        lastRun: string;
      }) => {
        const orgSchedule = item.schedule;
        const { schedule, scheduleDescription } =
          this.setScheduleAndDescription(item);
        return {
          ...item,
          schedule: schedule,
          orgSchedule,
          scheduleDescription: scheduleDescription,
          avatar: `avatar${Math.floor(Math.random() * 6)}`,
          lastRun:
            this.datePipe.transform(item.lastRun, this.defaultDateFormat) || '',
        };
      },
    );
    this.pagination.totalCount = this.schedulerList?.length || 0;
    this.schedulerListBKP = this.schedulerList;
    this.getScheduleData();
  }

  getScheduleData() {
    let schedulerData: any = this.commonDataService.getPagedData(
      this.schedulerListBKP,
      this.searchTerm || '',
      this.columnFilters,
      this.pagination,
      this.gridSort
    );
    this.schedulerList = schedulerData?.data || []
    this.pagination.totalCount = schedulerData?.totalCount || 0
    this.errorMessage = this.isLoading && !this.schedulerList.length ? 'Oops! We couldn’t find any records.': '';
    this.isLoading = true;
  }

  setScheduleAndDescription(item: any) {
    let schedule = '-';
    let scheduleDescription = '-';
    if (item.enabled) {
      if (schedule) {
        if (item?.schedule?.period === -1) {
          schedule = item?.schedule?.cronExpression || '-';
          const cronParsedResult = cronParser.parseString(schedule);

          if (Object.keys(cronParsedResult.errors).length <= 0) {
            scheduleDescription = cronstrue.toString(schedule);
          }
        } else {
          schedule =
            scheduleDescription = `Every ${item?.schedule.period} ${item?.schedule.timeUnit}`;
        }
      }
      schedule = schedule || '-';
    } else {
      schedule = 'Disabled';
      scheduleDescription = '';
    }

    return { schedule: item?.action || schedule, scheduleDescription };
  }
  /**
   * Navigates to the applications page.
   * @returns {void}
   */
  navigateToApplications() {
    this.router.navigate(['iapp/projects']);
  }

  /**
   * Determines if a cell is editable based on the schedule value.
   * @param {any} params - The cell parameters.
   * @returns {boolean} - Whether the cell is editable.
   */
  isEditable(params: any) {
    return params.data.schedule !== 'Disabled';
  }

  /**
   * Invokes update cronExpression request by taking jobId and updated cronExpression as parameter
   * @param {string} jobId
   * @param {string} cronExpression
   * @param {ValueSetterParams} params
   * @return {void}
   */

  /**
   * Handles cell click in schedules listing for actions
   * @param {any} params
   * @param {any} action
   * @return {void}
   */
  onCellClicked(params: any, action: any): void {
    if (params && action) {
      const paramsData = params;
      if (action === 'VIEWLOGS') {
        this.viewLogs(params?.id, params?.name);
        return;
      }
      const modalRef = this.modalService.open(ConfirmationModalComponent);
      modalRef.componentInstance.action = action;
      modalRef.componentInstance.entity = 'Schedule';
      modalRef.componentInstance.message = `${action} ${params?.['name']}`;
      modalRef.closed.subscribe(async (data) => {
        if (data === 'CONFIRM') {
          if (this.intervalSubscription) {
            this.intervalSubscription.unsubscribe();
          }
          await this.manageSchedule(action, paramsData);
          const thisSchedule = this.schedulerList?.find(
            (existingSchedule: any) => existingSchedule.id === params?.id,
          );

          if (thisSchedule?.id) {
            switch (action) {
              case 'Enable':
                this.updateScheduleListRow(thisSchedule, {
                  id: params?.id,
                  status: thisSchedule.status,
                  enabled: thisSchedule.enabled,
                  schedule: thisSchedule.orgSchedule,
                  lastRun: thisSchedule.lastRun,
                  action: 'Enabling',
                });
                break;
              case 'Disable':
                this.updateScheduleListRow(thisSchedule, {
                  id: params?.id,
                  status: thisSchedule.status,
                  enabled: thisSchedule.enabled,
                  schedule: thisSchedule.orgSchedule,
                  lastRun: thisSchedule.lastRun,
                  action: 'Disabling',
                });
                break;
              case 'Run':
                this.updateScheduleListRow(thisSchedule, {
                  id: params?.id,
                  status: this.nextScheduleStatus(paramsData.status || ''),
                  enabled: thisSchedule.enabled,
                  schedule: thisSchedule.orgSchedule,
                  lastRun: thisSchedule.lastRun,
                });
                break;
            }
          }
        }
      });
    }
  }

  nextScheduleStatus(action: string) {
    switch (action) {
      case 'IDLE':
        return 'QUEUED';
      case 'QUEUED':
        return 'RUNNING';
      case 'RUNNING':
        return 'IDLE';
      default:
        return '';
    }
  }

  /**
   * Invokes update schedule request
   * @param {any} payload
   * @param {string} toastrMessages
   * @return {void}
   */

  async manageSchedule(action: string, paramsData: any): Promise<void> {
    await this.iappGlobalDataService.manageSchedular(
      action,
      paramsData,
      this.applicationName,
    );
    this.monitorProjects();
  }

  monitorProjects() {
    if (
      this.projectMonitoringFrequency &&
      this.projectMonitoringMinDuration &&
      (!this.intervalSubscription || this.intervalSubscription?.closed)
    ) {
      this.canStopMonitoring = false;
      this.intervalSubscription = interval(
        this.projectMonitoringFrequency,
      ).subscribe((count) => {
        this.iappGlobalDataService.updateSchedules();
      });
      setTimeout(() => {
        this.canStopMonitoring = true;
      }, this.projectMonitoringMinDuration);
    }
  }

  stopMonitoringInterval() {
    if (this.canStopMonitoring) {
      this.intervalSubscription?.unsubscribe();
    }
  }

  updateSchedules(schedules: any[] = []) {
    schedules?.forEach((schedule: any) => {
      const thisApplication = this.schedulerList?.find(
        (existingApplication: any) =>
          existingApplication.id === schedule.id &&
          (existingApplication.status !== schedule.status ||
            existingApplication.enabled !== schedule.enabled),
      );

      if (thisApplication?.id) {
        this.updateScheduleListRow(thisApplication, schedule);
      }
    });
  }

  updateScheduleListRow(selectedSchedule: any, newSchedule: any) {
    const { schedule, scheduleDescription } =
      this.setScheduleAndDescription(newSchedule);

    // Update the rows array immutably using map
    this.schedulerList = this.schedulerList.map((row: any) => {
      if (row.id === newSchedule?.id) {
        return {
          ...row,
          status: newSchedule?.status || '-',
          lastRun: newSchedule?.lastRun
            ? this.datePipe.transform(newSchedule?.lastRun, 'MM/dd h:mm:ss a')
            : '-',
          enabled: newSchedule?.enabled || '-',
          schedule: schedule || '-',
          scheduleDescription: scheduleDescription || '-',
        };
      }
      return row;
    });

    // Update the selectedSchedule reference as well
    selectedSchedule.status = newSchedule?.status || '-';
    selectedSchedule.enabled = newSchedule?.enabled || '';
    selectedSchedule.schedule = schedule || '';
    selectedSchedule.lastRun = newSchedule?.lastRun || '';
    selectedSchedule.scheduleDescription = scheduleDescription || '';

    return true;
  }

  /**
   * Checks if the user has permission to enable or disable schedules.
   * @returns {boolean} - Whether the user can enable or disable schedules.
   */
  areActionsPermitted() {
    const submoduleSlug =
      this.iappGlobalDataService.getSelectedApplicationName() || undefined;
    return (
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        submoduleSlug,
        permissionSlug: 'enable_schedule',
        ignoreRedirection: true,
      }) ||
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        submoduleSlug,
        permissionSlug: 'disable_schedule',
        ignoreRedirection: true,
      }) ||
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        submoduleSlug,
        permissionSlug: 'run_schedule',
        ignoreRedirection: true,
      })
    );
  }

  // Checks if the user has permission for an application-level action
  isActionPermitted(params: any, action: string = '') {
    const submoduleSlug =
      this.iappGlobalDataService.getSelectedApplicationName() || undefined;
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'iapp',
      moduleSlug: 'projects',
      submoduleSlug: submoduleSlug,
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  getRowId(data: any): string {
    return data?.data?.id;
  }

  viewLogs(submodule?: string, submoduleName?: string): void {
    const modalRef = this.modalService.open(ApiLogs, {
      windowClass: 'iapp-application-logs mwl',
      backdropClass: 'iapp-application-logs mwl',
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.application = this.applicationName;
    modalRef.componentInstance.module = 'schedule';
    if (submodule) {
      modalRef.componentInstance.submodule = submodule;
      modalRef.componentInstance.submoduleName = submoduleName;
    }
    modalRef.componentInstance.title = `Action Logs${submoduleName ? ': ' + submoduleName : ''}`;
  }

  getApplicationGridData() {
    // let applicationData: any = this.commonDataService.getPagedData(
    //   this.applicationsListBKP,
    //   this.searchForm.get('filter')?.value?.trim() || '',
    //   this.columnFilters,
    //   this.pagination,
    // )
    // this.applicationsList = applicationData?.data || []
    // this.pagination.totalCount = applicationData.totalCount || 0
  }

  onSort(sort: any) {
    this.pagination.pageNumber = 1;
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.getScheduleData();
  }

  onRowClick(event: any): void {}

  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.getScheduleData();
  }

  // Handles pagination change and fetches data for the selected page
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.getScheduleData();
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.pagination.pageNumber = 1;
    this.columnFilters = columnFilters;
    this.getScheduleData();
  }

  getAvatarClass(id: string): string {
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return 'avatar' + ((sum % 6) + 1);
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   * @returns {void}
   */

  ngOnDestroy(): void {
    this.getSchedulersSubscription?.unsubscribe();
    this.modifyScheduleSubscription?.unsubscribe();
    this.intervalSubscription?.unsubscribe();
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
