import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { FileUploaderComponent } from 'src/app/file-uploader/file-uploader.component';
import { OrganizationModel } from 'src/app/models/organization.model';
import { GeneralInfoModel } from 'src/app/models/tracking-models/general-info.model';
import { InPersonTrackingModel } from 'src/app/models/tracking-models/in-person-tracking.model';
import { OnlineTrackingModel } from 'src/app/models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from 'src/app/models/tracking-models/serviced-tracking.model';
import { UserModel } from 'src/app/models/user.model';
import { TrackingService } from '../../tracking.service';
import { GeneralInfoComponent } from '../general-info/general-info.component';


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

  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;
  @ViewChild('generalInfo', {static: false}) generalInfo: GeneralInfoComponent;

  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;
  users: UserModel[];

  defaultLocationsSubject = new ReplaySubject<string[]>();
  customerCodesSubject = new ReplaySubject<string[]>();
  selectedUserIdSubject = new ReplaySubject<string>();

  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  updateExistingImagesSubject = new ReplaySubject<string[]>();
  statusChangeSubject = new ReplaySubject<string>();

  currentTracking: OnlineTrackingModel; // edit case
  mode = "create";

  showTable = false;

  onlineTrackings: OnlineTrackingModel[];



  definedColumns: string[] = ['select', 'trackingNumber', 'generalInfo', '123'];
  displayedColumns: string[] = ['select', 'Tracking Number', 'Origin', 'Destination'];

  customerCodes = ["Alex", "John", "Kay"];
  internalStatus = ["Received at US WH", "Consolidated"];

  expandedElement: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>;
  filterDataSource = [];
  selection = new SelectionModel<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>(true, []);
  filterselection = new SelectionModel<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>(true, []);
  isAllSelected = false;
  selectedTabIndex = 0;


  finalizingDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>;
  finalizingDefinedColumns: string[] = ['trackingNumber', 'Weight', 'Cost'];

  constructor(
    private zone: NgZone,
    private authService: AuthService,
    private route: ActivatedRoute,
    private trackingService: TrackingService,
    private cd: ChangeDetectorRef
  ) {
    // Assign the data to the data source for the table to render

  }

  ngOnInit() {
    this.consolidatedForm = this.createConcolidatedForm();
    this.trackingNumeberSubject.next("csl-" + Date.now() + Math.floor(Math.random() * 10000));

    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.selectedUserIdSubject.next(user._id);
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.defaultLocationsSubject.next(org.locations.map(item => item.name));
        this.authService.getUsersByOrg(org._id).subscribe((users: UserModel[] ) => {
          this.users = users;
          this.usersSubject.next(users);
          this.customerCodesSubject.next(users.map(user => user.customerCode));
            this.route.paramMap.subscribe((paramMap) => {
              if (paramMap.has('trackingId')) {
                this.trackingService.getTracking(paramMap.get('trackingId'), this.organization._id).subscribe((response: OnlineTrackingModel) => {
                  this.currentTracking = response;
                  this.mode = "edit"
                  this.emitChanges();
                }, error => {
                  this.authService.redirect404();
                });
              }
            }, error => {
              this.authService.redirect404();
            });
          this.trackingService.getTrackings(10, 1, "onl", this.organization._id, "Oregon", "California").subscribe((transformedTrackings) => {
            this.onlineTrackings = transformedTrackings.trackings;
            console.log(this.onlineTrackings);
            this.updateData(this.onlineTrackings);
          });;

        }, error => {
          this.authService.redirectOnFailedSubscription("Couldn't fetch users");
        })
      }, error => {
        this.authService.redirectOnFailedSubscription("Couldn't fetch organization");
      });
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch user");
    });



  }

  createConcolidatedForm() {
    let form = new FormGroup({
    })

    return form;
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  emitChanges() {
    this.patchFormValues(this.currentTracking);
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
  }

  patchFormValues(formData: OnlineTrackingModel) {
    this.consolidatedForm.patchValue({

    });
  }

  generalInfoValidity(valid: boolean) {
    if (valid) {
      this.zone.run(() => {this.showTable = true;});
    }
    // Don't change it back to false
  }

  updateData(data: OnlineTrackingModel[] | ServicedTrackingModel[] | InPersonTrackingModel[]) {
    this.dataSource = new MatTableDataSource(data);
    // this.dataSource.filterPredicate = (data: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel, filter: string) => {
    //   return data.OrderNumber.includes(filter);
    // };

    this.filterDataSource = this.dataSource.filteredData;
    this.finalizingDataSource = new MatTableDataSource([]);

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
  checkboxLabel(row?: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel): string {
    if (!row) {
      return `${this.isAllSelected ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.trackingNumber + 1}`;
  }

  rowSelectionClicked(row?: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel) {
    this.selection.toggle(row);
    this.filterselection.toggle(row);
    this.allSelectCheck();

    this.finalizingDataSource.data = this.selection.selected;
  }

}
