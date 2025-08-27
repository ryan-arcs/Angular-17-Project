export interface ApiStatus {
  apiCode: string;
  statusCode: number;
}

export interface OnboardingResourceChildTicketComment {
  id: string;
  ticketId: string;
  comment?: string;
  commentedBy?: string;
  ticketLink?: string;
  commentorName?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface OnboardingResourceChildTicket {
  id: string;
  parentTicketId: string;
  summary?: string;
  shortSummary?: string;
  status?: string;
  priority?: string;
  ticketLink?: string;
  assignee?: string;
  operation?: string;
  teamQueue?: string;
  comments?: Array<OnboardingResourceChildTicketComment>;
}

interface OnboardingResourceParentTicket {
  id: string;
  summary?: string;
  status?: string;
  priority?: string;
  ticketLink?: string;
  operation?: string;
  description?: string;
  childTickets?: Array<OnboardingResourceChildTicket>;
}

export interface OnboardingResource {
  employeeId: string;
  firstName: string;
  lastName: string;
  parentTicketId?: string;
  responseTicketNumber?: string;
  preferredName?: string;
  jobTitle?: string;
  companyCode?: string;
  departmentName?: string;
  startDate?: string;
  workerType?: string;
  employmentType?: string;
  jobGrade?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  hrBusinessPartner?: string;
  requisitionNo?: string;
  isBackfill?: string;
  isReturningEmployee?: string;
  workLocation?: string;
  workState?: string;
  workStateName?: string;
  primaryAddress?: string;
  zipCode?: string;
  contractEndDate?: string;
  createdDate?: string;
  formattedCreatedDate?: string;
  createdBy?: string;
  updatedDate?: string;
  formattedUpdatedDate?: string;
  updatedBy?: string;
  lastTerminationDate?: string;
  parentTicket?: OnboardingResourceParentTicket;
}

export interface OffboardingResourceChildTicketComment {
  id: string;
  ticketId: string;
  comment?: string;
  commentedBy?: string;
  ticketLink?: string;
  commentorName?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface OffboardingResourceChildTicket {
  id: string;
  parentTicketId: string;
  summary?: string;
  shortSummary?: string;
  status?: string;
  priority?: string;
  ticketLink?: string;
  assignee?: string;
  operation?: string;
  teamQueue?: string;
  comments?: Array<OffboardingResourceChildTicketComment>;
}

interface OffboardingResourceParentTicket {
  id: string;
  summary?: string;
  status?: string;
  priority?: string;
  ticketLink?: string;
  operation?: string;
  description?: string;
  childTickets?: Array<OffboardingResourceChildTicket>;
}

export interface OffboardingResource {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  parentTicketId?: string;
  responseTicketNumber?: string;
  preferredName?: string;
  jobTitle?: string;
  companyCode?: string;
  departmentName?: string;
  formattedTerminationDate?: string;
  workerType?: string;
  employmentType?: string;
  jobGrade?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  hrBusinessPartner?: string;
  requisitionNo?: string;
  isBackfill?: string;
  isReturningEmployee?: string;
  workLocation?: string;
  workState?: string;
  workStateName?: string;
  primaryAddress?: string;
  createdDate?: string;
  formattedCreatedDate?: string;
  createdBy?: string;
  updatedDate?: string;
  formattedUpdatedDate?: string;
  updatedBy?: string;
  lastTerminationDate?: string;
  parentTicket?: OffboardingResourceParentTicket;
}
