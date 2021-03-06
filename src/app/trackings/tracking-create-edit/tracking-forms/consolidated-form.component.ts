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
import { InPersonSubTrackingModel } from 'src/app/models/tracking-models/in-person-tracking.model';
import { OnlineTrackingModel } from 'src/app/models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from 'src/app/models/tracking-models/serviced-tracking.model';
import { UserModel } from 'src/app/models/user.model';
import { TrackingGlobals } from '../../tracking-globals';
import { TrackingService } from '../../tracking.service';
import { ConsolidationTableComponent } from '../consolidation-table/consolidation-table.component';
import { GeneralInfoComponent } from '../general-info/general-info.component';


@Component({
  selector: 'consolidated-tracking-form',
  templateUrl: './consolidated-form.component.html',
  styleUrls: ['./consolidated-form.component.css', '../tracking-create-edit.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})), // After sort is clicked, the state is void
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('3s cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ConsolidatedTrackingFormComponent implements OnInit, AfterViewChecked {
  consolidatedForm: FormGroup;

  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;
  @ViewChild('generalInfo') generalInfo: GeneralInfoComponent;
  @ViewChild('onlineTable') onlineTable: ConsolidationTableComponent;
  @ViewChild('servicedTable') servicedTable: ConsolidationTableComponent;
  @ViewChild('inPersonTable') inPersonTable: ConsolidationTableComponent;

  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;
  users: UserModel[];

  defaultLocationsSubject = new ReplaySubject<string[]>();

  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();
  defaultContentSubject = new ReplaySubject<string>();

  updateExistingImagesSubject = new ReplaySubject<string[]>();

  currentTracking: ConsolidatedTrackingModel; // edit case
  mode = "create";

  onlineTrackings: OnlineTrackingModel[] = [];
  serviceTrackings: ServicedTrackingModel[] = [];
  inPersonSubTrackings: InPersonSubTrackingModel[] = [];

  selectedTabIndex = 0;

  showTable = false;

  finalizingDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>;
  finalizingDefinedColumns: string[] = ['TrackingNumber', 'TrackingStatus', 'FinancialStatus', 'Weight', 'Cost'];
  tempDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>;

  onlineTrackingDataSubject = new ReplaySubject<OnlineTrackingModel[]>();
  servicedTrackingDataSubject = new ReplaySubject<ServicedTrackingModel[]>();
  inPersonSubTrackingDataSubject = new ReplaySubject<InPersonSubTrackingModel[]>();

  deselectOnlineTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>();
  deselectServicedTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>();
  deselectInPersonSubTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>();

  selectedOnlineTrackings: OnlineTrackingModel[] = [];
  selectedServicedTrackings: ServicedTrackingModel[] = [];
  selectedInPersonSubTrackings: InPersonSubTrackingModel[] = [];

  currentTrackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel)[] = []; // edit case
  currentTrackingsReference: (OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel)[] = []; // edit case

  generalInfoDisabledFields = [true, true, true, false, false, false, false];

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

    // this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = this.authService.getMongoDbUser();;
      // this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = this.authService.getUserOrg();
        this.defaultLocationsSubject.next(this.organization.locations.map(item => item.name));
        this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
          this.users = response.users;
          this.usersSubject.next(response.users.filter(u => u.role === AuthGlobals.roles.Customer));
            this.route.paramMap.subscribe((paramMap) => {
              if (paramMap.has('trackingId')) {
                this.trackingService.getTracking(paramMap.get('trackingId'), TrackingGlobals.trackingTypes.CONSOLIDATED).subscribe((response: ConsolidatedTrackingModel) => {
                  this.currentTracking = response;
                  this.mode = "edit"
                  this.consolidatedForm = this.createConcolidatedForm(response);
                  this.setUpDataSource(); // Has to be before emit changes so that we can disable generalInfo fields
                  this.emitChanges();
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
          this.authService.redirectToMainPageWithoutMessage();
        })
    //   }, error => {
    //     this.authService.redirectToMainPageWithoutMessage();
    //   });
    // }, error => {
    //   this.authService.redirectToMainPageWithoutMessage();
    // });
  }

  createConcolidatedForm(formData: ConsolidatedTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content : "")
    })
    return form;
  }

  emitChanges() {
    if (this.currentTrackings.length > 0) {
      this.generalInfoDisabledFields = [true, true, true, true, false, true, true];
    }
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
    this.defaultContentSubject.next(this.consolidatedForm.get("content").value);
  }

  fetchTrackings(origin: string, destination: string, sender: string) {
    // 0 per page to find all
    let additionalParams = {
      origin: origin,
      destination: destination,
      sender: sender
    }
    this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.ONLINE, additionalParams).subscribe((transformedTrackings) => {
      this.onlineTrackings = transformedTrackings.trackings.filter(i => !i.linkedToCsl);
      this.onlineTrackingDataSubject.next(this.onlineTrackings);
      this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.SERVICED, additionalParams).subscribe((transformedTrackings) => {
        this.serviceTrackings = transformedTrackings.trackings.filter(i => !i.linkedToCsl);
        this.servicedTrackingDataSubject.next(this.serviceTrackings);
        this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.INPERSONSUB, additionalParams).subscribe((transformedTrackings) => {
          this.inPersonSubTrackings = transformedTrackings.trackings.filter(t => !t.linkedToCsl);
          this.inPersonSubTrackingDataSubject.next(this.inPersonSubTrackings);
          this.showTable = true;
        });
      });;
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

  inPersonSelectionReceived(selection: InPersonSubTrackingModel[]) {
    this.selectedInPersonSubTrackings = selection;
    this.combineData();
  }

  combineData() {
    this.finalizingDataSource.data = [...this.currentTrackings, ...this.selectedOnlineTrackings, ...this.selectedServicedTrackings, ...this.selectedInPersonSubTrackings];
  }

  setUpDataSource() {
    this.currentTrackings = [...this.currentTracking.onlineTrackings, ...this.currentTracking.servicedTrackings, ...this.currentTracking.inPersonSubTrackings];
    this.currentTrackingsReference = [...this.currentTrackings];
    this.combineData();
  }

  generalInfoValidity(valid: boolean) {
    if (valid) {
      this.zone.run(() => {
        this.showTable = true;
      });
    } else {
      this.zone.run(() => {
        this.showTable = false;
      });
    }
    // Don't change it back to false
  }

  generalInfoUpdated(changes: { sender: string, origin: string, destination: string}) {
    // this.resetSelectedData();
    this.fetchTrackings(changes.origin, changes.destination, changes.sender);
  }

  // resetSelectedData() {
  //   this.tempDataSource = new MatTableDataSource([]);
  //   this.finalizingDataSource = new MatTableDataSource([]);
  //   this.selectedOnlineTrackings = [];
  //   this.selectedServicedTrackings = [];
  //   this.selectedInPersonSubTrackings = [];
  //   this.combineData();
  // }

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

  removeItem(row: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel) {
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

  deselectRow(row: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel) {
    if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.ONLINE)) {
      this.deselectOnlineTrackingSubject.next(row);
    } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.SERVICED)) {
      this.deselectServicedTrackingSubject.next(row);
    } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSONSUB)) {
      this.deselectInPersonSubTrackingSubject.next(row);
    }
  }

  addItemBack(row: OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel) {
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

    let formData = this.consolidatedForm.getRawValue();
    formData['generalInfo'] = this.generalInfo.getRawValues(); // Must be present

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
    let inPersonSubTrackings = [];

    let removedOnlineTrackings = [];
    let removedServicedTrackings = [];
    let removedInPersonSubTrackings = [];

    this.finalizingDataSource.data.forEach(row => {
      switch (row.generalInfo.type) {
        case TrackingGlobals.trackingTypes.ONLINE:
          onlineTrackings.push(row._id);
          break;
        case TrackingGlobals.trackingTypes.SERVICED:
          servicedTrackings.push(row._id);
          break;
        case TrackingGlobals.trackingTypes.INPERSONSUB:
          inPersonSubTrackings.push(row._id);
          break;
      }
    });

    this.tempDataSource.data.forEach(row => {
      switch (row.generalInfo.type) {
        case TrackingGlobals.trackingTypes.ONLINE:
          removedOnlineTrackings.push(row._id);
          break;
        case TrackingGlobals.trackingTypes.SERVICED:
          removedServicedTrackings.push(row._id);
          break;
        case TrackingGlobals.trackingTypes.INPERSONSUB:
          removedInPersonSubTrackings.push(row._id);
          break;
      }
    });

    formData['onlineTrackingIds'] = onlineTrackings; // Don't stringify it
    formData['servicedTrackingIds'] = servicedTrackings;
    formData['inPersonSubTrackingIds'] = inPersonSubTrackings;
    formData['removedOnlineTrackingIds'] = removedOnlineTrackings; // Don't stringify it
    formData['removedServicedTrackingIds'] = removedServicedTrackings;
    formData['removedInPersonSubTrackingIds'] = removedInPersonSubTrackings;

    formData['finalizedInfo'] = {};
    formData['finalizedInfo']['totalWeight'] = this.getTotalWeight();
    formData['finalizedInfo']['finalCost'] = this.getTotalCost();
    formData['finalizedInfo']['costAdjustment'] = 0;
    this.trackingService.createUpdateTracking(formData);
  }
}
