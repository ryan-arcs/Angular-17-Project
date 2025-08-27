import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { recordsPerPage } from '@app/my-apps/asher/constants/global.constant';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { environment } from '@environments/environment';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-logs-modal',
  standalone: true,
  imports: [DataGridComponent, CommonModule],
  templateUrl: './logs-modal.component.html',
  styleUrl: './logs-modal.component.scss',
})
export class LogsModalComponent {
  @ViewChild('renderTemplate') renderTemplate!: TemplateRef<any>;

  activeModal = inject(NgbActiveModal);
  errorMessage = '';
  errorDescription = '';
  paginationPageSizeSelector = recordsPerPage.sizes;
  defaultSize = recordsPerPage.defaultSize;
  defaultDateFormat = environment?.defaultDateFormat || 'MMM d, yyyy h:mm:ss a';
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
  showDifferece: boolean = true;

  @Input() module?: string;
  @Input() application?: string;
  @Input() submodule?: string;
  @Input() submoduleName?: string;
  @Input() title?: string;
  @Input() row?:any;
  applicationsHistoryRows: any[] = [];
  applicationsHistoryRowsBKP: any

  fieldsToIgnore = [
    'created_at',
    'created_by',
    'last_modified_at',
    'last_modified_by',
    'created_by_email',
    'last_modified_by_preferred_name',
    'last_modified_by_email',
    'created_by_preferred_name',
    'deleted_at',
    'deleted_by',
    'deleted_by_preferred_name',
    'deleted_by_email',
    'history_id',
    'product_owner',
    'system_owner',
    'it_contact',
    'business_owner',
    'product_manager',
    'approver1',
    'approver2',
    'id',
    'app_id',
    'vendor_id',
    'sponsor',
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private asherGlobalDataService: AsherGlobalDataService,
  ) {}

  async ngOnInit() {
    if (this.row?.id) {
      const response = await this.asherGlobalDataService.getApplicationLogs(
        this.row?.id,
      );
      this.errorMessage = !response?.totalCount ? 'Oops! We couldn’t find any records.' : '';
      this.pagination.totalCount = response?.totalCount || 0;
      this.applicationsHistoryRows = response?.data;
      this.applicationsHistoryRowsBKP =this.applicationsHistoryRows;
    }
  }

  ngAfterViewInit() {
    this.setTableColumns();
    this.cdr.detectChanges();
  }

