
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileImageUrl?: string;
  nameInitials?: string;
  config?: any;
  applications: PermittedApplication[];
  permissions: Permission[];
};

export interface Permission {
  aSlug: string;
  mSlug: string;
  smSlug: string;
  pSlug: string;
}

export interface PermittedApplication {
  id: number;
  slug: string;
  name: string;
  logo: string;
  sortOrder: number;
  appConfig?: any;
}

export interface SspApplication {
  id: string;
  slug: string;
  name: string;
  status: string;
  logo: string;
}

export interface Addrequestform {
  applicationId: string;
  subject: string;
  description: string;
  userId: string;
}

export interface StatusDetails {
  statusCode: number;
  statusLabel: string;
  statusColor: string;
}
export interface Message {
  id: string;
  message: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
}
export interface GroupedMessage {
  [date: string]: Message[];
}
export interface AccessReqComments {
  applicationAccessRequestId: string;
  commentedBy: string;
  commenterFirstName: string;
  commenterLastName: string;
  createdAt: string;
  deletedAt: string | null;
  id: string;
  isActive: boolean;
  isDeleted: boolean;
  message: string;
  type: string;
  updatedAt: string;
}
export interface AccessReqDetails {
  applicationId: string;
  applicationName: string;
  createdAt: string;
  deletedAt: string | null;
  description: string;
  id: string;
  isActive: boolean;
  isDeleted: boolean;
  requestedBy: boolean;
  reviewedBy: string;
  status: string;
  subject: string;
  updatedAt: string;
  userName: string;
}
export interface ApiResponseInterface {
  statusCode: number;
  statusMessage: string;
  statusDescription: string;
}

export interface GridColumnResizeRequest {
  excludeColumns?: Array<string>;
}

export interface ReviewPayload {
  subject: string;
  description: string;
  rating: number;
}

export interface UpdateReviewPayload {
  id: string;
  subject: string;
  description: string;
  rating: number;
}

export interface EditOpenFields {
  replyIndex: number | null,
  reviewIndex: number | null,
}

export interface AddReviewReplyPayload {
  reviewId: string;
  description: string;
}

export interface UpdateReviewReplyPayload {
  id: string;
  description: string;
}

export interface ReviewDetailsPayload {
  id: string;
}

export interface ReviewReplyListPayload {
  parentReviewId: string;
}

export interface Review {
  id: string;
  subject: string;
  comment: string;
  rating: number;
  createdAt: string;
  createdBy: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedAt: string;
  updator: {
    firstName: string;
    lastName: string;
  };
  isReplyBoxOpen?: boolean;
  isChildReviewBoxOpen?: boolean;
  inEditMode?: boolean;
  replies?: Array<any>;
}

export interface CurrentRouteDetails {
  url: string;
  queryParams?: Record<string, CurrentRouteQueryParam>;
  pathParams?: Record<string, CurrentRoutePathParam>;
  component?: string;
}

export interface CurrentRouteQueryParam {
  value: string;
}
export interface CurrentRoutePathParam {
  value: string;
}

export type ThemeMode = 'nds-light' | 'nds-dark';
export type FontSize = 'font-large' | 'font-medium' | 'font-small';
export interface FontClassMap {
  [label: string]: FontSize;
}
