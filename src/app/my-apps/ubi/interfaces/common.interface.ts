export interface TableauWorkbook {
  id: string;
  name: string;
  contentUrl: string;
}

export interface TableauProject {
  id: string;
  name: string;
  topPrName: string;
  prPath: string;
  envName: string;
}

export interface TagData {
  label: string;
}

export interface TableauView {
  id: string;
  name: string;
  viewUrlName: string;
  description?: string;
  tags: { tag?: TagData[] };
  thumbnail?: string;
  isFavorite?: boolean;
  workbook: TableauWorkbook;
  project: TableauProject;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentProject {
  id: string;
  name: string;
  topPrName: string;
  prPath: string;
  envName: string;
  isMenuExpanded?: boolean;
  seeAll?: boolean;
  views?: Array<TableauView>;
  childProjects?: Array<EnvironmentProject>;
  showViews?: boolean
}

export interface TableauAuthCredentials {
  site: {
    id: string;
    contentUrl: string;
  };
  token: string;
  user: {
    id: string;
  };
}

export interface RecentListRequest {
  silentCall?: boolean;
}

export interface FavoriteListRequest {
  silentCall?: boolean;
}

export interface UserFavorites {
  label: string;
  addedAt: string;
  view?: TableauView;
  workbook?: TableauWorkbook;
}

export interface UserRecents {
  view?: TableauView;
  workbook?: TableauWorkbook;
  isFavorite?: boolean;
}

export interface ApiStatus {
  apiCode: string;
  statusCode: number;
}

export interface TableauReport {
  id: string;
}

export interface TableauPersona {
  id: string;
  environment: string;
  name: string;
  reports?: Array<string>;
  fullReports?: Array<TableauView>;
}

export interface APIReportGroup {
  name: string;
  reports?: Array<string>;
}

export interface TableauPersonaListRequest {
  userId?: string;
  cacheData?: boolean;
  silentCall?: boolean;
}

export interface TableauPersonaCreateRequest {
  name: string;
}

export interface TableauPersonUpdateRequest extends TableauPersonaCreateRequest {
  id: string;
}

export interface ManageReportsRequest {
  personaId: string;
  assignedViews?: Array<{ id?: string }>;
}

export interface ManageUsersRequest {
  personaId: string;
  assignedUsers?: Array<{ id?: string }>;
}

export interface AddFavoritesOfUser {
  label: string;
  datasource?: { id: string };
  view?: { id: string };
  flow?: { id: string };
  metric?: { id: string };
  project?: { id: string };
  workbook?: { id: string };
}

export interface DeleteFavorite {
  id: string;
}

export interface InitialPackageRequest {
  silentCall?: boolean;
}

export interface ProjectRootFolderRequest extends InitialPackageRequest {}

export interface LocalProjectRequest {
  projectId: string;
}

export interface LocalViewRequest {
  viewId: string;
}

export interface MultipleLocalViewRequest {
  viewIds: Array<string>;
}

export interface DateFilter {
  modifiedAfter: string;
  modifiedBefore: string;
  createdAfter: string;
  createdBefore: string;
}

export interface FilterState {
  globalSearch?: string;
  dateFilters?: DateFilter;
  sorting?:any;
  itemCount?: number;
}

export interface EnvironmentOption {
  name: string;
  code: string;
}

export interface JWTTokenRequest {
  forceAPICall?: boolean;
}

export interface SetPersonaPayload {
  name: string;
  dbSync?: boolean;
}

export interface SetEnvironmentPayload {
  name: string;
  dbSync?: boolean;
}

export interface LeftPanelData {
  envProjectId: string;
  viewId: string;
  loadedFrom: string;
}

export interface Filters {
  dateFilters?: DateFilter;
  sortBy?: {
    order?: string;
    sort?: string;
  };
  globalSearch?: string;
}