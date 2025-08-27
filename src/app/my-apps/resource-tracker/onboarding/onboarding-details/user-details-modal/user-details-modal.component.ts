import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OnboardingResource } from '../../../interfaces/global.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [DatePipe],
  providers: [DatePipe],
  templateUrl: './user-details-modal.component.html',
  styleUrl: './user-details-modal.component.scss',
})
export class UserDetailsModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  @Input() onboardingResource?: OnboardingResource;

  constructor(private datePipe: DatePipe) {}
  ngOnInit(): void {}
}