  setTableColumns() {
    this.columns = [
      {
        prop: 'app_id',
        name: 'App ID',
        width: 100,
        hidden: true,
        searchConfig: {
          enableOperator: true,
        },
        sortable: false,
      },
      {
        prop: 'app_name',
        name: 'Name',
        width: 100,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'aliases',
        name: 'Aliases',
        searchConfig: {
          enableOperator: true,
        },
        sortable: false,
        cellTemplate: this.renderTemplate,
      },
      {
        prop: 'lc_name',
        name: 'Life Cycle',
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'app_desc',
        name: 'Description',
        searchConfig: {
          enableOperator: true,
        },
        width: 150,
        sortable: false,
        cellTemplate: this.renderTemplate,
      },
      {
        prop: 'product_managers',
        name: 'Product Manager(s)',
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.renderTemplate,
        width: 200,
        sortable: false,
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
        cellTemplate: this.renderTemplate,
        width: 190,
        sortable: false,
      },
      {
        prop: 'business_owners',
        name: 'Business Owner(s)',
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.renderTemplate,
        width: 200,
        sortable: false,
      },
      {
        prop: 'system_owners',
        name: 'System Owner(s)',
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.renderTemplate,
        width: 200,
        sortable: false,
      },
      {
        prop: 'it_contacts',
        name: 'IT Contact(s)',
        searchConfig: {
          enableOperator: true,
          searchType: 'multi-text',
          searchTypeFilterOptions: ['contains', 'does_not_contain'],
        },
        cellTemplate: this.renderTemplate,
        width: 200,
        sortable: false,
      },
      {
        prop: 'approver1_preferred_name',
        name: 'First Approver',
        searchConfig: {
          enableOperator: true,
        },
        width: 157,
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'approver2_preferred_name',
        name: 'Second Approver',
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        width: 170,
        sortable: false,
      },
      {
        prop: 'hosting_location',
        name: 'Hosting Location',
        width: 165,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'vendor_name',
        name: 'Vendor',
        width: 145,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'funding_department_name',
        name: 'Funding Department',
        width: 175,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'version',
        name: 'Version',
        width: 100,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'is_gxp',
        name: 'GXP',
        width: 85,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'is_sox',
        name: 'SOX',
        width: 85,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      // {
      //   prop: 'record_status',
      //   name: 'Status',
      //   searchConfig:{
      //     enableOperator: true
      //   },
      //   cellTemplate: this.renderTemplate,
      //   sortable: false,
      // },
      {
        prop: 'created_at',
        name: 'Created Date',
        width: 190,
        cellTemplate: this.renderTemplate,
        searchConfig: {
          enableOperator: true,
        },
        sortable: false,
      },
      {
        prop: 'created_by_preferred_name',
        name: 'Created By',
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
      {
        prop: 'last_modified_at',
        name: 'Updated Date',
        width: 190,
        cellTemplate: this.renderTemplate,
        searchConfig: {
          enableOperator: true,
        },
        sortable: false,
      },
      {
        prop: 'last_modified_by_preferred_name',
        name: 'Updated By',
        width: 167,
        searchConfig: {
          enableOperator: true,
        },
        cellTemplate: this.renderTemplate,
        sortable: false,
      },
    ];
  }

  async getApiLogData() {
    const payload = {
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination?.pageSize || recordsPerPage.defaultSize,
      },
    };
    this.showDifferece = true;
    const response = await this.asherGlobalDataService.getApplicationLogs(
      this.row?.id,
      payload,
    );
    this.errorMessage = !response?.totalCount ? 'Oops! We couldn’t find any records.' : '';
    this.pagination.totalCount = response?.totalCount || 0;
    this.applicationsHistoryRows = response?.data;
    this.applicationsHistoryRowsBKP = this.applicationsHistoryRows;
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

  getConcatUsersNames(obj: any) {
    if (Array.isArray(obj)) {
      return obj?.map(item => item?.fullname_preferred).join(", ");
    }
    return '';
  }

  // Compare current row property with previous row's property
  isDifferent(index: number, key: string): boolean {
    if (index === this.applicationsHistoryRows.length - 1) return false;
    if (Array.isArray(this.applicationsHistoryRows[index][key])) {
      const diff1 = this.getConcatUsersNames(
        this.applicationsHistoryRows[index][key],
      );
      const diff2 = this.getConcatUsersNames(
        this.applicationsHistoryRows[index + 1][key],
      );
      return diff1 !== diff2;
    }
    return (
      JSON.stringify(this.applicationsHistoryRows[index][key]) !==
      JSON.stringify(this.applicationsHistoryRows[index + 1][key])
    );
  }

  getValue(value: any, columnName: string = "") {
    // now this is case where multiple selection

    if(!value && ['vendor_name', 'approver1_preferred_name', 'approver2_preferred_name','product_owners', 'product_managers', 'system_owners', 'it_contacts', 'business_owners', 'funding_department_name', 'version'].includes(columnName)){
      return "Unknown";
    } 
    if (typeof value === 'string' || Number.isInteger(value)) {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value?.map((item: any) => item.fullname_preferred).join(', ');
    }
    return '';
  }

  removeIgnoredFields(obj: any, ignoreKeys: string[]): any {
    const result: any = {};

    for (const key in obj) {
      if (ignoreKeys.includes(key)) {
        continue;
      }

      const val = obj[key];

      if (Array.isArray(val)) {
        // If array of objects → extract fullname_preferred values only
        if (val.length && typeof val[0] === 'object') {
          result[key] = val.map((item) => item.fullname_preferred || '').sort(); // sort for consistency
        } else {
          // Simple array
          result[key] = [...val].sort();
        }
      } else {
        result[key] = val;
      }
    }

    return result;
  }

  filterUniqueRecords() {
    const seen = new Set();
    this.applicationsHistoryRows = this.applicationsHistoryRows.filter((item: any) => {
      const cleanedItem = this.removeIgnoredFields(item, this.fieldsToIgnore);
      const serialized = JSON.stringify(cleanedItem);
      if (seen.has(serialized)) {
        return false;
      }
      seen.add(serialized);
      return true;
    });
  }

  onShowDifference() {
    this.showDifferece = !this.showDifferece;
    if (!this.showDifferece) {
      this.filterUniqueRecords();
    }
    else{
      this.applicationsHistoryRows = this.applicationsHistoryRowsBKP
    }
  }

}
