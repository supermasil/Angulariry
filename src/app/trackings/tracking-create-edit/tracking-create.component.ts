import { Component, OnInit, OnDestroy } from '@angular/core';
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
  isLoading = false;
  form: FormGroup;
  imagePreview: string;
  private authStatusSub: Subscription;

  carriers = TrackingGlobals.carriers;

  constructor(
    public trackingService: TrackingService,
    public route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.authStatusSub.unsubscribe();
  }

  ngOnInit() {
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(
      authStatus => {
        this.isLoading = false; // Remove spinner every time auth status changes
      }
    );
    // Set up form
    this.form = new FormGroup({
      trackingNumber: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)]
      }),
      carrier: new FormControl(null, {validators: [Validators.required]}),
      content: new FormControl(null),
      image: new FormControl(null, {asyncValidators: [mimeType]})
    }, {updateOn: 'blur'});

    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has('trackingId')) { // Edit case
        this.mode = 'edit';
        this.trackingId = paramMap.get('trackingId');
        this.isLoading = true;

        this.trackingService.getTracking(this.trackingId).subscribe(
          trackingData => {
            this.isLoading = false;
            this.tracking = trackingData as Tracking;
            // Initialize the form
            this.form.setValue({
              trackingNumber: this.tracking.trackingNumber,
              carrier: this.tracking.carrier,
              content: this.tracking.content ? this.tracking.content : "",
              image: this.tracking.imagePath ? this.tracking.imagePath : null
            });
          },
          err => {
            this.router.navigate(['/404']);
          });
      } else {
        this.mode = 'create';
        this.trackingId = null;
        this.isLoading = false;
      }
    });
  }

  onSaveTracking() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === 'create') {
      this.trackingService.addTracking(
        this.form.value.trackingNumber,
        this.form.value.carrier,
        this.form.value.content,
        this.form.value.image);
    } else {
      this.trackingService.updateTracking(
        this.trackingId,
        this.form.value.trackingNumber,
        this.form.value.carrier,
        this.form.value.content,
        this.form.value.image);
    }
    this.isLoading = false;
    // this.form.reset();
  }

  onImagePicked(event: Event) {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({image: file}); // Target a single control
    this.form.get('image').updateValueAndValidity(); // Update and validate without html form
    const reader = new FileReader();
    reader.onload = () => { // When done loading
      this.imagePreview = reader.result as string;
    }
    reader.readAsDataURL(file); // This will kick off onload process
  }
}
