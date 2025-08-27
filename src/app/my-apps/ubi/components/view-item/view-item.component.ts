import { Component, Input } from '@angular/core';
import { LazyLoadThumbnailDirective } from '../../directives/lazy-load-thumbnail.directive';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { TableauView, TagData } from '../../interfaces';
import { TableauGlobalDataServiceNew } from '../../services';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-item',
  standalone: true,
  imports: [
    LazyLoadThumbnailDirective,
    NgbTooltipModule,
    CommonModule
  ],
  templateUrl: './view-item.component.html',
  styleUrl: './view-item.component.scss'
})
export class ViewItemComponent {
  @Input() view!: TableauView;
  @Input() loadedFrom!: string;
  defaultDateFormat = environment?.defaultDateFormat || "MMM d, yyyy h:mm:ss a";

  constructor(
    private router: Router, 
    private tableauGlobalDataService: TableauGlobalDataServiceNew
  ){}

  getTagData(tags?: TagData[]): string | undefined {
    return tags?.map(tag => tag.label).join(', ');
  }

  // Navigates to the details view page of a selected report
  viewDetails(): void {
    const environmentProject = this.tableauGlobalDataService.getLocalEnvironmentProjectByViewId(this.view?.id);
    this.tableauGlobalDataService.addToSelectedViews(this.view?.id);
    const selectedViews = this.tableauGlobalDataService.getSelectedViews();
    this.router.navigate([
      `ubi/projects/${environmentProject?.id}/views/${this.view?.id}/${this.loadedFrom}/${JSON.stringify(selectedViews)}`
    ]);
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
