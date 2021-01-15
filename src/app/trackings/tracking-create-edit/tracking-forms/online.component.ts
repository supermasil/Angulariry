import { Component, NgZone, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subscription } from 'rxjs';
import { AlertService } from "src/app/alert-message";
import { AuthService } from "src/app/auth/auth.service";
import { CodeScannerService } from 'src/app/code-scanner/code-scanner.service';
import { FileUploaderComponent } from "src/app/file-uploader/file-uploader.component";
import { GlobalConstants } from "src/app/global-constants";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "src/app/pricings/pricing.service";
import { TrackingGlobals } from '../../tracking-globals';
import { TrackingService } from '../../tracking.service';
import { ItemsListComponent } from '../items-list/items-list.component';


@Component({
  selector: 'online-form-create',
  templateUrl: './online.component.html',
  styleUrls: ['./online.component.css', '../tracking-create-edit.component.css']
})
export class OnlineFormCreateComponent {
  onlineForm: FormGroup;

  received = false;
  // tracking: Tracking;
  carriers = TrackingGlobals.carriers;

  internalStatus = ["Received at US WH", "Consolidated"];

  @ViewChild('itemsList') itemsList: ItemsListComponent;
  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;

  private codeScannerSub: Subscription;
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

  scannerOpened = false;

  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private codeScannerService: CodeScannerService,
    private authService: AuthService,
    private alertService: AlertService,
    private zone: NgZone,
    private router: Router,
    private pricingService: PricingService
  ) {}

  ngOnDestroy(): void {
    this.codeScannerSub.unsubscribe();
  }

  ngOnInit() {
    this.onlineForm = this.createOnlineForm(null);
    // Passed from tracking-list route
    let searchTerm = this.route.snapshot.paramMap.get('searchTerm');
    this.received = this.route.snapshot.paramMap.get('received') === "true";

    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.selectedUserIdSubject.next(user._id);
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.defaultLocationsSubject.next(org.locations.map(item => item.name));
        this.authService.getUsersByOrg(org._id).subscribe((users: UserModel[] ) => {
          this.users = users;
          this.customerCodesSubject.next(users.map(user => user.customerCode));
          this.pricingService.getPricing(org.pricings).subscribe((pricing: PricingModel) => {
            this.defaultPricing = pricing;
            this.itemNamesSubject.next(pricing.items.map(i => i.name));
            this.defaultPricingSubject.next(pricing);
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
        this.redirectOnError("Couldn't load code scanner");
      });
  }

  createOnlineForm(formData: any) {
    let form = new FormGroup({
      trackingNumber: new FormControl({value: "onl-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}),
      carrierTrackingNumber: new FormControl("", {validators: [Validators.required]}),
      carrier: new FormControl("", {validators: [Validators.required]}),
      customerCode: new FormControl("", {validators: [Validators.required]}),
      content: new FormControl(""),
      status: new FormControl("", {validators: [Validators.required]})
    });

    return form
  }

  redirectOnError(errorMessage: string) {
    this.alertService.error(errorMessage, GlobalConstants.flashMessageOptions);
    this.zone.run(() => {
      this.router.navigate(["/"]);
    });
  }

  async onSave() {
    this.itemsList.triggerValidation();
    if (this.onlineForm.invalid || !this.itemsList.getFormValidity()) {
      return;
    }

    console.log(this.onlineForm.getRawValue());

    // let postData = this.onlineForm.getRawValue();
    // postData['itemsList'] = this.itemsList.getRawValues();
    // postData['filesToUpload'] = this.fileUploader.getFilesToAdd();
    // postData['fileNames'] = this.fileUploader.getFileNames();
    // postData['filesToDelete'] = this.fileUploader.getFilesToDelete();

    // this.trackingService.createUpdateTracking(postData);
  }

  setUpGeneralInfo() {

  }
}
