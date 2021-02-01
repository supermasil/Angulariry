import { Component } from "@angular/core";
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from 'src/app/auth/auth.service';
import { TrackingGlobals } from '../tracking-globals';
import { TrackingService } from '../tracking.service';
import { CodeScannerService } from 'src/app/custom-components/code-scanner/code-scanner.service';
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OrganizationModel } from "src/app/models/organization.model";
import { UserModel } from "src/app/models/user.model";
import { ReplaySubject, Subject } from "rxjs";
import { AuthGlobals } from "src/app/auth/auth-globals";

@Component({
  selector: 'app-tracking-list',
  templateUrl: './tracking-list.component.html',
  styleUrls: ['./tracking-list.component.css']
})
export class TrackingListComponent {

  enabled = [true, true, true, true, true];
  selectedIndex = 0;
  currentTrackingType = TrackingGlobals.trackingTypes.ONLINE;

  scannerOpened = false;

  currentUser: UserModel;
  organization: OrganizationModel;
  authGlobals = AuthGlobals;

  isLoading = true;
  searchMode = false;

  trackingsSubject: ReplaySubject<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new ReplaySubject();
  resetPaginatorSubject = new Subject();
  searchedTrackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];

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
        this.isLoading = false;
        this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
      }, error => {
        this.authService.redirectToMainPageWithMessage("Couldn't fetch organization");
      });
    }, error => {
      this.authService.redirectToMainPageWithMessage("Couldn't fetch user");
    });
  }

  fetchTrackings(trackingsPerPage: number, currenPage: number, type: string) {
    this.searchMode = false;
    let sender = null
    if (this.currentUser.role === AuthGlobals.roles.Customer) {
      sender = this.currentUser._id;
    }
    this.trackingService.getTrackings(trackingsPerPage, currenPage, type, this.organization._id, null, null, sender).subscribe((transformedTrackings) => {
      this.trackingsSubject.next(transformedTrackings);
    });
  }

  pageDataChanged (pageData: PageEvent) {
    if (this.searchMode) {
      this.trackingsSubject.next({trackings: this.searchedTrackings.slice(pageData.pageIndex * pageData.pageSize, pageData.pageIndex * pageData.pageSize + pageData.pageSize) , count: this.searchedTrackings.length});
    } else {
      this.fetchTrackings(pageData.pageSize, pageData.pageIndex + 1, this.currentTrackingType);
    }
  }

  resetPaginator() {
    this.resetPaginatorSubject.next();
  }

  tabChanged(index: Number) {
    this.searchMode = true;
    switch (index) {
      case 0:
        this.currentTrackingType = TrackingGlobals.trackingTypes.ONLINE;
        this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
        break;
      case 1:
        this.currentTrackingType = TrackingGlobals.trackingTypes.SERVICED;
        this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
        break;
      case 2:
        this.currentTrackingType = TrackingGlobals.trackingTypes.INPERSON;
        this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
        break;
      case 3:
        this.currentTrackingType = TrackingGlobals.trackingTypes.CONSOLIDATED;
        this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
        break;
      case 4:
        this.currentTrackingType = TrackingGlobals.trackingTypes.MASTER;
        this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
        break;
    }
  }

  onFuzzySearch(searchTerm: string) {
    if (!searchTerm) {
      this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
    }

    this.resetPaginator();

    this.searchMode = true;
    console.log(this.currentTrackingType)
    this.trackingService.fuzzySearch(searchTerm, this.organization._id, this.currentTrackingType).subscribe(trackingData => {
      this.searchedTrackings = trackingData.trackings;
      this.trackingsSubject.next({trackings: this.searchedTrackings.slice(0, TrackingGlobals.defaultPageSizes[0]) , count: this.searchedTrackings.length});
    });
  }

  ngOnDestroy() {

  }

  canView(roles: string[]) {
    return roles.includes(this.authService.getMongoDbUser().role);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
