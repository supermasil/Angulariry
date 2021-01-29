import { Component } from "@angular/core";
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from 'src/app/auth/auth.service';
import { TrackingGlobals } from '../tracking-globals';
import { TrackingService } from '../tracking.service';
import { CodeScannerService } from 'src/app/code-scanner/code-scanner.service';
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OrganizationModel } from "src/app/models/organization.model";
import { UserModel } from "src/app/models/user.model";
import { ReplaySubject } from "rxjs";

@Component({
  selector: 'app-tracking-list',
  templateUrl: './tracking-list.component.html',
  styleUrls: ['./tracking-list.component.css']
})
export class TrackingListComponent {

  enabled = [true, true, true, true, true];
  selectedIndex = 0;
  currentTrackingType = TrackingGlobals.trackingTypes.ONLINE;

  searchClicked = false;
  scannerOpened = false;

  currentUser: UserModel;
  selectedUser: UserModel;
  organization: OrganizationModel;

  trackingsSubject: ReplaySubject<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new ReplaySubject();

  constructor(
    public trackingService: TrackingService,
    private authService: AuthService,
    private codeScannerService: CodeScannerService
  ) {} // Public simplifies code

  async ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.fetchTrackings(10, 1, this.currentTrackingType);
      }, error => {
        this.authService.redirectOnFailedSubscription("Couldn't fetch organization");
      });
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch user");
    });

    this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe((code: {code: string}) => {

      });
  }

  fetchTrackings(trackingsPerPage: number, currenPage: number, type: string) {
    this.trackingService.getTrackings(trackingsPerPage, currenPage, type, this.organization._id, null, null, null).subscribe((transformedTrackings) => {
      this.trackingsSubject.next(transformedTrackings);
    });
  }

  pageDataChanged (pageData: PageEvent) {
    this.fetchTrackings(pageData.pageSize, pageData.pageIndex + 1, this.currentTrackingType);
  }

  tabChanged(index: Number) {
    switch (index) {
      case 0:
        this.currentTrackingType = TrackingGlobals.trackingTypes.ONLINE;
        this.fetchTrackings(10, 1, this.currentTrackingType);
        break;
      case 1:
        this.currentTrackingType = TrackingGlobals.trackingTypes.SERVICED;
        this.fetchTrackings(10, 1, this.currentTrackingType);
        break;
      case 2:
        this.currentTrackingType = TrackingGlobals.trackingTypes.INPERSON;
        this.fetchTrackings(10, 1, this.currentTrackingType);
        break;
      case 3:
        this.currentTrackingType = TrackingGlobals.trackingTypes.CONSOLIDATED;
        this.fetchTrackings(10, 1, this.currentTrackingType);
        break;
      case 4:
        this.currentTrackingType = TrackingGlobals.trackingTypes.MASTER;
        this.fetchTrackings(10, 1, this.currentTrackingType);
        break;
    }
  }

  onFuzzySearch() {
    // this.trackingService.fuzzySearch(this.trackingsPerPage, this.currentPage, this.trackingForm.value.searchTerm);
    this.searchClicked = true;
  }

  ngOnDestroy() {

  }
}
