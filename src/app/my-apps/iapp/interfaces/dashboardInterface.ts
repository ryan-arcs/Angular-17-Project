export interface DateRange {
  startDate: Date;
  endDate: Date;
}
export interface Option {
  value: number;
  option: string;
}

export interface Detail {
  intf_log_id: number;
  status_code: number;
  status_message: string;
  message_details: string;
}

export interface Data {
  intf_id: number;
  interface_id: string;
  intf_log_id: number;
  execution_id: string;
  project_name: string;
  source_name: string;
  intf_log_updated_date: string;
  intf_log_created_date: string;
  target_name: string;
  flow_name: string;
  document_external_link: string;
  status_code: number;
  status_message: string;
  details?: Detail[];
}

export interface StatusDetails {
  statusCode: number;
  statusLabel: string;
  statusColor: string;
}
