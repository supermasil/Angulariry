import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from "@angular/core";
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { GlobalConstants } from 'src/app/global-constants';
import { InPersonSubTrackingModel } from 'src/app/models/tracking-models/in-person-tracking.model';
import { OnlineTrackingModel } from 'src/app/models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from 'src/app/models/tracking-models/serviced-tracking.model';


@Component({
  selector: 'consolidation-table',
  templateUrl: './consolidation-table.component.html',
  styleUrls: ['./consolidation-table.component.css', '../tracking-create-edit.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})), // After sort is clicked, the state is void
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('3s cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ConsolidationTableComponent implements OnInit, AfterViewChecked {
  definedColumns: string[] = ['select', 'trackingNumber', 'trackingStatus', 'financialStatus', 'recipientsaddress'];

  expandedElement: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>;
  filterDataSource = [];
  selection = new SelectionModel<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>(true, []);
  filterselection = new SelectionModel<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>(true, []);
  isAllSelected = false;
  globalConstants = GlobalConstants;

  @Input() tableDataObservable: Observable<OnlineTrackingModel[] | ServicedTrackingModel[] | InPersonSubTrackingModel[]> = new Observable();
  @Input() deselectItemObservable: Observable<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel> = new Observable();
  @Output() selectionEmitted: EventEmitter<any> = new EventEmitter();

  constructor(
    private cd: ChangeDetectorRef
  ) {
    // Assign the data to the data source for the table to render

  }

  ngOnInit() {
    this.tableDataObservable.subscribe((data: OnlineTrackingModel[] | ServicedTrackingModel[] | InPersonSubTrackingModel[]) => {
      // this.resetData();
      this.updateData(data);
    });

    this.deselectItemObservable.subscribe((row: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel) => {
      this.rowSelectionClicked(row);
    })
  }

  public resetData() {
    this.isAllSelected = false;
    this.filterselection.clear();
    this.selection.clear();
    this.dataSource = new MatTableDataSource([]);
    this.filterDataSource = [];
  }


  ngAfterViewChecked() {
    this.cd.detectChanges();
  }


  updateData(data: any) {
    this.dataSource = new MatTableDataSource(data);
    // this.dataSource.filterPredicate = (data: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel, filter: string) => {
    //   return data.OrderNumber.includes(filter);
    // };

    this.filterDataSource = this.dataSource.filteredData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.expandedElement = null;
    // Sort needs to be set after datasource is set
    // Don't ever use detectChanges on table, it will delay stuff

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.filterDataSource = this.dataSource.filteredData;

    this.refreshFilteredSelection();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.expandedElement = null;

  }

  sortClicked() {
    this.expandedElement = null;
  }

  refreshFilteredSelection() {
    this.filterselection.clear();
    this.filterDataSource.forEach(row => {
      if (this.selection.isSelected(row)) {
        this.filterselection.select(row);
      }
    });
    this.allSelectCheck();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  allSelectCheck() {
    const numRows = this.filterDataSource.length;
    const numSelected = this.filterselection.selected.length;
    this.isAllSelected = numSelected === numRows;
    this.selectionEmitted.emit(this.selection.selected);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected) {
      this.filterDataSource.forEach(row => this.selection.deselect(row));
      this.filterselection.clear();
    } else {
      this.filterDataSource.forEach(row => this.selection.select(row));
      this.filterDataSource.forEach(row => this.filterselection.select(row));
    }
    this.allSelectCheck();
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel): string {
    if (!row) {
      return `${this.isAllSelected ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.trackingNumber + 1}`;
  }

  rowSelectionClicked(row?: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel) {
    this.selection.toggle(row);
    this.filterselection.toggle(row);
    this.allSelectCheck();
    this.selectionEmitted.emit(this.selection.selected);
  }
}
