import { AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";
import { ReplaySubject } from 'rxjs';
import { AuthService } from "src/app/auth/auth.service";
import { FileUploaderComponent } from "src/app/custom-components/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ListItemModel } from "src/app/models/tracking-models/list-item.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "src/app/custom-components/pricings/pricing.service";
import { TrackingService } from "../../tracking.service";
import { FinalizedInfoComponent } from "../finalized-info/finalized-info.component";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { ItemsListComponent } from "../items-list/items-list.component";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { TrackingGlobals } from "../../tracking-globals";


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
    this.trackingNumeberSubject.next("inp-" + Date.now() + Math.floor(Math.random() * 10000));

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
                this.trackingService.getTracking(paramMap.get('trackingId')).subscribe((response: InPersonTrackingModel) => {
                  this.currentTracking = response;
                  this.mode = "edit"
                  this.inPersonForm = this.createInPersonForm(response);
                  this.emitChanges();
                }, error => {
                  this.authService.redirect404();
                });
              } else {
                this.inPersonForm = this.createInPersonForm(null);
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
  }

  createInPersonForm (formData: InPersonTrackingModel) {
    let form = new FormGroup({
      _id: new FormControl(formData?._id? formData._id :null),
      content: new FormControl(formData?.generalInfo?.content? formData.generalInfo.content : ""),
      paid: new FormControl({value: formData?.generalInfo?.paid? true : false, disabled: !this.canView(AuthGlobals.internal) || formData?.linkedToCsl }, {validators: [Validators.required]}),
      // payAtDestination: new FormControl(false, {validators: [Validators.required]}),
      // receiveAtDestinationWH: new FormControl(false, {validators: [Validators.required]})
    });

    return form
  }

  canView(roles: string[]) {
    return roles.includes(this.authService.getMongoDbUser()?.role);
  }

  generalInfoValidity(valid: boolean) {
    if (valid) {
      this.zone.run(() => {this.showItemsList = true;});
    }
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

  pricingUpdate(changes) {
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

    let sender = this.users.filter(u => u._id == this.generalInfo.getRawValues().sender)[0];
    let recipient = sender.recipients.filter(r => r.name == this.generalInfo.getRawValues().recipient)[0];

    let formData = this.inPersonForm.getRawValue();
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
