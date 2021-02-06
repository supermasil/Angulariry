import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TrackingService } from '../tracking.service';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import { TrackerModel } from '../../models/easy-post-models/tracker.model';
import { TrackingDetailModel } from '../../models/easy-post-models/tracking-details.model';
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
  searchForm: FormGroup;
  isLoading = false;
  shippingProgress = [false, false, false, false];
  stepCompletion = [false, false, false, false];
  // To prevent ng-star-inserted issue
  inTransitTrackingDetails = [];
  deliveryTrackingDetails = [];
  failureTrackingDetails = [];

  carriers = TrackingGlobals.carriers;
  preTransitCodes = TrackingGlobals.preTransitCodes;
  inTransitCodes = TrackingGlobals.inTransitCodes;
  deliveryCodes = TrackingGlobals.deliveryCodes;
  failureCodes = TrackingGlobals.failureCodes;
  codesMapping = TrackingGlobals.codesMapping;

  scannerOpened = false;

  tracked = false;
  tracker: TrackerModel;

  capitalizeFirstLetter = GeneralMethods.capitalizeFirstLetter;

  constructor(
    private trackingService: TrackingService)
    {}

  ngOnInit() {
    // Set up form
    this.searchForm = new FormGroup({
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

  async onSearch(value: string) {
    this.searchForm.get('trackingNumber').setValue(value);
    if (this.searchForm.invalid) {
      return;
    }
    this.resetStatus();

    this.isLoading = true;
    this.tracked = false;
    await this.trackingService.getTrackingInfo(this.searchForm.value.trackingNumber, this.searchForm.value.carrier)
      .subscribe(trackerData => {
        this.isLoading = false;
        // let status = trackerData["status"];
        this.tracked = true;
        this.tracker = trackerData as TrackerModel;
        this.setTrackingDetails(this.tracker);
      }, error => {
        this.isLoading = false;
        // this.alertService.warn("The status of this package is unknown", GlobalConstants.flashMessageOptions);
      });
  }

  setTrackingDetails(tracker: TrackerModel) {
    tracker.tracking_details.forEach(element => {
      if (this.preTransitCodes.includes(element.status)) {
        element.tracking_location = tracker.carrier_detail.origin_tracking_location;
        this.inTransitTrackingDetails.unshift(element as TrackingDetailModel);
        this.shippingProgress[0] = true;
        this.stepCompletion[0] = true;
      } else if(this.inTransitCodes.includes(element.status)) {
        this.inTransitTrackingDetails.unshift(element as TrackingDetailModel);
        this.shippingProgress[1] = true;
        this.stepCompletion[0] = true;
      } else if (this.deliveryCodes.includes(element.status)) {
        this.deliveryTrackingDetails.unshift(element as TrackingDetailModel);
        this.shippingProgress[2] = true;
        this.stepCompletion[1] = true;
        this.stepCompletion[2] = true;
      } else if (this.failureCodes.includes(element.status)) {
        this.failureTrackingDetails.unshift(element as TrackingDetailModel);
        this.shippingProgress[3] = true;
      }
    });
  }

}
