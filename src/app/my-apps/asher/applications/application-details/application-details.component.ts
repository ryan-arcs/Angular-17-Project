import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { AsherGlobalDataService } from '../../services';
import { UIService } from '@app/common/services/ui.service';
import { messages } from 'src/app/my-apps/iapp/constants';
import { AuthService } from '@app/common/services/auth.service';
import { ToastService } from '@app/common/services/toast.service';
import { environment } from '@environments/environment';
import { hostingLocationOptions } from '../../constants/global.constant';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddEditVendorsComponent } from '../../components/lookups/vendors/add-edit-vendors/add-edit-vendors.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterLinkActive],
  templateUrl: './application-details.component.html',
  styleUrl: './application-details.component.scss',
})
export class ApplicationDetailsComponent implements OnInit, OnDestroy {
  applicationDetails: any = {};
  isInformationPanelExpanded = true;
  isTextCopied = false;
  defaultDateFormat = environment?.defaultDateFormat || "MMM d, yyyy h:mm:ss a";

  constructor(
    public uiService: UIService,
    private route: ActivatedRoute,
    private asherGlobalDataService: AsherGlobalDataService,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private modalService: NgbModal
  ) { }

  /**
   * Initializes the component by fetching the ASHER application details based on the application ID from the route.
   * - Retrieves the application details using `asherGlobalDataService.getAsherDetails()`.
   * - Iterates over various owner and contact groups (business owners, system owners, product owners, etc.)
   *   to fetch their profile images asynchronously and attaches them to the respective owner.
   * - Retrieves and assigns the profile images for `approver1` and `approver2` to the application details.
   */
  async ngOnInit() {
    let applicationId = this.route.snapshot.paramMap.get('id') || '';
    this.applicationDetails = await this.asherGlobalDataService.getApplicationDetails({id: applicationId});

    const thisHostingLocation = hostingLocationOptions.find((option) => option.code === this.applicationDetails?.hosting_location);
    if (thisHostingLocation?.option) {
      this.applicationDetails.hosting_location = thisHostingLocation.option;
    }
    
    this.applicationDetails?.business_owners?.forEach((owner: any) => {
      this.uiService.getProfileImage(owner.email).then((res) => {
        owner.profileImage = res;
      });
    });
    this.applicationDetails?.system_owners?.forEach((owner: any) => {
      this.uiService.getProfileImage(owner.email).then((res) => {
        owner.profileImage = res;
      });
    });
    this.applicationDetails?.product_owners?.forEach((owner: any) => {
      this.uiService.getProfileImage(owner.email).then((res) => {
        owner.profileImage = res;
      });
    });
    this.applicationDetails?.it_contacts?.forEach((owner: any) => {
      this.uiService.getProfileImage(owner.email).then((res) => {
        owner.profileImage = res;
      });
    });

    this.applicationDetails?.product_managers?.forEach((owner: any) => {
      this.uiService.getProfileImage(owner.email).then((res) => {
        owner.profileImage = res;
      });
    });


    this.uiService.getProfileImage(this.applicationDetails?.approver1_email).then((res) => {
      this.applicationDetails.approver1ProfileImage = res;
    });
    this.uiService.getProfileImage(this.applicationDetails?.approver2_email).then((res) => {
      this.applicationDetails.approver2ProfileImage = res;
    });
  }

  // Navigates to the ASHER applications list page.
  navigateToAsherList() {
    this.router.navigate(['/asher/applications']);
  }
  
  // Navigates back to the previous page using the UI service.
  navigateBack() {
    this.uiService.goBack();
  }

  // Navigates to the ASHER application edit page with the provided ID.
  navigateToAsherEdit(id: string | number) {
    this.router.navigate([`/asher/applications/${id}/edit`]);
  }

  // Checks if the user has permission for a specific action on the ASHER applications.
  hasPermission(action: string, moduleSlug= "") {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: moduleSlug,
      permissionSlug: action,
      ignoreRedirection: true,
    })
  }

  // Copies the provided text to the clipboard and shows a success message.
  copyText(text: string) {

    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      this.isTextCopied = true;
      setTimeout(() => {
        this.isTextCopied = false;
      }, 2000);
    })

    this.toastService.fire({
      type: 'success',
      message: messages.success.logs.copy,
    });

  }

  // Navigates to the user details page for the provided email, if the user has permission.
  navigateToUserDetails(email?: string){
    if(!email){
      return;
    }

    if(this.hasPermission('details', 'users')){
      this.router.navigate([`/asher/users/${email}/user-details`]);
    }
  }

   // Navigates to vendor details modal if user has permission
  goToVendor(id: number) {
    if(!this.hasPermission("details", "vendors")){
      return;
    }
    const modalRef = this.modalService.open(AddEditVendorsComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static',
    });
    modalRef.componentInstance.vendor_id = id;
    modalRef.componentInstance.mode = 'details';
  }

  ngOnDestroy(): void { }
}
