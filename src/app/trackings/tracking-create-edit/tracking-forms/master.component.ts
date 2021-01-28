import { Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { Observable, of, ReplaySubject } from 'rxjs';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs/operators';
import { FileUploaderComponent } from "src/app/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { UserModel } from "src/app/models/user.model";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { AuthService } from "src/app/auth/auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { TrackingService } from "../../tracking.service";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { TrackingGlobals } from "../../tracking-globals";

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
  customerCodesSubject = new ReplaySubject<string[]>();
  selectedUserIdSubject = new ReplaySubject<string>();

  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  updateExistingImagesSubject = new ReplaySubject<string[]>();
  statusChangeSubject = new ReplaySubject<string>();

  currentTracking: MasterTrackingModel; // edit case
  currentTrackingNumbers: string[] = []
  currentConsolidatedTrackings: ConsolidatedTrackingModel[] = [];
  removedConsolidatedTrackingNumbers: string[] = [];
  mode = "create";
  showTable = false;

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredTrackings: Observable<ConsolidatedTrackingModel[]> = new Observable();;
  allTrackings: ConsolidatedTrackingModel[] = [];
  trackingsReference: ConsolidatedTrackingModel[] = [];

  trackingCtrl = new FormControl();
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(
    private zone: NgZone,
    private authService: AuthService,
    private route: ActivatedRoute,
    private trackingService: TrackingService
  ) {
    this.filteredTrackings = this.trackingCtrl.valueChanges.pipe(
      startWith(null),
      map((t: string | null) => t && typeof t === "string" ? this._filter(t) : this.allTrackings.slice()));
  }

  ngOnInit() {
    this.masterForm = this.createMasterForm();
    this.trackingNumeberSubject.next("mst-" + Date.now() + Math.floor(Math.random() * 10000));
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
                this.trackingService.getTracking(paramMap.get('trackingId'), this.organization._id).subscribe((response: MasterTrackingModel) => {
                  this.currentTracking = response;
                  this.mode = "edit"
                  this.emitChanges();
                  this.setUpData();
                }, error => {
                  this.authService.redirect404();
                });
              }
            }, error => {
              this.authService.redirect404();
            });
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

  createMasterForm() {
    let form = new FormGroup({
      _id: new FormControl(null),
      boxes: new FormArray([]),
      content: new FormControl("")
    });
    return form
  }

  emitChanges() {
    this.patchFormValues(this.currentTracking);
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
  }

  patchFormValues(formData: MasterTrackingModel) {
    this.masterForm.patchValue({
      _id: formData._id,
      content: formData.generalInfo.content
    })
  }

  setUpData() {
    this.currentTracking.boxes.forEach((box, index) => {
      this.addbox(box);
      box.items.forEach(i => {
        this.selectItem(i.trackingNumber, index);
        this.currentTrackingNumbers.push(i.trackingNumber);
        this.currentConsolidatedTrackings.push(i);
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
    this.fetchTrackings(changes.origin, changes.destination);
  }

  fetchTrackings(origin: string, destination: string) {
    this.trackingService.getTrackings(0, 1, "csl", this.organization._id, origin, destination, null).subscribe((transformedTrackings) => {
      this.allTrackings = transformedTrackings.trackings.filter(i => !TrackingGlobals.postConsolidatedStatuses.includes(i.generalInfo.status));
      this.trackingsReference = [...this.allTrackings];
      this.filteredTrackings = of(this.allTrackings);
    });;


  }


  removeItem(itemIndex: number, boxIndex: number, item: string): void {
    let items = this.masterForm.get('boxes')['controls'][boxIndex].get('items').value;
    items.splice(itemIndex, 1);
    if (this.currentTrackingNumbers.includes(item)) {
      this.allTrackings.push(this.currentConsolidatedTrackings.filter(t => t.trackingNumber === item)[0]);
      this.removedConsolidatedTrackingNumbers.push(item);
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
      this.removedConsolidatedTrackingNumbers = this.removedConsolidatedTrackingNumbers.filter(i => i != value);
    }
    this.filteredTrackings = of(this.allTrackings);
  }

  private _filter(value: string): ConsolidatedTrackingModel[] {
    const filterValue = value.toLowerCase();
    return this.allTrackings.filter(t => t.trackingNumber ? t.trackingNumber.includes(filterValue) : false);
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
        totalWeight += [...this.trackingsReference, ...this.currentConsolidatedTrackings].filter(i => i.trackingNumber === t)[0].generalInfo.totalWeight;
      })
    });
    return totalWeight;
  }

  getTotalCost() {
    let totalCost = 0;
    this.masterForm.get('boxes')['controls'].forEach(box => {
      box.get('items').value.forEach(t => {
        totalCost += [...this.trackingsReference, ...this.currentConsolidatedTrackings].filter(i => i.trackingNumber === t)[0].generalInfo.finalCost;
      })
    });
    return totalCost;
  }

  translateTrackingNumbersToIds(formData: any) {
    let tempValues = [];
    this.masterForm.get('boxes')['controls'].forEach((box, index) => {
      box.get('items').value.forEach(t => {
        tempValues.push([...this.trackingsReference, ...this.currentConsolidatedTrackings].filter(i => i.trackingNumber === t)[0]._id);
      })
      formData.boxes[index].items = tempValues;
      tempValues = [];
    });

    this.removedConsolidatedTrackingNumbers = this.removedConsolidatedTrackingNumbers.map(item => [...this.trackingsReference, ...this.currentConsolidatedTrackings].filter(i => i.trackingNumber === item)[0]._id);
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
    formData['organizationId'] = this.organization._id
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
    formData['removedConsolidatedTrackingNumbers'] = this.removedConsolidatedTrackingNumbers;
    this.trackingService.createUpdateTracking(formData);
  }
}
