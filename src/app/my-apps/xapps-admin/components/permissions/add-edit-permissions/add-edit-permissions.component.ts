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
import { forkJoin, lastValueFrom, Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';

@Component({
  selector: 'app-edit-permissions',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-edit-permissions.component.html',
  styleUrl: './add-edit-permissions.component.scss',
})
export class AddEditPermissionsComponent implements OnInit, OnDestroy {
  permissionForm: FormGroup;
  permissionId: string = '';
  showErrors = false;
  permissionName: string = '';
  getPermissionDetailsSubscription: Subscription | undefined;
  applications: any[] = [];
  applicationBkp: any[] = [];
  modules: any[] = [];
  moduleBkp: any[] = [];
  submodules: any[] = [];
  submodulesBkp: any[] = [];
  selectedApplicationId: string = '';
  selectedModuleId: string = '';
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
    this.permissionForm = this.fb.group({
      name: ['', Validators.required],
      isActive: [true, Validators.required],
      moduleId: [null, Validators.required],
      submoduleId: [''],
      applicationId: [null, Validators.required],
      description: ['']
    });
  }

  /**
   * Initializes the component, fetches module details and applications data.
   */

  async ngOnInit() {
    this.permissionId = this.route.snapshot.paramMap.get('id') || '';
    this.uiService.setLoader(true);
    this.applications = await this.xAppsAdminGlobalDataService.getApplicationLookup();
    this.applicationBkp = structuredClone(this.applications);
    if (this.permissionId) {

      let res: any = await lastValueFrom(
        forkJoin({
          permissionDetails: this.xAppsAdminGlobalDataService.getPermissionDetails({ id: this.permissionId }),
          applications: this.xAppsAdminGlobalDataService.getApplicationLookup(),
        }),
      );
   
      const { applications, permissionDetails } = res;
      
      this.applications = applications;
      this.applicationBkp = structuredClone(applications);

      res = await lastValueFrom(
        forkJoin({
          modules: this.xAppsAdminGlobalDataService.getModuleLookup(permissionDetails?.app_id),
          submodules: this.xAppsAdminGlobalDataService.getSubmoduleLookup(permissionDetails?.module_id),
        }),
      );

      const { modules, submodules } = res;

      this.modules = modules;
      this.moduleBkp = structuredClone(this.modules)

      this.submodules = submodules;
      this.submodulesBkp = structuredClone(this.submodules)
      
      if (permissionDetails?.permission_name) {
        this.permissionName = permissionDetails?.permission_name;
        this.selectedApplicationId = permissionDetails?.app_id;
        this.selectedModuleId = permissionDetails?.module_id;
        
        this.permissionForm.patchValue({
          name: permissionDetails.permission_name,
          moduleId: permissionDetails?.module_id || '',
          submoduleId: permissionDetails?.sub_module_id || '',
          applicationId: permissionDetails?.app_id || '',
          description: permissionDetails?.description || '',
          isActive: permissionDetails.is_active,
        });
      }

    }
    this.uiService.setLoader(false);

    this.permissionForm.get('applicationId')?.valueChanges.subscribe((applicationId) => {
      if (this.selectedApplicationId != applicationId) {
        this.permissionForm.get('moduleId')?.setValue('');
        this.permissionForm.get('submoduleId')?.setValue('');
        this.getModuleByApplicationId(applicationId);
        this.selectedApplicationId = applicationId;
      }
    });

    this.permissionForm.get('moduleId')?.valueChanges.subscribe((moduleId) => {
      if (this.selectedModuleId != moduleId) {
        this.permissionForm.get('submoduleId')?.setValue('');
        this.getSubmoduleByModuleId(moduleId);
        this.selectedModuleId = moduleId;
      }
    });

  }

  /**
   * Fetches modules for a given application ID or clears modules if ID is empty.
   */
  async getModuleByApplicationId(applicationId: string|number){
    if (applicationId != '') {
      this.modules = await this.xAppsAdminGlobalDataService.getModuleLookup(+applicationId);
      this.moduleBkp = structuredClone(this.modules)
    } else {
      this.modules = this.moduleBkp = this.submodules = this.submodulesBkp = [];
    }
  }

  async getSubmoduleByModuleId(moduleId: string){
    if (moduleId != '') {
      this.submodules = await this.xAppsAdminGlobalDataService.getSubmoduleLookup(+moduleId);
      this.submodulesBkp = structuredClone(this.submodules)

    } else {
      this.submodules = this.submodulesBkp = [];
    }
  }

  /**
   * Handles form submission for updating a module.
   */

  onSubmit() {
    this.showErrors = true;
    if (this.permissionForm.valid) {
      const formValue = this.permissionForm.value;
      const permissionData: any = {
        moduleId: formValue.moduleId,
        permissionName: formValue.name,
        submoduleId: formValue?.submoduleId || null,
        description: formValue?.description
      };

      const apiCall = this.permissionId
        ? this.xAppsAdminGlobalDataService.updatePermission({ ...permissionData, id: this.permissionId, isActive: formValue.isActive })
        : this.xAppsAdminGlobalDataService.addPermisssion(permissionData);

      apiCall.then((res: any) => {
        this.permissionForm.reset();
        this.navigateToPermissions();
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
  navigateToPermissions() {
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

  // Resets the module list options and clears the active field.
  reinitializeModuleOptions() {
    this.modules = this.moduleBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Resets the submodule list options and clears the active field.
  reinitializeSubmoduleOptions() {
    this.submodules = this.submodulesBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Removes the class from the selected field label.
  removeClassFromLabel(){
    this.ngSelectClass = '';
  }

  toggleCheckbox(controlName: string) {
    const control = this.permissionForm.get(controlName);
    control?.setValue(!control?.value);
  }

  /**
   * Unsubscribes from observables when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.getPermissionDetailsSubscription) {
      this.getPermissionDetailsSubscription.unsubscribe();
    }
  }
}
