import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';
import { DuplicateEmailService } from '@app/my-apps/xapps-admin/services/duplicate-email.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-edit-user.component.html',
  styleUrl: './add-edit-user.component.scss',
})
export class AddEditUserComponent implements OnInit, OnDestroy {
  userId: string = '';
  userEditForm: FormGroup;
  userName: string = '';
  showErrors = false;
  getUserDetailsSubscription: Subscription | undefined;
  @ViewChildren('inputElement') inputElements?: QueryList<any>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private uiService: UIService,
    private duplicateEmailService: DuplicateEmailService,
  ) {
    this.userEditForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [
        '',
        [Validators.required, Validators.email],
      ],
      isActive: [true],
      description: ['']
    });
  }
  get email() {
    return this.userEditForm.get('email');
  }

  /**
   * Initializes the component by fetching user details and subscribing to user data updates.
   */
  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.xAppsAdminGlobalDataService.getUserDetails({
        id: this.userId,
      });
      this.userEditForm.get('email')?.disable();
      this.getUserDetailsSubscription =
        this.xAppsAdminGlobalDataService.userDetails$.subscribe({
          next: (user) => {
            if (user.email) {
              this.userName = user?.full_name;
              this.userEditForm.patchValue({
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                isActive: user.is_active,
              });
            }
          },
        });

    }

  }
  /**
   * Navigates to the users list page.
   */
  navigateToUsers() {
    this.uiService.goBack();
  }

  /**
   * Handles form submission, validates the form, and updates user details.
   */
  async onSubmit() {
    this.showErrors = true;
    if (this.userEditForm.valid) {

      const userData: any = {
        firstName: this.userEditForm.get('firstName')?.value,
        lastName: this.userEditForm.get('lastName')?.value,
        email: this.userEditForm.get('email')?.value
      };

      const apiCall = this.userId
        ? await this.xAppsAdminGlobalDataService.updateUser({ ...userData, id: this.userId, isActive: this.userEditForm.get('isActive')?.value })
        : await this.xAppsAdminGlobalDataService.addUser(userData);
  
      this.userEditForm.reset();
      this.navigateToUsers();
      this.showErrors = false;
    } else {
      const firstControl = this.inputElements
        ?.toArray()
        .find((input) =>
          input?.nativeElement?.classList?.value?.includes('ng-invalid') || input?.element?.classList?.value?.includes('ng-invalid'),
        );
  
      if (firstControl) {
        if (firstControl?.nativeElement) {
          firstControl?.nativeElement?.focus();
        } else {
          firstControl?.open();
        }
      }
    }
  }

  toggleCheckbox(controlName: string) {
    const control = this.userEditForm.get(controlName);
    control?.setValue(!control?.value);
  }

  /**
   * Unsubscribes from user details subscription to prevent memory leaks.
   */
  ngOnDestroy() {
    this.getUserDetailsSubscription?.unsubscribe();
  }
}
