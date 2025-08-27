import {
  Component,
  inject,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@app/common/services/auth.service';
import { UpdateVendorPayload } from '@app/my-apps/asher/interfaces/global.interface';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';

@Component({
  selector: 'app-add-edit-lifecycles',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './add-edit-vendors.component.html',
  styleUrl: './add-edit-vendors.component.scss',
})

export class AddEditVendorsComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  addVendorForm: FormGroup;
  showErrors = false;
  vendorDetails?: UpdateVendorPayload;

  @Input() vendor_id = null;
  @Input() mode = '';

  subscriptions: Subscription = new Subscription();
  
  @ViewChildren('inputElement') inputElements?: QueryList<any>;

  constructor(
    private fb: FormBuilder,
    private asherGlobalDataService: AsherGlobalDataService,
    private authService: AuthService
  ) {
    this.addVendorForm = this.fb.group({
      vendor_name: ['', [Validators.required, Validators.pattern(/.*\S.*/)]]
    });
  }

  /**
   * Initializes the component by determining whether it's in add or edit mode.
   * - If `vendor_id` is present, sets mode to 'edit' and fetches vendors details to patch the form.
   * - If `vendor_id` is not present, clears any existing vendors details and sets mode to 'add'.
   * - Subscribes to the vendors details observable to keep local data in sync with the global state.
   * - Updates `vendorsDetails` object with the latest data received from the observable.
   *
   * @returns {Promise<void>}
   */
  async ngOnInit() {
    if (this.vendor_id) {
      if(this.mode !== 'details') {
        this.mode = 'edit';
      }
      const response = await this.asherGlobalDataService.getVendorDetails({vendor_id: this.vendor_id});
      this.addVendorForm.patchValue({
        vendor_name: response?.vendor_name || ''
      });
    } else {
      this.asherGlobalDataService.clearVendorDetails();
      this.mode = 'add';
    }

    const vendorDetailSubscription = this.asherGlobalDataService.vendorDetails$.subscribe({
      next: (vendor)=> {
        this.vendorDetails = undefined;
        if(vendor.vendor_id) {
          this.vendorDetails = {
            vendor_id: vendor.vendor_id || null,
            vendor_name: vendor?.vendor_name || ''
          }
        }
      }
    })
    this.subscriptions.add(vendorDetailSubscription);
    
  }

  async editVendor() {
    this.addVendorForm.patchValue({
      vendor_name: this.vendorDetails?.vendor_name || ''
    });
    this.mode = 'edit';
  }

   /**
   * Submits the Vendor form data for creation or update.
   * - Displays form errors if the form is invalid.
   * - If the form is valid, it gathers the form values into an object.
   * - If the `id` exists, it calls `updateVendor`, otherwise it calls `addVendor` to submit the data.
   * - After submission, it navigates to the Vendor details modal.
   * - If the form is invalid, it focuses on the first invalid form control.
   * @returns {void}
   */
  async submitVendor() {
    this.showErrors = true;
    if (this.addVendorForm.valid) {
      let vendor_id = this.vendorDetails?.vendor_id || null;
      const requestBody: any = {
        vendor_name: this.addVendorForm.get('vendor_name')?.value.trim()
      }

      if(this.vendorDetails?.vendor_id){
        await this.asherGlobalDataService
        .updateVendor({
          ...requestBody,
          vendor_id: this.vendorDetails?.vendor_id,
        }); 
      } else {
        const response = await this.asherGlobalDataService
        .addVendor(requestBody);
        if(response?.id){
          vendor_id = response.id;
        }
      }
      if(vendor_id){
        await this.asherGlobalDataService.getVendorDetails({vendor_id});
      }
      this.mode = 'details';
      this.addVendorForm.reset();
      this.showErrors = false;
    } else {
      // Optionally, you can focus on the first invalid field
      
      const firstControl = this.inputElements
        ?.toArray()
        .find((input) =>
          input?.nativeElement?.classList?.value?.includes('ng-invalid') || input?.element?.classList?.value?.includes('ng-invalid'),
        );

      if (firstControl) {
        if(firstControl?.nativeElement){
          firstControl.nativeElement.focus();
        }
        else{ // for ng-select select focus
          firstControl.focus();
        }
      }
    }
  }
  
  // Returns the page title based on the current mode (add/edit).
  getTitle() {
    switch(this.mode){
      case 'add': 
        return 'Add Vendor';

      case 'edit': 
        return 'Edit Vendor';

      default: 
        return 'Vendor';
    }
  }

  // Checks if the user has permission for a specific lifecycle action
  isActionPermitted(action: string = "") {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: 'vendors',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
