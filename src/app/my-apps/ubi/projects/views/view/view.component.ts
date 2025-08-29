import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TableauViz } from '@tableau/embedding-api';
import { UIService } from 'src/app/common/services/ui.service';
import { TableauGlobalDataServiceNew } from '@app/my-apps/ubi/services/tableau-global-data.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [NgbTooltipModule],
  templateUrl: './view.component.html',
  styleUrl: './view.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewComponent implements OnInit, OnDestroy {
  @ViewChild('viewContainer') viewContainer!: ElementRef;
  @ViewChildren('tabElement') tabElements!: QueryList<ElementRef>;
  viz: any;
  views: Array<any> = [];
  selectedView?: any;
  sidebar = true;
  sidebarClass = 'sidebar-open-outer';
  selectedTableauPersona?: string;
  loadedFrom = '';
  projectId = '';
  projectName = '';

  isScrollable = false;
  showLeftButton = false;
  showRightButton = false;

  constructor(
    private route: ActivatedRoute,
    private uiService: UIService,
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private renderer: Renderer2,
    private router: Router,
  ) {}

  /**
   * Angular lifecycle hook that runs after component initialization.
   * - Retrieves the selected Tableau persona from global data service.
   * - Subscribes to route parameters to fetch and mark the selected view.
   * - Adds the selected view to the views list if it's not already present.
   * - Sets the selected project's workbooks if there's only one view available.
   * - Reads and stores the 'from' query parameter if present.
   * - Applies sidebar class based on current sidebar state.
   */
  ngOnInit(): void {
    this.toggleSlidebar(true);
    this.selectedTableauPersona =
      this.tableauGlobalDataService.retrieveTableauPersona() || '';
    this.tableauGlobalDataService.toggleSlider(false);
    this.route.params.subscribe(async (params) => {
      const viewId = params['id'] || '';
      const from = params['loadedFrom']
        ? params['loadedFrom']?.trim()?.toLowerCase() || ''
        : '';
      if (from) {
        this.loadedFrom = from;
      }
      this.projectId = params['projectId'];
      let selectedViews = params['selectedViews'].split(',') || [];
      if (this.projectId && viewId && selectedViews?.length) {
        this.tableauGlobalDataService.selectedViews.set(selectedViews);
        const lastViews = this.views || [];
        this.views = this.tableauGlobalDataService
          .getLocalViews({
            viewIds: selectedViews,
          })
          ?.map((view) => {
            return {
              ...view,
              selected: view?.id === viewId ? true : false,
              loaded: lastViews?.some(
                (lastView) => lastView?.id === view?.id && lastView?.loaded,
              ),
            };
          });
        const thisView = this.views?.find((tview) => tview.id === viewId);
        if (thisView?.id) {
          this.selectedView = thisView;
          this.scrollToSelectedTab(thisView.id);
          if (!thisView?.loaded) {
            thisView.loaded = true;
            this.createView(thisView);
          }
        }
      }
      this.checkScroll();
    });

    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  scrollToSelectedTab(viewId: string | number): void {
    setTimeout(() => {
      const tab = this.tabElements?.find(
        (el) => el.nativeElement?.dataset?.viewId === String(viewId),
      );

      if (tab) {
        tab.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, 0);
  }

  /**
   * Creates and embeds a Tableau visualization view in the DOM using JWT authentication.
   * - Sets loading state before initiating request.
   * - Fetches Tableau API URL and logged-in user credentials.
   * - Makes a POST request to obtain a JWT token for Tableau embedding.
   * - Constructs and appends a TableauViz instance to the appropriate DOM container.
   * - Sets the visualization source using workbook and view names, formatting them as needed.
   * - Stops the loader once the visualization is rendered.
   *
   * @param view - The view object containing workbook and view details used to embed the visualization.
   * @throws Will throw an error if credentials are not available.
   */
  async createView(view: any) {
    this.uiService.setLoader(true);

    const credentials = this.tableauGlobalDataService.retrieveAuthCredentials();

    if (!credentials) {
      throw new Error('Invalid credentials');
    }
    const {
      site: { contentUrl: siteContentUrl },
    } = credentials;
    const jwtToken = await this.tableauGlobalDataService.getJWTToken();
    const viewBaseUrl = this.tableauGlobalDataService.getViewBaseUrl();

    const tableauVizContainer = (await this.getTableauVizContainer(
      view,
    )) as HTMLElement;
    if (tableauVizContainer) {
      tableauVizContainer.innerHTML = '';
    }

    const viz = new TableauViz();

    viz.src = `${viewBaseUrl}/t/${siteContentUrl}/views/${view?.workbook?.contentUrl}/${encodeURIComponent(view?.name?.replace(/\s+/g, ''))}`;
    viz.width = '100%';
    viz.height = 'calc(100vh - 48px)';
    viz.token = jwtToken;

    // Apply styles properly
    viz.style.border = '1px solid var(--layout-border-color)';
    viz.style.borderRadius = '8px';
    viz.style.overflow = 'hidden';

    // Append to container
    tableauVizContainer?.appendChild(viz);

    setTimeout(() => {
      this.uiService.setLoader(false);
    }, 500);
  }

  async getTableauVizContainer(view: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(document.getElementById(this.getVizContainerId(view)));
      }, 0);
    });
  }

  /**
   * Navigates the user to the appropriate Tableau route based on the context from which the view was accessed.
   * - If `from` is defined, navigates to the corresponding home, recents, or favorites route.
   * - If no `from` context is found and the selected persona is the default or not set,
   *   navigates to the project route using the current view's project ID.
   * - If a custom persona is selected, navigates to the Tableau home route.
   */
  navigateToProjects() {
    if (this.loadedFrom) {
      switch (this.loadedFrom) {
        case 'home': {
          this.router.navigate([`ubi/home`]);
          return;
        }
        case 'recents': {
          this.router.navigate([`ubi/recents`]);
          return;
        }
        case 'favorites': {
          this.router.navigate([`ubi/favorites`]);
          return;
        }
        case 'projects': {
          this.router.navigate([`ubi/projects/${this.projectId}`]);
          return;
        }
      }
    }
    this.router.navigate([`ubi/home`]);
  }

  // Toggles the visibility of the sidebar and updates the body class accordingly
  sidebarToggle() {
    this.sidebar = !this.sidebar;
    if (this.sidebar) {
      this.renderer.addClass(document.body, this.sidebarClass);
    } else {
      this.renderer.removeClass(document.body, this.sidebarClass);
    }
  }

  // Hides or shows the sidebar on smaller screens based on the provided event flag
  hideLeftBar(event: boolean) {
    if (window.innerWidth <= 992) {
      this.sidebar = event;
      if (this.sidebar) {
        this.renderer.addClass(document.body, this.sidebarClass);
      } else {
        this.renderer.removeClass(document.body, this.sidebarClass);
      }
    }
  }

  // Handles sidebar visibility on window resize events
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth < 993) {
      this.renderer.removeClass(document.body, this.sidebarClass);
      this.sidebar = false;
    } else {
      this.renderer.addClass(document.body, this.sidebarClass);
      this.sidebar = true;
    }
    this.checkScroll();
  }

  navigateToView(viewId: string, loadedFrom: string): void {
    if (!viewId) return;

    const environmentProject =
      this.tableauGlobalDataService.getLocalEnvironmentProjectByViewId(viewId);
    if (!environmentProject?.id) return;
    const selectedViews = this.tableauGlobalDataService.getSelectedViews();

    this.router.navigate([
      `ubi/projects/${environmentProject.id}/views/${viewId}/${loadedFrom}/${selectedViews.join(',')}`,
    ]);
  }

  // Navigates to the selected Tableau view using project and view IDs
  selectView(view: any) {
    if (!view?.id) return;
    // Set as selected in the service
    this.tableauGlobalDataService.addToSelectedViews(view.id);
    this.navigateToView(view.id, this.loadedFrom);
  }

  // Removes the selected view and navigates or reselects another if necessary
  removeView(thisView: any) {
    if (!thisView) return;

    this.tableauGlobalDataService.removeFromSelectedViews(thisView?.id);
    const selectedViews = this.tableauGlobalDataService.getSelectedViews();

    if (!selectedViews.length) {
      // No views left, go back to projects
      this.navigateToProjects();
      return;
    }
    this.navigateToView(
      selectedViews[selectedViews.length - 1],
      this.loadedFrom,
    );
    this.checkScroll();
  }

  // TrackBy function for view rendering optimization in ngFor
  trackByViewId(index: number, view: any): any {
    return view?.id;
  }

  // Returns a unique DOM element ID for the Tableau visualization container
  getVizContainerId(view: any) {
    return `tableauVizContainer_${view.id}`;
  }
  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  toggleSlidebar(state: boolean) {
    this.tableauGlobalDataService.toggleSlider(state);
  }

  ngAfterViewInit() {
    this.checkScroll();
  }

  scrollViews(distance: number) {
    const container = this.viewContainer?.nativeElement;
    if (container) {
      container.scrollBy({
        left: distance,
        behavior: 'smooth',
      });

      setTimeout(() => this.updateScrollButtons(), 300);
    }
  }

  checkScroll() {
    const container = this.viewContainer?.nativeElement;
    if (container) {
      this.isScrollable = container?.scrollWidth > container?.clientWidth;
      this.updateScrollButtons();
    }
  }

  updateScrollButtons() {
    const container = this.viewContainer?.nativeElement;
    this.showLeftButton = container.scrollLeft > 0;
    this.showRightButton =
      container.scrollLeft + container?.clientWidth < container?.scrollWidth;
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    this.tableauGlobalDataService.getRecentsOfUser({
      silentCall: true,
    });
    this.tableauGlobalDataService.emptizeTableauCreds();
    this.tableauGlobalDataService.clearJWTInterval();
    this.tableauGlobalDataService.clearSelectedViews();
  }
}
