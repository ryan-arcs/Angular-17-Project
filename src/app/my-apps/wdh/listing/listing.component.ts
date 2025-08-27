import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
} from '@angular/core';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { WdhGlobalDataService } from '../services/wdh-global-data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UIService } from 'src/app/common/services/ui.service';
import { recordsPerPage } from '../constants/global.constant';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/common/services/toast.service';
import { messages } from '../constants';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import { ScreenAware } from '@app/common/super/ScreenAware';

@Component({
  selector: 'app-users',
  standalone: true,
  providers: [DatePipe],
  imports: [
    NgbDropdownModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataGridComponent,
    NgbTooltip,
  ],
  templateUrl: './listing.component.html',
  styleUrl: './listing.component.scss',
})
export class ListingComponent extends ScreenAware implements OnInit {
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('searchBox') searchBox: any;
  modalRefSubscription: Subscription | undefined;
  isResourceRequestsListLoading: boolean = false;
  getUserResultsSubscription: Subscription | undefined;
  tableNameSubscription: Subscription | undefined;
  getTableDataFilterSubscription: Subscription | undefined;
  instanceCopyright: string = environment.instanceCopyright;
  listingData: any = [];
  category: string = '';
  searchText: string = '';
  formattedTableName: string = '';
  selectedTableName: string = '';
  selectedEntityName = '';
  errorMessage = '';

  fields: any[] = [];
  columnFilters: ColumnFilter[] = [];

  searchForm: FormGroup;
  hasAccessToAddRecord: boolean = false;
  columns?: Array<GridColumn>;
  gridSort: GridSort = {
    dir: '',
    prop: '',
  };

  gridName = 'wdh-list';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };
  selectedColumns: any = [];

  constructor(
    private wdhGlobalDataService: WdhGlobalDataService,
    private route: ActivatedRoute,
    private uiService: UIService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
  }

  async ngOnInit(): Promise<void> {
    const { apiTables, apiViews }: any =
      await this.wdhGlobalDataService.getTableAndViewNames();

    this.tableNameSubscription = this.wdhGlobalDataService.tableName$.subscribe(
      {
        next: (name: string) => {
          if (name) {
            this.selectedEntityName = name;
            if (apiTables.some((table: String) => table === name)) {
              this.category = 'Table';
            } else {
              this.category = 'View';
            }
            this.formattedTableName = this.uiService.convertToTitleCase(name);
            this.selectedTableName = name;
          }
        },
      },
    );
    this.subscribeToTableData();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchText = this.searchForm.get('filter')?.value?.trim() || '';
    this.fetchData();
  }

  subscribeToTableData() {
    this.getUserResultsSubscription =
      this.wdhGlobalDataService.selectedTable$.subscribe({
        next: (selectedTable) => {
          this.listingData = selectedTable.rows;
          this.errorMessage = selectedTable?.rows?.length
            ? ''
            : 'Oops! We couldn’t find any records.';
          const { startIndex, pageSize, totalCount } = selectedTable.pagination;
          this.selectedColumns = selectedTable.columns;
          this.pagination.totalCount = totalCount;
          this.pagination.pageNumber = startIndex;
          this.pagination.pageSize = pageSize;
          this.columnFilters = selectedTable?.columnFilters || [];
          this.searchText = selectedTable?.searchText || '';
          this.gridSort = selectedTable?.sorting || { prop: '', dir: '' };
          this.searchForm.get('filter')?.setValue(this.searchText);
          this.errorMessage =
            selectedTable.loaded && !totalCount ? 'Oops! We couldn’t find any records.' : '';
          this.setTableColumns();
        },
      });
  }

  fetchData(tableName?: string | null) {
    if (!tableName) {
      tableName = this.route.snapshot.paramMap.get('tableName') || '';
    }
    this.wdhGlobalDataService.getTableData(
      tableName,
      this.pagination.pageNumber,
      this.pagination.pageSize,
      this.searchForm.get('filter')?.value?.trim() || '',
      false,
      this.gridSort?.prop,
      this.gridSort?.dir,
      this.columnFilters,
    );
  }

  setTableColumns() {
    this.columns =
      this.selectedColumns?.map((item: any, index: any) => {
        return {
          prop: item,
          width: 150,
          name: this.uiService.convertToTitleCase(item || ''),
          frozenLeft: index <= 1 ? true : false,
        };
      }) || [];
  }

  onCellClicked(params: any, action: any): void {
    const id = params?.data?.id;
  }

  clearFilters() {
    this.columnFilters = [];
    this.searchText = '';
    this.searchForm.reset();
    this.shootSearch();
  }

  onGridPageSizeChange(event: GridPagination) {
    this.pagination.currentPage = this.pagination.pageNumber =
      event.currentPage;
    this.pagination.pageSize = event.pageSize;
    this.fetchData();
  }

  onGridPageChange(event: any) {
    this.pagination.pageNumber = event.page || 1;
    this.fetchData();
  }

  async downloadTableData(): Promise<void> {
    if (!this.selectedEntityName) {
      this.toastService.fire({
        type: 'error',
        message: messages.error.wdh.invalidEntityName,
      });
      return;
    }
    this.wdhGlobalDataService.downloadTableData(
      this.selectedEntityName,
      this.searchForm.get('filter')?.value?.trim() || '',
      this.pagination.pageSize,
      this.gridSort.prop,
      this.gridSort.dir,
      this.columnFilters,
    );
    if (this.searchForm.get('filter')?.value?.trim() != this.searchText) {
      this.fetchData();
    }
  }

  onSort(sort: any) {
    this.pagination.pageNumber = 1;
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.fetchData();
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.pagination.pageNumber = 1;
    this.columnFilters = columnFilters;
    this.fetchData();
  }
  ngOnDestroy(): void {
    this.modalRefSubscription?.unsubscribe();
    this.getTableDataFilterSubscription?.unsubscribe();
    this.getUserResultsSubscription?.unsubscribe();
  }
}
