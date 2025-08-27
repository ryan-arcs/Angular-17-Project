import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import {
  ApplicationResult,
  IappGlobalDataService,
} from 'src/app/my-apps/iapp/services';
import { NgbDropdownModule, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from 'src/app/common/modals/confirmation-modal/confirmation-modal.component';
import { recordsPerPage } from 'src/app/my-apps/iapp/constants';
import { AuthService } from 'src/app/common/services/auth.service';
import { environment } from 'src/environments/environment';
import { ApiLogs } from '../components/api-logs/api-logs.component';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { GlobalDataService as CommonDataService } from '@app/common/services/global-data.service';
import { UIService } from '@app/common/services/ui.service';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-applications',
  standalone: true,
  providers: [DatePipe],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
  imports: [
    NgbDropdownModule,
    DataGridComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltip,
  ],
})
export class ApplicationsComponent extends ScreenAware implements OnInit, OnDestroy {
  @ViewChild('applicationNameTemplate')
  applicationNameTemplate!: TemplateRef<any>;
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('staticIPsEnabledTemplate')
  staticIPsEnabledTemplate!: TemplateRef<any>;
  @ViewChild('leftPanelContent') leftPanelContent!: TemplateRef<any>;

  defaultSize = recordsPerPage.defaultSize;
  errorMessage = '';
  paginationPageSizeSelector = recordsPerPage.sizes;
  columns: Array<GridColumn> = [];
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };
  gridSort: GridSort = {
    dir: 'asc',
    prop: 'lastUpdateTime',
  };
  columnFilters: ColumnFilter[] = [];
  globalSearch: string = '';

  bodyClass: string = 'project-outer';
  getApplicationsSubscription: Subscription | undefined;
  modalRefSubscription: Subscription | undefined;
  startApplicationSubscription: Subscription | undefined;
  restartApplicationSubscription: Subscription | undefined;
  stopApplicationSubscription: Subscription | undefined;
  updateApplicationsSubscription: Subscription | undefined;
  intervalSubscription: Subscription | undefined;
  canStopMonitoring = false;
  projectMonitoringFrequency = environment.iAppProjectMonitoringFrequency
    ? Number(environment.iAppProjectMonitoringFrequency) * 1000
    : 2000;
  projectMonitoringMinDuration = environment.iAppProjectMonitoringMinDuration
    ? Number(environment.iAppProjectMonitoringMinDuration) * 1000
    : 10000;
  instanceCopyright: string = environment.instanceCopyright;
  isLoadingApplications: boolean = false;
  toggleModal: boolean = false;
  applicationsList: ApplicationResult = { data: [] };
  applicationsListBKP: ApplicationResult = { data: [] };
  loader: boolean = true;
  isColumnFilterActive = false;
  isLoading: boolean = false;
  searchTerm = '';

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private modalService: NgbModal,
    private commonDataService: CommonDataService,
    private iappGlobalDataService: IappGlobalDataService,
    private authService: AuthService,
    private renderer: Renderer2,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private uiService: UIService,
  ) {
    super();
  }

  setTableColumns() {
    this.columns = [
      {
        name: 'Project Name',
        prop: 'domain',
        cellTemplate: this.applicationNameTemplate,
        width: 250,
        frozenLeft:true
      },
      {
        name: 'Environment',
        prop: 'properties.env',
      },
      {
        name: 'Status',
        prop: 'status',
        cellTemplate: this.statusTemplate,
      },
      {
        name: 'Workers',
        prop: 'workers',
      },
      {
        name: 'Static IP Status',
        prop: 'staticIPsEnabled',
        cellTemplate: this.staticIPsEnabledTemplate,
      },
      {
        name: 'Mule Version',
        prop: 'muleVersion',
      },
      {
        name: 'Last Updated',
        prop: 'lastUpdateTime',
        cellTemplate: this.dateTemplate
      },
    ];
  }

  formatTimestamp(timestamp: number, format: string = 'MMM d, yyyy h:mm:ss a'): string {
    if (!timestamp) return '';
    return this.datePipe.transform(timestamp, format) || '';
  }

  ngOnInit(): void {
    this.getApplicationsSubscription =
      this.iappGlobalDataService.applicationResults$.subscribe({
        next: (applications) => {
          this.applicationsListBKP = applications;
          this.setCachingData(applications);
          this.setApplications(applications?.data || []);
          if (
            applications?.data?.some((application: any) => {
              return (
                application?.status?.toLowerCase() !== 'started' &&
                application?.status?.toLowerCase() !== 'undeployed'
              );
            })
          ) {
            this.monitorProjects();
          }
        },
      });

    this.updateApplicationsSubscription =
      this.iappGlobalDataService.updateApplicationResults$.subscribe({
        next: (applications) => {
          if (applications?.length) {
            if (
              !applications?.some((application: any) => {
                return (
                  application?.status?.toLowerCase() !== 'started' &&
                  application?.status?.toLowerCase() !== 'undeployed'
                );
              })
            ) {
              this.stopMonitoringInterval();
            }

            this.updateApplications(applications as []);
          }
        },
      });
    this.renderer.addClass(document.body, this.bodyClass);
    this.renderer.addClass(document.body, 'font-medium');
    this.renderer.removeClass(document.body, 'schedules-outer');
    // Add a class to the document body for styling
    // const theme = localStorage.getItem('app-theme') || 'nds-light-blue';
    // const font = localStorage.getItem('font-size') || 'font-medium';
    // this.renderer.addClass(document.body, theme);
    // this.renderer.addClass(document.body, font);
  }

  ngAfterViewInit() {
    this.setTableColumns();
    this.cdr.detectChanges();
    this.uiService.updateleftPanelContent(this.leftPanelContent);
  }

  setCachingData(applications: ApplicationResult) {
    this.columnFilters = applications.columnFilters || [];
    if (applications.pagination) {
      this.pagination = applications.pagination;
    }
    if (applications?.sorting) {
      this.gridSort = applications?.sorting;
    }
    this.searchTerm = applications?.search || '';
  }

  getClassForStatusTemplate(status: string) {
    switch (status) {
      case 'DEPLOYED':
        return 'circul-status status-deployed';
      case 'STARTED':
        return 'circul-status status-started';
      case 'UNDEPLOYED':
        return 'circul-status status-undeployed';
      case 'DEPLOY_FAILED':
        return 'circul-status status-deploy-failed';
      default:
        return '';
    }
  }

  clearFilters() {
    this.columnFilters = [];
    this.searchTerm = '';
    this.getApplicationGridData();

  }

  getApplications() {
    this.iappGlobalDataService.getApplications();
  }
  /**
   * Fetch all applications data
   * @return {void}
   */
  setApplications(applications: Array<any>): void {
    this.applicationsList.data = applications.map(
      (item: { staticIPsEnabled: boolean}) => {
        return {
          ...item,
          customStaticIPsEnabled: item.staticIPsEnabled
            ? 'Enabled'
            : 'Disabled',
          avatar: `avatar${Math.floor(Math.random() * 6)}`
        };
      },
    );
    this.applicationsListBKP = structuredClone(this.applicationsList);
    this.getApplicationGridData();
  }

  updateApplications(applications = []) {
    applications?.forEach((application: any) => {
      const thisApplication: any = this.applicationsList.data?.find(
        (existingApplication: any) =>
          existingApplication.id === application.id &&
          existingApplication.status !== application.status,
      );

      if (thisApplication?.id) {
        this.updateApplicationListRow(thisApplication, application);
      }
    });
  }

  updateApplicationListRow(selectedApplication: any, newApplication: any) {
    this.applicationsList.data = this.applicationsList?.data?.map(
      (app: any) => {
        if (newApplication?.id === app.id) {
          return {
            ...app,
            status: newApplication?.status || '-',
          };
        }
        return {
          ...app,
        };
      },
    );
    let index = this.applicationsListBKP?.data?.findIndex(
      (app: any) => app.id === newApplication?.id,
    );
    if (index && index > -1 && this.applicationsListBKP?.data) {
      this.applicationsListBKP.data[index] = {
        ...this.applicationsListBKP.data[index],
        status: newApplication?.status || '-',
      };
    }
  }

  /**
   * Handles row click in application listing and navigates to 'logs' page
   * @param {any} event
   * @return {void}
   */
  onRowClick(event: any): void {
    if (event.column?.prop !=='action' && event.type === 'click') {
      this.iappGlobalDataService.setGlobalApplicationName(event.row.domain);
      const applicationModules = ['dashboard', 'logs', 'schedules'];

      for (const applicationModule of applicationModules) {
        if (
          this.authService.hasPermissionToAccessModule({
            appSlug: 'iapp',
            moduleSlug:
              applicationModule != 'schedules' ? applicationModule : 'projects',
            submoduleSlug: event.row.domain?.trim()?.toLowerCase(),
            permissionSlug: 'view',
            ignoreRedirection: true,
          })
        ) {
          this.router.navigate([
            `iapp/projects/${event.row.domain}/${applicationModule}`,
          ]);
          return;
        }
      }

      this.router.navigate([
        `iapp/projects/${event.row.domain}/dashboard`,
      ]);
    }
  }

  /**
   * Handles cell click in application listing for actions
   * @param {any} params
   * @param {any} action
   * @return {void}
   */
  onCellClicked(params: any, action: any): void {
    if (params && action) {
      const domain = params.domain;
      if (action === 'VIEWLOGS') {
        this.viewLogs(domain);
        return;
      }
      const modalRef = this.modalService.open(ConfirmationModalComponent);
      modalRef.componentInstance.action = action;
      modalRef.componentInstance.entity = 'Application';
      modalRef.componentInstance.message = `${action} ${params?.['domain']}`;
      this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
        if (data === 'CONFIRM') {
          if (this.intervalSubscription) {
            this.intervalSubscription.unsubscribe();
          }
          await this.manageApplication(action, domain);

          const thisApplication: any = this.applicationsList?.data?.find(
            (existingApplication: any) => existingApplication.id === params?.id,
          );

          if (thisApplication?.id) {
            this.updateApplicationListRow(thisApplication, {
              id: params?.id,
              status: this.nextApplicationStatus(action),
            });
          }
        }
      });
    }
  }

  viewLogs(submodule?: string): void {
    const modalRef = this.modalService.open(ApiLogs, {
      windowClass: 'iapp-application-logs mwl',
      backdropClass: 'iapp-application-logs mwl',
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.module = 'project';
    if (submodule) {
      modalRef.componentInstance.application = submodule;
      modalRef.componentInstance.submodule = submodule;
    }
    modalRef.componentInstance.title = `Action Logs${submodule ? ': ' + submodule : ''}`;
  }
  nextApplicationStatus(action: string) {
    switch (action) {
      case 'START':
      case 'RESTART':
        return 'DEPLOYING';
      case 'STOP':
        return 'UNDEPLOYING';
      default:
        return '';
    }
  }

  async manageApplication(
    action: string,
    applicationName: string,
  ): Promise<void> {
    await this.iappGlobalDataService.manageApplication(action, applicationName);
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
        this.iappGlobalDataService.updateApplications();
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

  // Checks if the user has permission for an application-level action
  isActionPermitted(params: any, action: string = '') {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'iapp',
      moduleSlug: 'projects',
      submoduleSlug: params?.domain || '',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  /**
   * Performs search operation on application listing
   *
   * @return {void}
   */
  onSearchChange(event: any){
    this.searchTerm = (event.target as HTMLInputElement).value?.trim();
    this.pagination.pageNumber = 1;
    this.getApplicationGridData();
  }
  
  hasSomePermission() {
    return (
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        permissionSlug: 'start_project',
        ignoreRedirection: true,
      }) ||
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        permissionSlug: 'stop_project',
        ignoreRedirection: true,
      })
    );
  }

  getRowId(data: any): string {
    return data?.data?.id;
  }

  getApplicationGridData() {
    let applicationData: any = this.commonDataService.getPagedData(
      this.applicationsListBKP.data,
      this.searchTerm || '',
      this.columnFilters,
      this.pagination,
      this.gridSort,
    );
    this.applicationsList.data = applicationData?.data || [];
    this.pagination.totalCount = applicationData?.totalCount || 0;
    this.errorMessage =
      this.isLoading && !this.pagination.totalCount ? 'Oops! We couldn’t find any records.' : '';
    this.isLoading = true;
  }

  onSort(sort: any) {
    this.pagination.pageNumber = 1;
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.getApplicationGridData();
  }

  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.getApplicationGridData();
  }

  // Handles pagination change and fetches data for the selected page
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.getApplicationGridData();
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.pagination.pageNumber = 1;
    this.columnFilters = columnFilters;
    this.getApplicationGridData();
  }

  getAvatarClass(id: string): string {
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    return 'avatar' + ((sum % 6) + 1);
  }

  ngOnDestroy() {
    if (this.getApplicationsSubscription) {
      this.getApplicationsSubscription.unsubscribe();
    }
    if (this.modalRefSubscription) {
      this.modalRefSubscription.unsubscribe();
    }
    if (this.startApplicationSubscription) {
      this.startApplicationSubscription.unsubscribe();
    }
    if (this.restartApplicationSubscription) {
      this.restartApplicationSubscription.unsubscribe();
    }
    if (this.stopApplicationSubscription) {
      this.stopApplicationSubscription.unsubscribe();
    }
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    if (this.updateApplicationsSubscription) {
      this.updateApplicationsSubscription.unsubscribe();
    }
    if (this.applicationsList?.data?.length) {
      this.applicationsListBKP.columnFilters = this.columnFilters || [];
      this.applicationsListBKP.pagination = this.pagination;
      this.applicationsListBKP.sorting = this.gridSort;
      this.applicationsListBKP.search =
        this.searchTerm || '';
      this.iappGlobalDataService.setApplications(this.applicationsListBKP);
    }
    //Called once, before the instance is destroyed.
    this.renderer.removeClass(document.body, this.bodyClass);
    this.uiService.updateleftPanelContent(null);
  }
}
