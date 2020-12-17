import { Component, NgZone, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router';
import { Tracking } from '../models/tracking.model';
import { TrackingService } from '../tracking.service';


@Component({
  selector: 'app-tracking-create',
  templateUrl: './tracking-create.component.html',
  styleUrls: ['./tracking-create.component.css']
})

export class TrackingCreateComponent implements OnInit {

  formModes = ["Online", "Serviced", "In-person", "Consolidated", "Master"];
  selectedIndex = 0;

  private mode = 'create';
  private trackingId: string;
  tracking: Tracking;


  constructor(
    public route: ActivatedRoute,
    public trackingService: TrackingService,
    private zone: NgZone,
    public router: Router,
  ) {}



  ngOnInit() {
    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has('trackingId')) { // Edit case
        this.mode = 'edit';
        this.trackingId = paramMap.get('trackingId');

        this.trackingService.getTracking(this.trackingId).subscribe(
          trackingData => {
            this.tracking = trackingData as Tracking;

            // Initialize the form
            // this.onlineForm.setValue({
            //   trackingNumber: this.tracking.trackingNumber,
            //   carrier: this.tracking.carrier,
            //   content: this.tracking.content ? this.tracking.content : "",
            //   fileValidator: null
            // });

            // this.filePaths = this.tracking.filePaths;
            // // Load images preview
            // this.filePaths.forEach(file => {
            //   this.filesPreview.push(file);
            // });
            // this.received = this.tracking.status === "received_at_us_warehouse" ? true : false;
          },
          err => {
            this.zone.run(() => {
              this.router.navigate(["/404"]);
            });
          });
      } else {
        this.mode = 'create';
        this.trackingId = null;
      }
    });
  }
}
