import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms'

import { TrackingService } from '../tracking.service';
import { ActivatedRoute } from '@angular/router'; // to get info of the route through params
import { Tracking } from '../tracking.model';
import { mimeType } from "./mime-type.validator";
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { TrackingGlobals } from '../tracking-globals';

@Component({
  selector: 'app-tracking-create',
  templateUrl: './tracking-create.component.html',
  styleUrls: ['./tracking-create.component.css']
})

export class TrackingCreateComponent implements OnInit, OnDestroy{
  private mode = 'create';
  private trackingId: string;
  private carrier: string;
  tracking: Tracking;
  form: FormGroup;
  imagesPreview = new Set<string>();
  private authStatusSub: Subscription;
  filePaths: string[] = [];

  carriers = TrackingGlobals.carriers;
  selectedFiles = new Set<File>();
  filesToDelete = [];

  constructor(
    public trackingService: TrackingService,
    public route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.authStatusSub.unsubscribe();
  }

  ngOnInit() {
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(
      authStatus => {
        // this.isLoading = false; // Remove spinner every time auth status changes
      }
    );
    // Set up form
    this.form = new FormGroup({
      trackingNumber: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)]
      }),
      carrier: new FormControl(null, {validators: [Validators.required]}),
      content: new FormControl(null),
      fileValidator: new FormControl(null, {asyncValidators: [mimeType]})
    }, {updateOn: 'blur'});

    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has('trackingId')) { // Edit case
        this.mode = 'edit';
        this.trackingId = paramMap.get('trackingId');

        this.trackingService.getTracking(this.trackingId).subscribe(
          trackingData => {
            this.tracking = trackingData as Tracking;
            // Initialize the form
            this.form.setValue({
              trackingNumber: this.tracking.trackingNumber,
              carrier: this.tracking.carrier,
              content: this.tracking.content ? this.tracking.content : "",
              fileValidator: null
            });
            this.filePaths = this.tracking.filePaths;
            // Load images preview
            this.filePaths.forEach(file => {
              this.imagesPreview.add(file);
            });
          },
          err => {
            this.router.navigate(['/404']);
          });
      } else {
        this.mode = 'create';
        this.trackingId = null;
      }
    });
  }

  async onSaveTracking() {
    if (this.form.invalid) {
      return;
    }
    if (this.mode === 'create') {
      await this.trackingService.createTracking(
        this.form.value.trackingNumber,
        this.form.value.carrier,
        this.form.value.content,
        this.selectedFiles);
    } else {
      await this.trackingService.updateTracking(
        this.trackingId,
        this.form.value.trackingNumber,
        this.form.value.carrier,
        this.form.value.content,
        this.selectedFiles,
        this.filesToDelete);
    }
  }

  onFilePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];

    if (!file) {
      return;
    }

    // Trigger mimetype validator
    this.form.patchValue({image: file}); // Target a single control
    this.form.get('fileValidator').updateValueAndValidity(); // Update and validate without html form

    const reader = new FileReader();
    reader.onload = () => { // When done loading
      if(this.form.get("fileValidator").valid) {
        this.selectedFiles.add(file);
        this.imagesPreview.add(reader.result as string);
      }
    }
    reader.readAsDataURL(file); // This will kick off onload process
  }

  deleteImage(index: number, url: string) {
    let imagesPreviewItem = [...this.imagesPreview][index];
    let fileItem = [...this.selectedFiles][index];
    this.imagesPreview.delete(imagesPreviewItem);
    this.selectedFiles.delete(fileItem);
    if (this.mode === "edit") {
      if (this.filePaths.includes(url)) {
        this.filesToDelete.push(url);
      }
    }
  }
}
