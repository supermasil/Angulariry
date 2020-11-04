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

  constructor(private trackingService: TrackingService){}
  ngOnInit() {
    // Set up form
    this.form = new FormGroup({
      searchInput: new FormControl(null, {
        validators: [Validators.required]
      }),
    });
  }


  onSearch() {
    console.log("here");
    this.trackingService.getTrackingInfo();
  }

}
