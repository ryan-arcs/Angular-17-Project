import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  KeyValueDiffers,
  KeyValueDiffer,
  Renderer2,
  HostListener,
} from '@angular/core';
import { DeploymentsComponent } from 'src/app/my-apps/iapp/components/deployments/deployments.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { IappGlobalDataService } from '@app/my-apps/iapp/services/iapp-global-data.service';
import { NgbDropdownModule, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ErrorComponent } from 'src/app/my-apps/iapp/components/error/error.component';
import { ToastService } from 'src/app/common/services/toast.service';
import { UIService } from 'src/app/common/services/ui.service';
import { environment } from 'src/environments/environment';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { AdvanceFilterModalComponent } from './advance-filter-modal/advance-filter-modal.component';
import { messages } from '../../../constants';
import { downloadData, remove } from 'aws-amplify/storage';

interface AdvancedFilter {
  searchText?: string;
  startTime?: string;
  endTime?: string;
  priority?: string;
}
@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    DeploymentsComponent,
    NgbDropdownModule,
    ErrorComponent,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltip
  ],
  providers: [DatePipe],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss',
})
export class LogsComponent implements OnInit, OnDestroy {
  @ViewChild('tableBody') tableBody!: ElementRef;
  bodyClass: string = 'logs-outer';
  chipsClass: string = 'chips-body';
  searchForm: FormGroup;
  getDeploymentIdsSubscription: Subscription | undefined;
  getLogsSubscription: Subscription | undefined;
  canLoadMoreLogsSubscription: Subscription | undefined;
  exportFileLogsSubscription: Subscription | undefined;
  isLoadingMoreLogsSubscription: Subscription | undefined;
  instanceCopyright: string = environment.instanceCopyright;
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
  paginationPageSizeSelector = [100, 200, 300];
  applicationName: string = '';
  currentDate: Date = new Date();
  oneDay: Date = new Date(this.currentDate.getTime() - 24 * 60 * 60 * 1000);
  oneHour: Date = new Date(this.currentDate.getTime() - 60 * 60 * 1000);
  oneWeek: Date = new Date(
    this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000,
  );
  oneMonth: Date = new Date(
    this.currentDate.getTime() - 30 * 24 * 60 * 60 * 1000,
  );
  selectedInstanceId: string = '';
  advancedFilters: AdvancedFilter = {
    searchText: '',
    endTime: '',
    startTime: '',
    priority: '',
  };
  startTimeString: string = '';
  endTimeString: string = '';
  deploymentIdList: any[] = [];
  logsList: any[] = [];
  isloadingLogs: boolean = false;
  logTypes: string[] = ['All', 'INFO', 'ERROR', 'WARN', 'SYSTEM'];
  selectedLogType: string = this.logTypes[0];
  showDeploymentList: boolean = false;
  noRowsTemplate: string = 'Searching for logs...';
  checkThis: string = '211px';
  isColumnFilterActive = false;
  canLoadMoreLogs = false;
  isloadingMoreLogs = false;
  advanceSearchLimit = Number(environment.iAppLogAdvanceSearchLimit) || 100;
  advanceFilterApplied = false;
  isMobileScreen = false;

