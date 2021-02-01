import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthService } from 'src/app/auth/auth.service';
import { FileUploaderComponent } from 'src/app/custom-components/file-uploader/file-uploader.component';
import { OrganizationModel } from 'src/app/models/organization.model';
import { ConsolidatedTrackingModel } from 'src/app/models/tracking-models/consolidated-tracking.model';
import { GeneralInfoModel } from 'src/app/models/tracking-models/general-info.model';
import { InPersonTrackingModel } from 'src/app/models/tracking-models/in-person-tracking.model';
import { OnlineTrackingModel } from 'src/app/models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from 'src/app/models/tracking-models/serviced-tracking.model';
import { UserModel } from 'src/app/models/user.model';
import { TrackingGlobals } from '../../tracking-globals';
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
export class ConsolidatedFormCreateComponent implements OnInit, AfterViewChecked {
  consolidatedForm: FormGroup;

  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;
  @ViewChild('generalInfo') generalInfo: GeneralInfoComponent;

  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;
  users: UserModel[];

  defaultLocationsSubject = new ReplaySubject<string[]>();

  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  updateExistingImagesSubject = new ReplaySubject<string[]>();
  statusChangeSubject = new ReplaySubject<string>();

  currentTracking: ConsolidatedTrackingModel; // edit case
  mode = "create";

  onlineTrackings: OnlineTrackingModel[];
  serviceTrackings: ServicedTrackingModel[];
  inPersonTrackings: InPersonTrackingModel[];

  selectedTabIndex = 0;

  showTable = false;

  finalizingDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>;
  finalizingDefinedColumns: string[] = ['trackingNumber', 'Weight', 'Cost'];
  tempDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>;

  onlineTrackingDataSubject = new ReplaySubject<OnlineTrackingModel[]>();
  servicedTrackingDataSubject = new ReplaySubject<ServicedTrackingModel[]>();
  inPersonTrackingDataSubject = new ReplaySubject<InPersonTrackingModel[]>();

  deselectOnlineTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>();
  deselectServicedTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>();
  deselectInPersonTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel>();

  selectedOnlineTrackings: OnlineTrackingModel[] = [];
  selectedServicedTrackings: ServicedTrackingModel[] = [];
  selectedInPersonTrackings: InPersonTrackingModel[] = [];

  currentTrackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel)[] = []; // edit case
  currentTrackingsReference: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel)[] = []; // edit case

  constructor(
    private zone: NgZone,
    private authService: AuthService,
    private route: ActivatedRoute,
    private trackingService: TrackingService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {
    // Assign the data to the data source for the table to render

  }

  ngOnInit() {
    this.finalizingDataSource = new MatTableDataSource([]);
    this.tempDataSource = new MatTableDataSource([]);
    this.trackingNumeberSubject.next("csl-" + Date.now() + Math.floor(Math.random() * 10000));

    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.defaultLocationsSubject.next(org.locations.map(item => item.name));
        this.authService.getUsersByOrg(org._id).subscribe((users: UserModel[] ) => {
          this.users = users;
          this.usersSubject.next(users.filter(u => u.role === AuthGlobals.roles.Customer));
            this.route.paramMap.subscribe((paramMap) => {
              if (paramMap.has('trackingId')) {
                this.trackingService.getTracking(paramMap.get('trackingId'), this.organization._id).subscribe((response: ConsolidatedTrackingModel) => {
                  this.currentTracking = response;
                  this.mode = "edit"
                  this.consolidatedForm = this.createConcolidatedForm(response);
                  this.emitChanges();
                  this.setUpDataSource();
                }, error => {
                  this.authService.redirect404();
                });
              } else {
                this.consolidatedForm = this.createConcolidatedForm(null);
              }
            }, error => {
              this.authService.redirect404();
            });
        }, error => {
          this.authService.redirectToMainPageWithMessage("Couldn't fetch users");
        })
      }, error => {
        this.authService.redirectToMainPageWithMessage("Couldn't fetch organization");
      });
    }, error => {
      this.authService.redirectToMainPageWithMessage("Couldn't fetch user");
    });
  }

  createConcolidatedForm(formData: ConsolidatedTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content : "")
    })
    return form;
  }

  emitChanges() {
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
  }

  fetchTrackings(origin: string, destination: string, sender: string) {
    this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.ONLINE, this.organization._id, origin, destination, sender).subscribe((transformedTrackings) => {
      this.onlineTrackings = transformedTrackings.trackings.filter(i => !TrackingGlobals.postCreationStatuses.includes(i.generalInfo.status));
      this.onlineTrackingDataSubject.next(this.onlineTrackings);
    });;

    this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.SERVICED, this.organization._id, origin, destination, sender).subscribe((transformedTrackings) => {
      this.serviceTrackings = transformedTrackings.trackings.filter(i => !TrackingGlobals.postCreationStatuses.includes(i.generalInfo.status));
      this.servicedTrackingDataSubject.next(this.serviceTrackings);
    });;

    this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.INPERSON, this.organization._id, origin, destination, sender).subscribe((transformedTrackings) => {
      this.inPersonTrackings = transformedTrackings.trackings.filter(i => !TrackingGlobals.postCreationStatuses.includes(i.generalInfo.status));
      this.inPersonTrackingDataSubject.next(this.inPersonTrackings);
    });;
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  onlineSelectionReceived(selection: OnlineTrackingModel[]) {
    this.selectedOnlineTrackings = selection;
    this.combineData();
  }

  servicedSelectionReceived(selection: ServicedTrackingModel[]) {
    this.selectedServicedTrackings = selection;
    this.combineData();
  }

  inPersonSelectionReceived(selection: InPersonTrackingModel[]) {
    this.selectedInPersonTrackings = selection;
    this.combineData();
  }

  combineData() {
    this.finalizingDataSource.data = [...this.selectedOnlineTrackings, ...this.selectedServicedTrackings, ...this.selectedInPersonTrackings, ...this.currentTrackings];
  }

  redirectOnEdit(trackingNumber: string) {
    this.zone.run(() => {
      this.router.navigate([`/trackings/edit/${trackingNumber}`]);
    });
  }

  setUpDataSource() {
    this.currentTrackings = [...this.currentTracking.onlineTrackings, ...this.currentTracking.servicedTrackings, ...this.currentTracking.inPersonTrackings];
    this.currentTrackingsReference = [...this.currentTrackings];
    this.combineData();
  }

  generalInfoValidity(valid: boolean) {
    if (valid) {
      this.zone.run(() => {
        this.showTable = true;
      });
    }
    // Don't change it back to false
  }

  generalInfoUpdated(changes: { sender: string, origin: string, destination: string}) {
    this.fetchTrackings(changes.origin, changes.destination, changes.sender)
  }

  getTotalWeight() {
    let totalWeight = 0;
    this.finalizingDataSource.data.forEach(row => {
      totalWeight += row.generalInfo.totalWeight;
    });
    return totalWeight;
  }

  getTotalCost() {
    let totalCost = 0;
    this.finalizingDataSource.data.forEach(row => {
      totalCost += row.generalInfo.finalCost;
    });
    return totalCost;
  }

  removeItem(row: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel) {
    if (this.mode === "create") {
      this.deselectRow(row);
    } else if (this.mode === "edit") {
      if (this.currentTrackingsReference.findIndex(i => i._id === row._id) >= 0) {
        this.moveBetweenTables(this.finalizingDataSource, this.tempDataSource, row);
        this.currentTrackings = this.currentTrackings.filter(i => i._id != row._id);
      } else {
        this.deselectRow(row);
      }
    }
  }

  deselectRow(row: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel) {
    if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.ONLINE)) {
      this.deselectOnlineTrackingSubject.next(row);
    } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.SERVICED)) {
      this.deselectServicedTrackingSubject.next(row);
    } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSON)) {
      this.deselectInPersonTrackingSubject.next(row);
    }
  }

  addItemBack(row: OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel) {
    this.moveBetweenTables(this.tempDataSource, this.finalizingDataSource, row);
    this.currentTrackings.push(row);
  }

  moveBetweenTables(firstTable, secondTable, row) {
    this.zone.run(() => {
      let tempData = firstTable.data;
      let index = tempData.findIndex(i => i._id == row._id);
      tempData.splice(index, 1);
      firstTable.data = [...tempData];

      let tempData1 = secondTable.data;
      tempData1.push(row);
      secondTable.data = [...tempData1];
    });
  }

  onSave() {
    this.generalInfo.getFormValidity();

    if (!this.generalInfo.getFormValidity()) {
      return;
    }

    let sender = this.users.filter(u => u._id == this.generalInfo.getRawValues().sender)[0];
    let recipient = sender.recipients.filter(r => r.name == this.generalInfo.getRawValues().recipient)[0];

    let formData = this.consolidatedForm.getRawValue();
    formData['organizationId'] = this.organization._id
    formData['generalInfo'] = this.generalInfo.getRawValues(); // Must be present
    formData['generalInfo']['recipient'] = recipient;

    if (this.mode === "edit") {
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
      formData['filesToDelete'] = JSON.stringify(this.fileUploader.getFilesToDelete());
    } else {
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
    }

    let onlineTrackings = [];
    let servicedTrackings = [];
    let inPersonTrackings = [];

    let removedOnlineTrackings = [];
    let removedServicedTrackings = [];
    let removedInPersonTrackings = [];

    this.finalizingDataSource.data.forEach(row => {
      if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.ONLINE)) {
        onlineTrackings.push(row._id);
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.SERVICED)) {
        servicedTrackings.push(row._id);
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSON)) {
        inPersonTrackings.push(row._id);
      }
    });

    this.tempDataSource.data.forEach(row => {
      if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.ONLINE)) {
        removedOnlineTrackings.push(row._id);
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.SERVICED)) {
        removedServicedTrackings.push(row._id);
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSON)) {
        removedInPersonTrackings.push(row._id);
      }
    });

    formData['onlineTrackings'] = onlineTrackings; // Don't stringify it
    formData['servicedTrackings'] = servicedTrackings;
    formData['inPersonTrackings'] = inPersonTrackings;
    formData['removedOnlineTrackings'] = removedOnlineTrackings; // Don't stringify it
    formData['removedServicedTrackings'] = removedServicedTrackings;
    formData['removedInPersonTrackings'] = removedInPersonTrackings;

    formData['finalizedInfo'] = {};
    formData['finalizedInfo']['totalWeight'] = this.getTotalWeight();
    formData['finalizedInfo']['finalCost'] = this.getTotalCost();
    formData['finalizedInfo']['costAdjustment'] = 0;

    this.trackingService.createUpdateTracking(formData);
  }
}
