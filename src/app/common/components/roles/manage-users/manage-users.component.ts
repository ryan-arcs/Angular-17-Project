import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { UIService } from 'src/app/common/services/ui.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/common/services/auth.service';
import { XAppsAdminGlobalDataService } from '@app/my-apps/xapps-admin/services';

interface Application {
  id: string;
  application_name: string;
}

interface departmentState { 
  cost_center_code: string;
  cost_center_description: string;
}

interface ManagerState { 
  manager_name: string;
  worker_id: string; 
  searchable?: string;
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
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgbDropdownModule,NgbTooltip, ReactiveFormsModule],
})
export class ManageUsersComponent implements OnInit, OnDestroy {
  users: any[] = [];
  filteredUsers: any[] = [];
  roleId: string = '';
  roleDetails: any = {};
  currentApplicationId: string = '';
  getRolesDetailsSubscriptionByApplicationId: Subscription | undefined;
  getModulesDetailsSubscription: Subscription | undefined;
  getSubmodulesDetailsSubscription: Subscription | undefined;
  getApplicationsDetailsSubscription: Subscription | undefined;
  getUsersDetailsSubscription: Subscription | undefined;
  searchText = '';
  filteredModules?: any[] = [];
  filteredSubmodules?: any[] = [];
  filteredDepartment = new Map<string, departmentState>();
  filteredManager = new Map<string, ManagerState>();
  departmentListSearchText: string  = "";
  managerListSearchText: string = "";
  isMobileScreen = false;

  selectedManager: ManagerState = {
    manager_name: 'All',
    worker_id: 'All'
  }

  selectedDepartment: departmentState = {
    cost_center_code: 'All',
    cost_center_description: 'All'
  };

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

  dropdownListSearchText = '';

  constructor(
    private xAppsAdminGlobalDataService: XAppsAdminGlobalDataService,
    private uiService: UIService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  /**
   * Initialize the component by loading role details, modules, and users data.
   */
  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id') || '';
    this.uiService.setLoader(true);
    const initialApiCalls = {
        roleDetails: this.xAppsAdminGlobalDataService.getRoleDetails({ id: this.roleId }),
        usersByRoleId: this.xAppsAdminGlobalDataService.getUsersByRoleId({ roleId: this.roleId })
    };

    forkJoin(initialApiCalls).subscribe({
      next: (results) => {
        if (results?.roleDetails) {
          const role = results.roleDetails;
          const thisApplication = this.route.snapshot.data['application'];

          if (thisApplication && thisApplication !== role.app_slug) {
            this.authService.performInvalidAccessAction(false);
          }

          this.roleDetails = role;

          if (this.roleDetails?.id) {
            this.roleId = this.roleDetails?.id;
            if (results.usersByRoleId) {
              this.getFilterUsers(results?.usersByRoleId);
            }
          }
        }
        this.uiService.setLoader(false);
      },
      error: (error) => {
        this.uiService.setLoader(false);
      }
    });
  }

  setDepartment(item: departmentState){
    this.selectedDepartment = item;
    this.filterUsers();
  }

  setManager(item: any){
    this.selectedManager = item;
    this.filterUsers();
  }

  get filteredDepartmentArray() {
    return Array.from(this.filteredDepartment.values()).sort((a, b) => a.cost_center_description.localeCompare(b.cost_center_description));
  }

  get filteredManagerArray(){
    return Array.from(this.filteredManager.values()).sort((a, b) => a.manager_name.localeCompare(b.manager_name));
  }

  getFilterUsers(results: any) {
    this.users = results?.map((user: any) => {
      if (user?.cost_center_code) {
        this.filteredDepartment.set(user?.cost_center_code, {
          cost_center_code: user?.cost_center_code,
          cost_center_description: user?.cost_center_description,
        });
      }
      if (user?.employee_type?.toLowerCase() === "regular" && user?.empl_status?.toLowerCase() !== "terminated") {
        this.filteredManager.set(user.worker_id, {
          manager_name: user.full_name,
          worker_id: user.worker_id,
          searchable: `${user.first_name} ${user.last_name} (${user.email})`,
        });
      }
      return {
        ...user,
        displayName: `${user.first_name} ${user.last_name} (${user.email})`
      };
    })?.sort((a: any, b: any) => a.displayName.localeCompare(b.displayName)) || [];
    this.filterUsers();
  }

  searchDepartmentList(event: any){
    this.departmentListSearchText = (event.target as HTMLInputElement).value.toLowerCase();
  }

  searchManagerList(event: any){
    this.managerListSearchText = (event.target as HTMLInputElement).value.toLowerCase();
  }
  
  getDepartmentFilterList(departments: any, searchText: string){
    return departments.filter((item: any)=>!searchText || (item?.cost_center_code?.toLowerCase().includes(searchText)||item?.cost_center_description?.toLowerCase().includes(searchText)))
  }

  getManagerFilterList(managers: any, searchText: string){
    return managers.filter((item: any)=>
      !searchText || 
      item?.searchable?.toLowerCase().includes(searchText)
    )
  }


