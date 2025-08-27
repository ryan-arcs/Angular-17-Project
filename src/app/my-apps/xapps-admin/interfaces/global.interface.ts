export type ColumnFilterConditionFilterType = 'multi-text' | 'text';
type ColumnFilterConditionSearchTypeCode =
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
  // searchTags: string[];
  filterType: ColumnFilterConditionFilterType;
  columnName: string;
  conditions: Array<ColumnFilterCondition>;
  operator?: ColumnFilterOperator;  
}

export interface GetListPayload {
  globalSearch?: string;
  sortColumn?: string;
  sortDirection?: string;
  columnFilters?: Array<ColumnFilter>;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  application?: string;
  orderedColumns?: string;
  applicationId?: number ;
  moduleId?: number;
  submoduleId?: number ;
  skipLimit?: boolean;
}
