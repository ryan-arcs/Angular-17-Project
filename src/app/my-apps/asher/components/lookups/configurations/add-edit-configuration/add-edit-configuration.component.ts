import { Component, QueryList, ViewChildren } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { AddConfiguationsPayload } from '@app/my-apps/asher/interfaces/global.interface';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UIService } from '@app/common/services/ui.service';

@Component({
  selector: 'app-add-edit-configuration',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgSelectModule, CommonModule],
  templateUrl: './add-edit-configuration.component.html',
  styleUrl: './add-edit-configuration.component.scss'
})
export class AddEditConfigurationComponent {
  activeField = '';
  notificationForm!: FormGroup;
  showErrors: boolean = false;
  @ViewChildren('inputElement') inputElements?: QueryList<any>;
  subscriptions: Subscription = new Subscription();
  rowId: any;
  notificationEventName: string = ""

  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  constructor(
    private fb: FormBuilder,
    private asherGlobalDataService: AsherGlobalDataService,
    private router: Router,
    private route: ActivatedRoute,
    private uiService: UIService,
  ) {
    this.notificationForm = this.fb.group({
      notificationEvent: ['', Validators.required],
      initialTriggerDays: ['', [Validators.required, Validators.min(0)]],
      repeatFrequencyDays: ['', [Validators.required, Validators.min(1)]],
      threshold: ['', Validators.required],
      emailTo: [''],
      emailCc: [''],
      emailBcc: [''],
      adminEmail: ['', [Validators.required]],
      emailSubject: ['', Validators.required],
      emailBody: ['', [Validators.required]],
      emailReminderSubject: [''],
      emailReminderBody: [''],
      attribute1: [''],
      attribute2: [''],
      attribute3: [''],
      attribute4: [''],
      attribute5: [''],
      recordStatus: ['', [Validators.required]],
    });
    this.notificationForm.get('notificationEvent')?.disable();
  }

  async ngOnInit(): Promise<void> {
    this.rowId = this.route.snapshot.paramMap.get('id') || '';
    if(this.rowId){
      await this.asherGlobalDataService.getConfigurationsDetails({id: this.rowId});
      this.subscriptions.add(
        this.asherGlobalDataService.configurationsDetails$.subscribe({
          next: (value)=>{
            this.notificationEventName = value?.notification_event
            this.notificationForm.patchValue({
              notificationEvent: value?.notification_event,
              initialTriggerDays:  value?.initial_trigger_days,
              repeatFrequencyDays:  value?.repeat_frequency_days,
              recordStatus:value?.record_status,
              threshold: value?.threshold,
              emailTo: value?.email_to,
              emailCc: value?.email_cc,
              emailBcc: value?.email_bcc,
              adminEmail: value?.admin_email,
              emailSubject:value?.email_subject,
              emailBody:value?.email_body,
              emailReminderSubject: value?.email_reminder_subject,
              emailReminderBody: value?.email_reminder_body,
              attribute1:value?.attribute_1,
              attribute2:value?.attribute_2,
              attribute3:value?.attribute_3,
              attribute4:value?.attribute_4,
              attribute5:value?.attribute_5,
            })
          }
        })
      )
    }

  }

  submitNotification(){
    this.showErrors = true;
    if(this.notificationForm.valid){
      const notificationData: AddConfiguationsPayload = {
        notification_event: this.notificationForm.get('notificationEvent')?.value.toString().trim(),
        initial_trigger_days: this.notificationForm.get('initialTriggerDays')?.value.toString(),
        repeat_frequency_days: this.notificationForm.get('repeatFrequencyDays')?.value.toString(),
        threshold: this.notificationForm.get('threshold')?.value.toString() || "",
        email_to: this.notificationForm.get('emailTo')?.value || "",
        email_cc: this.notificationForm.get('emailCc')?.value || "",
        email_bcc: this.notificationForm.get('emailBcc')?.value,
        admin_email: this.notificationForm.get('adminEmail')?.value,
        email_subject: this.notificationForm.get('emailSubject')?.value,
        email_body: this.notificationForm.get('emailBody')?.value,
        email_reminder_subject: this.notificationForm.get('emailReminderSubject')?.value,
        email_reminder_body: this.notificationForm.get('emailReminderBody')?.value,
        attribute_1: this.notificationForm.get('attribute1')?.value,
        attribute_2: this.notificationForm.get('attribute2')?.value,
        attribute_3: this.notificationForm.get('attribute3')?.value,
        attribute_4: this.notificationForm.get('attribute4')?.value,
        attribute_5: this.notificationForm.get('attribute5')?.value,
        record_status: this.notificationForm.get('recordStatus')?.value,
      };

    const apiCall = this.asherGlobalDataService.updateConfigurations({ ...notificationData, id: parseInt(this.rowId) })
        
      apiCall.then((res: any) => {
        if(!res || !res?.id) return ;
        this.showErrors = false;
        this.router.navigate([`/asher/configurations`]);
        this.notificationForm.reset();
      })
    }
    else{
      const firstControl = this.inputElements
      ?.toArray()
      .find((input) =>
        input?.nativeElement?.classList?.value?.includes('ng-invalid') || input?.element?.classList?.value?.includes('ng-invalid'),
      );

    if (firstControl) {
      if (firstControl?.nativeElement) {
        firstControl?.nativeElement?.focus();
      } else {
        firstControl?.open();
      }
    }
    }
  }

  // Resets the lifecycles list and clears the active field.
  reinitializeConfigStatus() {
    this.activeField = '';
  }

  // Sets the class for the selected field.
  setClassToLabel(field: string) {
    this.activeField = field;
  }

  navigateToConfigurations(){
    this.uiService.goBack();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }

}
