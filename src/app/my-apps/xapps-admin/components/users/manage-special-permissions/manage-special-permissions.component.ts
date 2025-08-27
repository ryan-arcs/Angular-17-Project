import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';

interface Application {
  id: string;
  application_name: string;
}

interface Module {
  id: string;
  module_name: string;
}

interface Submodule {
  id: string;
  sub_module_name: string;
}
@Component({
  selector: 'app-manage-permissions',
  templateUrl: './manage-special-permissions.component.html',
  styleUrls: ['./manage-special-permissions.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgbDropdownModule,NgbTooltip],
})
export class ManageSpecialPermissionsComponent implements OnInit, OnDestroy {
  applications: any[] = [];
  modules?: any[] = [];
  submodules?: any[] = [];
  filteredModules?: any[] = [];
  filteredSubmodules?: any[] = [];
  permissions: any[] = [];
  filteredPermissions: any[] = [];
  currentApplicationId: string = '';
  getRolesDetailsSubscriptionByApplicationId: Subscription | undefined;
  getModulesDetailsSubscription: Subscription | undefined;
  getSubmodulesDetailsSubscription: Subscription | undefined;
  getPermissionsDetailsSubscription: Subscription | undefined;
  getUserDetailsSubscription: Subscription | undefined;
  applicationsSubscription: Subscription | undefined;
  searchText = '';
  userDetails: any = {};
  dropdownListSearchText = '';
  isMobileScreen = false;
  userId = '';

  selectedApplication?: Application = {
    id: 'all',
    application_name: 'All',
  };

  selectedModule: Module = {
    id: 'all',
    module_name: 'All',
  };

  selectedSubmodule: Submodule = {
    id: 'all',
    sub_module_name: 'All',
  };

  constructor(
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private uiService: UIService,
    private route: ActivatedRoute
  ) {}

  /**
   * Initialize the component by loading role details, modules, and permissions data.
   */
  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.uiService.setLoader(true);
    const initialApiCalls = {
      applications: this.xAppsAdminGlobalDataService.getApplicationLookup(),
      ...(this.userId && { 
        userDetails: this.xAppsAdminGlobalDataService.getUserDetails({ id: this.userId }),
        permissions: this.xAppsAdminGlobalDataService.getPermissionsByUserId({ userId: this.userId })
      })
    };
    
    forkJoin(initialApiCalls).subscribe({
      next: (results) => {
        this.applications = results?.applications;
        if (this.userId && results.userDetails) {
          this.userDetails = results.userDetails;
          if (results.permissions) {
            this.permissions = results.permissions;
            this.filterPermissions();
          }
        }
        
        this.uiService.setLoader(false);
      },
      error: (error) => {
        this.uiService.setLoader(false);
      }
    });
  }

  async setSelectedApplication(application: Application) {
    this.selectedApplication = application;
    this.selectedModule = {
      id: 'all',
      module_name: 'All',
    };
    this.selectedSubmodule = {
      id: 'all',
      sub_module_name: 'All',
    };
    const applicationId = this.selectedApplication?.id === 'all' ? undefined : parseInt(this.selectedApplication?.id as string);
    this.filterPermissions();
    this.modules = await this.xAppsAdminGlobalDataService.getModuleLookup(applicationId);
  }

  /**
   * Set the selected module and load permissions for the selected module.
   * @param module The module to select.
   */
  async setSelectedModule(module: Module) {
    this.selectedModule = module;
    this.selectedSubmodule = {
      id: 'all',
      sub_module_name: 'All',
    };
    const moduleId = this.selectedModule?.id === 'all' ? undefined : parseInt(this.selectedModule?.id as string);
    this.filterPermissions();
    this.submodules = await this.xAppsAdminGlobalDataService.getSubmoduleLookup(moduleId);
  }

  filterModules() {
    this.filteredModules =
      this.selectedApplication?.id === 'all'
        ? this.modules
        : this.modules?.filter(
            (module) => module.app_id === this.selectedApplication?.id,
          );
  }

  filterSubmodules() {
    this.filteredSubmodules =
      this.selectedModule?.id === 'all'
        ? this.submodules
        : this.submodules?.filter(
            (submodule) => submodule?.module_id === this.selectedModule?.id,
          );
  }

  setSelectedSubmodule(submodule: Submodule) {
    this.selectedSubmodule = submodule;
    this.filterPermissions();
  }

  filterPermissions() {
    let permissions =
      this.permissions?.filter(
        (permission) =>
          !this.searchText ||
          permission?.permission_name?.toLowerCase().includes(this.searchText),
      ) || [];
    if (this.selectedApplication?.id != 'all') {
      permissions =
        permissions?.filter(
          (permission) =>
            permission?.application_id ===
            this.selectedApplication?.id,
        ) || [];
      if (this.selectedModule?.id != 'all') {
        permissions =
          permissions?.filter(
            (permission) => permission?.module_id === this.selectedModule?.id,
          ) || [];
        if (this.selectedSubmodule?.id != 'all') {
          permissions =
            permissions?.filter(
              (permission) =>
                (this.selectedSubmodule?.id === 'sub-na' &&
                  !permission?.sub_module_id) ||
                (this.selectedSubmodule.id !== 'sub-na' &&
                  permission?.sub_module_id === this.selectedSubmodule.id),
            ) || [];
        }
      }
    }
    this.filteredPermissions = permissions;
  }

  getPermissionDisplayName(permission: any) {
    let parentName =
      this.selectedApplication?.id === 'all'
        ? `${permission?.application_name || '-'}/`
        : '';

    if (this.selectedModule?.id === 'all') {
      parentName = `${parentName}${permission?.module_name || '-'}/`;
    }

    if (this.selectedSubmodule?.id === 'all' && permission?.sub_module_name) {
      parentName = `${parentName}${permission?.sub_module_name}`;
    }

    if (parentName.endsWith('/')) {
      parentName = parentName.slice(0, -1);
    }

    if (parentName) {
      parentName = `(${parentName})`;
    }

    return `${permission?.permission_name || '-'} ${parentName}`;
  }

  /**
   * Get unassigned permissions.
   * @returns An array of permissions that are not assigned.
   */

  unassignedPermissions() {
    return this.filteredPermissions.filter((role: any) => !role.is_assigned);
  }

  /**
   * Get assigned permissions.
   * @returns An array of permissions that are assigned.
   */

  assignedPermissions() {
    return this.filteredPermissions.filter((role: any) => role.is_assigned);
  }

  /**
   * Toggle the selection state of a permission.
   * @param selectedPermission The permission to toggle.
   */

  selectPermission(selectedPermission: any) {
    selectedPermission.isSelected = !selectedPermission.isSelected;
    this.syncAllPermissions();
  }

  /**
   * Move selected permissions to assigned or unassigned state.
   * @param is_assigned True to assign the permissions, false to unassign.
   */
  moveSelectedPermissions(is_assigned: boolean) {
    this.filteredPermissions.forEach((item) => {
      if (item.isSelected) {
        item.is_assigned = is_assigned;
        item.isSelected = false;
      }
    });
    this.syncAllPermissions();
  }

  /**
   * Manage the assignment state of a permission.
   * @param selectedPermission The permission to manage.
   * @param assign True to assign the permission, false to unassign.
   */

  managePermission(selectedPermission: any, assign = false) {
    const thisPermission = this.filteredPermissions.find(
      (permission: any) => permission.permission_id === selectedPermission.permission_id,
    );
    if (thisPermission?.permission_id) {
      thisPermission.is_assigned = assign;
      thisPermission.isSelected = false; //case to handle double click
    }
    this.syncAllPermissions();
  }

  /**
   * Assign all permissions.
   */

  assignAllPermissions() {
    this.filteredPermissions.forEach((permission) => {
      permission.isSelected = false;
      permission.is_assigned = true;
    });
    this.syncAllPermissions();
  }

  /**
   * Remove all roles from permissions.
   */

  removeAllPermissions() {
    this.filteredPermissions.forEach((permission) => {
      permission.isSelected = false;
      permission.is_assigned = false;
    });
    this.syncAllPermissions();
  }

  syncAllPermissions() {
    this.permissions = this.permissions.map((permission) => {
      const updatedPermission = this.filteredPermissions?.find(
        (filteredPermission) => filteredPermission.permission_id === permission.permission_id,
      );
      return updatedPermission
        ? { ...permission, ...{ ...updatedPermission, name: permission.permission_name } }
        : permission;
    });
  }
  /**
   * Submit the assigned permissions to the server.
   */

  submitAssignedPermission() {
    const userId = this.userDetails?.id || '';
    this.permissions?.filter((permissions:any) => {
    })?.map((permissions: any) => {
    })
    const assignedSpecialPermissions = this.permissions
      .filter((permission: any) => permission.is_assigned)
      .map((permission: any) => ({
        id: permission.permission_id,
      }));
    this.xAppsAdminGlobalDataService.manageUserPermissions({
      userId,
      assignedSpecialPermissions,
    });
  }

  /**
   * Navigate to the roles list page.
   */

  navigateToUsers() {
    this.uiService.goBack();
  }

  searchPermissions(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterPermissions();
  }

  onDropdownListToggle(isDropDownVisible?: boolean) {
    if (!isDropDownVisible) {
      this.dropdownListSearchText = '';
    }
  }

  searchDropdownList(event: Event) {
    this.dropdownListSearchText = (
      event.target as HTMLInputElement
    ).value.toLowerCase();
  }

  filteredDropdownList(dropdownList?: Array<any>, searchText?: string) {
    return (
      dropdownList
        ?.sort((a: any, b: any) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        })
        ?.filter(
          (item) =>
            !searchText || item?.sub_module_name?.toLowerCase().includes(searchText),
        ) || []
    );
  }

  async refreshManageSpecialPermission() {
    this.uiService.setLoader(true);
    this.permissions = await this.xAppsAdminGlobalDataService.getPermissionsByUserId({ userId: this.userId });
    this.uiService.setLoader(false);
  }

  /**
   * Clean up subscriptions on component destroy.
   */

    @HostListener('window:resize')
    onResize() {
      this.isMobileScreen = window.innerWidth < 768 ? true : false;
    }
  ngOnDestroy(): void {
    this.xAppsAdminGlobalDataService.emptizePermissions();
    this.xAppsAdminGlobalDataService.emptizeRoleDetails();
    this.xAppsAdminGlobalDataService.emptizeApplicationModules();
    this.xAppsAdminGlobalDataService.emptizesubmodules();
    this.getRolesDetailsSubscriptionByApplicationId?.unsubscribe();
    this.getModulesDetailsSubscription?.unsubscribe();
    this.getSubmodulesDetailsSubscription?.unsubscribe();
    this.getPermissionsDetailsSubscription?.unsubscribe();
    this.getUserDetailsSubscription?.unsubscribe();
    this.applicationsSubscription?.unsubscribe();
  }
}
