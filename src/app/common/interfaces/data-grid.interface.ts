import { TableColumn } from "@swimlane/ngx-datatable";

export interface SearchConfig {
  enableOperator?: boolean;
  searchType?: ColumnFilterConditionFilterType;
  searchTypeFilterOptions?: ColumnFilterConditionSearchTypeCode[];
}
export interface GridColumn extends TableColumn {
  hidden?: boolean;
  suppressToggle?: boolean;
  searchable?: boolean;
  searchConfig?: SearchConfig
}

export type ColumnFilterConditionFilterType = 'multi-text' | 'text';
export type ColumnFilterConditionSearchTypeCode =
| 'contains'
| 'does_not_contain'
| 'equals'
| 'does_not_equal'
| 'begins_with'
| 'ends_with'
| 'is_blank'
| 'is_not_blank';

type ColumnFilterConditionSearchTypeName =
  | 'Contains'
  | 'Does not contain'
  | 'Equals'
  | 'Does not equal'
  | 'Begins with'
  | 'Ends with'
  | 'Blank'
  | 'Not blank';

export interface ColumnFilterConditionSearch {
  code: ColumnFilterConditionSearchTypeCode;
  name: ColumnFilterConditionSearchTypeName;
}

type ColumnFilterOperator = 'and' | 'or' | null;

export interface ColumnFilterCondition {
  searchTags: string[];
  type: ColumnFilterConditionSearchTypeCode;
}

export interface ColumnFilter {
  columnName: string;
  filterType: ColumnFilterConditionFilterType;
  conditions: Array<ColumnFilterCondition>;
  operator?: ColumnFilterOperator;  
}

export interface GridConfiguration {
  gridName: string;
  columns?: Array<GridColumn>;
}

export interface GridSort {
  prop: string;
  dir: string;
}

export interface GridPagination {
  totalCount?: number;
  pageNumber?: number;
  pageSize: number;
  currentPage?: number;
  totalPages?: number;
}

export interface SelectedOperator{
  main: ColumnFilterOperator;
  filter1: ColumnFilterConditionSearchTypeCode;
  filter2: ColumnFilterConditionSearchTypeCode;
}

export interface MainFilterOption {
  code: 'and' | 'or';
  name: 'AND' | 'OR';
}