  private differ: KeyValueDiffer<string, any>;
  private scrollHandler: any;

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private iappGlobalDataService: IappGlobalDataService,
    private toastService: ToastService,
    private clipboard: Clipboard,
    private uiService: UIService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private differs: KeyValueDiffers,
  ) {
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
    // Initialize grid options with external filter functions
    // Subscribe to selected instance ID changes
    iappGlobalDataService.selectedInstanceId$.subscribe({
      next: (value) => {
        this.selectedInstanceId = value;
      },
    });

    this.differ = this.differs.find(this.advancedFilters).create();
  }

  ngOnInit(): void {
    // Subscribe to global application name changes
    this.iappGlobalDataService.globalApplicationName$.subscribe({
      next: (value) => {
        if (value) {
          this.applicationName = value;
        }
      },
    });
    // Set up resize event listener
    this.resize();
    window.addEventListener('resize', this.resize);
    this.getDeploymentIdsSubscription =
      this.iappGlobalDataService.deploymentIdResults$.subscribe({
        next: (data: any) => {
          if (data?.length) {
            this.setDeploymentIds(data);
          }
        },
      });
    // Subscribe to logs results
    this.getLogsSubscription = this.iappGlobalDataService.logResults$.subscribe(
      {
        next: (data: any) => {
          this.setLogs(data);
        },
      },
    );

    this.canLoadMoreLogsSubscription =
      this.iappGlobalDataService.canLoadMoreLogs$.subscribe({
        next: (canLoadMoreLogs) => {
          this.canLoadMoreLogs = canLoadMoreLogs;
        },
      });

    this.isLoadingMoreLogsSubscription =
      this.iappGlobalDataService.isLoadingMoreLogs$.subscribe({
        next: (isloadingMoreLogs) => {
          this.isloadingMoreLogs = isloadingMoreLogs;
        },
      });
    this.renderer.removeClass(document.body, 'schedules-outer');
    this.renderer.addClass(document.body, this.bodyClass);
  }

  copyToClipboard(message: string) {
    if (message.length) {
      navigator.clipboard.writeText(message);
      this.toastService.fire({
        type: 'success',
        message: messages.success.logs.copy,
      });
    }
  }

  highlightText(logMessage: string): string {
    if (
      !this.advancedFilters?.searchText ||
      this.advancedFilters?.searchText.trim() === '*'
    ) {
      return logMessage;
    }
    const regExp = new RegExp(this.advancedFilters?.searchText, 'gi'); // case-insensitive search
    return logMessage.replace(
      regExp,
      (match: string) => `<mark>${match}</mark>`,
    );
  }

  ngDoCheck() {
    const changes = this.differ.diff(this.advancedFilters);
    if (changes) {
      this.advanceFilterApplied =
        this.advancedFilters.searchText ||
        this.advancedFilters.startTime ||
        this.advancedFilters.endTime ||
        this.advancedFilters.priority
          ? true
          : false;
    }

    if (this.advanceFilterApplied) {
      this.renderer.addClass(document.body, this.chipsClass);
    } else {
      this.renderer.removeClass(document.body, this.chipsClass);
    }
  }

  clearFilters() {
    this.isColumnFilterActive = false;
  }

  /**
   * Set deployment IDs and handle initial selection
   * @param data - List of deployment IDs
   */
  setDeploymentIds(data: any) {
    this.isloadingLogs = true;
    this.deploymentIdList = data.map((item: { createTime: string }) => {
      const localDate = new Date(item.createTime);
      return {
        ...item,
        createTime: this.datePipe.transform(localDate, this.defaultDateFormat),
      };
    });
    const selectedInstanceId =
      this.iappGlobalDataService.getSelectedInstanceId();
    if (!selectedInstanceId) {
      this.iappGlobalDataService.setselectedInstanceId(
        this.deploymentIdList[0]?.instances?.[0]?.instanceId || '',
      );
    }
    this.getLogs();
  }

  /**
   * Set logs and handle loading state
   * @param data - List of logs
   */
  setLogs(data: any) {
    if (!data.length) {
      this.logsList = [];
    }

    const logs =
      data?.map(
        (item: {
          timestamp: number;
          message: string;
          priority: string;
          flagColor: string;
          color: string;
          lastRecord?: boolean;
        }) => {
          const localDate = new Date(item.timestamp);
          const logMessage =
            this.datePipe.transform(localDate, this.defaultDateFormat) +
            ' ' +
            item.message;

          if (item?.priority?.toLowerCase() == 'info') {
            item.flagColor = 'info';
            item.color = 'white';
          } else if (item.priority.toLowerCase() == 'system') {
            item.flagColor = 'system';
            item.color = 'white';
          } else if (item?.priority?.toLowerCase() == 'warn') {
            item.flagColor = 'warn';
            item.color = 'lightyellow';
          } else if (item.priority.toLowerCase() == 'error') {
            item.flagColor = 'error';
            item.color = 'rgba(255, 0, 0, 0.1)';
          }
          return {
            message: logMessage || '',
            priority: item.priority || '',
            flagColor: item.flagColor || '',
            color: item.color || '',
            lastRecord: item.lastRecord ? true : false,
          };
        },
      ) || [];

    this.logsList = logs;
    if (this.isloadingMoreLogs) {
      setTimeout(() => {
        if (!this.advanceFilterApplied) {
          const lastRecord = document.querySelector('.last-record');
          if (lastRecord) {
            lastRecord.scrollIntoView();
          }
        }
      }, 100);
    } else {
      setTimeout(() => {
        this.attachScrollHandler();
        this?.advanceFilterApplied ? this.scrollToTop() : this.scrollToBottom();
      }, 100);
    }
    this.isloadingLogs = false;
  }

  scrollToBottom() {
    if (this.tableBody) {
      this.tableBody.nativeElement.scrollTop =
        this.tableBody.nativeElement.scrollHeight;
    }
  }

  scrollToTop() {
    if (this.tableBody) {
      this.tableBody.nativeElement.scrollTop = 0;
    }
  }

  /**
   * Handle window resize events for responsive design
   */

  resize() {
    if (window.innerWidth <= 576) {
      this.logTypes = ['All', 'INFO', 'ERR', 'WRN', 'SYS'];
    }
    if (window.innerWidth <= 495) {
      this.checkThis = '258px';
    }
    if (window.innerWidth >= 992) {
      this.showDeploymentList = true;
    }
    if (window.innerWidth <= 1092) {
      this.showDeploymentList = false;
    }
  }
  /**
   * Navigate to the applications page
   */

  navigateToApplications() {
    this.router.navigate(['iapp/projects']);
  }

  /**
   * Check if an external filter is present
   * @returns true if external filter is applied, false otherwise
   */
  isExternalFilterPresent(): boolean {
    return this.selectedLogType !== 'All';
  }


  /**
   * Handle log type selection change
   * @param type - Selected log type
   */
  onTypeChange(type: string): void {
    this.selectedLogType = type;
  }

  /**
   * Fetch all deploymentIds by 'applicationName'
   * @return {void}
   */
  getDeploymentIds() {
    this.iappGlobalDataService.getDeploymentIds();
  }

  /**
   * Fetch all logs with 'applicationName' and 'deploymentId'
   * @return {void}
   */
  getLogs(): void {
    this.iappGlobalDataService.getLogs({
      searchText: this.advancedFilters.searchText,
      startTime: this.advancedFilters.startTime,
      endTime: this.advancedFilters.endTime || '',
      priority: this.advancedFilters.priority,
    });
  }

  /**
   * Change selected deployment id
   * @param {string} deploymentId
   * @return {void}
   */
  changeselectedInstanceId(instanceId: string): void {
    if (instanceId === this.selectedInstanceId) {
      return;
    }

    this.iappGlobalDataService.resetFilter();
    this.iappGlobalDataService.setselectedInstanceId(instanceId);
    this.searchForm.get('filter')?.setValue('');
    this.clearAdvanceFilters();
    this.getLogs();
  }

  clearAdvanceFilters() {
    this.advancedFilters.endTime = '';
    this.advancedFilters.startTime = '';
    this.advancedFilters.searchText = '';
    this.advancedFilters.priority = '';
    this.iappGlobalDataService.resetFilter();
    this.iappGlobalDataService.getLogs();
    this.searchForm.reset();
  }

  /**
   * Placeholder method for setting row style (not implemented)
   * @returns undefined
   */

  setRowStyle() {
    return undefined;
  }

  /**
   * Handle search filter input
   * @param event - Input event
   */
  onSearchFilter(event: any) {
  }

  onGridScroll(event: any) {
    const gridBody = event.target;
    const scrollTop = gridBody.scrollTop;
    const maxScrollTop = gridBody.scrollHeight - gridBody.clientHeight;

    if (this.canLoadMoreLogs) {
      if (this.advanceFilterApplied) {
        if (scrollTop >= maxScrollTop - 3) {
          this.iappGlobalDataService.setCanLoadMoreLogs(false);
          this.loadMore();
        }
      } else {
        if (scrollTop <= 3) {
          this.iappGlobalDataService.setCanLoadMoreLogs(false);
          this.loadMore();
        }
      }
    }
  }

  /**
   * @description Download logs in a text file
   * @return {void}
   */
  async downloadLogs(): Promise<void> {
    this.uiService.setLoader(true);
    this.iappGlobalDataService.getFileLogs(this.selectedInstanceId).subscribe({
      next: async (response) => {
        const filePath = response?.data?.filePath || '';
        if (filePath) {
          const downloadResult = await downloadData({
            path: filePath,
            options: {
              onProgress: (progress) => {
                if (progress.totalBytes) {
                  const totalProgress =
                    progress.transferredBytes / progress.totalBytes;
                  if (totalProgress === 1) {
                    setTimeout(async () => {
                      await remove({
                        path: filePath,
                      });
                    }, 1000);
                  }
                }
              },
            },
          }).result;
          const text = await downloadResult.body.text();
          const fileName = `${this.applicationName}-${this.selectedInstanceId}-logs.txt`;
          const file = new Blob([text || ''], {
            type: 'text/plain',
          });
          const fileURL = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = fileURL;
          a.target = '_blank';
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          this.uiService.setLoader(false);
        } else {
          this.toastService.fire({
            type: 'error',
            message: 'Invalid file path!',
          });
        }
      },
      error: (err) => {
        this.uiService.setLoader(false);
      },
    });
  }

  openFilterModal() {
    const columnsModalRef = this.modalService.open(
      AdvanceFilterModalComponent,
      {
        windowClass: 'right-side-popup logs-calender-popup',
        backdropClass: 'mwl',
        backdrop: 'static',
      },
    );
    columnsModalRef.componentInstance.selectedInstanceId =
      this.selectedInstanceId;
    columnsModalRef.componentInstance.searchFilterValue =
      this.advancedFilters.searchText;
    columnsModalRef.componentInstance.priorityFilterValue =
      this.advancedFilters.priority;
    columnsModalRef.componentInstance.advanceFilterParams = {
      searchFilterValue: this.advancedFilters.searchText,
      priorityFilterValue: this.advancedFilters.priority,
      startTimeFilterValue: this.advancedFilters.startTime,
      endTimeFilerValue: this.advancedFilters.endTime,
    };
    columnsModalRef.componentInstance.startTimeFilterValue =
      this.advancedFilters.startTime;
    columnsModalRef.componentInstance.endTimeFilerValue =
      this.advancedFilters.endTime;

    columnsModalRef.closed.subscribe((data) => {
      if (data?.action === 'submit') {
        this.advancedFilters = {
          priority: data.priority,
          startTime: data.startTime.trim(),
          endTime: data.endTime.trim(),
          searchText: data.searchText,
        };
        this.searchForm.patchValue({
          filter: data.searchText,
        });

        this.startTimeString =
          this.datePipe.transform(
            this.advancedFilters.startTime,
            'MM/dd/yyyy HH:mm',
          ) || '';
        this.endTimeString =
          this.datePipe.transform(
            this.advancedFilters.endTime,
            'MM/dd/yyyy HH:mm',
          ) || '';
        if (this.advanceFilterApplied) {
          this.renderer.addClass(document.body, this.chipsClass);
        }
      }
    });
  }

  removeFilter(filterName: string) {
    this.iappGlobalDataService.resetFilter();
    switch (filterName) {
      case 'searchText':
        this.advancedFilters.searchText = '';
        this.searchForm.patchValue({
          filter: '',
        });
        break;
      case 'priority':
        this.advancedFilters.priority = '';
        break;
      case 'startTime':
        this.advancedFilters.startTime = '';
        break;
      case 'endTime':
        this.advancedFilters.endTime = '';
        break;
      case 'bothTime':
        this.advancedFilters.startTime = '';
        this.advancedFilters.endTime = '';
        break;
    }
    this.iappGlobalDataService.getLogs({
      searchText: this.advancedFilters.searchText,
      startTime: this.advancedFilters.startTime || '',
      endTime: this.advancedFilters.endTime || '',
      priority: this.advancedFilters.priority,
    });
  }

  loadMore() {
    this.showLoader();
    this.iappGlobalDataService.setIsLoadingMoreLogs(true);
    this.iappGlobalDataService.getLogs({
      searchText: this.advancedFilters.searchText,
      startTime: this.startTimeString || '',
      endTime: this.endTimeString || '',
      priority: this.advancedFilters.priority,
      loadMore: true,
      silentCall: true,
    });
  }

  async refreshLogs() {
    this.iappGlobalDataService.resetFilter();
    await this.iappGlobalDataService.getDeploymentIds();
  }

  showLoader() {
    const loader = {
      message: 'loading...',
      isLoading: true,
      isAdvance: this.advanceFilterApplied,
    };
    if (this.advanceFilterApplied) {
      this.logsList.push(loader);
    } else {
      this.logsList.unshift(loader);
    }
  }

  attachScrollHandler() {
    const gridBody = document.querySelector('.log-rows') as HTMLElement;
    if (gridBody) {
      this.scrollHandler = this.onGridScroll.bind(this); // Save reference to the handler
      gridBody.addEventListener('scroll', this.scrollHandler);
    }
  }

  detachScrollHandler() {
    const gridBody = document.querySelector('.log-rows') as HTMLElement;

    if (gridBody && this.scrollHandler) {
      gridBody.removeEventListener('scroll', this.scrollHandler);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileScreen = window.innerWidth < 768 ? true : false;
    if(window.innerWidth>=900){
      this.showDeploymentList=true
    }
  }
  ngOnDestroy() {
    // Unsubscribe from all subscriptions to prevent memory leaks
    if (this.getDeploymentIdsSubscription) {
      this.getDeploymentIdsSubscription.unsubscribe();
    }

    if (this.getLogsSubscription) {
      this.getLogsSubscription.unsubscribe();
    }

    if (this.exportFileLogsSubscription) {
      this.exportFileLogsSubscription.unsubscribe();
    }

    if (this.canLoadMoreLogsSubscription) {
      this.canLoadMoreLogsSubscription.unsubscribe();
    }

    if (this.isLoadingMoreLogsSubscription) {
      this.isLoadingMoreLogsSubscription.unsubscribe();
    }

    this.detachScrollHandler();
    this.renderer.removeClass(document.body, this.bodyClass);
    this.iappGlobalDataService.resetFilter();
  }
}
