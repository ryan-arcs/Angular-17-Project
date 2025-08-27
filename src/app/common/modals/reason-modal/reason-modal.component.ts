import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-reason-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reason-modal.component.html',
  styleUrl: './reason-modal.component.scss',
})
export class ReasonModalComponent {
  reasonForm: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
  ) {
    this.reasonForm = this.fb.group({
      reason: ['', [Validators.required, this.noWhitespaceValidator]],
    });
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  submitReason() {
    if (this.reasonForm.valid) {
      const trimmedReason = this.reasonForm.value.reason.trim();
      this.activeModal.close(trimmedReason);
    }
  }

  close() {
    this.activeModal.dismiss();
  }
}
