import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { PageEvent } from "@angular/material/paginator";
import * as moment from "moment";
import { Observable } from "rxjs";
import { CommentService } from "src/app/comments/comment.service";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { TrackingGlobals } from "../../tracking-globals";
import { TrackingService } from "../../tracking.service";


@Component({
  selector: 'tracking-list-common-template',
  templateUrl: './tracking-list-common-template.component.html',
  styleUrls: ['./tracking-list-common-template.component.css', "../tracking-list.component.css"]
})
export class TrackingListCommonTemplateComponent implements OnInit {
  trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[] = [];

  totalTrackings = 0;
  pageSizeOptions = [10, 20, 50, 100];
  trackingsPerPage = this.pageSizeOptions[0];
  currentPage = 1;

  getBadgeColor = TrackingGlobals.getBadgeColor;

  commentForm: FormGroup;

  @ViewChild('f') myCommentForm; // To be able to reset form without triggering validators

  preTransitCodes = TrackingGlobals.preTransitCodes;
  inTransitCodes = TrackingGlobals.inTransitCodes
  deliveryCodes = TrackingGlobals.deliveryCodes
  failureCodes = TrackingGlobals.failureCodes;

  @Input() trackingsObservable: Observable<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new Observable();
  @Output() pageDataChangeEvent = new EventEmitter<PageEvent>();

  constructor(
    private trackingService: TrackingService,
    private commentService: CommentService
  ){}

  ngOnInit() {
    this.commentForm = new FormGroup({
      commentContent: new FormControl(null, {validators: [Validators.required]})
    }, {updateOn: 'blur'});

    this.trackingsObservable.subscribe((data: {trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}) => {
      this.trackings = data.trackings;
      this.totalTrackings = data.count;
    })
  }

  onDelete(trackingId: string) {
    this.trackingService.deleteTracking(trackingId).subscribe(() => {
      // this.trackingService.getTrackings(this.trackingsPerPage, this.currentPage); // refetch after deletion
    });
  }

  // Change # of trackings per page
  pageDataChange(pageData: PageEvent) {
    this.pageDataChangeEvent.emit(pageData);
  }

  onCommentSubmit(trackingId: string, trackingNumber: string, content: string) {
    if (this.commentForm.invalid) {
      return;
    }
    let filePaths: string[] = [];
    this.commentService.createComment(trackingId, trackingNumber, content, filePaths)
      .subscribe(response => {
        this.trackings.filter(t => t._id === trackingId)[0].generalInfo.comments.unshift(response)
      });
    this.myCommentForm.resetForm();
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

  formatDateTime(date: Date) {
    return moment(moment.utc(date).toDate()).fromNow(); //.local().format("MM-DD-YY hh:mm:ss")
  }
}