  filterUsers() {
    this.filteredUsers = this.users?.filter(user => {
      const matchesSearch = !this.searchText || user?.displayName?.toLowerCase().includes(this.searchText);
      const matchesDepartment = this.selectedDepartment?.cost_center_code === 'All' || this.selectedDepartment?.cost_center_code === user?.cost_center_code;
      const matchesManager = this.selectedManager?.worker_id === 'All' || (this.selectedManager?.worker_id === user?.manager_worker_id);
      return (user.is_assigned || user?.empl_status?.toLowerCase() != 'terminated') && matchesSearch && matchesDepartment && matchesManager;
    });
  }

  getUserDisplayName(user: any) {
    let parentName =
      this.selectedApplication?.id === 'all'
        ? `${user?.module?.application?.name || '-'}/`
        : '';

    if (this.selectedModule?.id === 'all') {
      parentName = `${parentName}${user?.module?.name || '-'}/`;
    }

    if (this.selectedSubmodule?.id === 'all' && user?.submodule?.name) {
      parentName = `${parentName}${user?.submodule?.name}`;
    }

    if (parentName.endsWith('/')) {
      parentName = parentName.slice(0, -1);
    }

    if (parentName) {
      parentName = `(${parentName})`;
    }

    return `${user?.name || '-'} ${parentName}`;
  }

  /**
   * Get unassigned users.
   * @returns An array of users that are not assigned.
   */

  unassignedUsers() {
    return this.filteredUsers.filter((role: any) => !role.is_assigned );
  }

  /**
   * Get assigned users.
   * @returns An array of users that are assigned.
   */

  assignedUsers() {
    return this.filteredUsers.filter((role: any) => role.is_assigned);
  }

  /**
   * Toggle the selection state of a user.
   * @param selectedUser The user to toggle.
   */

  selectUser(selectedUser: any) {
    selectedUser.isSelected = !selectedUser.isSelected;
    this.syncAllUsers();
  }

  /**
   * Move selected users to assigned or unassigned state.
   * @param is_assigned True to assign the users, false to unassign.
   */
  moveSelectedUsers(is_assigned: boolean) {
    this.filteredUsers.forEach((item) => {
      if (item.isSelected) {
        item.is_assigned = is_assigned;
        item.isSelected = false;
      }
    });
    this.syncAllUsers();
  }

  /**
   * Manage the assignment state of a user.
   * @param selectedUser The user to manage.
   * @param assign True to assign the user, false to unassign.
   */

  manageUser(selectedUser: any, assign = false) {
    const thisUser = this.filteredUsers.find(
      (user: any) => user.user_id === selectedUser.user_id,
    );
    if (thisUser?.user_id) {
      thisUser.is_assigned = assign;
      thisUser.isSelected = false; //case to handle double click
    }
    this.syncAllUsers();
  }

  /**
   * Assign all users.
   */

  assignAllUsers() {
    this.filteredUsers.forEach((user) => {
      user.isSelected = false;
      user.is_assigned = true;
    });
    this.syncAllUsers();
  }

  /**
   * Remove all roles from users.
   */

  removeAllUsers() {
    this.filteredUsers.forEach((user) => {
      user.isSelected = false;
      user.is_assigned = false;
    });
    this.syncAllUsers();
  }

  syncAllUsers() {
    this.users = this.users.map((user) => {
      const updatedUser = this.filteredUsers?.find(
        (filteredUser) => filteredUser.user_id === user.user_id,
      );
      return updatedUser
        ? { ...user, ...{ ...updatedUser, name: user.name } }
        : user;
    });
  }
  /**
   * Submit the assigned users to the server.
   */

  submitAssignedUser() {
    const roleId = this.roleId;
    const assignedUsers = this.users
    .filter((user: any) => user.is_assigned)
    .map((user: any) => ({
      id: user.user_id
    }));
    this.xAppsAdminGlobalDataService.manageRoleUsers({
      roleId,
      assignedUsers,
    });
  }

  /**
   * Navigate to the roles list page.
   */

  navigateToRoles() {
    this.uiService.goBack();
  }

  searchUsers(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterUsers();
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
            !searchText || item?.name?.toLowerCase().includes(searchText),
        ) || []
    );
  }

  async refreshManageUser() {
    this.uiService.setLoader(true);
    const results = await this.xAppsAdminGlobalDataService.getUsersByRoleId({ roleId: this.roleId });
    this.getFilterUsers(results);
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
    // this.xAppsAdminGlobalDataService.emptizeUsers();
    this.xAppsAdminGlobalDataService.emptizeRoleDetails();
    this.xAppsAdminGlobalDataService.emptizesubmodules();
    this.getRolesDetailsSubscriptionByApplicationId?.unsubscribe();
    this.getModulesDetailsSubscription?.unsubscribe();
    this.getSubmodulesDetailsSubscription?.unsubscribe();
    this.getApplicationsDetailsSubscription?.unsubscribe();
    this.getUsersDetailsSubscription?.unsubscribe();
  }
}