import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ThemePalette } from "@angular/material/core";
import { PageEvent } from "@angular/material/paginator";
import * as moment from "moment";
import { BehaviorSubject, ReplaySubject, Subject } from "rxjs";
import { AuthService } from "src/app/auth/auth.service";
import { GlobalConstants } from "src/app/global-constants";
import { ConsolidatedTrackingModel } from "src/app/models/tracking-models/consolidated-tracking.model";
import { InPersonTrackingModel } from "src/app/models/tracking-models/in-person-tracking.model";
import { MasterTrackingModel } from "src/app/models/tracking-models/master-tracking.model";
import { OnlineTrackingModel } from "src/app/models/tracking-models/online-tracking.model";
import { ServicedTrackingModel } from "src/app/models/tracking-models/serviced-tracking.model";
import { UserModel } from "src/app/models/user.model";
import { TrackingGlobals } from "src/app/trackings/tracking-globals";
import { TrackingService } from "src/app/trackings/tracking.service";


@Component({
  selector: 'trackings-report-component',
  templateUrl: 'trackings-report.component.html',
  styleUrls: []
})
export class TrackingsReportComponent implements OnInit {

  searchForm: FormGroup;
  sendersSubject = new BehaviorSubject<any[]>([]);
  selectSenderSubject = new ReplaySubject<any>();
  pageData: PageEvent;
  trackingsSubject: ReplaySubject<{trackings: (OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel)[], count: number}> = new ReplaySubject();
  currentUser: UserModel;
  resetPaginatorSubject = new Subject();
  currentTrackingType = null;

  trackingGlobals = TrackingGlobals;

  public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  public minDate: moment.Moment;
  public maxDate: moment.Moment;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = 'primary';

  trackingsReportForm: FormGroup;

  senderFields = ['userCode', 'name', 'email', 'role'];
  creatorFields = ['userCode', 'name', 'email', 'role'];

  constructor(
    private authService: AuthService,
    private trackingService: TrackingService) {}


  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
    this.trackingsReportForm = new FormGroup({
      type: new FormControl(null, {validators: [Validators.required]}),
      trackingStatus: new FormControl(null),
      financialStatus: new FormControl(null),
      sender: new FormControl(null),
      creator: new FormControl(null),
      startTime: new FormControl(null, {validators: [Validators.required]}),
      endTime: new FormControl(null, {validators: [Validators.required]}),
      active: new FormControl(true)
      // consolidated: new FormControl(null),
      // mastered: new FormControl(null),
    });

    this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
      this.sendersSubject.next(response.users);
    });
  }

  senderSelected(user: UserModel) {
    this.trackingsReportForm.get('sender').setValue(user._id);
  }

  creatorSelected(user: UserModel) {
    this.trackingsReportForm.get('creator').setValue(user._id);
  }

  senderCancelled() {
    this.trackingsReportForm.get('sender').setValue(null);
  }

  creatorCancelled() {
    this.trackingsReportForm.get('creator').setValue(null);
  }

  pageDataChanged (pageData: PageEvent) {
    this.pageData = pageData;
    this.fetchTrackings(pageData.pageSize, pageData.pageIndex + 1);
  }

  fetchTrackings(trackingsPerPage: number, currentPage: number) {
    let additionalParams = this.trackingsReportForm.getRawValue();
    delete additionalParams['type'];

    console.log(additionalParams)

    this.trackingService.getTrackings(trackingsPerPage, currentPage, this.currentTrackingType, additionalParams).subscribe((transformedTrackings) => {
      this.trackingsSubject.next(transformedTrackings);
    });
  }

  submit() {
    if (!this.trackingsReportForm.valid) {
      return;
    }

    this.resetPaginatorSubject.next();

    if (this.trackingsReportForm.get('startTime').value?.isValid) {
      this.trackingsReportForm.get('startTime').setValue(moment.utc(this.trackingsReportForm.get('startTime').value).format());
    }

    if (this.trackingsReportForm.get('endTime').value?.isValid) {
      this.trackingsReportForm.get('endTime').setValue(moment.utc(this.trackingsReportForm.get('endTime').value).format())
    }

    this.currentTrackingType = this.trackingsReportForm.get('type').value;
    this.fetchTrackings(this.pageData? this.pageData?.pageSize : GlobalConstants.defaultPageSizes[0], this.pageData? this.pageData.pageIndex + 1: 1);
  }
}
