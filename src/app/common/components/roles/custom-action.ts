import {
  Component,
  ElementRef,
  Renderer2,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/common/services/auth.service';

@Component({
  selector: 'role-actions',
  standalone: true,
  template: `
    <div class="dropdown ag-grid-more-outer">
      <button
        type="button"
        class="circul-btn small grid-more-btn"
        (click)="toggleDropdown($event); $event.stopPropagation()"
      >
        <span class="material-symbols-rounded">more_horiz</span>
      </button>
    </div>
  `,
})
export class CustomButtonComponent implements OnDestroy
{
  isStarted: boolean = false;
  isUndeployed: boolean = false;
  isAdmin!: boolean;
  dropdownMenu!: HTMLElement;
  onCellClicked: any;
  params: any;
  content: string = '';

  static currentlyOpenDropdown: HTMLElement | null = null;
  suppressedActions: Array<string> = [];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  agInit(params: any): void {
    this.suppressedActions = this.route.snapshot.data['suppressedActions'] || [];
    
    this.params = params;
    this.isStarted = params.data.status === 'STARTED';
    this.isUndeployed = params.data.status === 'UNDEPLOYED';
    this.isAdmin = params.isAdmin;
    this.onCellClicked = params.onCellClicked;

    if (
      !this.isActionSuppressed('manage_permissions')
      &&
      this.authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'manage_permissions',
        ignoreRedirection: true,
      })
    ) {
      this.content += `<div class='action-tool' data-action="manage-permissions">
      <i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-gear" title="Manage Permissions" data-action="manage-permissions"></i> 
      Manage Permissions</div>
      `;
    }

    if (
      !this.isActionSuppressed('manage_users')
      &&
      this.authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'manage_users',
        ignoreRedirection: true,
      })
    ) {
      this.content += `<div class='action-tool' data-action="manage-users">
      <i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-user" title="Manage Users" data-action="manage-users"></i> 
      Manage Users</div>
      `;
    }

    if (
      !this.isActionSuppressed('edit')
      &&
      this.authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'edit',
        ignoreRedirection: true,
      })
    ) {
      this.content += `
      <div class='action-tool' data-action="edit-role" style="margin-bottom: 5px;">
        <i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-edit" title="Edit Role" data-action="edit-role"></i> 
        Edit
      </div>`;
    }

    if (
      !this.isActionSuppressed('delete')
      &&
      this.authService.hasPermissionToAccessModule({
        appSlug: 'xapps_admin',
        moduleSlug: 'roles',
        permissionSlug: 'delete',
        ignoreRedirection: true,
      })
    ) {
      this.content += `<div class='action-tool' data-action="delete-role">
        <i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-trash" title="Delete Role" data-action="delete-role"></i> 
        Delete
      </div>`;
    }

    if (!this.content) {
      this.content += `<div class='action-tool'><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-ban" title="No Action Available"></i>No Action</div>`;
    }
    this.createDropdownMenu();
  }

  isActionSuppressed(action: string){
    return this.suppressedActions.includes(action);
  }

  refresh(): boolean {
    return true;
  }

  /**
   * Toggles the visibility of the dropdown menu.
   * @param {Event} event - The click event triggered by the user interaction.
   */

  toggleDropdown(event: Event): void {
    if (
      CustomButtonComponent.currentlyOpenDropdown &&
      CustomButtonComponent.currentlyOpenDropdown !== this.dropdownMenu
    ) {
      CustomButtonComponent.currentlyOpenDropdown.style.display = 'none';
    }

    const button = event.currentTarget as HTMLButtonElement;
    const buttonRect = button.getBoundingClientRect();

    this.dropdownMenu.style.display =
      this.dropdownMenu.style.display === 'block' ? 'none' : 'block';
    this.dropdownMenu.style.top = `${buttonRect.bottom - 0}px`;
    this.dropdownMenu.style.right = `80px`;

    if (this.dropdownMenu.style.display === 'block') {
      CustomButtonComponent.currentlyOpenDropdown = this.dropdownMenu;
    } else {
      CustomButtonComponent.currentlyOpenDropdown = null;
    }
  }

  /**
   * Creates the dropdown menu and attaches it to the DOM.
   * Adds content based on user permissions and attaches click listeners to handle actions.
   */

  createDropdownMenu(): void {
    this.dropdownMenu = this.renderer.createElement('div');
    this.renderer.addClass(this.dropdownMenu, 'dropdown-menu');
    this.renderer.setStyle(this.dropdownMenu, 'display', 'none');
    this.renderer.setStyle(this.dropdownMenu, 'position', 'absolute');
    this.renderer.setStyle(this.dropdownMenu, 'background-color', 'white');
    this.renderer.setStyle(
      this.dropdownMenu,
      'box-shadow',
      '0px 8px 18px 0px rgba(0,0,0,0.3)',
    );
    this.renderer.setStyle(this.dropdownMenu, 'z-index', '1');

    // let content = `<div class='action-tool' data-action="manage-roles"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-gear" title="Manage Roles" data-action="manage-roles"></i> Manage Roles</div>`;

    this.dropdownMenu.innerHTML = this.content;

    // Add event listeners to the dropdown menu items
    this.renderer.listen(this.dropdownMenu, 'click', (event: Event) => {
      const target = event.target as HTMLElement;
      const action = target.getAttribute('data-action');
      if (action) {
        this.handleAction(action);
      }
    });

    this.renderer.appendChild(document.body, this.dropdownMenu);
  }

  /**
   * Handles actions triggered by clicking on dropdown menu items.
   */
  handleAction(action: string): void {
    this.onCellClicked(this.params, action);
    this.dropdownMenu.style.display = 'none'; // Hide dropdown after action
    CustomButtonComponent.currentlyOpenDropdown = null;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;

    if (
      CustomButtonComponent.currentlyOpenDropdown &&
      !this.el.nativeElement.contains(event.target) &&
      !targetElement.classList.contains('sh-common-drop')
    ) {
      CustomButtonComponent.currentlyOpenDropdown.style.display = 'none';
      CustomButtonComponent.currentlyOpenDropdown = null;
    }
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   */
  ngOnDestroy() {
    if (this.dropdownMenu) {
      this.dropdownMenu.remove();
    }
  }
}
