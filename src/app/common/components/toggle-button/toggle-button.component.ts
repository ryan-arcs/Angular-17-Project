import { Component } from '@angular/core';
import { UIService } from '@app/common/services/ui.service';
import { TableauGlobalDataServiceNew } from '@app/my-apps/ubi/services';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-toggle-button',
  standalone: true,
  imports: [],
  templateUrl: './toggle-button.component.html',
  styleUrl: './toggle-button.component.scss'
})
export class ToggleButtonComponent {
  sidebarOpen = false;
  isMobile = false;
  private destroy$ = new Subject<void>();
  constructor(
    private tableauGlobalDataServiceNew: TableauGlobalDataServiceNew,
    private uiService:UIService
  ) {}

  ngOnInit(): void {
    // Subscribe to slider state to keep button in sync
    this.tableauGlobalDataServiceNew.sliderState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.sidebarOpen = state;
      });
    this.uiService.isMobile$.pipe(takeUntil(this.destroy$)).subscribe((isMobile) => {
      this.isMobile = isMobile;
    })
  }

  toggleSidebar(){
    this.sidebarOpen = !this.sidebarOpen;
    
    this.tableauGlobalDataServiceNew.toggleSlider(this.sidebarOpen);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
