import { Component, NgZone, OnInit } from '@angular/core';
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
    private router: Router,
    private zone: NgZone
  ) {}



  ngOnInit() {
    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (this.router.url.includes('edit')) {
        if (paramMap.get('type') === 'online') {
          this.selectedIndex = 0;
        } else if (paramMap.get('type') === 'serviced') {
          this.selectedIndex = 1;
        } else if (paramMap.get('type') === 'inperson') {
          this.selectedIndex = 2;
        } else if (paramMap.get('type') === 'consolidated') {
          this.selectedIndex = 3;
        } else if (paramMap.get('type') === 'master') {
          this.selectedIndex = 4;
        }
      }
    });
  }
}
