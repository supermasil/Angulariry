import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { AuthService } from 'src/app/auth/auth.service';
import { TrackingGlobals } from '../tracking-globals';



@Component({
  selector: 'app-tracking-create',
  templateUrl: './tracking-create-edit.component.html',
  styleUrls: ['./tracking-create-edit.component.css']
})

export class TrackingCreateEditComponent implements OnInit {
  selectedIndex = 0;
  enabled = [false, false, false, false, false];
  authGlobals = AuthGlobals;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subcribe to see the active route
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.get('trackingId')?.includes(TrackingGlobals.trackingTypes.ONLINE) || paramMap.get('type')?.includes(TrackingGlobals.trackingTypes.ONLINE)) {
        this.selectedIndex = 0;
      } else if (paramMap.get('trackingId')?.includes(TrackingGlobals.trackingTypes.SERVICED) || paramMap.get('type')?.includes(TrackingGlobals.trackingTypes.SERVICED)) {
        this.selectedIndex = 1;
      } else if (paramMap.get('trackingId')?.includes(TrackingGlobals.trackingTypes.INPERSON) || paramMap.get('type')?.includes(TrackingGlobals.trackingTypes.INPERSON)) {
        this.selectedIndex = 2;
      } else if (paramMap.get('trackingId')?.includes(TrackingGlobals.trackingTypes.CONSOLIDATED) || paramMap.get('type')?.includes(TrackingGlobals.trackingTypes.CONSOLIDATED)) {
        this.selectedIndex = 3;
      } else if (paramMap.get('trackingId')?.includes(TrackingGlobals.trackingTypes.MASTER) || paramMap.get('type')?.includes(TrackingGlobals.trackingTypes.MASTER)) {
        this.selectedIndex = 4;
      } else {
        return this.authService.redirect404();
      }
      this.disableTheRest(this.selectedIndex);
    });
  }

  disableTheRest(index: number) {
    let temp = [...this.enabled];
    this.enabled.forEach((tab, i) => {
      if (i != index) {
        temp[i] = false;
      } else {
        temp[i] = true;
      }
    });
    this.enabled = [...temp];
  }

  canView(roles: string[]) {
    return roles.includes(this.authService.getMongoDbUser().role);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
