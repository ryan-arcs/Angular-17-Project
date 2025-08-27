import { AfterViewInit, ChangeDetectorRef, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ColumnFilter,
  GridColumn,
  GridConfiguration,
} from 'src/app/common/interfaces/data-grid.interface';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataGridHelper } from '@app/common/components/data-grid/helpers/data-grid.helper';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AsherGlobalDataService } from '@app/my-apps/asher/services/asher-global-data.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

interface lastInputValue {
  value: string;
  showError: boolean;
}

@Component({
  selector: 'app-advance-filter-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectModule, CommonModule],
  templateUrl: './advance-filter-modal.component.html',
  styleUrl: './advance-filter-modal.component.scss',
})
export class AdvanceFilterModalComponent implements OnInit, AfterViewInit , OnDestroy {
  activeModal = inject(NgbActiveModal);
  gcHelper = inject(DataGridHelper);
  formBuilder = inject(FormBuilder);
  asherGlobalDataService = inject(AsherGlobalDataService);
  cdr = inject(ChangeDetectorRef);

  private subscriptions: Subscription = new Subscription();

  @Input() gridName: string = '';
  @Input() columnFilters!: ColumnFilter[];

  gridConfiguration?: GridConfiguration;
  allColumnsOriginal: GridColumn[] = [];
  allColumns: GridColumn[] = [];
  selectedColumns: string[] = [];
  showErrors = false;
  advanceFilterForm!: FormGroup;
  lastInputValues: lastInputValue[] = [];

  ngOnInit(): void {
    // const watchTrigggerClearAdvanceFilterModal = this.gcHelper.triggerClearAdvanceFilterModal$.subscribe(() => {
    //   this.clearFilters();
    // });
    // this.subscriptions.add(watchTrigggerClearAdvanceFilterModal);

    // this.advanceFilterForm = this.formBuilder.group({
    //   filters: this.formBuilder.array(
    //     this.columnFilters.map((filter: ColumnFilter) => {
    //       return this.formBuilder.group({
    //         columnName: [filter.columnName, Validators.required],
    //         searchTags: [filter.searchTags],
    //       });
    //     })
    //   )
    // });

    // this.lastInputValues = new Array(this.columnFilters?.length).fill({value: '', showError: true});
    
    // this.gridConfiguration = this.gcHelper.getGridConfiguration(
    //   this.gridName || '',
    // );
    // this.allColumnsOriginal = this.gridConfiguration?.columns?.filter(
    //   (column: GridColumn) => column.searchable !== false
    // ) || [];
    
    // this.allColumns = [...this.allColumnsOriginal];
  }

  ngAfterViewInit(): void {
    this.initializeSelectedColumns();
    this.cdr.detectChanges();
  }
  
  initializeSelectedColumns() {
    this.columnFilters.forEach((column: ColumnFilter)=>{
      this.selectedColumns.push(column.columnName);
    })    
    this.updateAvailableColumns();
  }

  addForm() {
    const columnFormGroup = this.formBuilder.group({
      columnName: [null, Validators.required],
      searchTags: [null],
    });
    this.getAdvanceFilterForm().push(columnFormGroup);
    this.lastInputValues.push({value: '', showError: true});
  }

  applyFilter() {
    if (this.advanceFilterForm.invalid || this.isAnySearchTagFieldEmpty()) {
      this.showErrors = true;
      return;
    }

    let advanceFilterFormValues = this.advanceFilterForm?.value?.filters;
    // advanceFilterFormValues?.forEach((filter: ColumnFilter, index: number) => {
    //   if(this.lastInputValues?.[index]?.value && !(filter.searchTags?.includes(this.lastInputValues?.[index]?.value))){
    //     if(!advanceFilterFormValues[index].searchTags){
    //       advanceFilterFormValues[index].searchTags = [];
    //     }
    //     advanceFilterFormValues[index].searchTags.push(this.lastInputValues[index].value);
    //   }
    // });

    this.activeModal.close({
      action: 'SUBMIT',
      data: {
        columnFilters: advanceFilterFormValues,
      }
    });
  }

  onColumnChange(index: number) {
    const selectedColumn = this.getAdvanceFilterForm()
    .at(index)
    .get('columnName')?.value;
    if (selectedColumn) {
      if (!this.selectedColumns.includes(selectedColumn)) {
        this.selectedColumns = [...this.selectedColumns, selectedColumn];
      }
      this.updateAvailableColumns();
    }
  }

  deleteFilter(index: number) {
    const deletedColumn = this.getAdvanceFilterForm()
      .at(index)
      .get('columnName')?.value;
    this.getAdvanceFilterForm().removeAt(index);
    if (deletedColumn) {
      this.selectedColumns = this.selectedColumns.filter(
        (col) => col !== deletedColumn,
      );
      this.updateAvailableColumns();
    }
    if (this.getAdvanceFilterForm().length === 0) {
      this.clearFilters();
    }
    this.lastInputValues.splice(index, 1);
  }

  private updateAvailableColumns() {
    this.allColumns = this.allColumnsOriginal.filter(
      (column:any) => !this.selectedColumns.includes(column.prop),
    );
  }

  clearFilters() {
    this.lastInputValues = [];
    this.activeModal.close({
      action: 'SUBMIT',
      data: {
        columnFilters: []
      }, 
    });
  }

  getAdvanceFilterForm() {
    return this.advanceFilterForm.get('filters') as FormArray;
  }

  getColumnName(prop: string): string {
    const column = this.allColumnsOriginal.find(col => col.prop === prop);
    return column ? column.name as string : prop;
  }
  
  isColumnSelected(columnProp: string, currentIndex: number): boolean {
    return this.getAdvanceFilterForm().controls
      .some((control, index) => 
        index !== currentIndex && 
        control.get('columnName')?.value === columnProp
      );
  }

  addTagFn(searchText: any) {
		return searchText;
	}

  checkInvalidFormError(value: any, index: number){
    if(!this.lastInputValues[index]?.value && value?.length == 0){
      this.lastInputValues[index].showError = true;
    }
  }

  storeLastInput(event: any, index: number){
    const inputValue = (event.target as HTMLInputElement).value;
    if(inputValue){
      this.lastInputValues[index] = { value: inputValue, showError: false };
    }
    else{
      this.lastInputValues[index] = { value: '', showError: this.advanceFilterForm.value?.[index]?.searchTags?.length == 0 ? false : true};
    }
  }

  clearSearchTag(index: number){
    this.lastInputValues[index] = { value: '', showError: true };
  }

  isAnySearchTagFieldEmpty(): boolean {
    // let isAnySearchTagFieldInvalid = false;
    // const advanceFilterFormValues = this.getAdvanceFilterForm().value;
    // advanceFilterFormValues?.forEach((filter: ColumnFilter, index: number) => {
    //   if (!this.lastInputValues[index]?.value && !(filter?.searchTags && filter?.searchTags?.length > 0)) {
    //     this.lastInputValues[index].showError = true;
    //     isAnySearchTagFieldInvalid = true;
    //   }
    // });
    // return isAnySearchTagFieldInvalid;
    return true;
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.unsubscribe();
  }
}
