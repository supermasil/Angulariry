import { Component, NgZone, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subscription } from 'rxjs';
import { AlertService } from "src/app/alert-message";
import { AuthService } from "src/app/auth/auth.service";
import { CodeScannerService } from 'src/app/code-scanner/code-scanner.service';
import { FileUploaderComponent } from "src/app/file-uploader/file-uploader.component";
import { GlobalConstants } from "src/app/global-constants";
import { UserModel } from "src/app/models/user.model";
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
  customerCodesSubject = new ReplaySubject<string[]>();
  mongoDbUserSubscription: Subscription;
  mongoDbUser: UserModel;

  @ViewChild('itemsList') itemsList: ItemsListComponent;
  @ViewChild('fileUploader') fileUploader: FileUploaderComponent;

  private codeScannerSub: Subscription;
  scannerOpened = false;

  constructor(
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private codeScannerService: CodeScannerService,
    private authService: AuthService,
    private alertService: AlertService,
    private zone: NgZone,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.codeScannerSub.unsubscribe();
    this.mongoDbUserSubscription.unsubscribe();
  }

  ngOnInit() {

    // Passed from tracking-list route
    let searchTerm = this.route.snapshot.paramMap.get('searchTerm');
    this.received = this.route.snapshot.paramMap.get('received') === "true";

    // Set up form
    this.onlineForm = new FormGroup({
      trackingNumber: new FormControl({value: "onl-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}),
      carrierTrackingNumber: new FormControl(searchTerm !== null ? searchTerm : "", {validators: [Validators.required]}),
      carrier: new FormControl("", {validators: [Validators.required]}),
      customerCode: new FormControl("", {validators: [Validators.required]}),
      content: new FormControl(""),
      status: new FormControl("", {validators: [Validators.required]})
    });

    this.mongoDbUserSubscription = this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.mongoDbUser = user;
      this.authService.getUsersByOrg(user.organization).subscribe((users: UserModel[]) => {
        this.customerCodesSubject.next(users.map(item => item.customerCode));
      }, error => {
        this.redirectOnError("Couldn't fetch customer codes");
      });
    }, error => {
      this.redirectOnError("Couldn't fetch user");
    })

    this.codeScannerSub = this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe((code: {code: string}) => {
        this.onlineForm.controls['trackingNumber'].setValue(code.code);
      }, error => {
        this.redirectOnError("Couldn't load code scanner");
      });
  }

  redirectOnError(errorMessage: string) {
    this.alertService.error(errorMessage, GlobalConstants.flashMessageOptions);
    this.zone.run(() => {
      this.router.navigate(["/"]);
    });
  }

  async onSave() {
    this.itemsList.triggerValidation();
    console.log(this.onlineForm.valid, this.itemsList.getFormValidity())
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
