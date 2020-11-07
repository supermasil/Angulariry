import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TrackingService } from './tracking.service';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import { Tracker } from './models/tracker.model';
import { TrackingDetail } from './models/tracking-details.model';
import { AlertService } from '../alert-message';
import { GlobalConstants } from '../global-constants';
import { GeneralMethods } from '../shared/general-methods';

@Component({
  selector: 'app-tracking',
  templateUrl: 'tracking.component.html',
  styleUrls: ['tracking.component.css'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {displayDefaultIndicatorType: false}
  }]
})
export class TrackingComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  shippingProgress = [false, false, false];
  stepCompletion = [false, false, false];

  carriers = [
    "UPS",
    "Fedex",
    "USPS",
    "AmazonMws",
    "OnTrac"
  ];

  preTransitCodes = [
    "pre_transit"
  ]
  inTransitCodes = [
    "in_transit"
  ];

  deliveryCodes = [
    "out_for_delivery",
    "delivered",
    "return_to_sender",
  ];

  failureCodes = [
    "failure",
    "unknown"
  ];

  // To prevent ng-star-inserted issue
  inTransitTrackingDetails = [];
  deliveryTrackingDetails = [];

  tracked = false;
  tracker: Tracker;

  capitalizeFirstLetter = GeneralMethods.capitalizeFirstLetter;

  constructor(private trackingService: TrackingService, private alertService: AlertService){}
  ngOnInit() {
    // Set up form
    this.form = new FormGroup({
      trackingNumber: new FormControl(null, {
        validators: [Validators.required]
      }),
      carrier: new FormControl(null, {
        validators: [Validators.required]
      })
    });

  }

  async onSearch() {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.tracked = false;
    await this.trackingService.getTrackingInfo(this.form.value.trackingNumber, this.form.value.carrier)
      .subscribe(trackerData => {
        this.isLoading = false;
        let status = trackerData["status"];
        if (!this.failureCodes.includes(status)) {
          this.tracked = true;
          this.tracker = trackerData as Tracker;
          console.log(this.tracker);
          this.setShippingProgress(status);
          this.setTrackingDetails(this.tracker);
        }
        else {
          this.alertService.warn("The status of this package is unknown", GlobalConstants.flashMessageOptions);
        }
      }, error => {
        this.isLoading = false;
      });
  }

  setShippingProgress(status: string) {
    if (this.preTransitCodes.includes(status)) {
      this.shippingProgress = [true, true, false];
      this.stepCompletion = [true, false, false];
      console.log(this.stepCompletion)
    } else if (this.inTransitCodes.includes(status)) {
      this.shippingProgress = [true, true, false];
      this.stepCompletion = [true, false, false];
    } else if (this.deliveryCodes.includes(status) && status !== "delivered") {
      this.shippingProgress = [true, true, true];
      this.stepCompletion = [true, true, false];
    } else if (status === "delivered") {
      this.shippingProgress = [true, true, true];
      this.stepCompletion = [true, true, true];
    }
  }

  setTrackingDetails(tracker: Tracker) {
    tracker.tracking_details.forEach(element => {
      if (this.preTransitCodes.includes(element.status) || this.inTransitCodes.includes(element.status)) {
        element.tracking_location = tracker.carrier_detail.origin_tracking_location;
        this.inTransitTrackingDetails.push(element as TrackingDetail);
      } else if (this.deliveryCodes.includes(element.status)) {
        this.deliveryTrackingDetails.push(element as TrackingDetail);
      }
    });
  }

}
