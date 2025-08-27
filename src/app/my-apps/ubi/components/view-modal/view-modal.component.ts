import { Component, inject, Input } from '@angular/core';
import { NgbDropdownModule, NgbTooltipModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TableauView } from '../../interfaces';
import { UIService } from '@app/common/services/ui.service';
import { TableauGlobalDataServiceNew } from '../../services';
import { TableauEventType, TableauViz } from '@tableau/embedding-api';

@Component({
  selector: 'app-view-modal',
  standalone: true,
  imports: [NgbDropdownModule, NgbTooltipModule],
  templateUrl: './view-modal.component.html',
  styleUrl: './view-modal.component.scss'
})
export class ViewModalComponent {
  @Input() view!: TableauView;
  @Input() allViews: TableauView[] = [];
  viewIndex = 0;
  cardModal = inject(NgbActiveModal);
  cachedViewsId: string[] = [];
  disableNextPrevBtn: boolean = true;
  constructor(
    private uiService: UIService,
    private tableauGlobalDataService: TableauGlobalDataServiceNew
  ) { }

  ngOnInit() {
    this.viewIndex = this.allViews.findIndex((view) => view.id === this.view.id);
  }

  ngAfterViewInit() {
    this.createView();
  }

  handleClick(key?: string) {
    this.viewIndex = (key == 'prev') ? this.viewIndex - 1 : this.viewIndex + 1;
    this.view = this.allViews[this.viewIndex];
    this.createView();
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
  async createView() {
    const view = this.view;
    const credentials = this.tableauGlobalDataService.retrieveAuthCredentials();
    if (!credentials) {
      throw new Error('Invalid credentials');
    }
    if (this.cachedViewsId.includes(view.id)) {
      return;
    }
    this.disableNextPrevBtn = true;
    const {
      site: { contentUrl: siteContentUrl }
    } = credentials;
    const jwtToken = await this.tableauGlobalDataService.getJWTToken();
    const viewBaseUrl = this.tableauGlobalDataService.getViewBaseUrl();

    const tableauVizContainer = await this.getTableauVizContainer(view) as HTMLElement;
    if (tableauVizContainer) {
      tableauVizContainer.innerHTML = '';
    }

    const viz = new TableauViz();

    viz.addEventListener(TableauEventType.FirstVizSizeKnown, ()=>{
      this.disableNextPrevBtn = false;
    });

    viz.src = `${viewBaseUrl}/t/${siteContentUrl}/views/${view?.workbook?.contentUrl}/${encodeURIComponent(view?.name?.replace(/\s+/g, ''))}`;
    viz.width = '100%';
    viz.height = '100%';
    viz.token = jwtToken;
    viz.hideTabs = true;
    tableauVizContainer?.appendChild(viz);
    this.cachedViewsId.push(view.id);
  }

  async getTableauVizContainer(view: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(document.getElementById(
          this.getVizContainerId(view),
        ));
      }, 0);
    });
  }

  // Returns a unique DOM element ID for the Tableau visualization container
  getVizContainerId(view: any) {
    return view.id || '';
  }

  reloadView() {
    this.cachedViewsId = this.cachedViewsId.filter((id) => id != this.view.id);
    this.createView();
  }

  ngOnDestroy() {
    this.tableauGlobalDataService.getRecentsOfUser({
      silentCall: true
    });
    this.tableauGlobalDataService.emptizeTableauCreds();
    this.tableauGlobalDataService.clearJWTInterval();
  }
}
