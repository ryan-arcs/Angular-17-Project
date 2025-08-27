import {
  Component,
  DoCheck,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-columns-toggle-modal',
  standalone: true,
  imports: [],
  templateUrl: './columns-toggle-modal.component.html',
  styleUrl: './columns-toggle-modal.component.scss',
})
export class ColumnsToggleModalComponent implements OnInit, DoCheck {
  activeModal = inject(NgbActiveModal);

  @Input() applicationColumnDefs: any;
  @Input() toggleColumns: any;

  checkedAll: boolean = false;

  ngOnInit(): void {
    this.changeCheckedAll();
  }

  ngDoCheck(): void {
    this.changeCheckedAll();
  }

  checkAllColumns() {
    this.checkedAll = !this.checkedAll;
    this.applicationColumnDefs.forEach((col: any) => {
      if (col.headerName !== 'Action') {
        col.hide = !this.checkedAll;
      }
    });
    this.applicationColumnDefs.forEach((col: any) => {
      if (col.headerName !== 'Action') {
        this.toggleColumns(
          { target: { checked: this.checkedAll } },
          col.headerName,
        );
      }
    });
    this.changeCheckedAll();
  }

  changeCheckedAll() {
    this.checkedAll = this.applicationColumnDefs?.every((col: any) => {
      if (col.headerName !== 'Action') {
        return !col.hide;
      }
      return true;
    });
  }
}
