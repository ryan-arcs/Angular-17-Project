import { del, get, post, put } from "aws-amplify/api";

interface OwnerInfo {
  id: number;
  email: string;
  fullname_preferred: string;
  profileImage?: string;
  network_id?: string;
}

type HostingLocationOptionType = | 'Vendor Controlled' | 'Exelixis Controlled' | 'Hybrid' | null;

type HostingLocationCodeType = | 'vendor_controlled' | 'exelixis_controlled' | 'hybrid' | null;

export interface HostingLocationOption {
  code: HostingLocationCodeType;
  option: HostingLocationOptionType;
}

export interface UserDetail{
  id: number;
  email: string; 
  fullname_preferred: string;
}

export interface Application {
  id: number;
  unique_key?: string;
  app_id: number;
  app_name: string;
  aliases: string;
  app_desc: string;
  businessOwner: number[];
  systemOwner: number[];
  productOwner: number[];
  productManager: number[];
  itContact: number[];
  approver1: number;
  approver2: number;
  vendor_id: number;
  ucoa_code?: string;
  io_code?: string;
  location?: string;
  sponsor: number;
  hosting_location: HostingLocationOptionType;
  deployment_type?: string;
  deployment_dt: string;
  version: string;
  ci_cd?: string;
  is_gxp: string;
  is_sox: string;
  is_internal: boolean;
  license?: string;
  classification?: string;
  dr_location?: string;
  dr_req: boolean;
  business_criticality?: string;
  is_sor: boolean;
  doc_location?: string;
  sop_location?: string;
  effective_dt: string;
  created_at: string;
  created_by: number;
  deleted_at: string;
  deleted_by?: number;
  last_modified_at: string;
  last_modified_by: number;
  record_status: string;
  business_owners: OwnerInfo[];
  system_owners: OwnerInfo[];
  product_owners: OwnerInfo[];
  it_contacts: OwnerInfo[];
  product_managers: OwnerInfo[];
  approver1_preferred_name: string;
  approver1_email: string;
  approver2_preferred_name: string;
  approver2_email: string;
  created_by_preferred_name: string;
  last_modified_by_preferred_name: string;
  deleted_by_preferred_name?: string;
  life_cycle: string;
  lc_name: string;
  vendor_name: string;
  funding_department_name: string;
  avatar?: string;
  is_selected?: boolean;
}

export interface UserList {
  home_organization?: string;
  work_phone?: string;
  office?: string;
  empl_status_class?: string;
  building?: string;
  fulltime_equiv?: string;
  division?: string;
  pay_grade?: string;
  onleave?: string;
  contractend_date?: string;
  dept_corp_group?: string;
  work_state?: string;
  date_entered?: string;
  flsacode?: string;
  fax?: string;
  job_title?: string;
  home_address_line1?: string;
  home_address_line2?: string;
  work_city?: string;
  home_phone?: string;
  jobposition?: string;
  costcenter_code?: string;
  is_manager?: string;
  adp_employee_location?: string;
  manager_user_id?: string;
  worker_id?: string;
  lastname?: string;
  network_id?: string;
  local_remote?: string;
  employee_timetype?: string;
  employee_number?: string;
  siq_building?: string;
  empl_status?: string;
  firstname?: string;
  manager_hire_date?: string;
  home_zip?: string;
  emp_position_start_date?: string;
  costcenter_desc?: string;
  fullname_preferred?: string;
  work_address_line1?: string;
  work_address_line2?: string;
  emp_active_status_date?: string;
  manager_id?: string;
  nickname?: string;
  company_code?: string;
  effective_enddate?: string;
  work_country?: string;
  department?: string;
  division_corp_group?: string;
  email?: string;
  employeetype?: string;
  middlename?: string;
  work_zip?: string;
  hire_date?: string;
  original_hire_date?: string;
  home_state?: string;
  manager_name?: string;
  home_city?: string;
  termination_date?: string;
  home_country?: string;
  location?: string;
  fullname?: string;
  manager_email?: string;
  id?: string;
  last_modified_at?: string;
  created_at?: string;
  last_modified_by?: string;
  created_by?: string;
  dob?: string;
}

