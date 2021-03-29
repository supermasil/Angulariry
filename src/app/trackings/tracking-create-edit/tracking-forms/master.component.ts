import { Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { Observable, of, ReplaySubject } from 'rxjs';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { FileUploaderComponent } from "src/app/custom-components/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { UserModel } from "src/app/models/user.model";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { AuthService } from "src/app/auth/auth.service";
import { ActivatedRoute } from "@angular/router";
import { TrackingService } from "../../tracking.service";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { TrackingGlobals } from "../../tracking-globals";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { InPersonSubTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";

@Component({
  selector: 'master-form-create',
  templateUrl: './master.component.html',
  styleUrls: ['./master.component.css', '../tracking-create-edit.component.css']
})
export class MasterFormCreateComponent implements OnInit {
  masterForm: FormGroup;

  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;
  @ViewChild('generalInfo') generalInfo: GeneralInfoComponent;

  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;
  users: UserModel[];

  defaultLocationsSubject = new ReplaySubject<string[]>();
  defaultContentSubject = new ReplaySubject<string>();
  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  updateExistingImagesSubject = new ReplaySubject<string[]>();

  currentTracking: MasterTrackingModel; // edit case
  currentTrackingNumbers: string[] = []
  currentTrackings = [];
  removedTrackings = [];

  mode = "create";
  showTable = false;

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredTrackings: Observable<OnlineTrackingModel[] | ServicedTrackingModel[] | InPersonSubTrackingModel[]> = new Observable();;
  allTrackings = [];
  trackingsReference = [];
  generalInfoDisabledFields = [true, true, true, false, false, false, false];
  origin = null;
  destination = null;

  trackingCtrl = new FormControl();
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(
    private zone: NgZone,
    private authService: AuthService,
    private route: ActivatedRoute,
    private trackingService: TrackingService
  ) {
  }

  ngOnInit() {
    this.trackingNumeberSubject.next("mst-" + Date.now() + Math.floor(Math.random() * 10000));
    // this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = this.authService.getMongoDbUser();
      // this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = this.authService.getUserOrg();
        this.defaultLocationsSubject.next(this.organization.locations.map(item => item.name));
        this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
          this.users = response.users;
          this.usersSubject.next(response.users);
            this.route.paramMap.subscribe((paramMap) => {
              if (paramMap.has('trackingId')) {
                this.trackingService.getTracking(paramMap.get('trackingId'), TrackingGlobals.trackingTypes.MASTER).subscribe((response: MasterTrackingModel) => {
                  this.currentTracking = response;
                  this.mode = "edit"
                  this.masterForm = this.createMasterForm(response);
                  this.setFilter();
                  this.emitChanges();
                  this.setUpData();
                }, error => {
                  this.authService.redirect404();
                });
              } else {
                this.masterForm = this.createMasterForm(null);
                this.setFilter();
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

  createMasterForm(formData: MasterTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id : null),
      boxes: new FormArray([]),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content : "")
    });

    return form
  }

  setFilter() {
    this.trackingCtrl.valueChanges.subscribe(value => {
      if (value) {
        const filterValue = value.toLowerCase();
        this.filteredTrackings = of(this.allTrackings.filter(t => t.trackingNumber ? t.trackingNumber.includes(filterValue) : false));
      }
    });
  }

  emitChanges() {
    if (this.currentTracking.boxes.length > 0) {
      this.generalInfoDisabledFields = [true, true, true, true, true, true, true];
    }
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
    this.defaultContentSubject.next(this.masterForm.get("content").value);
  }

  setUpData() {
    this.currentTracking.boxes.forEach((box, index) => {
      this.addbox(box);
      box.onlineTrackings.forEach(i => {
        this.selectItem(i.trackingNumber, index);
        this.currentTrackingNumbers.push(i.trackingNumber);
        this.currentTrackings.push(i);
      });

      box.servicedTrackings.forEach(i => {
        this.selectItem(i.trackingNumber, index);
        this.currentTrackingNumbers.push(i.trackingNumber);
        this.currentTrackings.push(i);
      });
      box.inPersonSubTrackings.forEach(i => {
        this.selectItem(i.trackingNumber, index);
        this.currentTrackingNumbers.push(i.trackingNumber);
        this.currentTrackings.push(i);
      });
    });

  }

  generalInfoValidity(valid: boolean) {
    if (valid) {
      this.zone.run(() => {
        this.showTable = true;
      });
    }
    // Don't change it back to false
  }

  generalInfoUpdated(changes: {origin: string, destination: string}) {
    if (origin != this.origin || this.destination != this.destination) {
      this.origin = origin; this.destination = this.destination;
      this.allTrackings = [];
      this.trackingsReference = [];
      this.fetchTrackings(changes.origin, changes.destination);
    }
  }

  fetchTrackings(origin: string, destination: string) {
    this.trackingService.getTrackings(null, 0, 1, TrackingGlobals.trackingTypes.ONLINE, origin, destination, null).subscribe((transformedTrackings) => {
      this.allTrackings.push(...transformedTrackings.trackings.filter(i => i.generalInfo.trackingStatus == TrackingGlobals.trackingStatuses.ReceivedAtOrigin));
      this.trackingService.getTrackings(null, 0, 1, TrackingGlobals.trackingTypes.SERVICED, origin, destination, null).subscribe((transformedTrackings) => {
        this.allTrackings.push(...transformedTrackings.trackings.filter(i => !TrackingGlobals.postReadyToFly.includes(i.generalInfo.trackingStatus)));
        this.trackingService.getTrackings(null, 0, 1, TrackingGlobals.trackingTypes.INPERSONSUB, origin, destination, null).subscribe((transformedTrackings) => {
          this.allTrackings.push(...transformedTrackings.trackings.filter(i => !TrackingGlobals.postReadyToFly.includes(i.generalInfo.trackingStatus)));
          this.trackingsReference = [...this.allTrackings];
          this.filteredTrackings = of(this.allTrackings);
        });
      });
    });
  }


  removeItem(itemIndex: number, boxIndex: number, item: string): void {
    let items = this.masterForm.get('boxes')['controls'][boxIndex].get('items').value;
    items.splice(itemIndex, 1);
    if (this.currentTrackingNumbers.includes(item)) {
      let foundItem = this.currentTrackings.filter(t => t.trackingNumber === item)[0];
      this.allTrackings.push(foundItem);
      this.removedTrackings.push(foundItem);
    } else {
      this.allTrackings.push(this.trackingsReference.filter(t => t.trackingNumber === item)[0]);
    }
    this.filteredTrackings = of(this.allTrackings);
  }

  selectItem(value: string, index: number): void {
    this.masterForm.get('boxes')['controls'][index].get('items').value.push(value);
    this.trackingCtrl.setValue(null);
    this.allTrackings = this.allTrackings.filter(t => t.trackingNumber != value);// no need to index check here
    if (this.currentTrackingNumbers.includes(value)) {
      this.removedTrackings = this.removedTrackings.filter(i => i != value);
    }
    this.filteredTrackings = of(this.allTrackings);
  }

  createBox(formData: any): FormGroup {
    let form =  new FormGroup({
      palletNumber: new FormControl(formData?.palletNumber? formData.palletNumber: null, {validators:[Validators.required]}),
      boxNumber: new FormControl(formData?.boxNumber? formData.boxNumber : null, {validators:[Validators.required]}),
      items: new FormControl([]),
      content: new FormControl(formData?.content? formData.content : ""),
      removed: new FormControl([])
    })

    return form;
  }

  addbox(formData: any) {
    (this.masterForm.get('boxes') as FormArray).push(this.createBox(formData));
  }

  removeBox(boxIndex: number, form: FormGroup) {
    // if((this.masterForm.get('boxes') as FormArray).length == 1) {
    //   return;
    // }
    let saveItems = [...this.masterForm.get('boxes')['controls'][boxIndex].controls['items'].value];
    saveItems.forEach((item, index) => {
      this.removeItem(index, boxIndex, item);
    });
    (form.get('boxes') as FormArray).removeAt(boxIndex);
  }

  getTotalWeight() {
    let totalWeight = 0;
    this.masterForm.get('boxes')['controls'].forEach((box) => {
      box.get('items').value.forEach(t => {
        totalWeight += [...this.trackingsReference, ...this.currentTrackings].filter(i => i.trackingNumber === t)[0].generalInfo.totalWeight;
      })
    });
    return totalWeight;
  }

  getTotalCost() {
    let totalCost = 0;
    this.masterForm.get('boxes')['controls'].forEach(box => {
      box.get('items').value.forEach(t => {
        totalCost += [...this.trackingsReference, ...this.currentTrackings].filter(i => i.trackingNumber === t)[0].generalInfo.finalCost;
      })
    });
    return totalCost;
  }

  translateTrackingNumbersToIds(formData: any) {
    let trackings = [];
    let allTrackings = [];

    this.masterForm.get('boxes')['controls'].forEach((box, index) => {
      box.get('items').value.forEach(t => {
        trackings.push([...this.trackingsReference, ...this.currentTrackings].filter(i => i.trackingNumber === t)[0]);
      })
      formData.boxes[index].onlineTrackings = trackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.ONLINE).map(t => t._id);
      formData.boxes[index].servicedTrackings = trackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.SERVICED).map(t => t._id);
      formData.boxes[index].inPersonSubTrackings = trackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.INPERSONSUB).map(t => t._id);
      allTrackings.push(...trackings);
      trackings = [];
    });
    formData['validOnlineTrackingIds'] = allTrackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.ONLINE).map(t => t._id);
    formData['validServicedTrackingIds'] = allTrackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.SERVICED).map(t => t._id);
    formData['validInPersonSubTrackingIds'] = allTrackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.INPERSONSUB).map(t => t._id);
  }

  onSave() {
    this.generalInfo.getFormValidity();
    if (!this.masterForm.valid || !this.generalInfo.getFormValidity()) {
      return;
    }

    let finalizedInfo = {}
    finalizedInfo['totalWeight'] = this.getTotalWeight();
    finalizedInfo['finalCost'] = this.getTotalCost();
    finalizedInfo['costAdjustment'] = 0;

    let formData = this.masterForm.getRawValue();

    this.translateTrackingNumbersToIds(formData);
    formData['generalInfo'] = this.generalInfo.getRawValues(); // Must be present
    formData['generalInfo']['recipient'] = null;
    formData['generalInfo']['sender'] = null;

    if (this.mode === "edit") {
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
      formData['filesToDelete'] = JSON.stringify(this.fileUploader.getFilesToDelete());
    } else {
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
    }

    formData['finalizedInfo'] = finalizedInfo;

    this.removedTrackings.map(t => [...this.trackingsReference, ...this.currentTrackings].filter(i => i.trackingNumber === t)[0]);
    formData['removedOnlineTrackingIds'] = this.removedTrackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.ONLINE && !formData['validOnlineTrackingIds'].includes(t._id)).map(t => t._id);
    formData['removedServicedTrackingIds'] = this.removedTrackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.SERVICED && !formData['validServicedTrackingIds'].includes(t._id)).map(t => t._id);
    formData['removedInPersonSubTrackingIds'] = this.removedTrackings.filter(t => t.generalInfo.type === TrackingGlobals.trackingTypes.INPERSONSUB && !formData['validInPersonSubTrackingIds'].includes(t._id)).map(t => t._id);
    this.trackingService.createUpdateTracking(formData);
  }
}
