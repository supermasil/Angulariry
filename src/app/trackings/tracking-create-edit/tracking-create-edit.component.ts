import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackingService } from '../tracking.service';


@Component({
  selector: 'app-tracking-create',
  templateUrl: './tracking-create-edit.component.html',
  styleUrls: ['./tracking-create-edit.component.css']
})

export class TrackingCreateEditComponent implements OnInit {

  // formModes = ["Online", "Serviced", "In-person", "Consolidated", "Master", "Pricing"];
  selectedIndex = 0;

  private mode = 'create';
  private trackingId: string;
  // tracking: Tracking;


  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}



  ngOnInit() {
    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has('trackingId')) { // Edit case
        // this.mode = 'edit';
        // this.trackingId = paramMap.get('trackingId');

        // this.trackingService.getTracking(this.trackingId).subscribe(
        //   trackingData => {
        //     this.tracking = trackingData as Tracking;

        //     Initialize the form
        //     this.onlineForm.setValue({
        //       trackingNumber: this.tracking.trackingNumber,
        //       carrier: this.tracking.carrier,
        //       content: this.tracking.content ? this.tracking.content : "",
        //       fileValidator: null
        //     });

        //     this.filePaths = this.tracking.filePaths;
        //     // Load images preview
        //     this.filePaths.forEach(file => {
        //       this.filesPreview.push(file);
        //     });
        //     this.received = this.tracking.status === "received_at_us_warehouse" ? true : false;
        //   },
        //   err => {
        //     this.zone.run(() => {
        //       this.router.navigate(["/404"]);
        //     });
        //   });
      } else if (paramMap.has('pricingId') || this.router.url == "/pricings/new") {
        this.selectedIndex = 5;
      }
    });
  }
}
