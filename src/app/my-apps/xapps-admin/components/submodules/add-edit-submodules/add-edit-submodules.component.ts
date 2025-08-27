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
  selector: 'app-edit-submodules',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-edit-submodules.component.html',
  styleUrl: './add-edit-submodules.component.scss',
})
export class AddEditSubmodulesComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  submoduleForm: FormGroup;
  submoduleId: string = '';
  submoduleName: string = '';
  showErrors = false;
  getSubmoduleDetailsSubscription: Subscription | undefined;
  applications: any[] = [];
  applicationBkp: any[] = [];
  modules: any[] = [];
  moduleBkp: any[] = [];
  selectedApplicationId: string = '';
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
    this.submoduleForm = this.fb.group({
      name: ['', Validators.required],
      isActive: [true, Validators.required],
      applicationId: [null, Validators.required],
      moduleId: [null, Validators.required],
      description: ['']
    });
  }

  /**
   * Initializes the component, fetches module details and applications data.
   */

  async ngOnInit() {
    this.submoduleId = this.route.snapshot.paramMap.get('id') || '';
    this.applications = await this.xAppsAdminGlobalDataService.getApplicationLookup();
    this.applicationBkp = structuredClone(this.applications);
    if (this.submoduleId) {
      this.uiService.setLoader(true);
      const submodulesDetails: any = await this.xAppsAdminGlobalDataService.getSubmoduleDetails({ id: this.submoduleId });
      this.modules = await this.xAppsAdminGlobalDataService.getModuleLookup(submodulesDetails?.app_id)
      this.moduleBkp = structuredClone(this.modules)

      if (submodulesDetails?.sub_module_name) {
        this.selectedApplicationId = submodulesDetails.app_id;
        this.submoduleName = submodulesDetails?.sub_module_name || '';
        this.submoduleForm.patchValue({
            name: submodulesDetails.sub_module_name,
            applicationId: submodulesDetails.app_id,
            moduleId: submodulesDetails.module_id,
            isActive: submodulesDetails.is_active,
            description: submodulesDetails.description 
        });
      }
      this.uiService.setLoader(false);
    }

    this.submoduleForm.get('applicationId')?.valueChanges.subscribe((applicationId) => {
      if (this.selectedApplicationId != applicationId) {
        this.submoduleForm.get('moduleId')?.setValue('');
        this.getModuleByApplicationId(applicationId);
        this.selectedApplicationId = applicationId;
      }
    });
  }
  /**
   * Handles form submission for updating a module.
   */

  onSubmit() {
    this.showErrors = true;
    if (this.submoduleForm.valid) {
      const formValue = this.submoduleForm.value;
      const subModuleData: any = {
        moduleId: formValue.moduleId,
        subModuleName: formValue.name,
        description: formValue?.description,
      };

      const apiCall = this.submoduleId
        ? this.xAppsAdminGlobalDataService.updateSubmodule({ ...subModuleData, id: this.submoduleId, isActive: formValue.isActive })
        : this.xAppsAdminGlobalDataService.addSubmodule(subModuleData);

      apiCall.then((res: any) => {
        this.submoduleForm.reset();
        this.navigateToModules();
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
  navigateToModules() {
    this.uiService.goBack();
  }

  async getModuleByApplicationId(applicationId: string): Promise<void> {
    if (applicationId != '') {
      this.modules =  await this.xAppsAdminGlobalDataService.getModuleLookup(+applicationId);
      this.moduleBkp = structuredClone(this.modules);
    } else {
      this.modules = [];
      this.moduleBkp = [];
    }
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

  // Removes the class from the selected field label.
  removeClassFromLabel(){
    this.ngSelectClass = '';
  }

  toggleCheckbox(controlName: string) {
    const control = this.submoduleForm.get(controlName);
    control?.setValue(!control?.value);
  }

  /**
   * Unsubscribes from observables when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.getSubmoduleDetailsSubscription) {
      this.getSubmoduleDetailsSubscription.unsubscribe();
    }
    this.subscriptions.unsubscribe();
  }
}
function forkJoin(arg0: { permissionDetails: Promise<any>; applications: Promise<any>; }): import("rxjs").Observable<unknown> {
  throw new Error('Function not implemented.');
}

