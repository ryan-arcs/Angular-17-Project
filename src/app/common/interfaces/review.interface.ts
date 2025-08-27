export interface AddReviewPayload {
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

export type ReviewListSelectionSetType = readonly [
  'id',
    'subject',
    'comment',
    'rating',
    'createdAt',
    'createdBy',
    'creator.firstName',
    'creator.lastName',
    'creator.email',
    'updatedAt',
    'updator.firstName',
    'updator.lastName',
    'replies.id',
    'replies.reviewId',
    'replies.comment',
    'replies.createdAt',
    'replies.createdBy',
    'replies.creator.firstName',
    'replies.creator.lastName',
    'replies.creator.email',
    'replies.updatedAt',
    'replies.updator.firstName',
    'replies.updator.lastName'
];