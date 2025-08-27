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
  selector: 'app-edit-modules',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule],
  templateUrl: './add-edit-modules.component.html',
  styleUrl: './add-edit-modules.component.scss',
})
export class AddEditModulesComponent implements OnInit, OnDestroy {
  moduleForm: FormGroup;
  moduleId: string = '';
  moduleName: string = '';
  showErrors = false;
  getModuleDetailsSubscription: Subscription | undefined;
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
  ) {
    this.moduleForm = this.fb.group({
      name: ['', Validators.required],
      isActive: [true, Validators.required],
      applicationId: [null, Validators.required],
      description: ['']
    });
  }

  /**
   * Initializes the component, fetches module details and applications data.
   */

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('id') || '';
    if(this.moduleId) {
      this.xAppsAdminGlobalDataService.getModuleDetails({ id: this.moduleId });
      this.getModuleDetailsSubscription =
        this.xAppsAdminGlobalDataService.moduleDetails$.subscribe({
          next: async(module) => {
            if (module) {
              this.moduleName = module?.module_name || '';
              this.moduleForm.patchValue({
                name: module?.module_name,
                applicationId: module.app_id,
                isActive: module.is_active,
                description: module?.description || ''
              });
            }
          },
        });
    }
    this.xAppsAdminGlobalDataService.applicationLookup$.subscribe({
      next: (data) => {
        this.applications = data;
        this.applicationBkp = structuredClone(this.applications);
      },
    });
  }
  /**
   * Handles form submission for updating a module.
   */

  onSubmit() {
    this.showErrors = true;
    if (this.moduleForm.valid) {
      const formValue = this.moduleForm.value;
      const moduleData: any = {
        applicationId: formValue.applicationId,
        moduleName: formValue.name,
        description: formValue?.description
      };

      const apiCall = this.moduleId
        ? this.xAppsAdminGlobalDataService.updateModule({ ...moduleData, id: this.moduleId, isActive: formValue.isActive })
        : this.xAppsAdminGlobalDataService.addModule(moduleData);

      apiCall.then((res: any) => {
          this.moduleForm.reset();
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
   * Navigates to the modules list view.
   */
  navigateToModules() {
    this.uiService.goBack();
  }

  // Sets the class for the selected field.
  setClassToLabel(field: string){
    this.ngSelectClass = field;
    this.activeField = field;
  }

  // Resets the user list options and clears the active field.
  reinitializeModuleOptions() {
    this.applications = this.applicationBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Removes the class from the selected field label.
  removeClassFromLabel(){
    this.ngSelectClass = '';
  }

  toggleCheckbox(controlName: string) {
    const control = this.moduleForm.get(controlName);
    control?.setValue(!control?.value);
  }

  /**
   * Unsubscribes from observables when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.getModuleDetailsSubscription) {
      this.getModuleDetailsSubscription.unsubscribe();
    }
  }
}
