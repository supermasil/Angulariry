import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TrackingService } from '../tracking.service';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import { Tracker } from '../models/tracker.model';
import { TrackingDetail } from '../models/tracking-details.model';
import { AlertService } from '../../alert-message';
import { GlobalConstants } from '../../global-constants';
import { GeneralMethods } from '../../shared/general-methods';
import { TrackingGlobals } from '../tracking-globals';

@Component({
  selector: 'app-tracking',
  templateUrl: 'tracking-tool.component.html',
  styleUrls: ['tracking-tool.component.css'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: {displayDefaultIndicatorType: false}
  }]
})
export class TrackingToolComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  shippingProgress = [false, false, false, false];
  stepCompletion = [false, false, false, false];

  carriers = TrackingGlobals.carriers;
  preTransitCodes = TrackingGlobals.preTransitCodes;
  inTransitCodes = TrackingGlobals.inTransitCodes
  deliveryCodes = TrackingGlobals.deliveryCodes
  failureCodes = TrackingGlobals.failureCodes;

  // To prevent ng-star-inserted issue
  inTransitTrackingDetails = [];
  deliveryTrackingDetails = [];
  failureTrackingDetails = [];

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

  resetStatus() {
    this.shippingProgress = [false, false, false, false];
    this.stepCompletion = [false, false, false, false];
    this.inTransitTrackingDetails = [];
    this.deliveryTrackingDetails = [];
    this.failureTrackingDetails = [];
  }
  async onSearch() {
    if (this.form.invalid) {
      return;
    }
    this.resetStatus();

    this.isLoading = true;
    this.tracked = false;
    await this.trackingService.getTrackingInfo(this.form.value.trackingNumber, this.form.value.carrier)
      .subscribe(trackerData => {
        this.isLoading = false;
        let status = trackerData["status"];
        this.tracked = true;
        this.tracker = trackerData as Tracker;
        console.log(this.tracker);
        this.setTrackingDetails(this.tracker);
      }, error => {
        this.isLoading = false;
        // this.alertService.warn("The status of this package is unknown", GlobalConstants.flashMessageOptions);
      });
  }

  setTrackingDetails(tracker: Tracker) {
    tracker.tracking_details.forEach(element => {
      if (this.preTransitCodes.includes(element.status)) {
        element.tracking_location = tracker.carrier_detail.origin_tracking_location;
        this.inTransitTrackingDetails.push(element as TrackingDetail);
        this.shippingProgress[0] = true;
        this.stepCompletion[0] = true;
      } else if(this.inTransitCodes.includes(element.status)) {
        this.inTransitTrackingDetails.push(element as TrackingDetail);
        this.shippingProgress[1] = true;
        this.stepCompletion[0] = true;
      } else if (this.deliveryCodes.includes(element.status)) {
        this.deliveryTrackingDetails.push(element as TrackingDetail);
        this.shippingProgress[2] = true;
        this.stepCompletion[1] = true;
        this.stepCompletion[2] = true;
      } else if (this.failureCodes.includes(element.status)) {
        this.failureTrackingDetails.push(element as TrackingDetail);
        this.shippingProgress[3] = true;
      }
    });
  }

}
