import { Component, ViewChild } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { CodeScannerService } from 'src/app/code-scanner/code-scanner.service';
import { TrackingGlobals } from '../../tracking-globals';
import { Tracking } from '../../tracking.model';
import { TrackingService } from '../../tracking.service';
import { ItemsListComponent } from '../items-list/items-list.component';


@Component({
  selector: 'online-form-create',
  templateUrl: './online-form.component.html',
  styleUrls: ['./online-form.component.css', '../tracking-create.component.css']
})
export class OnlineFormCreateComponent {
  onlineForm: FormGroup;

  private mode = 'create';
  private trackingId: string;
  received = false;
  tracking: Tracking;
  carriers = TrackingGlobals.carriers;

  internalStatus = ["Received at US WH", "Consolidated"];

  @ViewChild('itemsList') itemsList: ItemsListComponent;

  scannerOpened = false;

  private authStatusSub: Subscription;
  private codeScannerSub: Subscription;

  constructor(
    public trackingService: TrackingService,
    public route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private codeScannerService: CodeScannerService,
  ) {}

  ngOnDestroy(): void {
    this.authStatusSub.unsubscribe();
    this.codeScannerSub.unsubscribe();
  }

  ngOnInit() {
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(
      authStatus => {
        // this.isLoading = false; // Remove spinner every time auth status changes
      }
    );

    // Passed from tracking-list route
    let searchTerm = this.route.snapshot.paramMap.get('searchTerm');
    this.received = this.route.snapshot.paramMap.get('received') === "true";

    // Set up form
    this.onlineForm = new FormGroup({
      trackingNumber: new FormControl(searchTerm !== "null" ? searchTerm : "", {
        validators: [Validators.required]
      }),
      carrier: new FormControl(null, {validators: [Validators.required]}),
      content: new FormControl(""),
      status: new FormControl(null, {validators: [Validators.required]}),
      boxes: new FormArray([])
    });

    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has('trackingId')) { // Edit case
        this.mode = 'edit';
        this.trackingId = paramMap.get('trackingId');

        this.trackingService.getTracking(this.trackingId).subscribe(
          trackingData => {
            this.tracking = trackingData as Tracking;
            // Initialize the form
            this.onlineForm.setValue({
              trackingNumber: this.tracking.trackingNumber,
              carrier: this.tracking.carrier,
              content: this.tracking.content ? this.tracking.content : "",
              fileValidator: null
            });
            // this.filePaths = this.tracking.filePaths;
            // // Load images preview
            // this.filePaths.forEach(file => {
            //   this.filesPreview.push(file);
            // });
            this.received = this.tracking.status === "received_at_us_warehouse" ? true : false;
          },
          err => {
            this.router.navigate(['/404']);
          });
      } else {
        this.mode = 'create';
        this.trackingId = null;
      }
    });

    this.codeScannerSub = this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe((code: {code: string}) => {
        this.onlineForm.controls['trackingNumber'].setValue(code.code);
      });
  }


  async onSave() {
    this.itemsList.triggerValidation();

    if (this.onlineForm.invalid || !this.itemsList.getFormValidity()) {
      return;
    }

    // if (this.mode === 'create') {
    //   this.trackingService.createTracking(
    //     this.onlineForm.value.trackingNumber,
    //     this.onlineForm.value.carrier,
    //     this.onlineForm.value.content,
    //     this.received,
    //     this.filesToAdd,
    //     this.fileNames);
    // } else {
    //   this.trackingService.updateTracking(
    //     this.trackingId,
    //     this.onlineForm.value.trackingNumber,
    //     this.onlineForm.value.carrier,
    //     this.onlineForm.value.content,
    //     this.received,
    //     this.filesToAdd,
    //     this.fileNames,
    //     this.filesToDelete);
    // }
  }

}
