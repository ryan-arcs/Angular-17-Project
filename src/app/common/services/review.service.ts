import { Injectable } from '@angular/core';
import { UserProfileService } from './user-profile.service';
import { UIService } from './ui.service';
import { messages } from '../constants';
import { ToastService } from './toast.service';
import { GlobalDataService as GS } from 'src/app/common/services/global-data.service';
import { BehaviorSubject } from 'rxjs';
import { AddReviewPayload, AddReviewReplyPayload, ReviewListSelectionSetType, UpdateReviewPayload, UpdateReviewReplyPayload } from '../interfaces/review.interface';

interface ApiStatus {
  apiCode: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private client:any = '';
  private apiStatuses: Array<ApiStatus> = [];

  private _reviewList = new BehaviorSubject<Array<any>>([]);
  reviewList$ = this._reviewList.asObservable();

  private _reviewListToken = new BehaviorSubject<string | null>(null);
  reviewListToken$ = this._reviewListToken.asObservable();

  ReviewModel: any = this.client.models.Review;
  ReviewReplyModel: any = this.client.models.ReviewReply;

  constructor(
    private userProfileService: UserProfileService,
    private uiService: UIService,
    private gs: GS,
    private toastService: ToastService,
  ) { }

  setApiResponse(apiCode: string, statusCode: number) {
    const apiStatus = {
      apiCode: apiCode,
      statusCode: statusCode,
    };

    const thisApiStatusIndex = this.apiStatuses.findIndex(
      (apiStatus: ApiStatus) => apiStatus.apiCode === apiCode,
    );
    if (thisApiStatusIndex > -1) {
      this.apiStatuses[thisApiStatusIndex] = apiStatus;
    } else {
      this.apiStatuses.push(apiStatus);
    }
  }

  async submitReview(payload: AddReviewPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.ReviewModel.create({
        subject: payload.subject,
        comment: payload.description,
        rating: payload.rating,
        createdBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
        updatedBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
      });
      this.toastService.fire({
        type: 'success',
        message: messages.success.feedback.add,
      });
      this.prependReviewInReviewList(result.data);
      return result;
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async updateReview(payload: UpdateReviewPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.ReviewModel.update({
        id: payload.id,
        subject: payload.subject,
        comment: payload.description,
        rating: payload.rating,
        updatedBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
      });

      if (result.data) {
        this.updateReviewInReviewList(result.data);
      }

      this.toastService.fire({
        type: 'success',
        message: messages.success.feedback.add,
      });

      return result;
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      return;
    } finally {
      this.uiService.setLoader(false);
    }
  }

  // no creator and replies and updator name in response of edit review so i manually put details
  updateReviewInReviewList(review: any) {
    if (!review) {
      return;
    }
    let reviewList = this._reviewList.getValue();
    let reviewIndex = reviewList.findIndex((r) => r.id == review.id);
    if (reviewIndex > -1) {

      //patch
      const creatorName = reviewList[reviewIndex].creator;
      const replies = reviewList[reviewIndex].replies;

      reviewList[reviewIndex] = review;
      reviewList[reviewIndex].creator = creatorName;
      reviewList[reviewIndex].replies = replies;
    }
    this._reviewList.next(reviewList);
  }

  addReviewReplyInList(reply: any) {
    if (!reply) {
      return;
    }

    var reviewList = this._reviewList.getValue();
    reviewList = reviewList.map((r) => {
      return {
        ...r,
        isChildReviewBoxOpen: false,
      }
    })
    const parentReviewIndex = reviewList.findIndex((review) => reply.reviewId === review.id);

    if (parentReviewIndex > -1) {

      // update reviewlist
      reviewList[parentReviewIndex].isChildReviewBoxOpen = true; // make it true to open replybox 
      let loggedInUserDetails = this.userProfileService.getLoggedInUserDetails();
      let creatorData = {
        'firstName': loggedInUserDetails?.firstName,
        'lastName': loggedInUserDetails?.lastName,
        'email': loggedInUserDetails?.email,
      }
      reply.creator = creatorData;
      reviewList[parentReviewIndex].replies.push(reply);
      this._reviewList.next(reviewList);
    }
  }


