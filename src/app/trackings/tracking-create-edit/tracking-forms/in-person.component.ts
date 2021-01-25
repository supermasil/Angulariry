import { AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";
import { ReplaySubject } from 'rxjs';
import { AuthService } from "src/app/auth/auth.service";
import { FileUploaderComponent } from "src/app/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ListItemModel } from "src/app/models/tracking-models/list-item.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "src/app/pricings/pricing.service";
import { TrackingService } from "../../tracking.service";
import { FinalizedInfoComponent } from "../finalized-info/finalized-info.component";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { ItemsListComponent } from "../items-list/items-list.component";


@Component({
  selector: 'in-person-form-create',
  templateUrl: './in-person.component.html',
  styleUrls: ['./in-person.component.css', '../tracking-create-edit.component.css']
})
export class InPersonFormCreateComponent implements OnInit, AfterViewChecked {
  inPersonForm: FormGroup;

  @ViewChild('itemsList') itemsList: ItemsListComponent;
  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;
  @ViewChild('generalInfo', {static: false}) generalInfo: GeneralInfoComponent;
  @ViewChild('finalizedInfo') finalizedInfo: FinalizedInfoComponent;

  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;
  users: UserModel[];
  defaultPricing: PricingModel;

  defaultLocationsSubject = new ReplaySubject<string[]>();
  itemNamesSubject = new ReplaySubject<string[]>();
  customerCodesSubject = new ReplaySubject<string[]>();
  defaultPricingSubject = new ReplaySubject<PricingModel>();
  selectedUserIdSubject = new ReplaySubject<string>();

  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  pricingUpdatedSubject = new ReplaySubject<{sender: string, origin: string, destination: string}>();
  itemsListSubject = new ReplaySubject<any>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  updateExistingItemsSubject = new ReplaySubject<ListItemModel[]>();
  costAdjustmentSubject = new ReplaySubject<number>();
  updateExistingImagesSubject = new ReplaySubject<string[]>();

  showItemsList = false;
  showFinalizedInfo = false;

  currentTracking: InPersonTrackingModel; // edit case
  mode = "create";

  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private zone: NgZone,
    private pricingService: PricingService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.inPersonForm = this.createInPersonForm();
    this.trackingNumeberSubject.next("inp-" + Date.now() + Math.floor(Math.random() * 10000));

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
          this.pricingService.getPricing(org.pricings).subscribe((pricing: PricingModel) => {
            this.defaultPricing = pricing;
            this.itemNamesSubject.next(pricing.items.map(i => i.name));
            this.defaultPricingSubject.next(pricing);

            this.route.paramMap.subscribe((paramMap) => {
              if (paramMap.has('trackingId')) {
                this.trackingService.getTracking(paramMap.get('trackingId'), this.organization._id).subscribe((response: InPersonTrackingModel) => {
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
          }, error => {
            this.authService.redirectOnFailedSubscription("Couldn't fetch pricing");
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

  emitChanges() {
    this.patchFormValues(this.currentTracking);
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingItemsSubject.next(this.currentTracking.itemsList);
    this.costAdjustmentSubject.next(this.currentTracking.generalInfo.costAdjustment);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
  }

  createInPersonForm () {
    let form = new FormGroup({
      _id: new FormControl(null),
      content: new FormControl(""),
      // payAtDestination: new FormControl(false, {validators: [Validators.required]}),
      // receiveAtDestinationWH: new FormControl(false, {validators: [Validators.required]})
    });

    return form
  }

  patchFormValues(formData: InPersonTrackingModel) {
    this.inPersonForm.patchValue({
      _id: formData._id,
      content: formData.generalInfo.content
    });
  }

  generalInfoValidity(valid: boolean) {
    if (valid) {
      this.zone.run(() => {this.showItemsList = true;});
    }
    // Don't change it back to false
  }

  itemsListValidity(valid: boolean) {
    console.log(valid);
    console.log(this.itemsList.getRawValues())
    if (valid && this.itemsList?.getRawValues()?.items?.length > 0) {
      this.showFinalizedInfo = true;
    } else {
      this.showFinalizedInfo = false;
    }
    this.itemsListSubject.next(this.itemsList?.getRawValues()?.items);
  }

  pricingUpdate(changes) {
    let customerCode = changes.sender.split(' ')[0];
    let user = this.users?.filter(u => u.customerCode == customerCode)[0];
    changes.sender = user?._id;
    this.pricingUpdatedSubject.next(changes);
    // Error is handled in itemsListComponent
  }


  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  onSave() {
    this.generalInfo.getFormValidity();
    this.itemsList?.getFormValidity();
    this.finalizedInfo?.getFormValidity();

    if (!this.inPersonForm.valid || !this.generalInfo.getFormValidity() || (this.itemsList && !this.itemsList.getFormValidity()) || (this.finalizedInfo && !this.finalizedInfo.getFormValidity())) {
      return;
    }

    let sender = this.users.filter(u => u.customerCode == this.generalInfo.getRawValues().sender)[0];
    let recipient = sender.recipients.filter(r => r.name == this.generalInfo.getRawValues().recipient)[0];

    let formData = this.inPersonForm.getRawValue();
    formData['organizationId'] = this.organization._id
    formData['generalInfo'] = this.generalInfo.getRawValues(); // Must be present
    formData['generalInfo']['recipient'] = recipient;
    formData['itemsList'] = this.itemsList?.getRawValues()?.items ? this.itemsList.getRawValues().items : [];
    formData['finalizedInfo'] = this.finalizedInfo?.getRawValues() ? this.finalizedInfo.getRawValues() : [];
    if (this.mode === "edit") {
      formData['_id'] = this.currentTracking._id;
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
      formData['filesToDelete'] = JSON.stringify(this.fileUploader.getFilesToDelete());
    } else {
      formData['filesToAdd'] = JSON.stringify(this.fileUploader.getFilesToAdd());
      formData['fileNamesToAdd'] = JSON.stringify(this.fileUploader.getFileNamesToAdd());
    }

    this.trackingService.createUpdateTracking(formData);
  }


}
