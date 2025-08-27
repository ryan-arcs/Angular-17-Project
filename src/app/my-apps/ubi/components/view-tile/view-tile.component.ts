import { Component, Input } from '@angular/core';
import { TableauGlobalDataServiceNew } from '../../services';
import { ViewModalComponent } from '../view-modal/view-modal.component';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { LazyLoadThumbnailDirective } from '../../directives/lazy-load-thumbnail.directive';
import { TableauView, TagData } from '../../interfaces';
import { UIService } from '@app/common/services/ui.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-view-tile',
  standalone: true,
  imports: [LazyLoadThumbnailDirective, NgbTooltipModule],
  templateUrl: './view-tile.component.html',
  styleUrl: './view-tile.component.scss'
})
export class ViewTileComponent {

  @Input() headerSetting: any;
  @Input({ required: true }) view!: TableauView;
  @Input() allViews!: TableauView[];
  @Input() loadedFrom!: string;
  @Input() quickview: boolean = true;
  @Input() isForViewPage: boolean = false;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private tableauGlobalDataService: TableauGlobalDataServiceNew,
    private uiService: UIService
  ) { }

  ngOnInit() {}

  viewDetails(): void {
    this.tableauGlobalDataService.setViewLoadedFrom(this.loadedFrom);
    const environmentProject = this.tableauGlobalDataService.getLocalEnvironmentProjectByViewId(this.view?.id);
    this.tableauGlobalDataService.addToSelectedViews(this.view?.id);
    const selectedViews = this.tableauGlobalDataService.getSelectedViews();
    this.router.navigate([
      `ubi/projects/${environmentProject?.id}/views/${this.view?.id}/${this.loadedFrom}/${selectedViews.join(',')}`
    ]);

    this.uiService.isMobile$.pipe(take(1)).subscribe((isMobile) => {
      if (isMobile) {
        this.tableauGlobalDataService.toggleSlider(false);
      }
    })
  }

  openCardModal(view: any, $event: any) {
    $event.stopPropagation();
    const modalRef = this.modalService.open(ViewModalComponent, { centered: true, size: 'xl',  windowClass: 'modal-dialog-quick-view' });
    modalRef.componentInstance.view = this.view;
    modalRef.componentInstance.allViews = this.allViews;
    modalRef.closed.subscribe((result) => {
      if (result.action === 'close') {
      }
    });
  }

  isObjectEmpty(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!this.isObjectEmpty(obj[key])) {
          return false;
        }
      } else if (obj[key]) {
        return false;
      }
    }
    return true;
  }

  getTagData(tags?: TagData[]): string | undefined {
    return tags?.map(tag => tag.label).join(', ');
  }

  /**
 * Toggles the favorite status of a Tableau view.
 * 
 * - If the view is not currently a favorite, it will be added.
 * - If the view is already a favorite, it will be removed.
 * 
 * @param {TableauView} view - The Tableau view object to be added or removed from favorites.
 */
  toggleFavorite(view: TableauView) {
    this.tableauGlobalDataService.toggleFavorite(view);
  }
  
}
