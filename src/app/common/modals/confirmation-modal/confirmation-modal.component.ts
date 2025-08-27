import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss',
})
export class ConfirmationModalComponent {
  activeModal = inject(NgbActiveModal);

  @Input() action?: string = '';
  @Input() entity?: string = '';
  @Input() message?: string = '';
  @Input() app_name?: string = '';
}
