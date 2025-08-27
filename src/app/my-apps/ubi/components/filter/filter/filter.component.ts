import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateFilter } from '@app/my-apps/ubi/interfaces';
import { NgbActiveModal, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [ReactiveFormsModule, NgbDatepickerModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  dateFilterForm!: FormGroup; 
  @Input() dateFilter!: DateFilter;

  constructor(
    private fb: FormBuilder
  ) {
    this.dateFilterForm = this.fb.group({
      modifiedAfter: [''],
      modifiedBefore: [''],
      createdAfter: [''],
      createdBefore: ['']
    });
  }

  ngOnInit() {
    const controls: (keyof DateFilter)[] = ['modifiedAfter', 'modifiedBefore', 'createdAfter', 'createdBefore'];
    controls.forEach(controlName => {
      const value = this.dateFilter[controlName];
      if (typeof value === 'string' && value) {
        const dateObj = this.convertStringToDate(value);
        if (dateObj) this.dateFilterForm.get(controlName)?.setValue(dateObj);
      }
    });
  }

  convertStringToDate(dateString: string) {
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return isNaN(year) || isNaN(month) || isNaN(day) ? '' : { year, month, day };
  }

  applyFilter() {
    const controls: (keyof DateFilter)[] = ['modifiedAfter', 'modifiedBefore', 'createdAfter', 'createdBefore'];
    controls.forEach(controlName => {
      const date = this.dateFilterForm.get(controlName)?.value;
      this.dateFilter[controlName] = date?.year && date?.month && date?.day ? 
        `${date.year}-${date.month < 10 ? '0' + date.month : date.month}-${date.day < 10 ? '0' + date.day : date.day}` : '';
    });
    
    this.activeModal.close({
      action: 'SUBMIT',
      data: { dateFilters: this.dateFilter }
    });
  }

  isObjectEmpty(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!this.isObjectEmpty(obj[key])) {
          return false;
        }
      } else if (obj[key]) {
        return false;
      }
    }
    return true;
  }

  clearDate(key: string){
    this.dateFilterForm.get(key)?.setValue('');
  }

  clearFilter(){
    this.dateFilterForm.reset();
    this.activeModal.close({
      action: 'SUBMIT',
      data: { dateFilters: this.dateFilterForm.value }
    });
  }
  
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    this.dateFilterForm.reset();
  }
}