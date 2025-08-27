import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UIService } from '@app/common/services/ui.service';
import { TableauGlobalDataServiceNew } from '@app/my-apps/ubi/services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss',
})
export class LeftPanelComponent {
  leftPanelContent: any;
  subsciptions: Subscription = new Subscription();
  isSliderOpen: boolean = false
  isLeftSliderOpen: boolean = false
  constructor(private uiService: UIService, private sliderService: TableauGlobalDataServiceNew) {
    this.sliderService.sliderState$.subscribe(state => {
      this.isSliderOpen = state;
    });
    this.sliderService.leftsiderbar$.subscribe(state => {
      this.isLeftSliderOpen = state;
    });
  }

  ngOnInit(): void {
    
    const leftPanelSubscription = this.uiService.leftPanelContent$.subscribe((content) => {
      this.leftPanelContent = content;
      
    });

    this.subsciptions.add(leftPanelSubscription)
  }

  ngOnDestroy(): void {
    this.subsciptions.unsubscribe();
  }
}
