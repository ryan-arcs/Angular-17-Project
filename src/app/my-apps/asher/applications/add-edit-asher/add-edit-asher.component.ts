import {
  Component,
  OnInit,
  QueryList,
  Renderer2,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AsherGlobalDataService } from '../../services';
import { UIService } from 'src/app/common/services/ui.service';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AddApplicationPayload, UserDetail } from '../../interfaces/global.interface';
import { CommonModule } from '@angular/common';
import { hostingLocationOptions } from '../../constants/global.constant';

@Component({
  selector: 'app-add-edit-asher',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgSelectModule, NgbTooltipModule, CommonModule],
  templateUrl: './add-edit-asher.component.html',
  styleUrl: './add-edit-asher.component.scss',
})
export class AddEditAsherComponent implements OnInit {
  addApplicationForm: FormGroup;
  asherId: string = '';
  applicationName: string = '';
  showErrors = false;
  bodyClass = 'add-asor-outer';
  @ViewChildren('inputElement') inputElements?: QueryList<any>;
  itListOptions: Array<any> = [];
  itListOptionsBKP: Array<any> = [];
  usersListOptions: Array<any> = [];
  usersListOptionsBKP: Array<any> = [];
  searchTerm$ = new Subject<string>();
  itSearchTerm$ = new Subject<string>();
  vendorSearchTerm$ = new Subject<string>();
  fundingDepartmentSearchTerm$ = new Subject<string>();
  lifecycleSearchTerm$ = new Subject<string>();
  hostingLocationOption = hostingLocationOptions;
  
  isUsersInitialized = false;
  isITUsersInitialized = false;

  ngselectLoaders: { [key: string]: boolean } = {
    system: false,
    businessOwnerId: false,
    it: false,
    approver1: false,
    approver2: false,
    productManagerId: false,
    sponsor: false,
    fundingDepartment: false
  };
  vendors: Array<any> = [];
  vendorsBkp: Array<any> = [];
  fundingDepartments: Array<any> = [];
  fundingDepartmentsBkp: Array<any> = [];
  lifecycles: Array<any> = [];
  lifecycleBkp: Array<any> = [];
  ngSelectClass = '';
  activeField = '';
  asherDetails?: any;

  subscriptions: Subscription = new Subscription();

