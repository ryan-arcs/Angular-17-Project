import { Component, Renderer2 } from '@angular/core';
import { ViewTileComponent } from '../view-tile/view-tile.component';
import { CommonModule } from '@angular/common';
import { TableauGlobalDataServiceNew } from '../../services';
import { EnvironmentProject, TableauView, TagData } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { UIService } from '@app/common/services/ui.service';
@Component({
  selector: 'app-report-sidebar',
  standalone: true,
  imports: [ViewTileComponent, CommonModule, FormsModule, NgbTooltipModule],
  templateUrl: './report-sidebar.component.html',
  styleUrl: './report-sidebar.component.scss',
})
export class ReportSidebarComponent {
  environmentProjects?: Record<string, EnvironmentProject>;
  projectsToShow?: Record<string, TableauView[]>;
  projectsToShowBKP?: Record<string, TableauView[]>;
  searchString = '';
  loadedFrom = '';
  subscriptions: Subscription = new Subscription();
  isViewsLoaded = false;
  views: TableauView[] = [];
  selectedViewId: string = '';
  projectName = '';
  sidebarOpen = false;
  constructor(
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private route: ActivatedRoute,
    private router: Router,
    private uiService: UIService,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.tableauGlobalDataService.environmentProjects$.subscribe(
        (environmentProjects) => {
          this.environmentProjects = environmentProjects || undefined;
        },
      ),
    );
    this.tableauGlobalDataService.toggleSlider(false);
    // for getLOadedFrom data like home, views, recents
    this.subscriptions.add(
      this.tableauGlobalDataService.viewLoadedFrom$.subscribe((loadedFrom) => {
        this.searchString = '';
        if (loadedFrom) {
          this.loadedFrom = loadedFrom;
          const splitPath = this.router.url.split('/');

          this.selectedViewId = splitPath?.[6] || '';
        } else {
          this.setupRouteListeners();
        }
        this.setViews();
      }),
    );

