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
import { Subscription } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@app/common/services/auth.service';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';

interface LifeCycleDetails{
  id?: number;
  code?: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-add-edit-lifecycles',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './add-edit-lifecycles.component.html',
  styleUrl: './add-edit-lifecycles.component.scss',
})

export class AddEditLifeCyclesComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  addLifeCycleForm: FormGroup;
  showErrors = false;
  lifeCycleDetails?: LifeCycleDetails;
  mode = 'details';

  @Input() code = '';

  subscriptions: Subscription = new Subscription();
  
  @ViewChildren('inputElement') inputElements?: QueryList<any>;

  constructor(
    private fb: FormBuilder,
    private asherGlobalDataService: AsherGlobalDataService,
    private authService: AuthService
  ) {
    this.addLifeCycleForm = this.fb.group({
      lifeCycleName: ['', [Validators.required, Validators.pattern(/.*\S.*/)]],
      description: [''],
    });
  }

  /**
   * Initializes the component by determining whether it's in add or edit mode.
   * - If `code` is present, sets mode to 'edit' and fetches lifecycle details to patch the form.
   * - If `code` is not present, clears any existing lifecycle details and sets mode to 'add'.
   * - Subscribes to the lifecycle details observable to keep local data in sync with the global state.
   * - Updates `lifeCycleDetails` object with the latest data received from the observable.
   *
   * @returns {Promise<void>}
   */
  async ngOnInit() {
    if (this.code) {
      this.mode = 'edit';
      const response = await this.asherGlobalDataService.getLifeCycleDetails({code: this.code});
      
      this.addLifeCycleForm.patchValue({
        lifeCycleName: response.name || '',
        description: response.description || ''
      });
    } else {
      this.asherGlobalDataService.clearLifeCycleDetails();
      this.mode = 'add';
    }
    
    const lifeCycleDetailSubscription = this.asherGlobalDataService.lifeCycleDetails$.subscribe({
      next: (lifeCycle)=> {
        this.lifeCycleDetails = undefined;
        if(lifeCycle.code) {
          this.lifeCycleDetails = {
            id: lifeCycle.id || 0,
            code: lifeCycle.code || '',
            name: lifeCycle.name || '',
            description: lifeCycle.description || ''
          }
        }
      }
    })
    this.subscriptions.add(lifeCycleDetailSubscription);
  }
  
  async editLifeCycle() {
    this.addLifeCycleForm.patchValue({
      lifeCycleName: this.lifeCycleDetails?.name || '',
      description: this.lifeCycleDetails?.description || ''
    });
    this.mode = 'edit';
  }

   /**
   * Submits the LifeCycle form data for creation or update.
   * - Displays form errors if the form is invalid.
   * - If the form is valid, it gathers the form values into an object.
   * - If the `code` exists, it calls `updateLifeCycle`, otherwise it calls `addLifeCycle` to submit the data.
   * - After submission, it navigates to the lifeCycle details modal.
   * - If the form is invalid, it focuses on the first invalid form control.
   * @returns {void}
   */
  async submitLifeCycle() {
    this.showErrors = true;
    if (this.addLifeCycleForm.valid) {
      let code = this.lifeCycleDetails?.code || '';
      const requestBody: any = {
        name: this.addLifeCycleForm.get('lifeCycleName')?.value?.trim() || '',
        description: this.addLifeCycleForm.get('description')?.value?.trim() || '',
      }

      if(this.lifeCycleDetails?.id){
        await this.asherGlobalDataService
        .updateLifeCycle({
          ...requestBody,
          id: this.lifeCycleDetails?.id,
        }); 
      } else {
        const response = await this.asherGlobalDataService
        .addLifeCycle(requestBody);
        if(response?.lifecycle){
          code = response.lifecycle;
        }
      }
      if(code){
        await this.asherGlobalDataService.getLifeCycleDetails({code});
      }

      this.mode = 'details';
      this.addLifeCycleForm.reset();
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
  
  // Returns the page title based on the current mode (add/edit).
  getTitle() {
    switch(this.mode){
      case 'add': 
        return 'Add Life Cycle';

      case 'edit': 
        return 'Edit Life Cycle';

      default: 
        return 'Life Cycle';
      break;
    }
  }

  // Checks if the user has permission for a specific lifecycle action
  isActionPermitted(action: string = "") {
    return this.authService.hasPermissionToAccessModule({
      appSlug: 'asher',
      moduleSlug: 'lifecycles',
      permissionSlug: action,
      ignoreRedirection: true,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
