import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UIService } from 'src/app/common/services/ui.service';
import { C4EGlobalDataService } from '../../services/c4e-global-data.service';
import { Subscription } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

interface C4eDetails{
  [key: string]: string;
}

@Component({
  selector: 'app-add-edit-record.',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-edit-record.component.html',
  styleUrl: './add-edit-record.component.scss',
})
export class AddEditRecordComponent implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  showErrors = false;
  c4eDetails: C4eDetails | null = null;

  tableName = '';
  @Input() id = '';

  dynamicForm!: FormGroup;
  selectedTableSubscription: Subscription | undefined;
  columnInfo: Array<any> = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private c4eGlobalDataService: C4EGlobalDataService,
    private uiService: UIService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.selectedTableSubscription =
      this.c4eGlobalDataService.selectedTable$.subscribe({
        next: (tableData) => {
          this.tableName = tableData?.tableName;

          if (this.id) {
            this.columnInfo = tableData?.columnsInfo?.filter(
              (item) =>
                !this.id ||
                (this.id && this.isColumnUpdatePermitted(item.column_name)),
            );
          } else {
            this.columnInfo = tableData?.columnsInfo;
          }

          const formControls = this.columnInfo.reduce((controls: any, col) => {
            controls[col.column_name] = this.getFormControl(
              col.data_type,
              col.is_nullable,
              col.max_length,
            );
            return controls;
          }, {});
          this.dynamicForm = this.fb.group(formControls);
          if (this.id) {
            const rowValue = tableData?.rows.find(
              (row) => row.id == this.id,
            );
            this.setFormValues(rowValue);
          }
        },
      });
    this.c4eDetails = null;
  }

  setFormValues(columnValues: any) {
    for (const key in columnValues) {
      if (this.dynamicForm.contains(key)) {
        this.dynamicForm.get(key)?.setValue(columnValues[key]);
      }
    }
  }

  createFormWithData(rowData: any) {
    const formGroup = this.fb.group({});
    for (const key in rowData) {
      if (rowData.hasOwnProperty(key) && this.isColumnUpdatePermitted(key)) {
        formGroup.addControl(key, this.fb.control(rowData[key]));
      }
    }
    return formGroup;
  }

  isColumnUpdatePermitted(columnName: string) {
    const check = this.c4eGlobalDataService.getPermittedTables()
      ?.find((table: any) => table.name === this.tableName)
      ?.columns?.some((column: any) => column.name === columnName && column.enabled);
    return check;
  }
 
  convertToTitleCase(columnName: string) {
    return this.uiService.convertToTitleCase(columnName);
  }

  /**
   * Handles the form submission for adding a new application.
   */
  async onSubmit() {
    const parsedObject = this.parsePostgresData(this.dynamicForm.value);
    this.showErrors = true;
    if (this.dynamicForm.valid) {
      if (!this.id) {
        await this.c4eGlobalDataService
          .addRecord(parsedObject, this.tableName);
      } else {
        await this.c4eGlobalDataService
          .editRecord(parsedObject, this.tableName, parseInt(this.id));
      }
      this.c4eDetails = this.dynamicForm.value;
      this.dynamicForm.reset();
      this.showErrors = false;
    } else {
      const firstInvalidControl: any = Object.keys(
        this.dynamicForm.controls,
      ).find((key) => this.dynamicForm.controls[key].invalid);
      if (firstInvalidControl) {
        document.getElementById(firstInvalidControl)?.focus();
      }
    }
  }

  getColumnType(columnName: string) {
    const column = this.columnInfo.find( col => col.column_name == columnName);
    switch (column?.data_type?.toLowerCase()) {
      case 'integer':
        return 'number';
      case 'character varying':
      case 'timestamp with time zone':
      case 'text':
      case 'boolean':
      case 'email':
        return 'text';
      default:
        return 'text';
    }
  }

  isColumnRequired(columnName: string) {
    const rowInfo = this.columnInfo.find(
      (rowData) => rowData?.column_name === columnName,
    );
    if (rowInfo) {
      return rowInfo?.is_nullable?.toLowerCase() == 'no';
    }
    return false;
  }

  parsePostgresData(addEditForm: any) {
    const parsedData: any = {};
    Object.entries(addEditForm).forEach((data: any, index: any) => {
      const columnDataType = this.columnInfo?.find(
        (col) => col.column_name == data[0],
      )?.data_type;

      if (columnDataType) {
        switch (columnDataType.toLowerCase()) {
          case 'integer':
            parsedData[data[0]] = Number(data[1]) || null;
            break;
          case 'varchar':
          case 'text':
            parsedData[data[0]] = String(data[1]?.trim());
            break;
          case 'timestamp with time zone':
            parsedData[data[0]] = null;
            // parsedData[data[0]] = new Date(data[1]).toISOString();
            break;
          case 'boolean':
            parsedData[data[0]] = data[1].toLowerCase() === 'true';
            break;
          case 'email':
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            parsedData[data[0]] = emailRegex.test(data[1]) ? data[1] : '';
            break;
          default:
            parsedData[data[0]] = data[1];
            break;
        }
      } else {
        parsedData[data[0]] = data[1];
      }
    });
    return parsedData;
  }

  getFormControl(dataType: string, isNullable: string, maxLength: number) {
    const value = '';
    const isRequired =
      isNullable.toLowerCase() === 'no' ? [Validators.required] : [];

    switch (dataType.toLowerCase()) {
      case 'integer':
        return new FormControl(value, [
          ...isRequired,
          Validators.pattern('^[0-9]*$'),
        ]);
      case 'character varying':
      case 'text':
        return new FormControl(value, [
          ...isRequired,
          Validators.maxLength(maxLength),
        ]);
      case 'timestamp with time zone':
        return new FormControl(value, isRequired);
      case 'boolean':
        return new FormControl(value, isRequired);

      case 'email':
        return new FormControl(value, [...isRequired, Validators.email]);
      default:
        return new FormControl(value, isRequired);
    }
  }

  ngOnDestroy(): void {
    this.selectedTableSubscription?.unsubscribe();
  }
}
