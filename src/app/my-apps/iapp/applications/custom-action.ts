import {
  Component,
  ElementRef,
  Renderer2,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { AuthService } from 'src/app/common/services/auth.service';

@Component({
  selector: 'project-actions',
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
export class CustomButtonComponent
  implements OnDestroy
{
  isStarted: boolean = false;
  isUndeployed: boolean = false;
  dropdownMenu!: HTMLElement;
  onCellClicked: any;
  params: any;

  static currentlyOpenDropdown: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
  ) {}

  agInit(params: any): void {
    this.params = params;

    this.onCellClicked = params.onCellClicked;
    this.isStarted = params.data.status === 'STARTED';
    this.isUndeployed = params.data.status === 'UNDEPLOYED';
    this.createDropdownMenu();
  }

  refresh(): boolean {
    return true;
  }

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

    if (this.isStarted) {
      if (
        this.authService.hasPermissionToAccessModule({
          appSlug: 'iapp',
          moduleSlug: 'projects',
          submoduleSlug: this.params.data?.domain || '',
          permissionSlug: 'start_project',
          ignoreRedirection: true,
        }) &&
        this.params.data.status?.toLowerCase() != 'deploying' &&
        this.params.data.status?.toLowerCase() != 'undeploying'
      ) {
        content += `<div class='action-tool' data-action="RESTART"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-repeat" title="Restart Project" data-action="RESTART"></i> Restart Project</div>`;
      }

      if (
        this.authService.hasPermissionToAccessModule({
          appSlug: 'iapp',
          moduleSlug: 'projects',
          submoduleSlug: this.params.data?.domain || '',
          permissionSlug: 'stop_project',
          ignoreRedirection: true,
        }) &&
        this.params.data.status?.toLowerCase() != 'deploying' &&
        this.params.data.status?.toLowerCase() != 'undeploying'
      ) {
        content += `<div class='action-tool' data-action="STOP"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-stop-circle" title="Stop Project"></i>Stop Project</div>`;
      }
    } else if (this.isUndeployed) {
      if (
        this.authService.hasPermissionToAccessModule({
          appSlug: 'iapp',
          moduleSlug: 'projects',
          submoduleSlug: this.params.data?.domain || '',
          permissionSlug: 'start_project',
          ignoreRedirection: true,
        }) &&
        this.params.data.status?.toLowerCase() != 'deploying' &&
        this.params.data.status?.toLowerCase() != 'undeploying'
      ) {
        content += `<div class='action-tool' data-action="START"><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-play-circle" title="Start Project" ></i>Start Project</div>`;
      }
    }

    content += `<div class='action-tool' data-action="VIEWLOGS"><span class="material-symbols-rounded btn-icon">history</span>
              <p class="">Action Logs</p></div>`;

    if (!content) {
      content += `<div class='action-tool'><i style="margin-right: 10px; font-size: 17px; cursor: pointer;" class="fa fa-ban" title="No Action Available"></i>No Action</div>`;
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

  ngOnDestroy() {
    if (this.dropdownMenu) {
      this.dropdownMenu.remove();
    }
  }
}
