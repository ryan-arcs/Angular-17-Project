import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-ng-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './ng-select.component.html',
  styleUrl: './ng-select.component.scss',
})
export class NgSelectCustomComponent implements AfterViewInit  {
  @Input({required: true}) mode: 'dropdown' | 'multitag' = 'dropdown';

  // Common inputs
  @Input() items: any[] = [];
  @Input() bindLabel: string = 'name';
  @Input() bindValue: string = 'code';
  @Input() class: string = '';
  @Input() model: any;
  @Input() focus: boolean = false;
  @ViewChild('NGCustomSelect') mySelect?: NgSelectComponent;
  @Output() modelChange = new EventEmitter<any>();

  // Dropdown specific
  @Input() hideSelected: boolean = true;
  @Input() clearable: boolean = false;

  // Multi-tag specific
  @Input() multiple: boolean = true;
  @Input() placeholder: string = 'Search here...';
  @Input() isInvalidClassActive: boolean = false;

  @Output() clear = new EventEmitter<void>();
  @Output() input = new EventEmitter<any>();

  ngAfterViewInit() {
    if (this.focus) {
      this.mySelect?.focus();
    }
  }

  onClear() {
    this.clear.emit();
  }

  addTagFn(searchText: any) {
    return searchText;
  }

  onInputChange(event: any) {
    this.input.emit(event);
  }
}
