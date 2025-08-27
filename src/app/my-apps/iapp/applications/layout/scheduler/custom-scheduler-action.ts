import {
  Component,
  ElementRef,
  Renderer2,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { AuthService } from 'src/app/common/services/auth.service';
import { IappGlobalDataService } from 'src/app/my-apps/iapp/services';

@Component({
  standalone: true,
  template: `<div class="dropdown ag-grid-more-outer">
    <button
      type="button"
      class="circul-btn small grid-more-btn"
      (click)="toggleDropdown($event); $event.stopPropagation()"
    >
      <span class="material-symbols-rounded">more_horiz</span>
    </button>
  </div>`,
})
export class CustomActionComponent
  implements OnDestroy
{
  isDisabled: boolean = false;
  dropdownMenu!: HTMLElement;
  onCellClicked: any;
  params: any;

  static currentlyOpenDropdown: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private iappGlobalDataService: IappGlobalDataService,
  ) {}

  /**
   * Initializes the component with the parameters from the cell
   * @param params - The parameters passed to the cell renderer
   */
  agInit(params: any): void {
    this.params = params;
    this.isDisabled = params.data.schedule === 'Disabled';
    this.onCellClicked = params.onCellClicked;

    this.createDropdownMenu();
  }

  /**
   * Refreshes the component; required by the ICellRendererAngularComp interface
   * @returns true to indicate successful refresh
   */
  refresh(): boolean {
    return true;
  }

  /**
   * Toggles the visibility of the dropdown menu
   * @param event - The click event
   */
  toggleDropdown(event: Event): void {
    if (
      CustomActionComponent.currentlyOpenDropdown &&
      CustomActionComponent.currentlyOpenDropdown !== this.dropdownMenu
    ) {
      CustomActionComponent.currentlyOpenDropdown.style.display = 'none';
    }

    const button = event.currentTarget as HTMLButtonElement;
    const buttonRect = button.getBoundingClientRect();

    this.dropdownMenu.style.display =
      this.dropdownMenu.style.display === 'block' ? 'none' : 'block';
    this.dropdownMenu.style.top = `${buttonRect.bottom - 0}px`;
    this.dropdownMenu.style.right = `80px`;

    if (this.dropdownMenu.style.display === 'block') {
      CustomActionComponent.currentlyOpenDropdown = this.dropdownMenu;
    } else {
      CustomActionComponent.currentlyOpenDropdown = null;
    }
  }

  /**
   * Creates the dropdown menu with the necessary actions
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

    let content = '';
    const submoduleSlug =
      this.iappGlobalDataService.getSelectedApplicationName() || undefined;

    if (
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        submoduleSlug,
        permissionSlug: 'enable_schedule',
        ignoreRedirection: true,
      }) &&
      this.isDisabled
    ) {
      content += `<div class='action-tool' data-action="Enable"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-check-circle" title="Enable Schedule"></i>Enable Schedule</div>`;
    }

    if (
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        submoduleSlug,
        permissionSlug: 'disable_schedule',
        ignoreRedirection: true,
      }) &&
      !this.isDisabled
    ) {
      content += `<div class='action-tool' data-action="Disable"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-ban" title="Disable Schedule"></i>Disable Schedule</div>`;
    }

    if (
      this.authService.hasPermissionToAccessModule({
        appSlug: 'iapp',
        moduleSlug: 'projects',
        submoduleSlug,
        permissionSlug: 'run_schedule',
        ignoreRedirection: true,
      })
    ) {
      content += `<div class='action-tool' data-action="Run"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-play-circle" title="Run Schedule"></i>Run Schedule</div>`;
    }
    content += `<div class='action-tool' data-action="VIEWLOGS"><span class="material-symbols-rounded btn-icon">history</span>
              <p class="">Action Logs</p>`;

    if (
      !content ||
      this.params?.data?.status?.toLowerCase() === 'running' ||
      this.params.data.status?.toLowerCase() === 'queued' ||
      this.params.data.schedule?.toLowerCase() === 'enabling' ||
      this.params.data.schedule?.toLowerCase() === 'disabling'
    ) {
      content = `<div class='action-tool'><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-ban" title="No Action Available"></i>No Action</div>`;
    }

    this.dropdownMenu.innerHTML = content;

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
   * Handles the selected action from the dropdown menu
   * @param action - The action to be performed
   */

  handleAction(action: string): void {
    this.onCellClicked(this.params, action);
    this.dropdownMenu.style.display = 'none'; // Hide dropdown after action
    CustomActionComponent.currentlyOpenDropdown = null;
  }

  /**
   * Handles click events outside the dropdown to close it
   * @param event - The click event
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;

    if (
      CustomActionComponent.currentlyOpenDropdown &&
      !this.el.nativeElement.contains(event.target) &&
      !targetElement.classList.contains('sh-common-drop')
    ) {
      CustomActionComponent.currentlyOpenDropdown.style.display = 'none';
      CustomActionComponent.currentlyOpenDropdown = null;
    }
  }

  /**
   * Cleanup method to remove the dropdown menu from the DOM when the component is destroyed
   */
  ngOnDestroy() {
    if (this.dropdownMenu) {
      this.dropdownMenu.remove();
    }
  }
}
