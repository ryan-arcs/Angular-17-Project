import { Injectable } from '@angular/core';
import { UIService } from './ui.service';
import { ToastService } from './toast.service';
import { Addrequestform } from '../interfaces/global.interface';
import { messages } from '../constants';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserProfileService } from './user-profile.service';
import { GlobalDataService as GS } from './global-data.service';

interface UserDetailsPayload {
  id: string;
}
interface AppAccessPayload {
  userId: string;
}

interface appAccessRequestDetailsPayload {
  id: string;
}

interface appAccessRequestCommentsPayload {
  id: string;
}

interface DeleteAppAccessRequest {
  id: string;
  userId: string;
}

interface MsgInfoPayload {
  id: string;
  commentBy: string;
  message: string;
}

interface DbRequest {
  tableModel: any;
  filter?: any;
  selectionSet?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AccessRequestService {
  private client:any;

  private _getAppAccessResults = new BehaviorSubject<any>([]);
  getAppAccessResults$ = this._getAppAccessResults.asObservable();

  private _usersResults = new BehaviorSubject<any>([]);
  usersResults$ = this._usersResults.asObservable();

  private _accessRequestDetails = new BehaviorSubject<any>([]);
  accessRequestDetails$ = this._accessRequestDetails.asObservable();

  private _accessRequestComments = new BehaviorSubject<any>([]);
  accessRequestComments$ = this._accessRequestComments.asObservable();

  private _userDetails = new BehaviorSubject<any>([]);
  userDetails$ = this._userDetails.asObservable();
  dbRecordsLimit = Number(environment.dbRecordsLimit) || 100000;

  //Models
  ApplicationAccessRequestModel: any = '';
  UserModel: any = '';
  ApplicationAccessRequestCommentModel:any = '';

  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private userProfileService: UserProfileService,
    private gs: GS,
  ) {}

