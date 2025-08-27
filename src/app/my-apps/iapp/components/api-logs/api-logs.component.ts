import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IappGlobalDataService } from '../../services/iapp-global-data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { messages, recordsPerPage } from '../../constants';
import { environment } from '@environments/environment';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { GlobalDataService as CommonDataService } from '@app/common/services/global-data.service';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-api-logs',
  standalone: true,
  imports: [DataGridComponent, CommonModule],
  providers: [DatePipe],
  templateUrl: './api-logs.component.html',
  styleUrl: './api-logs.component.scss',
})
export class ApiLogs extends ScreenAware implements OnInit {
  activeModal = inject(NgbActiveModal);
  errorMessage = '';
  errorDescription = '';
  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';

  mulesoftApiLogs: any[] = [];
  mulesoftApiLogsBKP: any[] = [];
  bodyClass: string = 'logs-popup-outer';
  columns: Array<GridColumn> = [];
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };
  gridSort: GridSort = {
    dir: '',
    prop: '',
  };
  columnFilters: ColumnFilter[] = [];
  isLoading: boolean = false;

  @Input() module?: string;
  @Input() application?: string;
  @Input() submodule?: string;
  @Input() submoduleName?: string;
  @Input() title?: string;
  constructor(
    private iappGlobalDataService: IappGlobalDataService,
    private commonDataService: CommonDataService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
  ) {
    super();
  }

  async ngOnInit() {
    this.renderer.addClass(document.body, this.bodyClass);
    if (this.module) {
      this.mulesoftApiLogsBKP = this.mulesoftApiLogs;
      this.getApiLogData();
      if (!this.mulesoftApiLogs.length) {
        this.errorMessage = messages?.error?.logsPopup?.notFound;
        this.errorDescription = messages.error.logsPopup.notFoundDescription;
      }
    }
  }

  ngAfterViewInit() {
    this.setTableColumns();
    this.cdr.detectChanges();
  }

  setTableColumns() {
    this.columns = [
      {
        name: 'Message',
        prop: 'fullMessage',
        width: 450,
        frozenLeft: true,
      },
      {
        name: 'Date Time',
        prop: 'createdAt',
        width: 150,
      },
    ];
  }

  getApiLogData() {
    let apiLogData: any = this.commonDataService.getPagedData(
      this.mulesoftApiLogsBKP,
      '',
      this.columnFilters,
      this.pagination,
      this.gridSort,
    );
    this.mulesoftApiLogs = apiLogData?.data || [];
    this.pagination.totalCount = apiLogData?.totalCount || 0;
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
    this.getApiLogData();
  }

  onGridPageSizeChange(event: any) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.getApiLogData();
  }

  // Handles pagination change and fetches data for the selected page
  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.getApiLogData();
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.pagination.pageNumber = 1;
    this.columnFilters = columnFilters;
    this.getApiLogData();
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
