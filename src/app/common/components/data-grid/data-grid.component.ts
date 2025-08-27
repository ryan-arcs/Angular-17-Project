import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ColumnMode,
  DatatableComponent,
  NgxDatatableModule,
  SelectionType,
} from '@swimlane/ngx-datatable';
import { DataGridHelper } from './helpers/data-grid.helper';
import {
  ColumnFilter,
  GridColumn,
  GridPagination,
  GridSort,
  MainFilterOption,
  SearchConfig,
  ColumnFilterCondition,
  ColumnFilterConditionSearch,
  SelectedOperator,
  ColumnFilterConditionFilterType,
  ColumnFilterConditionSearchTypeCode,
} from '@app/common/interfaces/data-grid.interface';
import {
  NgbDropdownModule,
  NgbModal,
  NgbTooltip,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { ColumnsToggleModalComponent } from './columns-toggle-modal/columns-toggle-modal.component';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AdvanceFilterModalComponent } from './advance-filter-modal/advance-filter-modal.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UIService, UiTheme } from '@app/common/services/ui.service';
import { NgSelectCustomComponent } from '../ng-select/ng-select.component';
import { ScreenAware } from '@app/common/super/ScreenAware';

type StringArray = string[];

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    NgxDatatableModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgSelectModule,
    FormsModule,
    NgSelectCustomComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
})
export class DataGridComponent
  extends ScreenAware
  implements OnInit, OnChanges, AfterViewChecked, AfterViewInit, OnDestroy
{
  @ViewChild('ngxTable') table!: DatatableComponent;
  @ViewChild('actionRow') actionRow!: TemplateRef<any>;
  @ViewChild('actionHeader') actionHeader!: TemplateRef<any>;
  @ViewChild('statusHeader') statusHeader!: TemplateRef<any>;
  @ViewChild('progessHeader') progessHeader!: TemplateRef<any>;
  @ViewChild('filterHeader') filterHeader!: TemplateRef<any>;
  @ViewChild('pageSizeInputValidationTooltip')
  pageSizeInputValidationTooltip!: NgbTooltip;

  columns: GridColumn[] = [];
  customPageSize = new FormControl('');
  instanceCopyright: string = environment.instanceCopyright;
  @Input({ required: true }) gridName: string = '';
  @Input() errorMessage?: string;
  @Input() gridColumns?: GridColumn[];
  @Input() gridClass?: string;
  @Input() gridRows?: Array<any>;
  @Input() rowClass?: string;
  @Input() pagination?: GridPagination;
  @Input() selected?: any[];
  @Input() gridSorts?: Array<GridSort>;
  @Input() enableGridConfiguration = true;
  @Input() enableInlineSearch = true;
  @Input() actionHeaderTemplate?: TemplateRef<any>;
  @Input() actionRowTemplate?: TemplateRef<any>;
  @Input() pageSizes = [25, 50, 100, 200];
  @Input() selectedPageSize = 25;
  @Input() columnFilters: ColumnFilter[] = [];
  @Input() externalSorting = true;
  @Input() externalPagination = true;

  @Output() onGridPage = new EventEmitter<any>();
  @Output() onGridSort = new EventEmitter<any>();
  @Output() onGridRowSelect = new EventEmitter<any>();
  @Output() onGridPageSizeChange = new EventEmitter<GridPagination>();
  @Output() onGridRowEdit = new EventEmitter<any>();
  @Output() onGridPageChange = new EventEmitter<any>();
  @Output() onColumnFilterChange = new EventEmitter<ColumnFilter[]>();
  @Output() onGridActivate = new EventEmitter<any>();

  ColumnMode = ColumnMode;
  SelectionType = SelectionType;
  isDropdownOpen = false;
  defaultColumns!: GridColumn[];
  noRecordMessage = '';
  isInvalidClassActive = false;
  private subscriptions: Subscription = new Subscription();
  private resizeObserver!: ResizeObserver;
  searchValues: StringArray[] = [[], []];
  lastInputValues: StringArray = ['', ''];
  activatedTheme: UiTheme = 'default';
  filterVisible = false;
  filterType: ColumnFilterConditionFilterType = 'multi-text';
  currentFilterColumn: string = '';
  filterColumnPosition = { top: 0, left: 0 };
  defaultOperatorsOptions: ColumnFilterConditionSearch[] = [
    { code: 'contains', name: 'Contains' },
    { code: 'does_not_contain', name: 'Does not contain' },
    { code: 'equals', name: 'Equals' },
    { code: 'does_not_equal', name: 'Does not equal' },
    { code: 'begins_with', name: 'Begins with' },
    { code: 'ends_with', name: 'Ends with' },
    { code: 'is_blank', name: 'Blank' },
    { code: 'is_not_blank', name: 'Not blank' },
  ];
  operatorOptions: ColumnFilterConditionSearch[] = [];
  isOperatorFieldEnabled: boolean = true;
  hiddenInputBox = ['is_blank', 'is_not_blank'];

  mainFilters: MainFilterOption[] = [
    { name: 'AND', code: 'and' },
    { name: 'OR', code: 'or' },
  ];

  selectedOperators: SelectedOperator = {
    main: 'or',
    filter1: 'contains',
    filter2: 'contains',
  };
  disabledAndOperatorForFilters: ColumnFilterConditionSearchTypeCode[] = [
    'equals',
    'does_not_equal',
    'begins_with',
    'ends_with',
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private gcHelper: DataGridHelper,
    private modalService: NgbModal,
    private uiService: UIService,
    private renderer: Renderer2,
  ) {
    super();
  }

  /**
   * Lifecycle hook that is called when any data-bound property of a directive changes.
   *
   * - Reinitializes the grid columns if `gridColumns` input changes.
   * - Updates the UI message template if `errorMessage` input changes.
   * - Triggers a scroll class update shortly after `gridRows` input changes to allow DOM to render.
   *
   * @param {SimpleChanges} changes - An object of current and previous property values.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['gridColumns']) {
      this.setTableColumns();
    }

    if (changes['errorMessage']) {
      this.noRecordMessage = this.errorMessage
        ? this.getUioverlayNoRowsTemplate(this.errorMessage)
        : '';
    }

    if (changes['gridRows']) {
      this.isDropdownOpen = false;
      if (!this.gridRows?.length) {
        this.resetTableTransform();
      }
      this.setCustomPaginationValue();
      setTimeout(() => {
        this.updateHorizontalScrollClass();
      }, 10);
    }
  }

  /**
   * Angular lifecycle hook that is called after component initialization.
   *
   * - Subscribes to `tableColumns$` to keep the displayed columns in sync with saved preferences.
   * - Subscribes to `activatedTheme$` to reactively update the component's theme.
   * - Subscribes to `triggerAdvanceFilterModal$` to open the advanced filter modal on trigger.
   * - Subscribes to `triggerClearAdvanceFilterModal$` to clear applied filters on trigger.
   * - All subscriptions are stored for cleanup on component destroy.
   */
  async ngOnInit() {
    const watchGridReInitialization = this.gcHelper.tableColumns$.subscribe(
      (tableColumns) => {
        this.defaultColumns =
          tableColumns[this.gridName || '']?.map(
            (tc) => this.defaultColumns?.find((dc) => dc?.prop === tc?.prop)!,
          ) || [];

        this.columns = this.defaultColumns?.filter((defaultColumn) => {
          if (!defaultColumn) {
            return false;
          }
          if (defaultColumn.checkboxable) {
            return true;
          }
          const thisColumn = tableColumns[this.gridName || '']?.find(
            (tableColumn) =>
              tableColumn.prop === defaultColumn.prop && !tableColumn.hidden,
          );
          return thisColumn?.prop ? true : false;
        });
      },
    );
    this.subscriptions.add(watchGridReInitialization);

    const getActivateTheme = this.uiService.activatedTheme$.subscribe(
      (theme) => {
        this.activatedTheme = theme;
      },
    );
    this.subscriptions.add(getActivateTheme);

    const watchTrigggerAdvanceFilterModal =
      this.gcHelper.triggerAdvanceFilterModal$.subscribe(() => {
        this.openAdvancedFilterModal();
      });
    this.subscriptions.add(watchTrigggerAdvanceFilterModal);

    const watchTrigggerClearAdvanceFilterModal =
      this.gcHelper.triggerClearAdvanceFilterModal$.subscribe(() => {
        this.clearAdvanceColumnFilter();
      });
    this.subscriptions.add(watchTrigggerClearAdvanceFilterModal);

    const watchReIntializationGridColumn =
      this.gcHelper.reInitializeGridColumn$.subscribe((columns) => {
        columns = columns?.filter(
          (column: GridColumn) => column.prop != 'action',
        );
        columns?.push({
          prop: 'action',
          name: 'Action',
          sortable: false,
          searchable: false,
          hidden: false,
          width: 60,
          draggable: false,
          resizeable: false,
          cellTemplate: this.actionRowTemplate || this.actionRow,
          frozenRight: true,
          headerTemplate: this.actionHeaderTemplate || this.actionHeader,
          suppressToggle: true,
        });
        this.gcHelper.initializeDefaultColumnsOfGrid({
          gridName: this.gridName,
          columns: columns,
        });
      });
    this.subscriptions.add(watchReIntializationGridColumn);
  }

  /**
   * Angular lifecycle hook called after the component's view (and child views) has been fully initialized.
   *
   * - Sets up a scroll event listener on the data table's body to reapply column classes with debounce.
   * - Initializes a `ResizeObserver` to monitor the grid's container for size changes and triggers recalculation and change detection accordingly.
   */
  ngAfterViewInit() {
    const tableBodyElement = this.table.element.querySelector(
      '.datatable-body',
    ) as HTMLElement;
    if (tableBodyElement) {
      const scrollSubscription = fromEvent(tableBodyElement, 'scroll')
        .pipe(debounceTime(50))
        .subscribe(() => {
          this.applyColumnClasses();
        });
      this.subscriptions.add(scrollSubscription);
    }

    const dataGridElement = this.table.element;
    if (dataGridElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.table.recalculate();
        this.cdr.detectChanges();
      });
      this.resizeObserver.observe(dataGridElement);
    }
    this.setTableColumns();
  }

  /**
   * Angular lifecycle hook called after the view and its child views have been checked by the change detection mechanism.
   *
   * - Ensures column-specific classes are consistently applied after every change detection cycle.
   * - Useful for scenarios where dynamic column styling may be affected by content or layout changes.
   */
  ngAfterViewChecked() {
    if (this.table?.element) {
      this.applyColumnClasses();
    }
  }

  updateHorizontalScrollClass(removeClass?: boolean) {
    if (!this.table?.element) return;
    const tableBodyElement = this.table.element.querySelector(
      '.datatable-body',
    ) as HTMLElement;
    if (!tableBodyElement) return;
    const hasVerticalScrollbar =
      tableBodyElement.scrollHeight > tableBodyElement.clientHeight;
    const hasHorizontalScrollbar =
      tableBodyElement.scrollWidth > tableBodyElement.clientWidth;

    const scrollCell = this.table.element.querySelector('.datatable-scroll');
    const actionCell = this.table.element.querySelector('.action-header');
    if (scrollCell) {
      if (removeClass) {
        this.renderer.removeClass(scrollCell, 'un-scroll-horizantal');
      } else {
        if (!hasHorizontalScrollbar) {
          this.renderer.addClass(scrollCell, 'un-scroll-horizantal');
        } else {
          this.renderer.removeClass(scrollCell, 'un-scroll-horizantal');
        }
      }
    }
    if (actionCell) {
      if (removeClass) {
        this.renderer.removeClass(actionCell, 'action-wrap-scrolled');
      } else {
        if (hasVerticalScrollbar) {
          this.renderer.addClass(actionCell, 'action-wrap-scrolled');
        } else {
          this.renderer.removeClass(actionCell, 'action-wrap-scrolled');
        }
      }
    }
  }

  get hasMultipleColumns(): boolean {
    return this.columns.filter(col => col.prop !== 'action').length > 1;
  }

  applyColumnClasses() {
    if (!this.table?.element) return;
    const headerCells = this.table.element.querySelectorAll('.resizeable');
    headerCells.forEach((cell) => {
      cell.classList.remove('last-column', 'second-last-column');
    });
    const visibleCells = Array.from(headerCells).filter((cell) => {
      const rect = cell.getBoundingClientRect();
      const tableRect = this.table.element.getBoundingClientRect();
      return rect.right <= tableRect.right && rect.left >= tableRect.left;
    });
    const visibleLength = visibleCells.length;
    if (visibleLength > 0) {
      if (visibleCells[visibleLength - 1] !== visibleCells[0]) {
        visibleCells[visibleLength - 1].classList.add('last-column');
      }
      if (visibleLength > 1) {
        if (visibleCells[visibleLength - 2] !== visibleCells[0]) {
          visibleCells[visibleLength - 2].classList.add('second-last-column');
        }
      }
    }
  }

  setTableColumns(): void {
    if (this.gridColumns?.length) {
      this.columns = this.gridColumns || [];
      this.columns = this.columns.map((column) => {
        return {
          ...column,
          frozenLeft:
            column?.frozenLeft ? !this.isMobileScreen() : false,
          searchable: this.enableInlineSearch
            ? column.searchable !== undefined
              ? column.searchable
              : true
            : false,
          headerTemplate: this.enableInlineSearch
            ? column.searchable !== false
              ? this.filterHeader
              : column.headerTemplate
            : column.headerTemplate,
        };
      });

      if (this.enableGridConfiguration) {
        const thisActionColumn = this.columns.find(
          (column) => column.prop === 'action',
        );

        if (!thisActionColumn?.prop) {
          const isMobile = this.isMobileScreen();
          this.columns.push({
            prop: 'action',
            name: 'Action',
            sortable: false,
            searchable: false,
            hidden: false,
            width: isMobile? 32 : 60,
            draggable: false,
            resizeable: false,
            cellTemplate: this.actionRowTemplate || this.actionRow,
            frozenRight: true,
            headerTemplate: this.actionHeaderTemplate || this.actionHeader,
            suppressToggle: true,
            cellClass: isMobile ? 'mobile-action-cell' : '',
            headerClass: isMobile ? 'mobile-action-header' : '',
          });
        }
      }
      this.defaultColumns = this.columns;
      this.cdr.detectChanges();
      if (this.gridName) {
        this.gcHelper.initializeDefaultColumnsOfGrid({
          gridName: this.gridName,
          columns: this.columns,
        });
      }
    }
  }

  onPageSizeInput() {
    if (this.customPageSize?.value) {
      this.onPageSizeChange(parseInt(this.customPageSize.value) || 25);
    }
  }

  setValidation() {
    const value = parseInt(this.customPageSize?.value || '0');
    if (value) {
      if (value > 500) {
        this.customPageSize.setValue('500');
        this.pageSizeInputValidationTooltip.open();
        setTimeout(() => {
          this.pageSizeInputValidationTooltip.close();
        }, 2000);
      }
    }
  }

  toggleFilter(event: MouseEvent, columnProp: string): void {
    event.stopPropagation();
    this.clearLastInputValues();
    this.clearInvalidClass();
    const column = this.columns.find((col) => col.prop === columnProp);
    if (!column || column.searchable === false) return;
    const isSameColumn = this.currentFilterColumn === columnProp;
    this.filterVisible = !isSameColumn || !this.filterVisible;
    this.currentFilterColumn = this.filterVisible ? columnProp : '';
    this.setInlineFilterOptions(column?.searchConfig);
    this.filterType = column.searchConfig?.searchType || 'multi-text';
    if (this.filterVisible) {
      const currentInlineFilter = this.columnFilters.find(
        (f) => f.columnName === columnProp,
      );
      const conditions = currentInlineFilter?.conditions || [];

      this.setValuesForSearchBoxes(conditions);

      this.selectedOperators.main = currentInlineFilter?.operator || 'or';
      this.selectedOperators.filter1 =
        conditions[0]?.type || this.operatorOptions[0].code;
      this.selectedOperators.filter2 =
        conditions[1]?.type || this.operatorOptions[0].code;
    }
    this.cdr.detectChanges();
  }

  setValuesForSearchBoxes(conditions: ColumnFilterCondition[]) {
    if (this.filterType === 'multi-text') {
      this.searchValues[0] = conditions[0]?.searchTags || [];
      this.searchValues[1] = conditions[1]?.searchTags || [];
    } else {
      this.lastInputValues[0] = conditions[0]?.searchTags?.[0] || '';
      this.lastInputValues[1] = conditions[1]?.searchTags?.[0] || '';
    }
  }

  setInlineFilterOptions(searchConfig?: SearchConfig) {
    if (searchConfig && searchConfig.searchTypeFilterOptions?.length) {
      const allowedCodes = new Set(searchConfig.searchTypeFilterOptions);
      this.operatorOptions = this.defaultOperatorsOptions.filter((option) =>
        allowedCodes.has(option.code),
      );
    } else {
      this.operatorOptions = this.defaultOperatorsOptions;
    }
    this.isOperatorFieldEnabled =
      searchConfig?.enableOperator !== undefined
        ? searchConfig?.enableOperator
        : true;
  }

  addTagFn(searchText: any) {
    return searchText;
  }

  storeLastInput(event: any, index: number) {
    const inputValue = (event.target as HTMLInputElement).value;
    if (!(inputValue === undefined)) {
      this.lastInputValues[index] = inputValue;
    }

    if (inputValue && index == 0) {
      this.clearInvalidClass();
    }
  }

  clearLastInputValues(index?: number) {
    if (index) {
      this.lastInputValues[index] = '';
      return;
    }

    this.lastInputValues.forEach((val, index) => {
      this.lastInputValues[index] = '';
    });
  }

  applyFilter(columnName: string, column: GridColumn): void {
    if (this.filterType === 'multi-text') {
      this.searchValues.forEach((element, index) => {
        if (
          !(
            element.includes(this.lastInputValues[index]) ||
            !this.lastInputValues[index]
          )
        ) {
          this.searchValues?.[index].push(this.lastInputValues[index]);
        }
      });
    } else {
      this.searchValues.forEach((_, index) => {
        this.searchValues[index] = [this.lastInputValues[index]];
      });
    }

    if (this.hiddenInputBox.includes(this.selectedOperators.filter1)) {
      this.searchValues[0] = [];
    }

    if (this.hiddenInputBox.includes(this.selectedOperators.filter2)) {
      this.searchValues[1] = [];
    }

    if (
      !this.getSearchTagsValue(0)?.length &&
      !this.hiddenInputBox.includes(this.selectedOperators.filter1)
    ) {
      this.isInvalidClassActive = true;
      return;
    }

    this.clearLastInputValues();

    this.filterVisible = false;

    const existingFilterIndex = this.columnFilters.findIndex(
      (f) => f.columnName === columnName,
    );

    const conditions: ColumnFilterCondition[] = [
      {
        type: this.selectedOperators.filter1,
        searchTags: this.getSearchTagsValue(0),
      },
    ];

    if (
      (this.searchValues[1].length && this.searchValues[1][0].length) ||
      this.hiddenInputBox.includes(this.selectedOperators.filter2)
    ) {
      conditions.push({
        type: this.selectedOperators.filter2,
        searchTags: this.getSearchTagsValue(1),
      });
    }

    if (this.searchValues?.length > 0) {
      if (existingFilterIndex > -1) {
        this.columnFilters[existingFilterIndex].operator =
          conditions.length > 1 ? this.selectedOperators.main : null;
        this.columnFilters[existingFilterIndex].conditions = conditions;
      } else {
        this.columnFilters.push({
          filterType: column.searchConfig?.searchType || 'multi-text',
          columnName,
          operator: conditions.length > 1 ? this.selectedOperators?.main : null,
          conditions,
        });
      }
    } else {
      if (existingFilterIndex > -1) {
        this.columnFilters.splice(existingFilterIndex, 1);
      }
    }
    this.fireUpdatedColumnFilters();
  }

  getSearchTagsValue(index: number) {
    return this.searchValues[index]?.length && this.searchValues[index][0]
      ? this.searchValues[index]
      : [];
  }

  isColumnFiltered(columnName: string): boolean {
    return this.columnFilters.some(
      (filter) => filter.columnName === columnName && filter.conditions[0],
    );
  }

  getFilterValue(columnName: string): string[] {
    const filter = this.columnFilters.find((f) => f.columnName === columnName);
    if (!filter?.conditions) return [];
    return [
      ...(filter.conditions[0]?.searchTags || []),
      ...(filter.conditions[1]?.searchTags || []),
    ];
  }

  getUioverlayNoRowsTemplate(message: string): string {
    return `<div>
    <div class="wrapper-no-data">
      <div class="no-data-avl-data">
        <img src="assets/images/no-records-found.svg" />
        <h4 style="margin-top: 24px;">${message}</h4>
      </div>
    </div>
  </div>`;
  }

  onActivate(event: any) {
    // For onboarding or offboarding details
    if (
      this.gridName &&
      ['Onboarding', 'Offboarding'].includes(this.gridName) &&
      event?.type === 'dblclick'
    ) {
      this.onGridActivate.emit(event?.row);
    }
    this.onGridActivate.emit(event);
  }

  onPage(event: any) {
    this.onGridPage.emit(event);
  }

  onSort(event: any) {
    this.onGridSort.emit(event);
  }

  onRowSelect(event: any) {
    this.onGridRowSelect.emit(event);
  }

  onColumnReOrder(event: any) {
    const gridConfiguration = this.gcHelper.getGridConfiguration(
      this.gridName || '',
    );
    if (gridConfiguration) {
      const allColumns = gridConfiguration.columns || [];
      const visibleColumns =
        allColumns.filter((column) => !column.hidden) || [];
      const updatedVisibleColumns = this.reorderColumn(
        visibleColumns,
        event?.prevValue,
        event?.newValue,
      );
      gridConfiguration.columns = allColumns?.map((column) => {
        if (!column.hidden) {
          // Replace from the reordered visible columns in order
          return updatedVisibleColumns.shift();
        } else {
          return column;
        }
      }) as GridColumn[];
      this.gcHelper.setColumnsOfGrid(gridConfiguration);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const filterContent = event.target as HTMLElement;
    if (
      filterContent.closest('.column-filter-dropdown') ||
      filterContent.closest('.filter-icon') ||
      filterContent.closest('.ng-value') ||
      filterContent.closest('.ng-dropdown-panel-items')
    ) {
      event.stopPropagation();
      return;
    }
    if (
      filterContent.closest('.pages-selector') ||
      filterContent.closest('.total-pages')
    ) {
      event.stopPropagation();
      return;
    }
    this.isDropdownOpen = false;
    this.filterVisible = false;
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  clearInvalidClass() {
    this.isInvalidClassActive = false;
  }

  onFooterPage(event: any) {
    this.table.offset = event.page - 1;
    this.table.bodyComponent.updateOffsetY(this.table.offset);

    this.table.page.emit({
      count: this.table.count,
      pageSize: this.table.pageSize,
      limit: this.table.limit,
      offset: this.table.offset,
    });

    if (this.table.selectAllRowsOnPage) {
      this.table.selected = [];
      this.table.select.emit({
        selected: this.table.selected,
      });
    }
    this.onGridPageChange.emit(event);
  }

  async onPageSizeChange(pageSize: number) {
    if (this.pagination) {
      this.pagination.pageSize = pageSize;
      this.pagination.pageNumber = 1;
    }
    this.selectedPageSize = pageSize;
    this.onGridPageSizeChange.emit(this.pagination);
    this.toggleDropdown();
  }

  validateNumber(currentValue?: number) {
    return currentValue || 0;
  }

  toggleColumns() {
    const columnsModalRef = this.modalService.open(
      ColumnsToggleModalComponent,
      {
        windowClass: 'right-side-popup',
      },
    );
    columnsModalRef.componentInstance.originalColumn = this.gridColumns;
    columnsModalRef.componentInstance.gridName = this.gridName;
  }

  editRow(row: any) {
    this.onGridRowEdit.emit(row);
  }

  clearAdvanceColumnFilter() {
    this.columnFilters = [];
    this.fireUpdatedColumnFilters();
  }

  openAdvancedFilterModal() {
    const modalRef = this.modalService.open(AdvanceFilterModalComponent, {
      windowClass: 'sidebar-small',
      modalDialogClass: 'advance-filter-modal',
    });
    modalRef.componentInstance.gridName = this.gridName;
    modalRef.componentInstance.columnFilters = this.columnFilters;
    modalRef.closed.subscribe((result) => {
      if (result.action !== 'CANCEL') {
        this.columnFilters = result.data.columnFilters;
        this.fireUpdatedColumnFilters();
      }
    });
  }

  fireUpdatedColumnFilters() {
    this.columnFilters = this.trimColumnFiltersSearchTags(this.columnFilters);
    this.onColumnFilterChange.emit(this.columnFilters);
  }

  trimColumnFiltersSearchTags(columnFilters: ColumnFilter[]): ColumnFilter[] {
    return columnFilters.map((filter) => ({
      ...filter,
      conditions: filter.conditions.map((condition) => ({
        ...condition,
        searchTags: condition.searchTags.map((tag) => tag.trim()),
      })),
    }));
  }

  resetTableTransform() {
    let tableColumnElement = this.table?.element?.querySelector(
      '.datatable-row-center',
    ) as HTMLElement;
    if (tableColumnElement) {
      tableColumnElement.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  }

  reorderColumn(
    columns: Array<GridColumn>,
    fromIndex: number,
    toIndex: number,
  ) {
    if (
      fromIndex < 0 ||
      fromIndex >= columns.length ||
      toIndex < 0 ||
      toIndex >= columns.length ||
      fromIndex === toIndex
    ) {
      return columns;
    }

    const item = columns.splice(fromIndex, 1)[0];
    columns.splice(toIndex, 0, item);
    return columns;
  }

  isOperatorEnabled(column: GridColumn) {
    if (this.filterType === 'multi-text') {
      return (
        (this.searchValues[0]?.length > 0 ||
          this.searchValues[1]?.length > 0 ||
          this.hiddenInputBox.includes(this.selectedOperators.filter1)) &&
        this.isOperatorFieldEnabled
      );
    } else {
      return (
        (this.lastInputValues[1] ||
          this.lastInputValues[0] ||
          this.hiddenInputBox.includes(this.selectedOperators.filter1)) &&
        this.isOperatorFieldEnabled
      );
    }
  }

  isAndOperatorDisabled(option: MainFilterOption) {
    const result =
      this.selectedOperators.filter1 === this.selectedOperators.filter2 &&
      this.disabledAndOperatorForFilters.includes(
        this.selectedOperators.filter1,
      ) &&
      option.code === 'and';

    if (result) {
      this.selectedOperators.main = 'or';
    }

    return result;
  }

  clearFilterForColumn(columnProp: string) {
    this.columnFilters = this.columnFilters.filter(
      (filter) => filter.columnName !== columnProp,
    );
    this.fireUpdatedColumnFilters();
  }

  setCustomPaginationValue() {
    const pageSize = this.pagination?.pageSize;
    const value =
      pageSize && !this.pageSizes.includes(pageSize)
        ? pageSize.toString()
        : null;
    this.customPageSize.setValue(value);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.unsubscribe();
    this.resizeObserver?.disconnect();
    this.updateHorizontalScrollClass(true);
  }
}
