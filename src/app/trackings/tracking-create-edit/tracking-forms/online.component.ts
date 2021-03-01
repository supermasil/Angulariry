import { AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from "@angular/material/checkbox";
import { ActivatedRoute } from '@angular/router';
import { ReplaySubject, Subscription } from 'rxjs';
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


@Component({
  selector: 'online-form-create',
  templateUrl: './online.component.html',
  styleUrls: ['./online.component.css', '../tracking-create-edit.component.css']
})
export class OnlineFormCreateComponent implements OnInit, AfterViewChecked{
  onlineForm: FormGroup;
  carriers = TrackingGlobals.carriers;

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
  selectedUserIdSubject = new ReplaySubject<string>();

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

  scannerOpened = false;
  showFinalizedInfo = false;

  trackingGlobals = TrackingGlobals;
  authGlobals = AuthGlobals;

  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private pricingService: PricingService,
    private zone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.trackingNumeberSubject.next("onl-" + Date.now() + Math.floor(Math.random() * 10000));

    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.selectedUserIdSubject.next(user._id);
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.defaultLocationsSubject.next(org.locations.map(item => item.name));
        this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
          this.users = response.users;
          this.usersSubject.next(response.users.filter(u => u.role === AuthGlobals.roles.Customer));
          this.pricingService.getPricing(org.pricings).subscribe((pricing: PricingModel) => {
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
            this.authService.redirectToMainPageWithMessage("Couldn't fetch pricing");
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

  emitChanges() {
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingItemsSubject.next(this.currentTracking.itemsList);
    this.costAdjustmentSubject.next(this.currentTracking.generalInfo.costAdjustment);
    this.exchangeSubject.next(this.currentTracking.generalInfo.exchange);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
    this.itemsListSubject.next(this.itemsList?.getRawValues()?.items);
  }

  createOnlineForm(formData: OnlineTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id :null),
      carrierTrackingNumber: new FormControl(formData?.carrierTracking?.carrierTrackingNumber? formData.carrierTracking.carrierTrackingNumber: "", {validators: [Validators.required]}),
      carrier: new FormControl(formData?.carrierTracking?.carrier? formData.carrierTracking.carrier: "", {validators: [Validators.required]}),
      received: new FormControl({value: this.trackingGlobals.postReceivedAtOrigin.includes(formData?.generalInfo?.trackingStatus)? true : false, disabled: !this.canView(this.authGlobals.internal) || this.trackingGlobals.postReadyToFly.includes(formData?.generalInfo?.trackingStatus)}, {validators: [Validators.required]}),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content: ""),
    });

    return form
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

  canView(roles: string[]) {
    return roles.includes(this.authService.getMongoDbUser()?.role);
  }

  onSave() {
    this.generalInfo.getFormValidity();
    this.itemsList?.getFormValidity();
    this.finalizedInfo?.getFormValidity();

    if (!this.onlineForm.valid || !this.generalInfo.getFormValidity() || (this.itemsList && !this.itemsList.getFormValidity()) || (this.finalizedInfo && !this.finalizedInfo.getFormValidity())) {
      return;
    }

    let sender = this.users.filter(u => u._id == this.generalInfo.getRawValues().sender)[0];
    let recipient = sender.recipients.filter(r => r.name == this.generalInfo.getRawValues().recipient)[0];

    let formData = this.onlineForm.getRawValue();
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
