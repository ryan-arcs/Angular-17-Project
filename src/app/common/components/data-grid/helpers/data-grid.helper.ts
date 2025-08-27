import { Injectable } from '@angular/core';
import { GridColumn, GridConfiguration } from '@app/common/interfaces/data-grid.interface';
import { BehaviorSubject, Subject } from 'rxjs';
 
 
@Injectable({
  providedIn: 'root',
})
export class DataGridHelper {
   _tableColumns = new BehaviorSubject<{[key: string]: GridColumn[]}>({});
  tableColumns$ = this._tableColumns.asObservable();
 
  private _allTablesColumns = new BehaviorSubject< {[key: string]: GridColumn[]} >({});
  allTablesColumns$ = this._allTablesColumns.asObservable();
 
  private _triggerAdvanceFilterModal = new Subject<void>();
  triggerAdvanceFilterModal$ = this._triggerAdvanceFilterModal.asObservable();
 
  private _triggerClearAdvanceFilterModal = new Subject<void>();
  triggerClearAdvanceFilterModal$ = this._triggerClearAdvanceFilterModal.asObservable();

  private _reInitializeGridColumn = new Subject<GridColumn[]>();
  reInitializeGridColumn$ = this._reInitializeGridColumn.asObservable();
 
  setColumnsOfGrid(gridConfiguration: GridConfiguration) {
    gridConfiguration.columns = gridConfiguration.columns?.filter((column) => column.prop)?.map((column) => {
      return {
        prop: String(column.prop) || '',
        name: column.name || '',
        hidden: column.hidden || false,
        suppressToggle: column.suppressToggle || false,
        searchable: column.searchable || false,
      }
    }) || [];
    let currentTableColumns:any = this._tableColumns.getValue();
    currentTableColumns[gridConfiguration.gridName] = gridConfiguration.columns;
    
    this._tableColumns.next({ ...currentTableColumns});
    const gridConfigurations = JSON.parse(String(localStorage.getItem('gridConfigurations'))) as Array<GridConfiguration> || [];
    const thisGrid = gridConfigurations?.find((gconfiguration) => gconfiguration.gridName === gridConfiguration.gridName);
    if (thisGrid?.gridName) {
      thisGrid.columns = gridConfiguration.columns;
    } else {
      gridConfigurations.push(gridConfiguration);
    }

    localStorage.setItem('gridConfigurations', JSON.stringify(gridConfigurations));
  }

  initializeDefaultColumnsOfGrid(gridConfiguration: GridConfiguration) {
    const thisGrid = this.getGridConfiguration(gridConfiguration.gridName);
    if (thisGrid?.gridName) {
      let columnsChanged = false;
      gridConfiguration.columns?.forEach(column => {
        if(!thisGrid.columns?.some(gridColumn => gridColumn.prop === column.prop && gridColumn.name === column.name)) {
          columnsChanged = true;
        }
      });
      thisGrid.columns?.forEach(column => {
        if(!gridConfiguration.columns?.some(gridColumn => gridColumn.prop === column.prop && gridColumn.name === column.name)) {
          columnsChanged = true;
        }
      });
      if (columnsChanged) {
        this.setColumnsOfGrid(gridConfiguration);
      } else {
        let currentTableColumns:any = this._tableColumns.getValue();
        currentTableColumns[gridConfiguration.gridName] = thisGrid?.columns;
        this._tableColumns.next(currentTableColumns);
      }
    } else {
      this.setColumnsOfGrid(gridConfiguration);
    }
  }

  getGridConfiguration(gridName: string) {
    const gridConfigurations = JSON.parse(String(localStorage.getItem('gridConfigurations'))) as Array<GridConfiguration> || [];
    return gridConfigurations?.find((gconfiguration) => gconfiguration.gridName === gridName);
  }
  openAdvanceFilterModal(){
    this._triggerAdvanceFilterModal.next();
  }

  clearColumnFilters(){
    this._triggerClearAdvanceFilterModal.next();
  }

  setIntializeGridColumn(columns: GridColumn[]) {
    this._reInitializeGridColumn.next(columns);
  }
}