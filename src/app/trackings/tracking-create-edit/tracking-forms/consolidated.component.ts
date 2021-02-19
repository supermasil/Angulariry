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
import { InPersonSubTrackingModel, InPersonTrackingModel } from 'src/app/models/tracking-models/in-person-tracking.model';
import { OnlineTrackingModel } from 'src/app/models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from 'src/app/models/tracking-models/serviced-tracking.model';
import { UserModel } from 'src/app/models/user.model';
import { TrackingGlobals } from '../../tracking-globals';
import { TrackingService } from '../../tracking.service';
import { ConsolidationTableComponent } from '../consolidation-table/consolidation-table.component';
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

  updateExistingImagesSubject = new ReplaySubject<string[]>();
  statusChangeSubject = new ReplaySubject<string>();

  currentTracking: ConsolidatedTrackingModel; // edit case
  mode = "create";

  onlineTrackings: OnlineTrackingModel[] = [];
  serviceTrackings: ServicedTrackingModel[] = [];
  inPersonTrackings: InPersonSubTrackingModel[] = [];

  selectedTabIndex = 0;

  showTable = false;

  finalizingDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>;
  finalizingDefinedColumns: string[] = ['trackingNumber', 'Weight', 'Cost'];
  tempDataSource: MatTableDataSource<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>;

  onlineTrackingDataSubject = new ReplaySubject<OnlineTrackingModel[]>();
  servicedTrackingDataSubject = new ReplaySubject<ServicedTrackingModel[]>();
  inPersonTrackingDataSubject = new ReplaySubject<InPersonSubTrackingModel[]>();

  deselectOnlineTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>();
  deselectServicedTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>();
  deselectInPersonTrackingSubject = new ReplaySubject<OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel>();

  selectedOnlineTrackings: OnlineTrackingModel[] = [];
  selectedServicedTrackings: ServicedTrackingModel[] = [];
  selectedInPersonTrackings: InPersonSubTrackingModel[] = [];

  currentTrackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel)[] = []; // edit case
  currentTrackingsReference: (OnlineTrackingModel | ServicedTrackingModel | InPersonSubTrackingModel)[] = []; // edit case

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
        this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
          this.users = response.users;
          this.usersSubject.next(response.users.filter(u => u.role === AuthGlobals.roles.Customer));
            this.route.paramMap.subscribe((paramMap) => {
              if (paramMap.has('trackingId')) {
                this.trackingService.getTracking(paramMap.get('trackingId')).subscribe((response: ConsolidatedTrackingModel) => {
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
    // 0 per page to find all
    this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.ONLINE, origin, destination, sender).subscribe((transformedTrackings) => {
      this.onlineTrackings = transformedTrackings.trackings.filter(i => !i.linkedToCsl);
      this.onlineTrackingDataSubject.next(this.onlineTrackings);

      this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.SERVICED, origin, destination, sender).subscribe((transformedTrackings) => {
        this.serviceTrackings = transformedTrackings.trackings.filter(i => !i.linkedToCsl);
        this.servicedTrackingDataSubject.next(this.serviceTrackings);

        this.trackingService.getTrackings(0, 1, TrackingGlobals.trackingTypes.INPERSON, origin, destination, sender).subscribe((transformedTrackings) => {
          this.inPersonTrackings = [];
          transformedTrackings.trackings.forEach((t: InPersonTrackingModel) => {
              let subTrackings = t.subTrackings.filter(i => !i.linkedToCsl);
              subTrackings.forEach(s => {
                s['parentTrackingId'] = t._id;
                Object.assign(s.generalInfo, {
                  sender: t.generalInfo.sender,
                  recipient: t.generalInfo.recipient,
                  organization: t.generalInfo.organization,
                  origin: t.generalInfo.origin,
                  destination: t.generalInfo.destination,
                  creatorId: t.generalInfo.creatorId,
                  creatorName: t.generalInfo.creatorName
                });
              });
              this.inPersonTrackings.push(...subTrackings);
          });

          this.inPersonTrackingDataSubject.next(this.inPersonTrackings);
          this.showTable = true;
          this.resetSelectedData();
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
    let inPersonSubtrackings: InPersonSubTrackingModel[] = [];
    this.currentTracking.inPersonTrackings.map(t => {
      inPersonSubtrackings.push(...t.subTrackings);
    })

    this.currentTrackings = [...this.currentTracking.onlineTrackings, ...this.currentTracking.servicedTrackings, ...inPersonSubtrackings];
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
    this.showTable = false;
    this.fetchTrackings(changes.origin, changes.destination, changes.sender);
  }

  resetSelectedData() {
    this.tempDataSource = new MatTableDataSource([]);
    this.finalizingDataSource = new MatTableDataSource([]);
    this.selectedOnlineTrackings = [];
    this.selectedServicedTrackings = [];
    this.selectedInPersonTrackings = [];
    this.combineData();
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
    } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSON)) {
      this.deselectInPersonTrackingSubject.next(row);
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

    let sender = this.users.filter(u => u._id == this.generalInfo.getRawValues().sender)[0];
    let recipient = sender.recipients.filter(r => r.name == this.generalInfo.getRawValues().recipient)[0];

    let formData = this.consolidatedForm.getRawValue();
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
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSON)) { // These are subtrackings
        inPersonTrackings.push(row);
      }
    });

    let tempMap = new Map(inPersonTrackings.map(r => [r.parentTrackingId, []]));

    inPersonTrackings.forEach(r => {
      tempMap.set(r.parentTrackingId, [...tempMap.get(r.parentTrackingId), r._id]);
    });

    console.log(tempMap);

    inPersonTrackings = Array.from(tempMap);

    this.tempDataSource.data.forEach(row => {
      if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.ONLINE)) {
        removedOnlineTrackings.push(row.trackingNumber);
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.SERVICED)) {
        removedServicedTrackings.push(row.trackingNumber);
      } else if (row.trackingNumber.includes(TrackingGlobals.trackingTypes.INPERSON)) { // These are subtrackings
        removedInPersonTrackings.push(row.trackingNumber);
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
