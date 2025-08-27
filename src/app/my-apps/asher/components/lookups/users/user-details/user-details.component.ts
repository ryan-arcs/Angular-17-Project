import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UIService } from '@app/common/services/ui.service';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/common/services/auth.service';
import { messages } from 'src/app/my-apps/iapp/constants';
import { ToastService } from '@app/common/services/toast.service';
import { environment } from '@environments/environment';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  userDetails: any = {};
  isInformationPanelExpanded = true;
  copiedField = '';
  defaultDateFormat = environment?.defaultDateFormat || "MMM d, yyyy h:mm:ss a";

  private subscriptions: Subscription = new Subscription();

  constructor(
    public uiService: UIService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private asherGlobalDataService: AsherGlobalDataService,
    private router: Router,
    private toastService: ToastService
  ) {}

  /**
   * Initializes the component by fetching user details and profile images.
   * - Subscribes to route parameters to extract the user's email.
   * - If the email exists, retrieves the user details using `asherGlobalDataService.getUser`.
   * - Fetches and assigns the user's and manager's profile images asynchronously.
   */
  async ngOnInit() {
    this.subscriptions.add(
      this.route.paramMap.subscribe(async params => {
        const userEmail = params.get('email') || '';
        if (userEmail) {
          this.userDetails = await this.asherGlobalDataService.getUser(userEmail);
          this.uiService.getProfileImage(userEmail).then((res) => {
            this.userDetails.userProfileImage = res;
          });

          this.uiService.getProfileImage(this.userDetails?.manager_email).then((res) => {
            this.userDetails.managerProfileImage = res;
          });
        }
      })
    );
  }

  // Navigates to the user details page of the given manager email.
  async navigateManagerDetails(email: string) {
    this.router.navigate([`/asher/users/${email}/user-details`]);
  }

  // Navigates to the users list page if permitted, otherwise to the applications page.
  navigateToUsers() {
    if(this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: 'users',
      permissionSlug: 'list',
      strictMode: true,
      ignoreRedirection: true,
    })){
      this.router.navigate([`/asher/users`]);
    } else {
      this.router.navigate([`/asher/applications`]);
    }
  }

  // Navigates to the previous route using UI service.
  navigateBack() {
    this.uiService.goBack();
  }

  // Returns the UTC string format of a given date.
  getDateDisplay(date: string) {
    if(date) {
      const utcString = new Date(date).toUTCString();
      return utcString;
    }
    return date;
  }

  // Returns a CSS class name based on the employment status.
  getEmploymentStatusClass(status: string) {
    switch (status?.trim()?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'onleave':
        return 'on-leave';
      case 'terminated':
        return 'terminated';
      default:
        return '';
    }
  }

  // Copies the specified field's text to clipboard and shows a success toast.
  copy(field: string, text: string) {
    switch (field) {
      case 'name':
        this.copiedField = 'name';
        break;
      case 'email':
        this.copiedField = 'email';
        break;
      case 'manager_email':
        this.copiedField = 'manager_email';
        break;
      case 'manager_name':
        this.copiedField = 'manager_name';
        break;
      default:
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setTimeout(() => {
        this.copiedField = '';
      }, 4000);
    });

    this.toastService.fire({
      type: 'success',
      message: messages.success.logs.copy,
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from the subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }
}
