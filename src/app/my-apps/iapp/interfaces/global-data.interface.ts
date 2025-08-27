export interface ApiStatus {
  apiCode: string;
  statusCode: number;
  statusMessage: string;
  statusDescription: string;
}

export interface DashboardGridPagination {
  startIndex: number;
  pageSize: number;
  totalCount: number;
}
export interface DashboardFilters {
  duration: number;
  pagination: DashboardGridPagination;
  searchText: string ;
  sortColumn: string;
  sortDirection: string;
  columnFilters: any;
}

export interface LogRequest {
  searchText?: string;
  startTime?: string; // number=>string
  endTime?: string; // number=>string
  priority?: string;
  loadMore?: boolean;
  silentCall?: boolean;
}

export interface ApplicationRequest {
  silentCall?: boolean;
}