    // for selectedView id only
    this.subscriptions.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const childRoute = this.getDeepestChild(this.route);
          const childRouteSubscription = childRoute.params.subscribe(
            (params) => {
              this.selectedViewId = params['id'] || '';
            },
          );
          childRouteSubscription?.unsubscribe();
        }
      }),
    );

    this.uiService.toggleMainSidebar();
    this.renderer.addClass(document.body, 'ubi-projects-page');
  }

  async setViews() {

    if(this.isViewsLoaded) return;
    switch (this.loadedFrom) {
      case 'home':
        this.projectsToShow = Object.fromEntries(
          Object.entries(this.environmentProjects || {}).map(([key, value]) => [
            key,
            value?.views || [],
          ]),
        );
        break;
      case 'recents':
        if (this.tableauGlobalDataService.reloadData('user-recents')) {
          await this.tableauGlobalDataService.getRecentsOfUser();
        }
        this.tableauGlobalDataService.userRecents$.subscribe({
          next: (recents) => {
            const environmentProjects =
              this.tableauGlobalDataService.getEnvironmentProjects();
            if (recents && environmentProjects) {
              const views = Object.values(environmentProjects).flatMap(
                (project) => project?.views,
              );
              this.projectsToShow = {
                Recents:
                  recents?.reduce((acc: any, item) => {
                    if (item.view?.id) {
                      const thisView = views?.find(
                        (v) => v?.id === item.view?.id,
                      );
                      if (thisView?.id) {
                        acc.push(thisView);
                      }
                    }
                    return acc;
                  }, []) || [],
              };
            }
          },
        });
        break;
      case 'favorites':
        this.tableauGlobalDataService.environmentProjects$.subscribe(
          (environmentProjects) => {
            this.projectsToShow = {
              Favorites: Object.values(environmentProjects || {})
                .flatMap((project) => project?.views || [])
                .filter(
                  (view): view is TableauView => view?.isFavorite === true,
                ),
            };
          },
        );
        break;
      case 'personas':
        this.tableauGlobalDataService.tableauPersonas$.subscribe((personas) => {
          const selectedPersona =
            this.tableauGlobalDataService.retrieveTableauPersona();
          const tableauPersonas = structuredClone(personas);
          if (selectedPersona && selectedPersona !== 'Home') {
            const thisPersona = tableauPersonas?.find(
              (persona) => persona.name === selectedPersona,
            );
            if (thisPersona?.name) {
              let views = Object.values(this.environmentProjects || {}).flatMap(
                (project) => project?.views,
              );

              const personaReports =
                (thisPersona?.reports as Array<string>) || [];
              thisPersona.fullReports =
                views.filter((view): view is TableauView => {
                  return !!(view && personaReports?.includes(view.id));
                }) || [];

              const personaName = thisPersona?.name || '';
              this.projectsToShow = {
                [personaName]: thisPersona?.fullReports || [],
              };
            }
          }
        });
        break;
      case 'projects':
        const routeDetails = this.uiService.getCurrentRouteDetails();
        const projectId = routeDetails?.pathParams?.['projectId']?.value || '';
        if(projectId){
          this.loadProjectViews(projectId || '');
        }
    }

    this.projectsToShowBKP = structuredClone(this.projectsToShow);
    this.isViewsLoaded = true;
  }

  toggleExpand(projectName: string) {
    if (
      this.environmentProjects?.[projectName] &&
      this.environmentProjects?.[projectName]
    ) {
      const newState = !this.environmentProjects[projectName].showViews;
      this.environmentProjects[projectName].showViews =
        this.environmentProjects[projectName].showViews = newState;
    }
  }

  /**
   * Generic filter function for views based on search criteria
   * Checks both view name and tags for matches
   *
   * @param views - Array of views to filter
   * @param searchString - The search criteria to filter by
   * @returns Filtered array of views matching the search criteria
   */
  performSearch(view: TableauView, searchString: string): boolean {
    const tag = view?.tags?.tag || [];
    return (
      this.isIncluded(view.name, searchString) ||
      this.isIncluded(tag, searchString) ||
      this.isIncluded(view?.description || '', searchString)
    );
  }

  /**
   * Set up listeners for route parameter changes
   * Extracts view ID, loading context, and project information
   */
  private setupRouteListeners(): void {
    // for refresh only
    const childRoute = this.getDeepestChildOnRefresh(this.route);

    childRoute.params.subscribe((params) => {
      if (params['loadedFrom']) {
        this.loadedFrom = params['loadedFrom'];
      }
      if (params['id']) {
        this.selectedViewId = params['id'];
      }
      if (this.loadedFrom === 'projects' && params['projectId']) {
        const projectId = params['projectId'];
        this.loadProjectViews(projectId || '');
      }
    });
  }

  /**
   * Load views for a specific project
   * @param projectId - The ID of the project to load views from
   */
  private loadProjectViews(projectId?: string): void {
    if (!projectId) return;

    this.views = [];
    const project = this.tableauGlobalDataService.getLocalEnvironmentProject({
      projectId: projectId,
    });

    if (project) {
      const projectName = project?.name || '';
      this.projectsToShow = {
        [projectName]: project.views || [],
      };
    }
  }

  getDeepestChildOnRefresh(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  isIncluded(value: string | TagData[], searchString: string): boolean {
    const search = searchString.toLowerCase().trim();

    if (typeof value === 'string') {
      return value.toLowerCase().trim().includes(search);
    }

    if (Array.isArray(value) && value.length) {
      return value.some((item) => item.label.toLowerCase().includes(search));
    }

    return false;
  }

  getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  filterProjects(): void {
    const filteredProjectsToShow: any = {};
    for (const projectName in this.projectsToShow) {
      if (
        Object.prototype.hasOwnProperty.call(this.projectsToShow, projectName)
      ) {
        const views = this.projectsToShow[projectName];
        const filteredViews = views.filter((view: any) => this.performSearch(view, this.searchString)
        );

        // Only add project key if filtered views is not empty
        if (filteredViews.length > 0) {
          filteredProjectsToShow[projectName] = filteredViews;
        }
      }
    }

    this.projectsToShowBKP = filteredProjectsToShow;
  }

  navigateToHomePage() {
    this.router.navigate(['ubi']);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.renderer.removeClass(document.body, 'ubi-projects-page');

    this.subscriptions.unsubscribe();
  }
}
