import { Component, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { TrackingGlobals } from '../tracking-globals';
import { Tracking } from '../tracking.model';
import { TrackingService } from '../tracking.service';
import * as moment from 'moment';
import { CodeScannerService } from 'src/app/code-scanner/code-scanner.service';

@Component({
  selector: 'app-tracking-list',
  templateUrl: './tracking-list.component.html',
  styleUrls: ['./tracking-list.component.css']
})
export class TrackingListComponent {
  trackings: Tracking[] = [];
  // subscribedTrackings: String[] = [];
  private trackingSub: Subscription;
  private codeScannerSub: Subscription;
  // private subscribedPostsSub: Subscription;
  private authListenerSub: Subscription;
  userIsAuthenticated = false;
  userId: string;
  totalTrackings = 0;
  trackingsPerPage = 10;
  currentPage = 1;
  pageSizeOptions = [10, 20, 50, 100];
  trackingForm: FormGroup;
  commentForm: FormGroup;
  @ViewChild('f') myCommentForm;

  preTransitCodes = TrackingGlobals.preTransitCodes;
  inTransitCodes = TrackingGlobals.inTransitCodes
  deliveryCodes = TrackingGlobals.deliveryCodes
  failureCodes = TrackingGlobals.failureCodes;

  constructor(
    public trackingService: TrackingService,
    private authService: AuthService,
    public dialog: MatDialog,
    private codeScannerService: CodeScannerService
  ) {} // Public simplifies code

  async ngOnInit() {
    this.trackingForm = new FormGroup({
      searchTerm: new FormControl(null)
    });


    this.commentForm = new FormGroup({
      commentContent: new FormControl(null, {validators: [Validators.required]})
    }, {updateOn: 'blur'});

    this.userIsAuthenticated = this.authService.getIsAuth(); // Get current login status
    this.userId = this.authService.getUserId();
    // Since the post list component is loaded after logging in
    // so this block won't be entered again (no new broadcast)
    this.authListenerSub = this.authService.getAuthStatusListener().subscribe(
      isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      }
    );

    this.trackingSub = this.trackingService.getTrackingUpdateListener()
      .subscribe((trackingData: {trackings: Tracking[], count: number}) => {
        this.trackings = trackingData.trackings;
        this.totalTrackings = trackingData.count;
      });
    await this.trackingService.getTrackings(this.trackingsPerPage, 1); // This will update the getTrackingUpdateListener() observable

    this.codeScannerSub = this.codeScannerService.getCodeScannerUpdateListener()
      .subscribe((code: {code: string}) => {
        this.trackingForm.controls['searchTerm'].setValue(code.code);
      });
  }

  onDelete(trackingId: string) {
    this.trackingService.deleteTracking(trackingId).subscribe(() => {
      this.trackingService.getTrackings(this.trackingsPerPage, this.currentPage); // refetch after deletion
    });
  }

  // Change # of trackings per page
  onChangedPage(pageData: PageEvent) {
    this.currentPage = pageData.pageIndex + 1;
    this.trackingsPerPage = pageData.pageSize;
    this.trackingService.getTrackings(this.trackingsPerPage, this.currentPage);
  }

  onFuzzySearch() {
    this.trackingService.fuzzySearch(this.trackingsPerPage, this.currentPage, this.trackingForm.value.searchTerm);
  }

  onCommentSubmit(trackingId: string) {
    if (this.commentForm.invalid) {
      return;
    }
    let imagePaths: string[] = [];
    let attachmentPaths: string[] = [];
    this.trackingService.createComment(trackingId, this.commentForm.value.commentContent, imagePaths, attachmentPaths);
    this.myCommentForm.resetForm();
  }

  // Always remember to unsub
  ngOnDestroy() {
    this.trackingSub.unsubscribe();
    this.authListenerSub.unsubscribe();
    this.codeScannerSub.unsubscribe();
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

  onReceivedToggled(checked: boolean, tracking: Tracking) {
    this.trackingService.updateTracking(
      tracking._id,
      tracking.trackingNumber,
      tracking.carrier,
      tracking.content,
      checked,
      [],
      [],
      []);

  }
}
