import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/common/services/toast.service';
import { messages } from 'src/app/my-apps/iapp/constants';

@Component({
  selector: 'app-payload-modal',
  standalone: true,
  imports: [],
  templateUrl: './payload-modal.component.html',
  styleUrl: './payload-modal.component.scss',
})
export class PayloadModalComponent {
  activeModal = inject(NgbActiveModal);
  @Input() payloadContent: string = '';

  constructor(private toastService: ToastService) {}

  copyToClipboard(data: string) {
    navigator.clipboard.writeText(data);
    this.toastService.fire({
      type: 'success',
      message: messages.success.logs.copy,
    });
  }
}
