import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { C4EGlobalDataService } from '../services/c4e-global-data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { AuthService } from 'src/app/common/services/auth.service';
import { DataGridComponent } from '@app/common/components/data-grid/data-grid.component';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
} from '@app/common/interfaces/data-grid.interface';
import { ApiLogs } from '../components/api-logs/api-logs.component';
import { AddEditRecordComponent } from './add-edit-record/add-edit-record.component';
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
  paginationPageSizeSelector = recordsPerPage.sizes;
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
  isGridLoading: boolean = false;
  selectedEntityName = '';

  public pagination = {
    start: 0,
    itemsPerPage: recordsPerPage.defaultSize,
    totalRowCount: 0,
    currentPage: 0,
    pageCount: 0,
  };
  errorMessage = '';

  tempPagination: GridPagination = {
    pageSize: 25,
    currentPage: 1,
  };

  fields: any[] = [];
  columnFilters: ColumnFilter[] = [];

  searchForm: FormGroup;
  hasAccessToAddRecord: boolean = false;
  columns?: Array<GridColumn>;
  rows?: Array<any> = [];
  gridSort: GridSort = {
    dir: '',
    prop: '',
  };

  constructor(
    private c4eGlobalDataService: C4EGlobalDataService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private uiService: UIService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
  ) {
    super();
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });
  }

  async ngOnInit(): Promise<void> {
    this.reInitializeListing();
    const { apiTables, apiViews }: any =
      await this.c4eGlobalDataService.getTableAndViewNames();

    this.tableNameSubscription =
      await this.c4eGlobalDataService.tableName$.subscribe({
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
            this.subscribeToTableData(name);
          }
        },
      });
  }

  shootSearch() {
    this.searchText = this.searchForm.get('filter')?.value?.trim() || '';
    this.onSearchFilter(this.searchText);
  }

  subscribeToTableData(name: string) {
    this.searchText = '';
    this.searchForm.patchValue({
      filter: '',
    });
    this.columnFilters = [];
    this.getUserResultsSubscription =
      this.c4eGlobalDataService.selectedTable$.subscribe({
        next: (selectedTable) => {
          this.listingData = selectedTable.rows;
          this.errorMessage =
            selectedTable.loaded && !selectedTable?.rows?.length
              ? 'Oops! We couldn’t find any records.'
              : '';
          this.setTableColumns();
          const { startIndex, pageSize, totalCount } = selectedTable.pagination;
          this.pagination.currentPage = startIndex;
          this.pagination.itemsPerPage = pageSize;
          this.tempPagination.pageNumber = this.tempPagination.currentPage =
            startIndex;
          this.tempPagination.pageSize = pageSize;
          this.setPagination(totalCount);
        },
      });
  }

  reInitializeListing() {
    this.setTableColumns();
    this.clearFilters();
    this.clearSearch();
  }

  setTableColumns() {
    this.columns = this.listingData?.length
      ? Object.keys(this.listingData[0])?.map((item: any, index: any) => {
          return {
            prop: item,
            width: 150,
            name: this.uiService.convertToTitleCase(item || ''),
            searchConfig: {
              enableOperator: true,
              searchType: 'multi-text',
              searchTypeFilterOptions: [
                'is_blank',
                'is_not_blank',
                'contains',
                'does_not_contain',
                'begins_with',
                'ends_with',
                'equals',
              ],
            },
            frozenLeft: index <= 1 ? true : false,
          };
        })
      : [];
  }

  onCellClicked(params: any, action: any): void {
    const id = params?.data?.id;
    // if (!id) {
    //   this.toastService.fire({
    //     type: 'error',
    //     message: messages.error.application.invalidId,
    //   });
    //   return;
    // }

    switch (action) {
      case 'edit-record':
        this.router.navigate([
          `c4e/list/${this.selectedTableName}/${id}/edit`,
        ]);
        break;
    }
  }

  clearSearch(): void {
    this.clearFilters();
    this.searchForm.patchValue({
      filter: '',
    });
    this.searchText = '';
  }

  clearFilters() {
    this.columnFilters = [];
    if (this.searchText) {
      this.searchForm.patchValue({
        filter: '',
      });
    }
    this.shootSearch();
  }

  getTableData(tableName?: string | null) {
    this.isGridLoading = true;
    if (!tableName) {
      tableName = this.route.snapshot.paramMap.get('tableName') || '';
    }
    this.c4eGlobalDataService.getTableData(
      tableName,
      this.tempPagination.currentPage,
      this.tempPagination.pageSize,
      this.searchForm.get('filter')?.value?.trim() || '',
      false,
      this.gridSort?.prop,
      this.gridSort?.dir,
    );
    this.isGridLoading = false;
  }

  onSearchFilter(searchText: string): void {
    const tableName = this.route.snapshot.paramMap.get('tableName') || '';
    this.c4eGlobalDataService.getTableData(
      tableName,
      1,
      25,
      searchText,
      false,
      this.gridSort?.prop,
      this.gridSort?.dir,
      this.columnFilters,
    );
  }

  onGridPageSizeChange(pagination: GridPagination) {
    if (this.isGridLoading) return;
    this.isGridLoading = true;
    this.tempPagination.currentPage = this.tempPagination.pageNumber = 1;
    this.getTableData();
  }

  onGridPageChange(event: any) {
    if (this.isGridLoading) return;
    this.isGridLoading = true;
    this.tempPagination.pageNumber = this.tempPagination.currentPage =
      event.page || 0;
    this.getTableData();
  }

  setPagination(totalCount: number) {
    this.tempPagination.totalCount = totalCount;
    this.pagination.totalRowCount = totalCount;
    this.pagination.pageCount = Math.ceil(
      Number(this.pagination.totalRowCount) / this.pagination.itemsPerPage,
    );

    this.pagination.start =
      this.pagination.currentPage * this.pagination.itemsPerPage + 1;
  }

  async downloadTableData(): Promise<void> {
    if (!this.selectedEntityName) {
      this.toastService.fire({
        type: 'error',
        message: messages.error.wdh.invalidEntityName,
      });
      return;
    }
    this.c4eGlobalDataService.downloadTableData(
      this.selectedEntityName,
      this.searchText,
    );
  }

  hasPermissionToAddRecord() {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'c4e',
      moduleSlug: this.category === 'Table' ? 'tables' : 'views',
      submoduleSlug: this.selectedTableName,
      permissionSlug: 'add',
      ignoreRedirection: true,
    });
  }

  hasEnabledColumn(): boolean {
    const permittedTables = this.c4eGlobalDataService.getPermittedTables();
    if (!permittedTables?.length) return false;

    const table = permittedTables.find(
      (table: any) => table.name === this.selectedTableName,
    );
    if (!table?.columns.length) return false;

    return table.columns.find((col: any) => col.enabled === true);
  }

  hasPermissionToEditRecord() {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'c4e',
      moduleSlug: this.category === 'Table' ? 'tables' : 'views',
      submoduleSlug: this.selectedTableName,
      permissionSlug: 'edit',
      ignoreRedirection: true,
    });
  }

  editRow(row: any) {
    const modalRef = this.modalService.open(AddEditRecordComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
    });
    modalRef.componentInstance.id = row.id;
  }

  onSort(sort: any) {
    this.gridSort = {
      prop: sort?.sorts[0]?.prop,
      dir: sort.sorts[0]?.dir,
    };
    this.c4eGlobalDataService.getTableData(
      this.selectedTableName,
      1,
      this.tempPagination.pageSize,
      this.searchForm.get('filter')?.value?.trim() || '',
      false,
      this.gridSort?.prop,
      this.gridSort?.dir,
      this.columnFilters,
    );
  }

  onColumnFilterChange(columnFilters: ColumnFilter[]) {
    this.columnFilters = columnFilters;

    this.c4eGlobalDataService.getTableData(
      this.selectedTableName,
      1,
      this.tempPagination.pageSize,
      this.searchForm.get('filter')?.value?.trim() || '',
      false,
      this.gridSort?.prop,
      this.gridSort?.dir,
      this.columnFilters,
    );
  }

  viewLogs(submodule?: string): void {
    const modalRef = this.modalService.open(ApiLogs, {
      windowClass: 'c4e-application-logs mwl',
      backdropClass: 'c4e-application-logs mwl',
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.module = 'tables';
    if (submodule) {
      modalRef.componentInstance.submodule = submodule;
    }
    modalRef.componentInstance.title = `Action Logs${submodule ? ': ' + submodule : ''}`;
  }

  ngOnDestroy(): void {
    this.modalRefSubscription?.unsubscribe();
    this.getTableDataFilterSubscription?.unsubscribe();
    this.getUserResultsSubscription?.unsubscribe();
  }
}