export interface ApiStatus {
  apiCode: string;
  statusCode: number;
}

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
  orderedColumns?: string;
}

export interface DownloadFilePayload extends GetListPayload {
  fileName: string;
}

export interface UserSearchPayload {
  searchTerm?: string;
  showLoader?: boolean;
  authorityType?: string;
}

export interface VendorSearchPayload extends UserSearchPayload {
}

export interface LifecycleSearchPayload extends UserSearchPayload {
}

export interface DepartmentSearchPyaload extends UserSearchPayload {
}

export interface ApplicationDetailsPayload {
  id: string;
}

export interface ConfigurationsDetailsPayload {
  id: string;
}

export interface LifeCycleDetailsPayload {
  code: string;
}

export interface VendorDetailsPayload {
  vendor_id: number;
}

export interface AddApplicationPayload {
  app_name: string;
  business_owner: number[];
  system_owner: number[];
  life_cycle: string;
  aliases: string;
  hosting_location: HostingLocationCodeType;
  app_desc: string;
  vendor_id: string;
  sponsor?: number;
  version?: string;
  product_owner?: number[];
  product_manager?: number[];
  it_contact?: number[];
  approver1?: number;
  is_gxp?: boolean;
  is_sox?: boolean;
}

export interface AddConfiguationsPayload {
    notification_event: string;
    initial_trigger_days: string;
    repeat_frequency_days: string;
    record_status: string;
    threshold: number;
    email_to: string;
    email_cc: string;
    email_bcc: string;
    admin_email: string;
    email_subject: string;
    email_body: string;
    email_reminder_subject: string;
    email_reminder_body: string;
    attribute_1: string;
    attribute_2: string;
    attribute_3: string;
    attribute_4: string;
    attribute_5: string;
}

export interface UpdateConfigurationsPayload extends AddConfiguationsPayload {
  id: number
}


export interface AddLifeCyclePayload {
  name: string;
  description?: string;
}

export interface DeleteLifeCyclePayload {
  id: number;
}

export interface DeleteApplicationPayload {
  id: number;
}

export interface UpdateLifeCyclePayload extends AddLifeCyclePayload {
  id: number
}

export interface UpdateApplicationPayload extends AddApplicationPayload {
  id: number;
}

export interface AddVendorPayload {
  vendor_name: string;
}

export interface UpdateVendorPayload extends AddVendorPayload {
  vendor_id: number
}

export interface Vendor {
  vendor_id?: number;
  vendor_name: string;
  created_at: string;
  created_by: number;
  last_modified_at: string;
  last_modified_by: number;
  deleted_at?: string;
  deleted_by?: number;
  record_status?: string;
  avatar?: string;
  created_by_preferred_name?: string;
  last_modified_by_preferred_name?: string;
  deleted_by_preferred_name?: string;
}

export interface DeleteVendorPayload {
  vendor_id: number;
}

export interface Department {
  id: number;
  department_name: string;
  created_at: string;
  created_by: number;
  last_modified_at: string;
  last_modified_by: number;
  created_by_preferred_name: string;
  last_modified_by_preferred_name: string;
  deleted_at?: string;
  deleted_by?: number;
  record_status?: string;
  deleted_by_preferred_name?: string;
}

export type RestApiGetCallResponseType = 'text' | 'json' | 'blob';

type Headers = Record<string, string>;

export interface RestApiGetCallRequest {
  path: string;
  responseType?: RestApiGetCallResponseType;
  headers?: Headers;
  queryParams?: Record<string, string>;
}

export interface RestApiPostCallRequest extends RestApiGetCallRequest{
  body?: any;
}

export interface RestApiPutCallRequest extends RestApiPostCallRequest {}

export interface RestApiDeleteCallRequest extends RestApiGetCallRequest {}

type RestApiMethodType = 'get' | 'post' | 'put' | 'del';

export interface RestApiReponseOptions {
  restOperation: (ReturnType<typeof get> | ReturnType<typeof post> | ReturnType<typeof put> | ReturnType<typeof del>) & {
    type: RestApiMethodType;
  };
  responseType?: RestApiGetCallResponseType;
}
