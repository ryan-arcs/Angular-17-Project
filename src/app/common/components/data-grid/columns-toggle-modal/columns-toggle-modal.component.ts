import { Component, inject, Input, OnInit } from '@angular/core';
import { GridColumn, GridConfiguration } from 'src/app/common/interfaces/data-grid.interface';
import { DataGridHelper } from '../helpers/data-grid.helper';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-columns-toggle-modal',
  standalone: true,
  templateUrl: './columns-toggle-modal.component.html',
  styleUrl: './columns-toggle-modal.component.scss'
})
export class ColumnsToggleModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  gcHelper = inject(DataGridHelper);
  gridConfiguration?: GridConfiguration;
  gridColumns: GridColumn[] = [];
  @Input() originalColumn: GridColumn[] = []
  @Input() gridName: string = '';
  
  ngOnInit(): void {
    this.gridConfiguration = this.gcHelper.getGridConfiguration(this.gridName || '');
    this.gridColumns = this.gridConfiguration?.columns || [];
  }

  toggle(col: GridColumn) {
    col.hidden = !col.hidden;
    if(this.gridConfiguration){
      const thisColumn = this.gridConfiguration.columns?.find((column) => column.prop === col.prop);
      if(thisColumn?.prop){
        thisColumn.hidden = col.hidden;
      }
      this.gcHelper.setColumnsOfGrid(this.gridConfiguration);
    }
  }

  resetToOriginalColumn() {
    const gridConfigurations = JSON.parse(String(localStorage.getItem('gridConfigurations'))) as Array<GridConfiguration> || [];
    const currentGridConfigurations = gridConfigurations?.filter((gridValue)=>gridValue.gridName!=this.gridName);
    localStorage.setItem('gridConfigurations', JSON.stringify(currentGridConfigurations));
     this.gridColumns = this.originalColumn.map(column => ({
      ...column,
      hidden: column.hidden || false
    }));
    this.gcHelper.setIntializeGridColumn(this.originalColumn);
  }

  toggleAllColumns(hidden: boolean) {
    if(this.gridConfiguration){
      this.gridConfiguration.columns = this.gridConfiguration.columns?.map((tableColumn) => {
        return {
          ...tableColumn,
          hidden: tableColumn.suppressToggle ? tableColumn.hidden : hidden
        }
      });
      this.gridColumns = this.gridConfiguration?.columns || [];
      this.gcHelper.setColumnsOfGrid(this.gridConfiguration);
    }
  }

  anyColumnHidden() {
    return this.gridConfiguration?.columns?.some((tableColumn) => tableColumn.hidden);
  }

  filterColumns(event: any){
    const searchText = event.target?.value?.toLowerCase();
    
    if(this.gridConfiguration){
      this.gridColumns = this.gridConfiguration.columns?.filter((column)=> column?.name?.toLowerCase().includes(searchText)) || [];
    }
    
  }
}