  hasITOwner: boolean = true;
  selectedSystemUsers: Array<any> = [] ;
  selectedBusinessUsers: Array<any> = []

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private asherGlobalDataService: AsherGlobalDataService,
    private uiService: UIService,
    private renderer: Renderer2,
  ) {
    this.addApplicationForm = this.fb.group({
      applicationName: ['', [Validators.required, Validators.pattern(/.*\S.*/)]],
      systemAlias: [null, [Validators.required, Validators.pattern(/.*\S.*/)]],
      lifecycle: [null, [Validators.required]],
      hostingLocation: [null, [Validators.required]],
      vendor: [null, [Validators.required]],
      description: ['', [Validators.required, Validators.pattern(/.*\S.*/)]],
      businessOwnerId: [null, [Validators.required]],
      systemOwnerId: [null, [Validators.required]],
      productOwnerId: [null],
      productManagerId: [null],
      itContactId: [null,[Validators.required]],
      approver1: [null],
      approver2: [null],
      fundingDepartment: [null],
      version: [''],
      gxp: [false],
      sox: [false],
    });
  }

  
  // Get email from the addAsherForm
  get email() {
    return this.addApplicationForm.get('email');
  }

  /**
   * Initializes the component and fetches necessary data.
   * - Adds a CSS class to the body element to style the page.
   * - Retrieves the ASHER ID from the route and fetches ASHER details if an ID is present.
   * - Subscribes to `asherGlobalDataService.asherDetails$` to handle and populate ASHER details in the form.
   * - Populates user, vendor, lifecyle, and department options using debounced search terms with `switchMap`.
   * - Subscribes to search term observables for users, vendors, and funding departments to update their respective lists.
   * - Resets the form with ASHER details, sets application name, and updates related dropdowns.
   * - Handles the loading and error states for user, vendor, and funding department searches.
   *
   * @returns {Promise<void>} - A promise that resolves once all asynchronous operations (like fetching data) are complete.
   */
  async ngOnInit(): Promise<void> {
    this.renderer.addClass(document.body, this.bodyClass);
    this.asherId = this.route.snapshot.paramMap.get('id') || '';
    if (this.asherId) {
      await this.asherGlobalDataService.getApplicationDetails({id: this.asherId});
      
      const asherDetailsSubscription =
      this.asherGlobalDataService.asherDetails$.subscribe({
        next: async (asher) => {
          if (asher.id) {
            this.asherDetails = asher;
            await this.addUsersInSelectOptions(asher);
            this.addVendorIfNotExists(asher.vendor_id, asher.vendor_name);
            this.addLifecycleIfNotExists(asher.life_cycle, asher.lc_name);
            this.addDepartmentIfNotExists(asher.sponsor, asher.funding_department_name);
            this.applicationName = asher?.app_name || '';

            this.addApplicationForm.patchValue({
              applicationName: asher?.app_name,
              systemAlias: asher?.aliases,
              lifecycle: asher?.life_cycle,
              description: asher?.app_desc,
              productManagerId: asher?.product_manager,
              productOwnerId: asher?.product_owner,
              systemOwnerId: asher?.system_owner,
              itContactId: asher?.it_contact,
              businessOwnerId: asher?.business_owner,
              approver1: asher?.approver1,
              approver2: asher?.approver2,
              hostingLocation: (asher?.hosting_location && asher.hosting_location !== 'Unknown') ? asher.hosting_location : null,
              vendor: asher?.vendor_id,
              version: (asher?.version && asher.version !== 'Unknown') ? asher.version : null,
              gxp: asher?.is_gxp,
              sox: asher?.is_sox,
              fundingDepartment: asher?.sponsor
            });
        }
        },
      });
      this.subscriptions.add(asherDetailsSubscription);
    }
    this.searchTerm$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          if (!searchTerm) {
            return Promise.resolve(this.usersListOptionsBKP || []);
          }
          return this.asherGlobalDataService.getUsersForSelectField({ searchTerm });
        })
      )
      .subscribe({
        next: (users) => {
          this.usersListOptions = users || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        },
        error: (error) => {
          this.usersListOptions = this.usersListOptionsBKP || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        }
      });

      this.itSearchTerm$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          if (!searchTerm) {
            return Promise.resolve(this.itListOptionsBKP || []);
          }
          return this.asherGlobalDataService.getUsersForSelectField({ 
            searchTerm,
            authorityType: 'it' 
          });
        })
      )
      .subscribe({
        next: (users) => {
          this.itListOptions = users || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        },
        error: (error) => {
          this.itListOptions = this.itListOptionsBKP || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        }
      });

    this.vendorSearchTerm$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((vendorSearchTerm) => {
          if (!vendorSearchTerm) {
            return Promise.resolve(this.vendorsBkp || []);
          }
          return this.asherGlobalDataService.getVendors({ searchTerm: vendorSearchTerm });
        })
      )
      .subscribe({
        next: (vendors) => {
          this.vendors = vendors || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        },
        error: (error) => {
          this.vendors = this.vendorsBkp || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        }
      });

    this.fundingDepartmentSearchTerm$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((fundingDepartmentSearchTerm) => {
          if (!fundingDepartmentSearchTerm) {
            return Promise.resolve(this.fundingDepartmentsBkp || []);
          }
          return this.asherGlobalDataService.getDepartments({ searchTerm: fundingDepartmentSearchTerm });
        })
      )
      .subscribe({
        next: (fundingDepartments) => {
          this.fundingDepartments = fundingDepartments || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        },
        error: (error) => {
          this.fundingDepartments = this.fundingDepartmentsBkp || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        }
      });

    this.lifecycleSearchTerm$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((lifecycleSearchTerm) => {
          if (!lifecycleSearchTerm) {
            return Promise.resolve(this.lifecycleBkp || []);
          }
          return this.asherGlobalDataService.getLifecycles({ searchTerm: lifecycleSearchTerm });
        })
      )
      .subscribe({
        next: (lifecycles) => {
          this.lifecycles = lifecycles || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        },
        error: (error) => {
          this.lifecycles = this.lifecycleBkp || [];
          Object.keys(this.ngselectLoaders).forEach(key => {
            this.ngselectLoaders[key] = false;
          });
        }
      });

  }

  // Formats and returns the user's preferred full name in title case, or an empty string if not available.
  formatUserInfo(user: any) {
    return user?.fullname_preferred || '';
  }

  onOwnerChange(event: any, type: string){
    const users =  [ ...this.usersListOptionsBKP, ...this.usersListOptions];
    if(type=='business'){
        this.selectedBusinessUsers = this.selectedBusinessUsers.filter((user: any)=>event.includes(user.id));
        for(let user of users){
            if (event.includes(user.id) && !this.selectedBusinessUsers.some((u: any) => u.id === user.id)) {
            this.selectedBusinessUsers.push(user);
          }
        }
    }
    if(type=='system'){
        this.selectedSystemUsers = this.selectedSystemUsers.filter((user: any)=>event.includes(user.id))
        for(let user of users){
            if (event.includes(user.id) && !this.selectedSystemUsers.some((u: any) => u.id === user.id)) {
            this.selectedSystemUsers.push(user);
          }
        }
    }
    this.checkITContactRequirement();
  }

  checkITContactRequirement() {
    const itContactControl = this.addApplicationForm.get('itContactId');
    const selectedSystemAndBusinessUser = [...this.selectedBusinessUsers, ...this.selectedSystemUsers]
    if(!selectedSystemAndBusinessUser.length){
      this.hasITOwner = false;
      return ;
    }

    this.hasITOwner = selectedSystemAndBusinessUser?.some((user: any) => user?.costcenter_code === '10070');
    if(!this.hasITOwner){
      itContactControl?.setValidators([Validators.required]);
    }
    else{
      itContactControl?.clearValidators();
    }
    itContactControl?.updateValueAndValidity();
  }

 /**
   * Submits the ASHER form data for creation or update.
   * - Displays form errors if the form is invalid.
   * - If the form is valid, it gathers the form values into an object.
   * - If the `asherId` exists, it calls `updateAsher`, otherwise it calls `addAsher` to submit the data.
   * - After submission, it navigates to the application details page and resets the form.
   * - If the form is invalid, it focuses on the first invalid form control.
   *
   * @returns {void}
   */


  submitAsher() {
    this.showErrors = true;
    this.checkITContactRequirement()
    
    if (this.addApplicationForm.valid) {
      const asherData: AddApplicationPayload = {
        app_name: this.addApplicationForm.get('applicationName')?.value.toString().trim(),
        business_owner: this.addApplicationForm.get('businessOwnerId')?.value || [],
        system_owner: this.addApplicationForm.get('systemOwnerId')?.value || [],
        product_owner: this.addApplicationForm.get('productOwnerId')?.value || [],
        product_manager: this.addApplicationForm.get('productManagerId')?.value || [],
        it_contact: this.addApplicationForm.get('itContactId')?.value || [],
        life_cycle: this.addApplicationForm.get('lifecycle')?.value,
        aliases: this.addApplicationForm.get('systemAlias')?.value?.toString().trim(),
        hosting_location: this.addApplicationForm.get('hostingLocation')?.value,
        vendor_id: this.addApplicationForm.get('vendor')?.value,
        sponsor: this.addApplicationForm.get('fundingDepartment')?.value,
        version: this.addApplicationForm.get('version')?.value?.toString().trim(),
        app_desc: this.addApplicationForm.get('description')?.value.toString().trim(),
        approver1: this.addApplicationForm.get('approver1')?.value,
        is_gxp: this.addApplicationForm.get('gxp')?.value,
        is_sox: this.addApplicationForm.get('sox')?.value,
      };
  
      const apiCall = this.asherId 
        ? this.asherGlobalDataService.updateApplication({ ...asherData, id: parseInt(this.asherId) })
        : this.asherGlobalDataService.addApplication(asherData);
          
      apiCall.then((res: any) => {
        if(!res || !res?.id) return ;
        this.router.navigate([`/asher/applications/${this.asherId || res.id}/application-details`]);
        this.addApplicationForm.reset();
        this.showErrors = false;
      })
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


  // Initializes vendors data if it hasn't been loaded or is empty, and sets loading state.
  async intitializeVendors(loader: string) {
    try {
      if(this.vendors?.length <= 1){
        this.ngselectLoaders[loader] = true;
        this.vendors = await this.asherGlobalDataService.getVendors();
        this.vendorsBkp = structuredClone(this.vendors);
      }
    } catch (error) {
      this.vendors = [];
      this.vendorsBkp = [];
    } finally {
      this.ngselectLoaders[loader] = false;
    }
  }

  // Initializes departments data if it hasn't been loaded or is empty, and sets loading state.
  async intitializeDepartments(loader: string) {
    try {
      if(this.fundingDepartments?.length <= 1){
        this.ngselectLoaders[loader] = true;
        this.fundingDepartments = await this.asherGlobalDataService.getDepartments();
        this.fundingDepartmentsBkp = structuredClone(this.fundingDepartments);
      }
    } catch (error) {
      this.fundingDepartments = [];
      this.fundingDepartmentsBkp = [];
    } finally {
      this.ngselectLoaders[loader] = false;
    }
  }

  // Initializes lifecycle data if it hasn't been loaded or is empty, and sets loading state.
  async intitializeLifecycles(loader: string) {
    try {
      if(this.lifecycles?.length <= 1){
        this.ngselectLoaders[loader] = true;
        this.lifecycles = await this.asherGlobalDataService.getLifecycles();
        this.lifecycleBkp = structuredClone(this.lifecycles);
      }
    } catch (error) {
      this.lifecycles = [];
      this.lifecycleBkp = [];
    } finally {
      this.ngselectLoaders[loader] = false;
    }
  }

  // Sets the loader state for a specific field.
  setLoader(fieldName: string) {
    this.ngselectLoaders[fieldName] = true;
  }

  // Resets the user list options and clears the active field.
  reinitializeUsersOptions() {
    this.usersListOptions = this.usersListOptionsBKP;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Resets the it list options and clears the active field.
  reinitializeITUsersOptions() {
    this.itListOptions = this.itListOptionsBKP;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Resets the vendors list and clears the active field.
  reinitializeVendors() {
    this.vendors = this.vendorsBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Resets the departments list and clears the active field.
  reinitializeDepartments() {
    this.fundingDepartments = this.fundingDepartmentsBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Resets the lifecycles list and clears the active field.
  reinitializeLifecyles() {
    this.lifecycles = this.lifecycleBkp;
    this.ngSelectClass = '';
    this.activeField = '';
  }

  // Initializes users data if it hasn't been loaded or is empty, and sets loading state.
  async intitializeUsers(loader: string){
    try {
      if(!this.isUsersInitialized){
        this.isUsersInitialized = true;
        this.ngselectLoaders[loader] = true;
        
        const users = await this.asherGlobalDataService.getUsersForSelectField({
          authorityType: loader === 'it' ? loader : undefined
        });
        this.usersListOptions = users || [];
        this.usersListOptionsBKP = structuredClone(this.usersListOptions);
      }
    } catch (error) {
      this.usersListOptions = [];
      this.usersListOptionsBKP = [];
    } finally {
      this.ngselectLoaders[loader] = false;
    }
  }

  // Initializes itcontact data if it hasn't been loaded or is empty, and sets loading state.
  async intitializeITUsers(loader: string){
    try {
      if(!this.isITUsersInitialized){
        this.isITUsersInitialized = true;
        this.ngselectLoaders[loader] = true;
        
        const users = await this.asherGlobalDataService.getUsersForSelectField({
          authorityType: loader === 'it' ? loader : undefined
        });
        this.itListOptions = users || [];
        this.itListOptionsBKP = structuredClone(this.itListOptions);
      }
    } catch (error) {
      this.itListOptions = [];
      this.itListOptionsBKP = [];
    } finally {
      this.ngselectLoaders[loader] = false;
    }
  }

  // Adds users from the ASHER details to the select options, if they don't already exist
  async addUsersInSelectOptions(asher: any){
    asher?.business_owners?.forEach((element:UserDetail) => {
      this.addUserIfNotExists(element.id, element.fullname_preferred, element.email);
      this.selectedBusinessUsers.push(element);
    });
    asher?.system_owners?.forEach((element:UserDetail) => {
      this.addUserIfNotExists(element.id, element.fullname_preferred, element.email);
      this.selectedSystemUsers.push(element);
    });
    asher?.it_contacts?.forEach((element:UserDetail) => {
      this.addITContactIfNotExists(element.id, element.fullname_preferred, element.email)
    });
    asher?.product_managers?.forEach((element:UserDetail) => {
      this.addUserIfNotExists(element.id, element.fullname_preferred, element.email)
    });
    asher?.product_owners?.forEach((element:UserDetail) => {
      this.addUserIfNotExists(element.id, element.fullname_preferred, element.email)
    });
    this.addUserIfNotExists(asher.approver1, asher.approver1_preferred_name, asher.approver1_email);
    this.addUserIfNotExists(asher.approver2, asher.approver2_preferred_name, asher.approver2_email);
  }

  // Adds a user to the user list options if they don't already exist.
  addUserIfNotExists(id: any, fullname: string, email?: string){
    if (id && !this.usersListOptions.some(user => user.id === id)) {
      this.usersListOptions.push({ id, fullname_preferred: fullname, email });
    }
  };

  // Adds a user to the user list options if they don't already exist.
  addITContactIfNotExists(id: any, fullname: string, email?: string){
    if (id && !this.itListOptions.some(user => user.id === id)) {
      this.itListOptions.push({ id, fullname_preferred: fullname, email });
    }
  };
  
  // Adds a department to the funding departments list if it doesn't already exist.
  addDepartmentIfNotExists(costcenterCode: number, name: string){
    if (costcenterCode && !this.fundingDepartments.some(department => department.costcenterCode === costcenterCode)) {
      this.fundingDepartments.push({ costcenterCode, name });
    }
  };

  // Adds a vendor to the vendors list if it doesn't already exist.
  addVendorIfNotExists(id: any, name: string){
    if (id && !this.vendors.some(vendor => vendor.id === id)) {
      this.vendors.push({ id, name });
    }
  };

  // Adds a lifecycle to the lifecycles list if it doesn't already exist.
  addLifecycleIfNotExists(code: any, name: string){
    if (code && !this.lifecycles.some(lifecycle => lifecycle.code === code)) {
      this.lifecycles.push({ code, name });
    }
  };
  
  // Navigates back to the previous ASHER page.
  navigateToAsher() {
    this.uiService.goBack();
  }

  // Sets the class for the selected field.
  setClassToLabel(field: string){
    this.ngSelectClass = field;
    this.activeField = field;
  }

  // Removes the class from the selected field label.
  removeClassFromLabel(){
    this.ngSelectClass = '';
  }

  // Sets the default value for the system alias in the ASHER form.
  setDefaultValueAsNa(fieldName: string){
    switch (fieldName) {
      case 'version':
        this.addApplicationForm.patchValue({
          version: "NA"
        });
        break;

      case 'systemAlias':
        this.addApplicationForm.patchValue({
          systemAlias: "NA"
        });
        break;
    }
  }

  // Sets the default value for the system alias in the ASHER form.
  setDefaultValueInVersion(){
    this.addApplicationForm.patchValue({
      version: "NA"
    });
  }
  
  toggleCheckbox(controlName: string) {
    const control = this.addApplicationForm.get(controlName);
    control?.setValue(!control?.value);
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.renderer.removeClass(document.body, this.bodyClass);
  }
}