  async addReviewReply(payload: AddReviewReplyPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.ReviewReplyModel.create({
        reviewId: payload.reviewId,
        comment: payload.description,
        createdBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
        updatedBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
      });

      this.addReviewReplyInList(result.data);
      this.toastService.fire({
        type: 'success',
        message: messages.success.feedback.add,
      });
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  updateReviewReplyInList(reply: any) {
    if (!reply) {
      return;
    }

    let reviewList = this._reviewList.getValue();
    reviewList = reviewList.map((r) => {
      return {
        ...r,
        isChildReviewBoxOpen: false,
      }
    })
    const parentReviewIndex = reviewList.findIndex((review) => reply.reviewId === review.id);

    if (parentReviewIndex > -1) {
      const replyIndex = reviewList[parentReviewIndex].replies?.findIndex((r: any) => r.id === reply.id);

      // update reviewlist
      if (replyIndex > -1) {
        reviewList[parentReviewIndex].isChildReviewBoxOpen = true; // make it true to open replybox 
        reviewList[parentReviewIndex].replies[replyIndex].comment = reply.comment;
        reviewList[parentReviewIndex].replies[replyIndex].updatedAt = reply.updatedAt;
        this._reviewList.next(reviewList);
      }

    }
  }

  async updateReviewReply(payload: UpdateReviewReplyPayload) {
    try {
      this.uiService.setLoader(true);
      const result = await this.ReviewReplyModel.update({
        id: payload.id,
        comment: payload.description,
        updatedBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
      });

      this.updateReviewReplyInList(result.data);

      this.toastService.fire({
        type: 'success',
        message: messages.success.feedback.add,
      });
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getReviews() {
    try {
      this.uiService.setLoader(true);
      const reviews = await this.gs.tableRecords({
        tableModel: this.client.models.Review,
        filter: {
          isDeleted: {
            ne: true,
          },
        },
        selectionSet: [
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
          'replies.updator.lastName',
        ],
      });

      this._reviewList.next(reviews || []);
      this.setApiResponse('review', 200);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      this.setApiResponse('review', 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getReviewPartialList() {
    try {
      this.uiService.setLoader(true);

      const selectionSet: ReviewListSelectionSetType = [
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
        'replies.updator.lastName',
      ];

      const { data: reviews, nextToken } = await this.ReviewModel.list({
        limit: 25,
        nextToken: this._reviewListToken.getValue() || null,
        filter: {
          isDeleted: {
            ne: true,
          },
        },
        selectionSet,
      }) as any;

      this._reviewListToken.next(nextToken || null);
      const lastReviews = this._reviewList.getValue() || [];
      this._reviewList.next(lastReviews?.concat(reviews || []));
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      this.setApiResponse('review', 520);
    } finally {
      this.uiService.setLoader(false);
    }
  }

  getReviewListNextToken() {
    return this._reviewListToken.getValue() || '';
  }

  prependReviewInReviewList(review: any) {
    if (!review) {
      return;
    }
    // make replies empty 
    review.replies = [];

    // enter creator data
    let loggedInUserDetails = this.userProfileService.getLoggedInUserDetails();
    let creatorData = {
      'firstName': loggedInUserDetails?.firstName,
      'lastName': loggedInUserDetails?.lastName,
      'email': loggedInUserDetails?.email,
    }
    review.creator = creatorData;

    let reviewList = this._reviewList.getValue();
    reviewList.unshift(review);
    this._reviewList.next(reviewList);
  }

  emptizeReviewList() {
    this._reviewList.next([]);
  }

  emptizeReviewListToken() {
    this._reviewListToken.next(null);
  }

  resetReviewList() {
    this.emptizeReviewList();
    this.emptizeReviewListToken();
  }

  updateReviewList(reviews: Array<any>) {
    this._reviewList.next(reviews || []);
  }
}
