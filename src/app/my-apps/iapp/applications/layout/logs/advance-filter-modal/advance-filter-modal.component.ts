import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbActiveModal,
  NgbAlertModule,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbTimepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { IappGlobalDataService } from '@app/my-apps/iapp/services/iapp-global-data.service';

@Component({
  selector: 'app-advance-filter-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbAlertModule,
    NgbTimepickerModule,
    CommonModule,
  ],
  providers: [DatePipe],
  templateUrl: './advance-filter-modal.component.html',
  styleUrl: './advance-filter-modal.component.scss',
})
export class AdvanceFilterModalComponent {
  @ViewChild('swiper')
  swipe!: ElementRef;

  @Input() selectedInstanceId: string = '';
  @Input() searchFilterValue: string = '';
  @Input() priorityFilterValue: string = '';
  @Input() startTimeFilterValue!: number;
  @Input() endTimeFilerValue!: number;
  @Input() advanceFilterParams: any = {};
  defaultTime = new Date().setHours(0, 0, 0, 0);

  // defTime=new Date(this.defaultTime.getTime());

  // startDate!: NgbDateStruct;
  // endDate!: NgbDateStruct;
  // startTime = { hour: 0, minute: 0 };
  // endTime = { hour: 0, minute: 0 };
  startFormattedDate: string = '';
  endFormattedDate: string = '';
  startFormattedTime: string = '';
  endFormattedTime: string = '';
  change: boolean = false;

  searchForm: FormGroup;
  currentDate: Date = new Date();
  maxDate: NgbDateStruct = this.getNgbDateStruct(new Date());
  oneDay: Date = new Date(this.currentDate.getTime() - 24 * 60 * 60 * 1000);
  oneHour: Date = new Date(this.currentDate.getTime() - 60 * 60 * 1000);
  oneWeek: Date = new Date(
    this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000,
  );
  oneMonth: Date = new Date(
    this.currentDate.getTime() - 30 * 24 * 60 * 60 * 1000,
  );
  activeModal = inject(NgbActiveModal);
  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private iappGlobalDataService: IappGlobalDataService,
  ) {
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
      startTime: [JSON.stringify({ hour: 10, minute: 10 })],
      endTime: [{ hour: 0, minute: 0 }],
      priority: [''],
      startDate: [''],
      endDate: [''],
    });
  }

  private getNgbDateStruct(date: Date): NgbDateStruct {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  // Method to convert start date to mm-dd-yyyy format.
  getFormattedStartDate(): string {
    const date = this.searchForm.get('startDate')?.value;
    const { month, day, year } = date;
    if (Number(month) && Number(day) && Number(year)) {
      this.startFormattedDate = `${this.padZero(month)}/${this.padZero(day)}/${year}`;
    }
    return this.startFormattedDate;
  }

  getFormattedStartTime(): string {
    const time = this.searchForm.get('startTime')?.value;
    const { hour, minute } = time;
    if (Number(hour) > -1 && Number(minute) > -1) {
      this.startFormattedTime = `${hour}:${minute}`;
    }
    return this.startFormattedTime;
  }

  // Method to convert end date to mm-dd-yyyy format.
  getFormattedEndDate(): string {
    const date = this.searchForm.get('endDate')?.value;
    const { month, day, year } = date;
    if (Number(month) && Number(day) && Number(year)) {
      this.endFormattedDate = `${this.padZero(month)}/${this.padZero(day)}/${year}`;
    }
    return this.endFormattedDate;
  }

  getDefaultTime() {
    const time = this.searchForm.get('startTime')?.value;
    const { hour, minute } = time;
    const hours = time.hour.toString().padStart(2, '0');
    const minutes = time.minute.toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getFormattedEndTime(): string {
    const time = this.searchForm.get('endTime')?.value;
    const { hour, minute } = time;
    if (Number(hour) > -1 && Number(minute) > -1) {
      this.endFormattedTime = `${hour}:${minute}`;
    }
    return this.endFormattedTime;
  }

  // Utility function to add leading zero if needed.
  padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    setTimeout(() => {
      this.swipe.nativeElement.focus();
      this.setSearchForm();
    }, 0);
  }

  setSearchForm() {
    const startTime = new Date(this.startTimeFilterValue);
    const endTime = new Date(this.endTimeFilerValue);
    const defTime = new Date(this.defaultTime);
    this.searchForm.patchValue({
      filter: this.searchFilterValue,
      startDate: {
        month: startTime.getMonth() + 1,
        day: startTime.getDate(),
        year: startTime.getFullYear(),
      },
      startTime: this.startTimeFilterValue
        ? { hour: startTime.getHours(), minute: startTime.getMinutes() }
        : { hour: defTime.getHours(), minute: defTime.getMinutes() },
      endDate: {
        month: endTime.getMonth() + 1,
        day: endTime.getDate(),
        year: endTime.getFullYear(),
      },
      endTime: this.endTimeFilerValue
        ? { hour: endTime.getHours(), minute: endTime.getMinutes() }
        : { hour: defTime.getHours(), minute: defTime.getMinutes() },
      priority: this.priorityFilterValue,
    });
  }

  shootSearch() {
    this.getFormattedStartTime();
    this.getFormattedEndTime();
    this.setFilter(
      this.searchForm.get('filter')?.value,
      this.startFormattedTime,
      this.startFormattedDate,
      this.endFormattedDate,
      this.endFormattedTime,
      this.searchForm.get('priority')?.value,
    );
  }

  setFilter(
    searchText: string,
    startTime: string,
    startDate: string,
    endDate: string,
    endTime: string,
    priority: string,
  ): void {
    this.iappGlobalDataService.resetFilter();
    this.iappGlobalDataService.getLogs({
      searchText: searchText.trim() || undefined,
      startTime: startDate ? startDate + ' ' + startTime : undefined,
      endTime: endDate ? endDate + ' ' + endTime : undefined,
      priority: priority || undefined,
    });
    this.closeModal('submit');
  }

  closeModal(action: string) {
    this.activeModal.close({
      action,
      instanceId: this.selectedInstanceId,
      searchText: this.searchForm.get('filter')?.value?.trim() || '',
      startTime:
        this.startFormattedDate.trim() +
          ' ' +
          (this.startFormattedTime != '0:0' ? this.startFormattedTime : '') ||
        '',
      endTime:
        this.endFormattedDate +
          ' ' +
          (this.endFormattedTime != '0:0' ? this.endFormattedTime : '') || '',
      priority: this.searchForm.get('priority')?.value || '',
    });
  }

  setCustomTime(startTime: Date, endTime: Date) {
    this.searchForm.patchValue({
      startDate: {
        month: startTime.getMonth() + 1,
        day: startTime.getDate(),
        year: startTime.getFullYear(),
      },
      startTime: { hour: startTime.getHours(), minute: startTime.getMinutes() },
      endDate: {
        month: endTime.getMonth() + 1,
        day: endTime.getDate(),
        year: endTime.getFullYear() || '',
      },
      endTime: { hour: endTime.getHours(), minute: endTime.getMinutes() },
    });
  }

  clearFilters() {
    this.iappGlobalDataService.resetFilter();
    this.iappGlobalDataService.getLogs();
    this.endFormattedDate = '';
    this.endFormattedTime = '';
    this.startFormattedDate = '';
    this.startFormattedTime = '';
    this.searchForm.patchValue({
      filter: '',
      priority: '',
    });
    this.closeModal('submit');
  }
}