  async submitAppAccessRequest(payload: Addrequestform) {
    try {
      this.uiService.setLoader(true);

      await this.ApplicationAccessRequestModel.create({
        applicationId: payload.applicationId,
        subject: payload.subject,
        description: payload.description,
        status: 'Pending',
        requestedBy: payload.userId,
        createdBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
        updatedBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
      });

      this.toastService.fire({
        type: 'success',
        message: messages.success.appAccessRequest.add,
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

  async getUsers() {
    try {
      this.uiService.setLoader(true);

      const apiUsers = await this.gs.tableRecords({
        tableModel: this.client.models.User,
        filter: {
          isDeleted: {
            ne: true,
          },
        },
      });

      this._usersResults.next(apiUsers || []);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async deleteAppAccessRequest(payload: DeleteAppAccessRequest) {
    try {
      this.uiService.setLoader(true);

      const request = await this.ApplicationAccessRequestModel.get({
        id: payload.id,
      }) as any;

      if (!request?.data?.id) {
        throw new Error(messages.error.appAccessRequest.notFound);
      }

      // Check if the userId of the request matches the userId in the payload
      if (request?.data?.requestedBy !== payload.userId) {
        throw new Error(messages.error.appAccessRequest.notFound);
      }

      await this.ApplicationAccessRequestModel.update({
        id: payload.id,
        deletedAt: new Date().toISOString(),
        isDeleted: true,
      });

      this.toastService.fire({
        type: 'success',
        message: messages.success.appAccessRequest.delete,
      });
      this.getAppAccessRequests(payload.userId);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        title: '',
        message: err?.message || 'Something went wrong',
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getUserDetails(payload: UserDetailsPayload): Promise<any | null> {
    try {
      this.uiService.setLoader(true);
      const { data: apiUserDetails } = await this.UserModel.get({
        id: payload.id,
      }) as any;

      if (apiUserDetails?.deletedAt) {
        throw new Error(messages.error.user.notFound);
      }

      this._userDetails.next(apiUserDetails);

      return apiUserDetails;
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      return null; // Return a value in the catch block
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getAppAccessRequests(userId: string) {
    try {
      this.uiService.setLoader(true);

      const apiAppAccessRequests = await this.gs.tableRecords({
        tableModel: this.client.models.ApplicationAccessRequest,
        filter: {
          requestedBy: {
            eq: userId,
          },
          isDeleted: {
            ne: true,
          },
        },
      });

      await this.getUsers();
      const apiApplications:any= '';
      const apiUsers = this._usersResults.value;

      const accessRequests = apiAppAccessRequests.map((accessRequest: any) => {
        const user = apiUsers.find(
          (user: any) => user.id === accessRequest.requestedBy,
        );
        this._userDetails.next(user);
        const reviewedBy = apiUsers.find(
          (user: any) => user.id === accessRequest?.reviewedBy,
        );
        return {
          ...accessRequest,
          applicationName:
            apiApplications.find(
              (application: any) =>
                application.id === accessRequest.applicationId,
            )?.name || '',
          requestedBy: user ? `${user.firstName} ${user.lastName}` : '',
          reviewedBy: reviewedBy
            ? `${reviewedBy.firstName} ${reviewedBy.lastName}`
            : 'None',
        };
      });

      this._getAppAccessResults.next(accessRequests || []);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async getAppAccessRequestDetails(payload: appAccessRequestDetailsPayload) {
    try {
      this.uiService.setLoader(true);
      const { data: apiAccessRequestDetails } =
        await this.ApplicationAccessRequestModel.get({
          id: payload.id,
        });

      if (!apiAccessRequestDetails?.id || apiAccessRequestDetails?.deletedAt) {
        throw new Error(messages.error.appAccessRequest.notFound);
      }

      if (!this._userDetails.value || this._userDetails.value.length === 0) {
        await this.getUserDetails({ id: apiAccessRequestDetails.requestedBy });
      }
      const apiApplications:any = '';

      const apiUser = this._userDetails.value;

      this._accessRequestDetails.next({
        ...apiAccessRequestDetails,
        applicationName:
          apiApplications.find(
            (application: any) =>
              application.id === apiAccessRequestDetails.applicationId,
          )?.name || '',
        userName: `${apiUser?.firstName} ${apiUser?.lastName}`,
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

  async getAppAccessRequestComments(payload: appAccessRequestCommentsPayload) {
    try {
      this.uiService.setLoader(true);

      const apiAccessRequestComments = await this.gs.tableRecords({
        tableModel: this.client.models.ApplicationAccessRequestComment,
        filter: {
          applicationAccessRequestId: {
            eq: payload.id,
          },
          isDeleted: {
            ne: true,
          },
        },
      });

      if (!this._usersResults.value || this._usersResults.value.length === 0) {
        await this.getUsers();
      }

      const apiUsers = this._usersResults.value;

      const accessRequestsComments: any = apiAccessRequestComments
        .map((accessRequestsComment: any) => {
          const commenter = apiUsers.find(
            (commenter: any) =>
              commenter.id === accessRequestsComment.commentedBy,
          );

          return {
            ...accessRequestsComment,

            commenterFirstName: commenter ? `${commenter.firstName}` : '',
            commenterLastName: commenter ? `${commenter.lastName}` : '',
          };
        })
        .sort((a: any, b: any) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

      this._accessRequestComments.next(accessRequestsComments || []);
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
    } finally {
      this.uiService.setLoader(false);
    }
  }

  async saveMsgRequest(payload: MsgInfoPayload): Promise<Boolean> {
    try {
      this.uiService.setLoader(true);
      await this.ApplicationAccessRequestCommentModel.create({
        applicationAccessRequestId: payload.id,
        type: 'more_info',
        commentedBy: payload.commentBy,
        message: payload.message,
        createdBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
        updatedBy: String(this.userProfileService.getLoggedInUserDetails()?.id),
      });

      this.toastService.fire({
        type: 'success',
        message: messages.success.appAccessRequest.success,
      });
      return true;
    } catch (err: any) {
      this.toastService.fire({
        type: 'error',
        message: err?.message || 'Something went wrong',
      });
      return false;
    } finally {
      this.uiService.setLoader(false);
    }
  }
}
