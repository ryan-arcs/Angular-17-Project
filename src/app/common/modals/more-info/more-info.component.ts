import { Component, Input } from '@angular/core';
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
  templateUrl: './more-info.component.html',
  styleUrl: './more-info.component.scss',
})
export class MoreInfoModalComponent {
  moreInfoForm: FormGroup;
  @Input() header?: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
  ) {
    this.moreInfoForm = this.fb.group({
      message: ['', [Validators.required, this.noWhitespaceValidator]],
    });
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  sendMsg() {
    if (this.moreInfoForm.valid) {
      const messsage = this.moreInfoForm.value.message.trim();
      this.activeModal.close(messsage);
    }
  }

  close() {
    this.activeModal.dismiss();
  }
}
