import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';

@Component({
  selector: 'app-edit-applications',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-edit-applications.component.html',
  styleUrl: './add-edit-applications.component.scss',
})
export class AddEditApplicationsComponent implements OnInit, OnDestroy {
  applicationId: string = '';
  applicationForm: FormGroup;
  applicationName: string = '';
  showErrors = false;
  getApplicationDetailsSubscription: Subscription | undefined;
  ngSelectClass = '';
  activeField = '';

  @ViewChildren('inputElement') inputElements?: QueryList<any>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private uiService: UIService,
  ) {
    this.applicationForm = this.fb.group({
      name: ['', [Validators.required]],
      status: ['', [Validators.required]],
      sortOrder: ['', [Validators.required, Validators.min(0)]],
      logo: ['', [Validators.required]],
      isActive: [true, Validators.required],
      description: ['']
    });
  }

  /**
   * Initializes the component, fetches module details and applications data.
   */

  ngOnInit() {
    this.applicationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.applicationId) {
      this.xAppsAdminGlobalDataService.getApplicationDetails({
        id: this.applicationId,
      });
      this.getApplicationDetailsSubscription =
        this.xAppsAdminGlobalDataService.applicationDetails$.subscribe({
          next: (application) => {
              this.applicationName = application?.application_name || '';
              this.applicationForm.patchValue({
                name: application.application_name,
                logo: application.logo,
                status: application.status,
                sortOrder: application.sort_order,
                isActive: application.is_active,
                description: application.description
              });
          },
        });
    }
  }
  /**
   * Handles form submission for updating a module.
   */

  onSubmit() {
    this.showErrors = true;
    if (this.applicationForm.valid) {
      const applicationData: any = {
        applicationName: this.applicationForm.get('name')?.value,
        status: this.applicationForm.get('status')?.value,
        logo: this.applicationForm.get('logo')?.value,
        sortOrder: this.applicationForm.get('sortOrder')?.value,
        description: this.applicationForm.get('description')?.value || ''
      };

      const apiCall = this.applicationId
        ? this.xAppsAdminGlobalDataService.updateApplication({ ...applicationData, id: this.applicationId, isActive: this.applicationForm.get('isActive')?.value })
        : this.xAppsAdminGlobalDataService.addApplication(applicationData);

      apiCall.then((res: any) => {
          this.applicationForm.reset();
          this.navigateToApplications();
          this.showErrors = false;
      });
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

  /**
   * Navigates to the applications list view.
   */
  navigateToApplications() {
    this.uiService.goBack();
  }

  // Sets the class for the selected field.
  setClassToLabel(field: string){
    this.ngSelectClass = field;
    this.activeField = field;
  }

  // Resets the user list options and clears the active field.
  reinitializeUsersOptions() {
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Removes the class from the selected field label.
  removeClassFromLabel(){
    this.ngSelectClass = '';
  }

  toggleCheckbox(controlName: string) {
    const control = this.applicationForm.get(controlName);
    control?.setValue(!control?.value);
  }

  /**
   * Unsubscribes from observables when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.getApplicationDetailsSubscription) {
      this.getApplicationDetailsSubscription.unsubscribe();
    }
  }
}
