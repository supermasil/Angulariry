import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Observable } from "rxjs";
import { GlobalConstants } from "src/app/global-constants";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { TrackingGlobals } from "src/app/trackings/tracking-globals";

@Component({
  selector: 'trackings-report-compact',
  templateUrl: './trackings-report-compact.component.html',
  styleUrls: ['./trackings-report-compact.component.css']
})
export class TrackingsReportCompactComponent implements OnInit {
  trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];

  totalTrackings = 0;
  pageSizeOptions = GlobalConstants.defaultPageSizes;
  currentPageSize = this.pageSizeOptions[0];
  getBadgeColor = TrackingGlobals.getBadgeColor;

  @ViewChild('paginator') paginator: MatPaginator;

  globalConstants = GlobalConstants;

  @Input() trackingsObservable: Observable<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new Observable();
  @Input() resetPaginatorObservable = new Observable()
  @Output() pageDataChangeEvent = new EventEmitter<PageEvent>();
  displayedColumns: string[] = ['trackingNumber', 'trackingStatus', 'financialStatus', 'recipient'];
  dataSource: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];

  constructor(){}

  ngOnInit() {
    this.trackingsObservable.subscribe((data: {trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}) => {
      this.trackings = data.trackings;
      this.totalTrackings = data.count;
      this.dataSource = data.trackings;
    });

    this.resetPaginatorObservable.subscribe(() =>{
      this.paginator?.firstPage();
    });
  }

  // Change # of trackings per page
  pageDataChange(pageData: PageEvent) {
    this.pageDataChangeEvent.emit(pageData);
  }
}
