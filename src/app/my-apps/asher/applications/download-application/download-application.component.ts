import {
  Component,
  inject,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-edit-lifecycles',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './download-application.component.html',
  styleUrl: './download-application.component.scss',
})

export class DownloadApplicationComponent implements OnInit{
  activeModal = inject(NgbActiveModal);
  downloadForm: FormGroup = this.fb.group({
    fileName: ['', [Validators.required, Validators.pattern(/.*\S.*/)]]
  });
  showErrors = false;
  @Input() defaultName = '';

  @ViewChildren('inputElement') inputElements?: QueryList<any>;

  constructor(
    private fb: FormBuilder,
  ) {
  }
  ngOnInit(): void {
    this.downloadForm.get('fileName')?.setValue(this.defaultName);
  }

  /**
   * Handles the download application data process.
   * 
   * This method validates the `downloadForm` and performs the following actions:
   * - If the form is valid:
   *   - Closes the active modal with the action and application name.
   *   - Resets the form and hides error messages.
   * - If the form is invalid:
   *   - Displays error messages.
   *   - Attempts to focus on the first invalid input field for user convenience.
   *     - If the invalid field is a standard input, it focuses on the native element.
   *     - If the invalid field is a custom `ng-select` element, it calls the `focus` method.
   * 
   * @async
   */
  async downloadFile() {
    this.showErrors = true;
    if (this.downloadForm.valid) {
      this.activeModal.close({
        action: 'SUBMIT',
        fileName: this.downloadForm.get('fileName')?.value?.trim()
      });
      this.downloadForm.reset();
      this.showErrors = false;
    } else {
      // Optionally, you can focus on the first invalid field
      
      const firstControl = this.inputElements
        ?.toArray()
        .find((input) =>
          input?.nativeElement?.classList?.value?.includes('ng-invalid') || input?.element?.classList?.value?.includes('ng-invalid'),
        );

      if (firstControl) {
        if(firstControl?.nativeElement){
          firstControl.nativeElement.focus();
        }
        else{ // for ng-select select focus
          firstControl.focus();
        }
      }
    }
  }

  isShowError(){
    return this.showErrors && this.downloadForm.get("fileName")?.invalid;
  }
}
