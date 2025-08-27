import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-deployment-info',
  standalone: true,
  imports: [],
  templateUrl: './deployment-info.component.html',
  styleUrl: './deployment-info.component.scss',
})
export class DeploymentInfoComponent {
  activeModal = inject(NgbActiveModal);
  @Input() applicationName: string = '';
}
