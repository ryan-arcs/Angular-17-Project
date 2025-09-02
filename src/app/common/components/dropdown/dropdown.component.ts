import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { UserProfile } from 'src/app/common/interfaces/global.interface';
import { UIService, UiTheme } from '../../services/ui.service';
import { UserProfileService } from '../../services/user-profile.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemeModalComponent } from '@app/common/modals/theme-modal/theme-modal.component';
import { ThemeServiceService } from '@app/common/services/theme-service.service';
import { GlobalDataService } from '@app/common/services/global-data.service';
import { Router } from '@angular/router';

interface ThemeOptions {
  name: String;
  type: UiTheme;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent implements OnInit, OnDestroy {
  private channel: BroadcastChannel = new BroadcastChannel('xapps-broadcast-channel');
  userDataSubscription: Subscription | undefined;
  userData: UserProfile | undefined;
  isMenuOpen = false;
  selectedOption = 'Dev';
  options = ['Dev', 'Prod', 'UAT'];
  themes: ThemeOptions[] = [
    // { name: 'Classic', type: 'classic' },
    // { name: 'Default', type: 'default' },
    { name: 'Dark', type: 'dark' },
    { name: 'Light', type: 'light' },
  ];
  applicationNameSubscription: Subscription | undefined;
  activeTheme: any = '';
  private subscriptions: Subscription = new Subscription();
  
  @Output() toggleDropDown = new EventEmitter<void>();

  constructor(
    private uiService: UIService,
    private userProfileService: UserProfileService,
    private modalService: NgbModal,
    private renderer: Renderer2,
    private themeService:ThemeServiceService,
    private globalDataService: GlobalDataService,
    private router: Router
  ) {}
  // Lifecycle hook that is called after the component is initialized
  ngOnInit(): void {
    this.userDataSubscription =
      this.userProfileService.loggedInUserData$.subscribe({
        next: (data) => {
          // Update user data with the data received from the observable
          this.userData = data;
        },
      });

    this.subscriptions.add(
      this.uiService.activatedTheme$.subscribe({
        next: (data) => {
          this.activeTheme = data;
        },
      }),
    );
  }

  /**
   * Toggle the visibility of the dropdown menu
   * @return {void}
   */

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Set the selected option and open the menu
   * @param {string} option
   * @param {Event} event
   * @return {void}
   */

  selectOption(option: string, event: Event): void {
    event.stopPropagation();
    this.selectedOption = option;
    this.isMenuOpen = true;
  }

  /**
   * Log out the user and clear local storage
   * @return {void}
   */

  async logOut(): Promise<void> {
    const message = {
      logout: true,
    };
    this.channel.postMessage(JSON.stringify(message));
  }

  setTheme(theme: any) {
    const activeTheme = theme;
    this.uiService.setTheme({activeTheme, syncWithDb: true})
    this.toggleDropDown.emit();
  }
  
  // onThemeChange(mode: 'nds-light' | 'nds-dark', color: string) {
  //   this.themeService.setTheme(mode, color);
  // }

  openThemeModal() {
    const modalRef = this.modalService.open(ThemeModalComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static'
    });
    modalRef.closed.subscribe((result) => {
      if (result.action === 'close') {
      }
    });
  }

  // Lifecycle hook that is called before the component is destroyed

  ngOnDestroy(): void {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    this.subscriptions?.unsubscribe();
  }
}
