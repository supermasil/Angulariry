import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subject } from 'rxjs';
import { AuthGlobals } from '../auth/auth-globals';
import { AuthService } from '../auth/auth.service';
import { OrganizationModel } from '../models/organization.model';
import { ConsolidatedTrackingModel } from '../models/tracking-models/consolidated-tracking.model';
import { InPersonTrackingModel } from '../models/tracking-models/in-person-tracking.model';
import { MasterTrackingModel } from '../models/tracking-models/master-tracking.model';
import { OnlineTrackingModel } from '../models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from '../models/tracking-models/serviced-tracking.model';
import { UserModel } from '../models/user.model';
import { TrackingGlobals } from '../trackings/tracking-globals';
import { TrackingService } from '../trackings/tracking.service';

@Component({
  selector: 'app-front-page',
  templateUrl: 'front-page.component.html',
  styleUrls: ['front-page.component.css']
})
export class FrontPageComponent implements OnInit{
  organizations : OrganizationModel[] = [];
  companiesSubject = new ReplaySubject<string[]>();
  trackingsSubject: ReplaySubject<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new ReplaySubject();
  currentUser: UserModel;
  searchedTrackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];
  resetPaginatorSubject = new Subject();
  currentTrackingType = null;
  pageData: PageEvent;
  searchTerm = "";
  showingResults = false;

  constructor(
    private authService: AuthService,
    private trackingService: TrackingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
    this.route.paramMap.subscribe((paramMap) => {
      if (this.router.url.includes("/trackings/view/")) {
        this.onFuzzySearch(paramMap.get('trackingId'));
      }
    });
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
    this.currentTrackingType = this.trackingService.getTrackingTypeFromString(searchTerm);
    this.resetPaginator();
    this.searchTerm = searchTerm;
    if (!searchTerm || !this.currentTrackingType) {
      this.showingResults = false;
      this.trackingsSubject.next({trackings:[], count: 0});
      return;
    }
    this.fetchTrackings(this.pageData? this.pageData?.pageSize : TrackingGlobals.defaultPageSizes[0], this.pageData? this.pageData.pageIndex + 1: 0 , this.currentTrackingType);
    this.showingResults = true;
  }
}
