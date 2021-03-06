import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatCheckboxChange } from "@angular/material/checkbox";
import { ActivatedRoute } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { AuthService } from "src/app/auth/auth.service";
import { FileUploaderComponent } from "src/app/custom-components/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { ListItemModel } from "src/app/models/tracking-models/list-item.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "src/app/custom-components/pricings/pricing.service";
import { TrackingGlobals } from "../../tracking-globals";
import { TrackingService } from '../../tracking.service';
import { FinalizedInfoComponent } from "../finalized-info/finalized-info.component";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { ItemsListComponent } from '../items-list/items-list.component';
import { AuthGlobals } from "src/app/auth/auth-globals";
import { getTracking } from 'ts-tracking-number';


@Component({
  selector: 'online-tracking-form',
  templateUrl: './online-form.component.html',
  styleUrls: ['./online-form.component.css', '../tracking-create-edit.component.css']
})
export class OnlineTrackingFormComponent implements OnInit, AfterViewChecked{
  onlineForm: FormGroup;
  carriers = Object.values(TrackingGlobals.carriers);

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
  defaultPricingSubject = new ReplaySubject<PricingModel>();
  defaultContentSubject = new ReplaySubject<string>();

  usersSubject = new ReplaySubject<UserModel[]>();
  trackingNumeberSubject = new ReplaySubject<string>();
  pricingUpdatedSubject = new ReplaySubject<{sender: string, origin: string, destination: string}>();
  itemsListSubject = new ReplaySubject<any>();
  generalInfoSubject = new ReplaySubject<GeneralInfoModel>();

  updateExistingItemsSubject = new ReplaySubject<ListItemModel[]>();
  costAdjustmentSubject = new ReplaySubject<number>();
  exchangeSubject = new ReplaySubject<number>();
  updateExistingImagesSubject = new ReplaySubject<string[]>();

  currentTracking: OnlineTrackingModel; // edit case
  mode = "create";

  canView = this.authService.canView;
  isAuth = this.authService.isAuth;

scannerOpened = false;
  showFinalizedInfo = false;

  generalInfoDisabledFields = [true, true, true, false, false, false, false];

  trackingGlobals = TrackingGlobals;
  authGlobals = AuthGlobals;

  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private pricingService: PricingService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.trackingNumeberSubject.next("onl-" + Date.now() + Math.floor(Math.random() * 10000));
    this.currentUser = this.authService.getMongoDbUser();

    this.organization = this.authService.getUserOrg();;
    this.defaultLocationsSubject.next(this.organization.locations.map(item => item.name));
    this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
      this.users = response.users;
      this.usersSubject.next(response.users.filter(u => u.role === AuthGlobals.roles.Customer));
      this.pricingService.getPricing(this.organization.pricings).subscribe((pricing: PricingModel) => {
        this.defaultPricing = pricing;
        this.defaultPricingSubject.next(pricing);
        this.route.paramMap.subscribe((paramMap) => {
          if (paramMap.has('trackingId')) {
            this.trackingService.getTracking(paramMap.get('trackingId'), TrackingGlobals.trackingTypes.ONLINE).subscribe((response: OnlineTrackingModel) => {
              this.currentTracking = response;
              this.mode = "edit"
              this.onlineForm = this.createOnlineForm(response);
              this.emitChanges();
            }, error => {
              this.authService.redirect404();
            });
          } else {
            this.onlineForm = this.createOnlineForm(null);
          }
        }, error => {
          this.authService.redirect404();
        });
      }, error => {
        this.authService.redirectToMainPageWithoutMessage();
      });
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });
  }

  emitChanges() {
    if (this.currentTracking.linkedToCsl || this.currentTracking.linkedToCsl) {
      this.generalInfoDisabledFields = [true, true, true, true, false, true, true];
    }
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingItemsSubject.next(this.currentTracking.itemsList);
    this.costAdjustmentSubject.next(this.currentTracking.generalInfo.costAdjustment);
    this.exchangeSubject.next(this.currentTracking.generalInfo.exchange);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
    this.itemsListSubject.next(this.itemsList?.getRawValues()?.items);
    this.defaultContentSubject.next(this.onlineForm.get("content").value);
  }

  createOnlineForm(formData: OnlineTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id :null),
      carrierTrackingNumber: new FormControl(formData?.carrierTracking?.carrierTrackingNumber? formData.carrierTracking.carrierTrackingNumber: "", {validators: [Validators.required, this.trackingNumberValidator()]}),
      carrier: new FormControl(formData?.carrierTracking?.carrier? formData.carrierTracking.carrier: "", {validators: [Validators.required]}),
      received: new FormControl({value: this.trackingGlobals.postReceivedAtOrigin.includes(formData?.generalInfo?.trackingStatus)? true : false, disabled: (!this.canView(this.authGlobals.internal) || this.trackingGlobals.postReadyToFly.includes(formData?.generalInfo?.trackingStatus))}, {validators: [Validators.required]}),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content: ""),
    });

    return form
  }

  trackingNumberValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (control && control.value) {
        let response = getTracking(control.value);
        console.log(response)
        if (response) {
          let carrier = null;
          if (response.name.includes("USPS")) {
            carrier = TrackingGlobals.carriers.USPS;
          } else if (response.name.includes("UPS")) {
            carrier = TrackingGlobals.carriers.UPS;
          } else if (response.name.includes("Fedex")) {
            carrier = TrackingGlobals.carriers.Fedex;
          } else if (response.name.includes("DHL")) {
            carrier = TrackingGlobals.carriers.DHLExpress;
          } else if (response.name.includes("OnTrac")) {
            carrier = TrackingGlobals.carriers.OnTrac;
          } else if (response.name.includes("Amazon")) {
            carrier = TrackingGlobals.carriers.AmazonMws;
          }
          this.onlineForm.get("carrier").setValue(carrier);
          return null;
        }
      }
      this.onlineForm?.get("carrier").setValue(null);
      return {invalidInput: control.value};
    };
  }

  generalInfoValidity(valid: boolean) {
    // Don't change it back to false
  }

  itemsListValidity(input: any) {
    if (input.valid) {
      this.showFinalizedInfo = true;
      this.itemsListSubject.next(input.data.items);

    } else {
      this.showFinalizedInfo = false;
      this.itemsListSubject.next(null);
    }
    this.cd.detectChanges();
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  pricingUpdate(changes) {
    this.pricingUpdatedSubject.next(changes);
    // Error is handled in itemsListComponent
  }

  receivedCheckboxChecked(event: MatCheckboxChange) {
    let generalInfo = {}
    if (event.checked) {
      generalInfo['trackingStatus'] = TrackingGlobals.trackingStatuses.ReceivedAtOrigin;
    } else {
      generalInfo['trackingStatus'] = TrackingGlobals.trackingStatuses.Created;
    }
    this.generalInfoSubject.next(generalInfo as GeneralInfoModel);
    // this.onlineForm.get('received').disable();
  }

  onSave() {
    this.generalInfo.getFormValidity();
    this.itemsList?.getFormValidity();
    this.finalizedInfo?.getFormValidity();

    let validity = this.onlineForm.valid && this.generalInfo.getFormValidity()
    if (this.itemsList?.getRawValues().items.length > 0) {
      validity = validity && (this.itemsList && this.itemsList.getFormValidity()) && (this.finalizedInfo && this.finalizedInfo.getFormValidity());
    }

    if (!validity) {
      return;
    }

    let formData = this.onlineForm.getRawValue();
    formData['generalInfo'] = this.generalInfo.getRawValues(); // Must be present
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
