import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OffboardingResource } from '../../../interfaces/global.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [DatePipe],
  providers: [DatePipe],
  templateUrl: './user-details-modal.component.html',
  styleUrl:
    '../../../onboarding/onboarding-details/user-details-modal/user-details-modal.component.scss',
})
export class UserDetailsModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  @Input() offboardingResource?: OffboardingResource;

  constructor(private datePipe: DatePipe) {}
  ngOnInit(): void {}
}
