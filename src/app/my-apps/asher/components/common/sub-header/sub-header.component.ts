import { Component, Input } from '@angular/core';
import { ColumnFilter, GridPagination, GridSort } from '@app/common/interfaces/data-grid.interface';
import { UIService } from '@app/common/services/ui.service';
import { AsherGlobalDataService } from '@app/my-apps/asher/services';
import { recordsPerPage } from '../../../constants/global.constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@environments/environment';
import { DataGridHelper } from '@app/common/components/data-grid/helpers/data-grid.helper';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DownloadApplicationComponent } from '@app/my-apps/asher/applications/download-application/download-application.component';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Application } from '@app/my-apps/asher/interfaces/global.interface';

@Component({
  selector: 'app-sub-header',
  standalone: true,
  imports: [],
  templateUrl: './sub-header.component.html',
  styleUrl: './sub-header.component.scss'
})
export class SubHeaderComponent {
  advanceFilterForm!: FormGroup;
  columnFilters: ColumnFilter[] = [];
  errorMessage = '';
  searchTerm = "";
  defaultDateFormat = environment?.defaultDateFormat || "MMM d, yyyy h:mm:ss a";
  searchForm: FormGroup;
  gridName = 'applications';
  pagination: GridPagination = {
    currentPage: 1,
    pageNumber: 1,
    pageSize: recordsPerPage.defaultSize,
  };

  gridSort: GridSort = {
    dir: 'desc',
    prop: 'last_modified_at',
  };
  modalRefSubscription: Subscription | undefined;

  @Input() applications: Application[] = [];

  constructor(
    private uiService: UIService,
    private asherGlobalDataService: AsherGlobalDataService,
    private fb: FormBuilder,
    private dataGridHelper: DataGridHelper,
    private modalService: NgbModal,
    private router: Router,


  ) {
    this.searchForm = this.fb.group({
      filter: ['', [Validators.required]],
    });

  }
  // Refreshes the Application list with current search, sort, and filter values
  refreshApplication() {
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

  downloadTableData() {
    const tableColumns = this.dataGridHelper._tableColumns.getValue();
    const orderedColumnsString = (tableColumns?.["applications"] || []).filter(item => item.prop !== 'action' && !item.hidden).map(item => `${item.prop}:${item.name}`).join(",");

    const payload = {
      globalSearch: this.searchForm.get('filter')?.value?.trim() || '',
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters || [],
      pagination: {
        pageIndex: 1,
        pageSize: this.pagination?.pageSize || recordsPerPage.defaultSize,
      },
    }
    const modalRef = this.modalService.open(DownloadApplicationComponent, {
      windowClass: 'mwl',
      backdropClass: 'mwl',
      backdrop: 'static',
    });
    modalRef.componentInstance.defaultName = `applications-${this.asherGlobalDataService.currentDate()}`;

    this.modalRefSubscription = modalRef.closed.subscribe(async (data) => {
      if (data.action === 'SUBMIT') {
        this.asherGlobalDataService.downloadTableData({
          ...payload,
          fileName: data.fileName,
          orderedColumns: orderedColumnsString
        });
        if (this.searchForm.get('filter')?.value?.trim() != this.searchTerm) {
          this.asherGlobalDataService.getApplicationList(payload);
        }
      }
    });
  }
  // Navigates to the Add ASHER Application form
  navigateToAddApplication() {
    this.router.navigate(['asher/applications/add']);
  }

  // Triggers globalSearch with current filters, sorting, and resets to first page
  shootSearch() {
    this.pagination.pageNumber = 1;
    this.searchTerm = this.searchForm.get('filter')?.value?.trim() || ''
    this.asherGlobalDataService.getApplicationList({
      globalSearch: this.searchTerm,
      sortColumn: this.gridSort.prop,
      sortDirection: this.gridSort.dir,
      columnFilters: this.columnFilters  || [],
      pagination: {
        pageIndex: this.pagination.pageNumber || 1,
        pageSize: this.pagination.pageSize || recordsPerPage.defaultSize,
      },
    });
  }

}
