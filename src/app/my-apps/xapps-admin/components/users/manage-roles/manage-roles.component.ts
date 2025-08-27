import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';

interface Application {
  id: string;
  application_name: string;
}

@Component({
  selector: 'app-manage-roles',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbDropdownModule,NgbTooltip],
  templateUrl: './manage-roles.component.html',
  styleUrls: ['./manage-roles.component.scss'],
})
export class ManageRolesComponent implements OnInit, OnDestroy {
  applications: any[] = [];
  roles: any[] = [];
  filteredRoles: any[] = [];
  userId: string = '';
  userDetails: any = [];
  searchText = '';

  selectedApplication?: Application = {
    id: 'all',
    application_name: 'All',
  };
  getUserDetailsSubscription: Subscription | undefined;
  applicationsSubscription: Subscription | undefined;
  getRolesDetailsSubscription: Subscription | undefined;
  isMobileScreen = false;

  constructor(
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private route: ActivatedRoute,
    private uiService: UIService,
  ) {}

  /**
   * Fetches user and application details and subscribes to data streams
   * for user roles and applications.
   */
  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.uiService.setLoader(true);

    const initialApiCalls = {
      applications: this.xAppsAdminGlobalDataService.getApplicationLookup(),
      ...(this.userId && {
        userDetails: this.xAppsAdminGlobalDataService.getUserDetails({
          id: this.userId,
        }),
        manageRoles: this.xAppsAdminGlobalDataService.getRolesByWithAssigned({
          userId: this.userId,
        }),
      }),
    };

    forkJoin(initialApiCalls).subscribe({
      next: (results) => {
        this.applications = results?.applications;
        if (this.userId && results.userDetails) {
          this.userDetails = results.userDetails;
          this.roles = results.manageRoles;
          this.filteredRoles = this.filterForAllApplications();
        }
        this.uiService.setLoader(false);
      },
      error: (error) => {
        this.uiService.setLoader(false);
      },
    });
  }

  setSelectedApplication(application: Application) {
    this.selectedApplication = application;
    this.filterRoles();
  }

  /**
   * Returns a list of roles that are not assigned to the user.
   * @returns Array of unassigned roles.
   */

  unassignedRoles() {
    return this.filteredRoles?.filter((role: any) => !role.is_assigned);
  }

  /**
   * Returns a list of roles that are assigned to the user.
   * @returns Array of assigned roles.
   */

  assignedRoles() {
    return this.filteredRoles?.filter((role: any) => role.is_assigned);
  }

  /**
   * Updates the assignment status of a role.
   * @param selectedRole - The role to be updated.
   * @param assign - Boolean indicating whether to assign or unassign the role.
   */

  manageRole(selectedRole: any, assign = false) {
    const thisRole = this.filteredRoles.find(
      (role: any) => role.id === selectedRole.id,
    );
    if (thisRole?.id) {
      thisRole.is_assigned = assign;
      thisRole.isSelected = false;
    }
    this.syncAllRoles();
  }

  /**
   * Assigns all roles to the user.
   */

  assignAllRoles() {
    this.filteredRoles.forEach((role) => {
      role.is_assigned = true;
      role.isSelected = false;
    });
    this.syncAllRoles();
  }

  /**
   * Removes all role assignments from the user.
   */
  removeAllRoles() {
    this.filteredRoles.forEach((role) => {
      role.is_assigned = false;
      role.isSelected = false;
    });
    this.syncAllRoles();
  }

  /**
   * Navigates to the users list page.
   */
  navigateToUsers() {
    this.uiService.goBack();
  }

  /**
   * Toggles the selection status of a role.
   * @param selectedPermission - The role whose selection status is to be toggled.
   */
  selectRole(selectedPermission: any) {
    selectedPermission.isSelected = !selectedPermission.isSelected;
    this.syncAllRoles();
  }

  /**
   * Updates the assignment status of selected roles.
   * @param is_assigned - Boolean indicating whether to assign or unassign the roles.
   */

  moveSelectedRoles(is_assigned: boolean) {
    this.filteredRoles.forEach((item) => {
      if (item.isSelected) {
        item.is_assigned = is_assigned;
        item.isSelected = false;
      }
    });
    this.syncAllRoles();
  }
  /**
   * Submits the selected roles for the user.
   * @returns A promise that resolves when the roles have been submitted.
   */
  async submitSelectedRoles() {
    const assignedRoles = this.roles
      .filter((role: any) => role.is_assigned)
      .map((role: any) => ({
        id: role.id,
      }));
    const userId = this.userId;
    await this.xAppsAdminGlobalDataService.manageRoles({
      userId: userId,
      assignedRoles: assignedRoles,
    });
  }

  searchRoles(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterRoles();
  }

  filterRoles() {
    if (this.selectedApplication?.id === 'all') {
      this.filteredRoles = this.filterForAllApplications();
    } else {
      this.filteredRoles =
        this.roles?.filter(
          (role) =>
            role.app_id === this.selectedApplication?.id &&
            (!this.searchText ||
              role?.role_name?.toLowerCase().includes(this.searchText)),
        ) || [];
    }
  }

  filterForAllApplications() {
    return this.roles
      ?.filter(
        (role) =>
          !this.searchText ||
          role.role_name.toLowerCase().includes(this.searchText),
      )
      ?.map((role) => {
        return {
          ...role,
          role_name: role?.role_name || '-',
        };
      });
  }

  syncAllRoles() {
    this.roles = this.roles?.map((role) => {
      const updatedRole = this.filteredRoles?.find(
        (filteredRole) => filteredRole.id === role.id,
      );
      return updatedRole
        ? { ...role, ...{ ...updatedRole, role_name: role.role_name } }
        : role;
    });
  }

  async refreshManageRole() {
    this.uiService.setLoader(true);
    this.roles = await this.xAppsAdminGlobalDataService.getRolesByWithAssigned({userId: this.userId});
    this.uiService.setLoader(false);
  }

  /**
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */

  @HostListener('window:resize')
  onResize() {
    this.isMobileScreen = window.innerWidth < 768 ? true : false;
  }

  ngOnDestroy(): void {
    this.xAppsAdminGlobalDataService.emptizeRoleResults();
    this.xAppsAdminGlobalDataService.emptizeUserDetails();
    this.getUserDetailsSubscription?.unsubscribe();
    this.getRolesDetailsSubscription?.unsubscribe();
    this.applicationsSubscription?.unsubscribe();
  }
}
