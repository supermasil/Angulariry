import { AfterViewChecked, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from "@angular/material/checkbox";
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subscription } from 'rxjs';
import { AuthService } from "src/app/auth/auth.service";
import { CodeScannerService } from 'src/app/code-scanner/code-scanner.service';
import { FileUploaderComponent } from "src/app/file-uploader/file-uploader.component";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { GeneralInfoModel } from "src/app/models/tracking-models/general-info.model";
import { ListItemModel } from "src/app/models/tracking-models/list-item.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "src/app/pricings/pricing.service";
import { TrackingGlobals } from "../../tracking-globals";
import { TrackingService } from '../../tracking.service';
import { FinalizedInfoComponent } from "../finalized-info/finalized-info.component";
import { GeneralInfoComponent } from "../general-info/general-info.component";
import { ItemsListComponent } from '../items-list/items-list.component';


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
  updateExistingImagesSubject = new ReplaySubject<string[]>();

  statusChangeSubject = new ReplaySubject<string>();

  currentTracking: OnlineTrackingModel; // edit case
  mode = "create";

  private codeScannerSub: Subscription;
  scannerOpened = false;
  showItemsList = false;
  showFinalizedInfo = false;


  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private codeScannerService: CodeScannerService,
    private authService: AuthService,
    private pricingService: PricingService,
    private zone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.codeScannerSub.unsubscribe();
  }

  ngOnInit() {
    this.onlineForm = this.createOnlineForm();
    this.trackingNumeberSubject.next("onl-" + Date.now() + Math.floor(Math.random() * 10000));

    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.selectedUserIdSubject.next(user._id);
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.defaultLocationsSubject.next(org.locations.map(item => item.name));
        this.authService.getUsersByOrg(org._id).subscribe((users: UserModel[] ) => {
          this.users = users;
          this.usersSubject.next(users);
          this.pricingService.getPricing(org.pricings).subscribe((pricing: PricingModel) => {
            this.defaultPricing = pricing;
            this.defaultPricingSubject.next(pricing);
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

    this.codeScannerSub = this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe((code: {code: string}) => {
        this.onlineForm.controls['trackingNumber'].setValue(code.code);
      }, error => {
        this.authService.redirectOnFailedSubscription("Couldn't load code scanner");
      });
  }

  emitChanges() {
    this.patchFormValues(this.currentTracking);
    this.trackingNumeberSubject.next(this.currentTracking.trackingNumber);
    this.generalInfoSubject.next(this.currentTracking.generalInfo);
    this.updateExistingItemsSubject.next(this.currentTracking.itemsList);
    this.costAdjustmentSubject.next(this.currentTracking.generalInfo.costAdjustment);
    this.updateExistingImagesSubject.next(this.currentTracking.generalInfo.filePaths);
    this.itemsListSubject.next(this.itemsList?.getRawValues()?.items);
  }

  patchFormValues(formData: OnlineTrackingModel) {
    this.onlineForm.patchValue({
      _id: formData._id,
      carrierTrackingNumber: formData.carrierTracking?.carrierTrackingNumber,
      carrier: formData.carrierTracking?.carrier,
      received: formData.received,
      content: formData.generalInfo.content
    });
  }

  createOnlineForm() {
    let form = new FormGroup({
      _id: new FormControl(null),
      carrierTrackingNumber: new FormControl("", {validators: [Validators.required]}),
      carrier: new FormControl("", {validators: [Validators.required]}),
      received: new FormControl(false, {validators: [Validators.required]}),
      content: new FormControl(""),
    });

    return form
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
      this.showFinalizedInfo = true;
      this.itemsListSubject.next(null);
    }

  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  pricingUpdate(changes) {
    let customerCode = changes.sender.split(' ')[0];
    let user = this.users?.filter(u => u.customerCode == customerCode)[0];
    changes.sender = user?._id;
    this.pricingUpdatedSubject.next(changes);
    // Error is handled in itemsListComponent
  }

  receivedCheckboxChecked(event: MatCheckboxChange) {
    if (event.checked) {
      this.statusChangeSubject.next(TrackingGlobals.allStatusTypes.ReceivedAtOrigin);
    } else {
      this.statusChangeSubject.next(TrackingGlobals.allStatusTypes.Pending);
    }
    // this.onlineForm.get('received').disable();
  }

  onSave() {
    this.generalInfo.getFormValidity();
    this.itemsList?.getFormValidity();
    this.finalizedInfo?.getFormValidity();

    if (!this.onlineForm.valid || !this.generalInfo.getFormValidity() || (this.itemsList && !this.itemsList.getFormValidity()) || (this.finalizedInfo && !this.finalizedInfo.getFormValidity())) {
      return;
    }

    let sender = this.users.filter(u => u.customerCode == this.generalInfo.getRawValues().sender)[0];
    let recipient = sender.recipients.filter(r => r.name == this.generalInfo.getRawValues().recipient)[0];

    let formData = this.onlineForm.getRawValue();
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

  printPage() {
    window.print();
  }
}
