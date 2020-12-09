import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, ViewChild } from "@angular/core";
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'consolidated-form-create',
  templateUrl: './consolidated-form.component.html',
  styleUrls: ['./consolidated-form.component.css', '../tracking-create.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})), // After sort is clicked, the state is void
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('3s cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class consolidatedFormCreateComponent implements AfterViewInit {
  consolidatedForm: FormGroup;

  displayedColumns: string[] = ['select', 'name', 'weight', 'symbol', 'position'];
  expandedElement: PeriodicElement | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<PeriodicElement>;
  filterDataSource = [];
  selection = new SelectionModel<PeriodicElement>(true, []);
  filterselection = new SelectionModel<PeriodicElement>(true, []);

  isAllSelected = false;

  constructor() {
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(ELEMENT_DATA);
    this.filterDataSource = this.dataSource.filteredData;
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
  checkboxLabel(row?: PeriodicElement): string {
    if (!row) {
      return `${this.isAllSelected ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  rowSelectionClicked(row?: PeriodicElement) {
    this.selection.toggle(row);
    this.filterselection.toggle(row);
    this.allSelectCheck();
  }
}

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
  description: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 1,
    name: 'Hydrogen',
    weight: 1.0079,
    symbol: 'H',
    description: `Hydrogen is a chemical element with symbol H and atomic number 1. With a standard
        atomic weight of 1.008, hydrogen is the lightest element on the periodic table.`
  }, {
    position: 2,
    name: 'Helium',
    weight: 4.0026,
    symbol: 'He',
    description: `Helium is a chemical element with symbol He and atomic number 2. It is a
        colorless, odorless, tasteless, non-toxic, inert, monatomic gas, the first in the noble gas
        group in the periodic table. Its boiling point is the lowest among all the elements.`
  }, {
    position: 3,
    name: 'Lithium',
    weight: 6.941,
    symbol: 'Li',
    description: `Lithium is a chemical element with symbol Li and atomic number 3. It is a soft,
        silvery-white alkali metal. Under standard conditions, it is the lightest metal and the
        lightest solid element.`
  }, {
    position: 4,
    name: 'Beryllium',
    weight: 9.0122,
    symbol: 'Be',
    description: `Beryllium is a chemical element with symbol Be and atomic number 4. It is a
        relatively rare element in the universe, usually occurring as a product of the spallation of
        larger atomic nuclei that have collided with cosmic rays.`
  }, {
    position: 5,
    name: 'Boron',
    weight: 10.811,
    symbol: 'B',
    description: `Boron is a chemical element with symbol B and atomic number 5. Produced entirely
        by cosmic ray spallation and supernovae and not by stellar nucleosynthesis, it is a
        low-abundance element in the Solar system and in the Earth's crust.`
  }, {
    position: 6,
    name: 'Carbon',
    weight: 12.0107,
    symbol: 'C',
    description: `Carbon is a chemical element with symbol C and atomic number 6. It is nonmetallic
        and tetravalent—making four electrons available to form covalent chemical bonds. It belongs
        to group 14 of the periodic table.`
  }, {
    position: 7,
    name: 'Nitrogen',
    weight: 14.0067,
    symbol: 'N',
    description: `Nitrogen is a chemical element with symbol N and atomic number 7. It was first
        discovered and isolated by Scottish physician Daniel Rutherford in 1772.`
  }, {
    position: 8,
    name: 'Oxygen',
    weight: 15.9994,
    symbol: 'O',
    description: `Oxygen is a chemical element with symbol O and atomic number 8. It is a member of
         the chalcogen group on the periodic table, a highly reactive nonmetal, and an oxidizing
         agent that readily forms oxides with most elements as well as with other compounds.`
  }, {
    position: 9,
    name: 'Fluorine',
    weight: 18.9984,
    symbol: 'F',
    description: `Fluorine is a chemical element with symbol F and atomic number 9. It is the
        lightest halogen and exists as a highly toxic pale yellow diatomic gas at standard
        conditions.`
  }, {
    position: 10,
    name: 'Neon',
    weight: 20.1797,
    symbol: 'Ne',
    description: `Neon is a chemical element with symbol Ne and atomic number 10. It is a noble gas.
        Neon is a colorless, odorless, inert monatomic gas under standard conditions, with about
        two-thirds the density of air.`
  },
];
