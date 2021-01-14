import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'consolidated-form-create',
  templateUrl: './consolidated.component.html',
  styleUrls: ['./consolidated.component.css', '../tracking-create-edit.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})), // After sort is clicked, the state is void
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('3s cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ConsolidatedFormCreateComponent implements OnInit, AfterViewInit {
  consolidatedForm: FormGroup;

  definedColumns: string[] = ['select', 'CustomerCode', 'OrderNumber', 'CreationDate'];
  displayedColumns: string[] = ['select', 'Customer Code', 'Order Number', 'Creation Date'];

  customerCodes = ["Alex", "John", "Kay"];
  internalStatus = ["Received at US WH", "Consolidated"];

  expandedElement: TrackingRow | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<TrackingRow>;
  filterDataSource = [];
  selection = new SelectionModel<TrackingRow>(true, []);
  filterselection = new SelectionModel<TrackingRow>(true, []);
  isAllSelected = false;
  selectedTabIndex = 0;


  finalizingDataSource: MatTableDataSource<TrackingRow>;
  finalizingDefinedColumns: string[] = ['OrderNumber', 'Weight', 'Cost'];

  constructor() {
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(ELEMENT_DATA);
    this.filterDataSource = this.dataSource.filteredData;

    this.finalizingDataSource = new MatTableDataSource([]);
  }

  ngOnInit() {
    this.consolidatedForm = new FormGroup({
      trackingNumber: new FormControl({value: "csl-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}, {validators: [Validators.required]}),
      status: new FormControl(null, {validators: [Validators.required]})
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    this.finalizingDataSource.data = this.selection.selected;
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
  checkboxLabel(row?: TrackingRow): string {
    if (!row) {
      return `${this.isAllSelected ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  rowSelectionClicked(row?: TrackingRow) {
    this.selection.toggle(row);
    this.filterselection.toggle(row);
    this.allSelectCheck();

    this.finalizingDataSource.data = this.selection.selected;
  }

}

export interface TrackingRow {
  position: number,
  CustomerCode: string;
  OrderNumber: string;
  Status: string;
  CreationDate: string;
  description: string;
}

const ELEMENT_DATA: TrackingRow[] = [
  {
    position: 1,
    CustomerCode: "JMD12323212",
    OrderNumber: "sev-12234323423",
    Status: 'Delivered',
    CreationDate: '10/12/2020',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  },
  {
    position: 2,
    CustomerCode: "JMD122131312",
    OrderNumber: "sev-12234323423",
    Status: 'Delivered',
    CreationDate: '10/12/2020',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  },
  {
    position: 3,
    CustomerCode: "JMD1232323112",
    OrderNumber: "sev-12234323423",
    Status: 'Delivered',
    CreationDate: '10/12/2020',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  },
  {
    position: 4,
    CustomerCode: "JMD123232312",
    OrderNumber: "sev-12234323423",
    Status: 'Delivered',
    CreationDate: '10/12/2020',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  },
  {
    position: 5,
    CustomerCode: "JMD123232212",
    OrderNumber: "sev-12234323423",
    Status: 'Delivered',
    CreationDate: '10/12/2020',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  },
  {
    position: 6,
    CustomerCode: "JMD123123112",
    OrderNumber: "sev-12234323423",
    Status: 'Delivered',
    CreationDate: '10/12/2020',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  }
];
