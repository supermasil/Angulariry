import { Component } from "@angular/core";
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from 'src/app/auth/auth.service';
import { TrackingGlobals } from '../tracking-globals';
import { TrackingService } from '../tracking.service';
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OrganizationModel } from "src/app/models/organization.model";
import { UserModel } from "src/app/models/user.model";
import { ReplaySubject, Subject } from "rxjs";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { ActivatedRoute, Router } from "@angular/router";

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
  searchTerm = "";

  trackingsSubject: ReplaySubject<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new ReplaySubject();
  resetPaginatorSubject = new Subject();
  searchedTrackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];
  pageData: PageEvent;
  canView = this.authService.canView;
  isAuth = this.authService.isAuth;

  constructor(
    private trackingService: TrackingService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.route.params.subscribe(val => {
      switch (this.route.snapshot.paramMap.get('type')) {
        case TrackingGlobals.trackingTypes.ONLINE:
          this.selectedIndex = 0;
          break;
        case TrackingGlobals.trackingTypes.SERVICED:
          this.selectedIndex = 1;
          break;
        case TrackingGlobals.trackingTypes.INPERSON:
          this.selectedIndex = 2;
          break;
        case TrackingGlobals.trackingTypes.CONSOLIDATED:
          this.selectedIndex = 3;
          break;
        case TrackingGlobals.trackingTypes.MASTER:
          this.selectedIndex = 4;
          break;
      }
      this.setTab(this.selectedIndex);
    });

    this.currentUser = this.authService.getMongoDbUser();
    this.organization = this.authService.getUserOrg();
    this.isLoading = false;
    this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
  }


  setTab(index: Number) {
    switch (index) {
      case 0:
        this.currentTrackingType = TrackingGlobals.trackingTypes.ONLINE;
        this.router.navigate(['/trackings/onl']);
        break;
      case 1:
        this.currentTrackingType = TrackingGlobals.trackingTypes.SERVICED;
        this.router.navigate(['/trackings/sev']);
        break;
      case 2:
        this.currentTrackingType = TrackingGlobals.trackingTypes.INPERSON;
        this.router.navigate(['/trackings/inp']);
        break;
      case 3:
        this.currentTrackingType = TrackingGlobals.trackingTypes.CONSOLIDATED;
        this.router.navigate(['/trackings/csl']);
        break;
      case 4:
        this.currentTrackingType = TrackingGlobals.trackingTypes.MASTER;
        this.router.navigate(['/trackings/mst']);
        break;
    }
  }

  tabChanged(index: Number) {
    this.searchTerm = "";
    this.setTab(index);

  }

  fetchTrackings(trackingsPerPage: number, currenPage: number, type: string) {
    let sender = this.currentUser.role === AuthGlobals.roles.Customer? this.currentUser._id: null;

    this.trackingService.getTrackings(this.searchTerm, trackingsPerPage, currenPage, type, null, null, sender).subscribe((transformedTrackings) => {
      this.trackingsSubject.next(transformedTrackings);
    });
  }

  pageDataChanged (pageData: PageEvent) {
    this.pageData = pageData;
    this.fetchTrackings(pageData.pageSize, pageData.pageIndex + 1, this.currentTrackingType);
  }

  resetPaginator() {
    this.resetPaginatorSubject.next();
  }

  onFuzzySearch(searchTerm: string) {
    this.resetPaginator();
    this.searchTerm = searchTerm;
    if (!searchTerm) {
      this.fetchTrackings(TrackingGlobals.defaultPageSizes[0], 1, this.currentTrackingType);
      return;
    }
    this.fetchTrackings(this.pageData? this.pageData?.pageSize : TrackingGlobals.defaultPageSizes[0], this.pageData? this.pageData.pageIndex + 1: 0 , this.currentTrackingType);
  }

  ngOnDestroy() {

  }
}
