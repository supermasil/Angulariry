import { AfterViewChecked, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Observable } from "rxjs";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { AuthService } from "src/app/auth/auth.service";
import { CommentService } from "src/app/custom-components/comments/comment.service";
import { GlobalConstants } from "src/app/global-constants";
import { OrganizationModel } from "src/app/models/organization.model";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import {InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { UserModel } from "src/app/models/user.model";
import { TrackingGlobals } from "../../tracking-globals";
import { TrackingService } from "../../tracking.service";
import { getTracking } from 'ts-tracking-number';
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";


@Component({
  selector: 'tracking-list-common',
  templateUrl: './tracking-list-common.component.html',
  styleUrls: ['../tracking-list.component.css']
})
export class TrackingListCommonComponent implements OnInit, AfterViewChecked {
  trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];
  displayedColumns: string[] = ['trackingNumber', 'trackingStatus', 'financialStatus', 'recipient'];
  dataSource = new MatTableDataSource(this.trackings);
  @ViewChild(MatSort) sort: MatSort;

  totalTrackings = 0;
  pageSizeOptions = GlobalConstants.defaultPageSizes;
  currentPageSize = this.pageSizeOptions[0];
  currentUser: UserModel;
  currentOrg: OrganizationModel;
  authGlobal = AuthGlobals;
  trackingGlobals = TrackingGlobals;

  canView = this.authService.canView;
  isAuth = this.authService.isAuth;

  getBadgeColor = TrackingGlobals.getBadgeColor;

  @ViewChild('paginator') paginator: MatPaginator;

  preTransitCodes = TrackingGlobals.preTransitCodes;
  inTransitCodes = TrackingGlobals.inTransitCodes
  deliveryCodes = TrackingGlobals.deliveryCodes
  failureCodes = TrackingGlobals.failureCodes;
  globalConstants = GlobalConstants;
  expanded = [];

  @Input() trackingsObservable: Observable<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new Observable();
  @Input() resetPaginatorObservable = new Observable()
  @Output() pageDataChangeEvent = new EventEmitter<PageEvent>();

  constructor(
    private trackingService: TrackingService,
    private commentService: CommentService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ){}

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
    this.currentOrg = this.authService.getUserOrg();

    this.trackingsObservable.subscribe((data: {trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}) => {
      this.trackings = data.trackings;
      this.totalTrackings = data.count;
      this.expanded = [];
      this.trackings.forEach(t => {
        this.expanded.push(false);
      })
      this.dataSource = new MatTableDataSource(data.trackings);
      if (data.trackings.length > 0 && data.trackings[0].generalInfo.type == "mst") {
        this.displayedColumns = this.displayedColumns.slice(0, -1);
      }
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch(property) {
          case 'trackingNumber': return item.trackingNumber;
          case 'trackingStatus': return item.generalInfo.trackingStatus;
          case 'financialStatus': return item.generalInfo.financialStatus;
          case 'recipient': return item.generalInfo.recipient.name;
          default: return item[property];
        }
      };
      this.dataSource.sort = this.sort;
    });

    this.resetPaginatorObservable.subscribe(() =>{
      this.paginator?.firstPage();
    });
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  onDelete(trackingId: string) {
    // this.trackingService.deleteTracking(trackingId).subscribe(() => {
      // this.trackingService.getTrackings(this.trackingsPerPage, this.currentPage); // refetch after deletion
    // });
  }

  // Change # of trackings per page
  pageDataChanged(pageData: PageEvent) {
    this.pageDataChangeEvent.emit(pageData);
  }

  onCommentSubmit(trackingId: string, trackingNumber: string, content: string) {
    if (!content.trim()) {
      return;
    }
    let filePaths: string[] = [];
    this.commentService.createComment(trackingId, trackingNumber, content, filePaths)
      .subscribe(response => {
        this.trackings.filter(t => t._id === trackingId)[0].generalInfo.comments.unshift(response)
      });
  }

  getHeaderColor(status: string) {
    if (this.preTransitCodes.includes(status)) {
      return "bg-dark"
    } else if (this.inTransitCodes.includes(status)) {
      return "bg-warning"
    } else if (this.deliveryCodes.includes(status)) {
      return "bg-info"
    } else if (this.failureCodes.includes(status)) {
      return "bg-danger"
    } else if (status === "received_at_us_warehouse") {
      return "bg-success"
    }
  }

  canEdit(roles: string[], creatorId: string) {
    return roles?.includes(this.authService.getMongoDbUser()?.role) || creatorId === this.currentUser._id
  }

  trackingToggle(tracking: OnlineTrackingModel | ServicedTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel, index: number, status: string) {
    this.trackingService.changeTrackingStatus(status, tracking._id, tracking.generalInfo.type, null).subscribe(response => {
      this.zone.run(() => {
        this.trackings[index] = response.tracking;
      });
    });
  }

  getCarrierTrackingUrl(value: string) {
    let url = getTracking(value)?.trackingUrl? getTracking(value).trackingUrl.slice(0, -2) + value : "";
    return url;
  }
}
