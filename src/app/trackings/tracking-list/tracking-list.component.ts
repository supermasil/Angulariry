import { Component, Inject } from "@angular/core";
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { TrackingGlobals } from '../tracking-globals';
import { Tracking } from '../tracking.model';
import { TrackingService } from '../tracking.service';

@Component({
  selector: 'app-tracking-list',
  templateUrl: './tracking-list.component.html',
  styleUrls: ['./tracking-list.component.css']
})
export class TrackingListComponent {
  trackings: Tracking[] = [];
  // subscribedTrackings: String[] = [];
  private trackingSub: Subscription;
  // private subscribedPostsSub: Subscription;
  private authListenerSub: Subscription;
  userIsAuthenticated = false;
  isLoading = false;
  userId: string;
  totalTrackings = 0;
  trackingsPerPage = 5;
  currentPage = 1;
  pageSizeOptions = [1, 2, 5, 10];
  form: FormGroup;

  preTransitCodes = TrackingGlobals.preTransitCodes;
  inTransitCodes = TrackingGlobals.inTransitCodes
  deliveryCodes = TrackingGlobals.deliveryCodes
  failureCodes = TrackingGlobals.failureCodes;

  constructor(
    public trackingService: TrackingService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {} // Public simplifies code

  ngOnInit() {

    this.isLoading = true;

    this.form = new FormGroup({
      searchTerm: new FormControl(null)
    });

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

    this.trackingService.getTrackings(this.trackingsPerPage, 1); // This will update the getTrackingUpdateListener() observable
    this.trackingSub = this.trackingService.getTrackingUpdateListener()
      .subscribe((trackingData: {trackings: Tracking[], count: number}) => {
        this.trackings = trackingData.trackings;
        this.totalTrackings = trackingData.count;
      });

    this.isLoading = false;
  }

  onDelete(trackingId: string) {
    this.isLoading = true;
    this.trackingService.deleteTracking(trackingId).subscribe(() => {
      this.trackingService.getTrackings(this.trackingsPerPage, this.currentPage); // refetch after deletion
    });
    this.isLoading = false;
  }

  // Change # of trackings per page
  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.trackingsPerPage = pageData.pageSize;
    this.trackingService.getTrackings(this.trackingsPerPage, this.currentPage);
    this.isLoading = false;
  }

  onFuzzySearch() {
    this.isLoading = true;
    this.trackingService.fuzzySearch(this.trackingsPerPage, this.currentPage, this.form.value.searchTerm);
    this.isLoading = false;
  }

  // Always remember to unsub
  ngOnDestroy() {
    this.trackingSub.unsubscribe();
    this.authListenerSub.unsubscribe();
  }

  openDialog(imagePath: string) {
    console.log(imagePath);
    this.dialog.open(ImageDialogComponent, {
      data: {
        imagePath: imagePath
      }
    });
  }

  getHeaderColor(status: string) {
    if (this.preTransitCodes.includes(status)) {
      return "bg-dark"
    } else if (this.inTransitCodes.includes(status)) {
      return "bg-warning"
    } else if (this.deliveryCodes.includes(status)) {
      return "bg-success"
    } else if (this.failureCodes.includes(status)) {
      return "bg-danger"
    }
  }
}

export interface DialogData {
  imagePath: string
}

@Component({
  selector: 'mat-dialog',
  template: "<div mat-dialog-content><div><img src='{{data.imagePath}}' style='width: 100%;'></div></div>"
})
export class ImageDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}
