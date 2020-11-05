import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TrackingService } from './tracking.service';

@Component({
  selector: 'app-tracking',
  templateUrl: 'tracking.component.html',
  styleUrls: ['tracking.component.css']
})
export class TrackingComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  carriers: String[] = [
    "UPS",
    "Fedex",
    "USPS"
  ];

  tracked = false;

  tracker: {
    tracking_code: String,
    carrier: String,
    origin_location: String,
    destination_location: String,
    signed_by: String,
    status: String
  }

  constructor(private trackingService: TrackingService){}
  ngOnInit() {
    // Set up form
    this.tracker = {
      tracking_code: "",
      carrier: "",
      origin_location: "",
      destination_location: "",
      signed_by: "",
      status: ""
    }
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
      .subscribe(tracker => {
        this.isLoading = false;
        console.log(tracker);
        let trackingData = JSON.parse(JSON.stringify(tracker));
        if (trackingData.status != "unknown") {
          this.tracked = true;
          this.tracker = {
            tracking_code: trackingData.tracking_code,
            carrier: trackingData.carrier,
            origin_location: trackingData.carrier_detail.origin_location,
            destination_location: trackingData.carrier_detail.destination_location,
            signed_by: trackingData.signed_by,
            status: trackingData.status
          }
        }
      }, error => {
        this.isLoading = false;
      });
  }
}
