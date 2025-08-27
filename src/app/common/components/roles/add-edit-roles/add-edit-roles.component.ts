import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/common/services/auth.service';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';
import { NgSelectModule } from '@ng-select/ng-select';
import { forkJoin, lastValueFrom, Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';

@Component({
  selector: 'app-edit-roles',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-edit-roles.component.html',
  styleUrl: './add-edit-roles.component.scss',
})
export class AddEditRolesComponent implements OnInit, OnDestroy {
  roleForm: FormGroup;
  roleId: string = '';
  roleName: string = '';
  showErrors = false;
  getRolesDetailsSubscription: Subscription | undefined;
  applications: any[] = [];
  applicationBkp: any[] = [];
  ngSelectClass = '';
  activeField = '';

  @ViewChildren('inputElement') inputElements?: QueryList<any>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private uiService: UIService,
    private authService: AuthService
  ) {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      application: [null],
      isActive: [false, Validators.required],
      description: ['']
    });
  }

  /**
   * Initializes the component, fetches module details and applications data.
   */

  async ngOnInit() {
    this.uiService.setLoader(true);
    const apiCalls: any = {
      applications: this.xAppsAdminGlobalDataService.getApplicationLookup(),
    }
    
    this.roleId = this.route.snapshot.paramMap.get('id') || '';
    if(this.roleId){
      apiCalls.roleDetails = this.xAppsAdminGlobalDataService.getRoleDetails({
        id: this.roleId,
      });
    }
    
    const res: any = await lastValueFrom(
      forkJoin(apiCalls)
    );
       
    const { applications } = res;
    
    this.applications = applications;
    this.applicationBkp = structuredClone(applications);

    if (this.roleId) {
      const roleDetails = res.roleDetails;
      const thisApplication = this.route.snapshot.data['application'];
      if(thisApplication && thisApplication !== roleDetails?.application){
        this.authService.performInvalidAccessAction(false);
      }
      this.roleName = roleDetails?.role_name || '';
      this.roleId = roleDetails?.id || '';
      this.roleForm.patchValue({
        name: roleDetails?.role_name,
        application: roleDetails?.app_id,
        description: roleDetails?.description,
        isActive: roleDetails?.is_active,
      });
    }
    this.uiService.setLoader(false);
  }

  /**
   * Handles form submission for updating a module.
   */

  onSubmit() {
    this.showErrors = true;
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      const roleData: any = {
        roleName: formValue.name,
        appId: formValue.application,
        isActive: formValue.isActive,
        description: formValue?.description || ''
      };

      const apiCall = this.roleId
        ? this.xAppsAdminGlobalDataService.updateRole({ ...roleData, id: this.roleId, isActive: formValue.isActive })
        : this.xAppsAdminGlobalDataService.addRole(roleData);

      apiCall.then((res: any) => {
        this.roleForm.reset();
        this.navigateToRoles();
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
   * Navigates to the permissions list view.
   */
  navigateToRoles() {
    this.uiService.goBack();
  }

  // Sets the class for the selected field.
  setClassToLabel(field: string){
    this.ngSelectClass = field;
    this.activeField = field;
  }

  // Resets the user list options and clears the active field.
  reinitializeApplicationOptions() {
    this.applications = this.applicationBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }


  // Removes the class from the selected field label.
  removeClassFromLabel(){
    this.ngSelectClass = '';
  }

  toggleCheckbox(controlName: string) {
    const control = this.roleForm.get(controlName);
    control?.setValue(!control?.value);
  }

  /**
   * Unsubscribes from observables when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.getRolesDetailsSubscription) {
      this.getRolesDetailsSubscription.unsubscribe();
    }
  }
}
