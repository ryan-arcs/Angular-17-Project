import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-schedule-info-popup',
  standalone: true,
  imports: [],
  templateUrl: './schedule-info.component.html',
  styleUrl: './schedule-info.component.scss',
})
export class ScheduleInfoComponent {
  @Input() params: any;
  constructor() {
    this.scheduleExpressionDocUrl = environment.scheduleExpressionDocUrl;
  }
  scheduleExpressionDocUrl: string = '';
  activeModal = inject(NgbActiveModal);

  openScheduleDoc() {
    window.open(this.scheduleExpressionDocUrl, '_blank');
  }
}
