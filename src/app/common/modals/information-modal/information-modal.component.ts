import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [],
  templateUrl: './information-modal.component.html',
  styleUrl: './information-modal.component.scss',
})
export class InformationModalComponent {
  activeModal = inject(NgbActiveModal);

  @Input() action: string = '';
  @Input() button1: string = '';
  @Input() button2: string = '';
}
