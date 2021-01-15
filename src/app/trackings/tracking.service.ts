import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { CommentService } from '../comments/comment.service';
import { OnlineTrackingModel } from '../models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from '../models/tracking-models/serviced-tracking.model';
import { InPersonTrackingModel } from '../models/tracking-models/in-person-tracking.model';
import { ConsolidatedTrackingModel } from '../models/tracking-models/consolidated-tracking.model';
import { MasterTrackingModel } from '../models/tracking-models/master-tracking.model';
import { AlertService } from '../alert-message';
import { GlobalConstants } from '../global-constants';
import { CommentModel } from '../models/comment.model';
import { PricingModel } from '../models/pricing.model';

const BACKEND_URL = environment.apiURL + "/trackings/";
const PRICING_BACKEND_URL = environment.apiURL + "/pricings/";

const TrackingTypes = Object.freeze({
  ONLINE: "onl",
  SERVICED: "sev",
  INPERSON: "inp",
  CONSOLIDATED: "csl",
  MASTER: "mst"
});

@Injectable({ providedIn: "root"})
export class TrackingService{
  private onlineTrackings: OnlineTrackingModel[] = [];
  private onlineTrackingsUpdated = new Subject<{trackings: OnlineTrackingModel[], count: number}>();

  private servicedTrackings: ServicedTrackingModel[] = [];
  private servicedTrackingsUpdated = new Subject<{trackings: ServicedTrackingModel[], count: number}>();

  private inPersonTrackings: InPersonTrackingModel[] = [];
  private inPersonTrackingsUpdated = new Subject<{trackings: InPersonTrackingModel[], count: number}>();

  private consolidatedTrackings: ConsolidatedTrackingModel[] = [];
  private consolidatedTrackingsUpdated = new Subject<{trackings: ConsolidatedTrackingModel[], count: number}>();

  private masterTrackings: MasterTrackingModel[] = [];
  private masterTrackingsUpdated = new Subject<{trackings: MasterTrackingModel[], count: number}>();

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private commentService: CommentService,
    private zone: NgZone,
    private alertService: AlertService
    ) {}

  getOnlineTrackingUpdateListener() {
    return this.onlineTrackingsUpdated.asObservable();
  }

  getServicedTrackingUpdateListener() {
    return this.servicedTrackingsUpdated.asObservable();
  }

  getInPersonTrackingUpdateListener() {
    return this.inPersonTrackingsUpdated.asObservable();
  }

  getConsolidatedTrackingUpdateListener() {
    return this.consolidatedTrackingsUpdated.asObservable();
  }

  getMasterTrackingUpdateListener() {
    return this.masterTrackingsUpdated.asObservable();
  }

  getTrackingInfo(trackingNumber: String, carrier: String) {
    const queryParams = `tracking-tool/?trackingNumber=${trackingNumber}&carrier=${carrier}`;
    return this.httpClient.get<Object>(BACKEND_URL + queryParams);
  }

  fuzzySearch(trackingsPerPage: number, currentPage: number, searchTerm: string) {
    const queryParams = `search/?pageSize=${trackingsPerPage}&currentPage=${currentPage}&searchTerm=${searchTerm}`;
    this.httpClient
      .get<{message: string, trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((trackingData) => {
        return {
          trackings: trackingData.trackings.map(tracking => {return tracking as OnlineTrackingModel}),
          count: trackingData.count};
        })
      )
      .subscribe((transformedTrackings) => {
        this.setTransformedTrackings(transformedTrackings.trackings, null, null);
    });
  }

  createComment(trackingNumber: string, content: string, imagePaths: string[], attachmentPaths: string[]) {
    this.commentService.createComment(trackingNumber, content, imagePaths, attachmentPaths)
      .subscribe(response => {
        this.setTransformedTrackings(null, response.comment, trackingNumber)
      });
  }

  createUpdateTracking(formData: any) {
    this.httpClient
      .post<{message: string, tracking: any}>(BACKEND_URL, formData)
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate(["/trackings"]);
        });
      });
  }

  getTracking(trackingNumber: string) {
    return this.httpClient.get<OnlineTrackingModel>(BACKEND_URL + trackingNumber); // return an observable
  }

  getTrackings(trackingsPerPage: number, currentPage: number) {
    const queryParams = `?pageSize=${trackingsPerPage}&currentPage=${currentPage}`;
    this.httpClient
      .get<{trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((response) => {
        return {
          trackings: response.trackings.map(tracking => {return this.setTrackingModel(tracking)}),
          count: response.count};
        })
      )
      .subscribe((transformedTrackings) => {
        this.setTransformedTrackings(transformedTrackings.trackings, null, null);
    });
  }

  deleteTracking(trackingNumber: string) {
    return this.httpClient.delete(BACKEND_URL + trackingNumber);
  }

  setTrackingModel(tracking: any) {
    let prefix = tracking.trackingNumber.substring(0, 3);
    switch (prefix) {
      case TrackingTypes.ONLINE:
        return tracking as OnlineTrackingModel;
      case TrackingTypes.SERVICED:
        return tracking as ServicedTrackingModel;
      case TrackingTypes.INPERSON:
        return tracking as InPersonTrackingModel;
      case TrackingTypes.CONSOLIDATED:
        return tracking as ConsolidatedTrackingModel;
      case TrackingTypes.MASTER:
        return tracking as MasterTrackingModel;
      default:
        this.alertService.error("Couldn't find tracking type", GlobalConstants.flashMessageOptions);
        return tracking;
    }
  }

  setTransformedTrackings(trackings: any, comment: CommentModel, trackingNumber: string) {
    let prefix = trackings[0]?.trackingNumber.substring(0, 3);
    switch (prefix) {
      case TrackingTypes.ONLINE:
        if (trackingNumber) {
          this.onlineTrackings.find(item => item.trackingNumber == trackingNumber)?.generalInfo.comments.unshift(comment);}
        else {
          this.onlineTrackings = trackings;
        }
        this.onlineTrackingsUpdated.next({
          trackings: [...this.onlineTrackings],
          count: this.onlineTrackings.length
        });
        break;
      case TrackingTypes.SERVICED:
        if (trackingNumber) {
          this.servicedTrackings.find(item => item.trackingNumber == trackingNumber)?.generalInfo.comments.unshift(comment);}
        else {
          this.servicedTrackings = trackings;
        }
        this.servicedTrackingsUpdated.next({
          trackings: [...this.servicedTrackings],
          count: this.servicedTrackings.length
        });
        break;
      case TrackingTypes.INPERSON:
        if (trackingNumber) {
          this.inPersonTrackings.find(item => item.trackingNumber == trackingNumber)?.generalInfo.comments.unshift(comment);}
        else {
          this.inPersonTrackings = trackings;
        }
        this.inPersonTrackingsUpdated.next({
          trackings: [...this.inPersonTrackings],
          count: this.inPersonTrackings.length
        });
        break;
      case TrackingTypes.CONSOLIDATED:
        if (trackingNumber) {
          this.consolidatedTrackings.find(item => item.trackingNumber == trackingNumber)?.generalInfo.comments.unshift(comment);}
        else {
          this.consolidatedTrackings = trackings;
        }
        this.consolidatedTrackingsUpdated.next({
          trackings: [...this.consolidatedTrackings],
          count: this.consolidatedTrackings.length
        });
        break;
      case TrackingTypes.MASTER:
        if (trackingNumber) {
          this.masterTrackings.find(item => item.trackingNumber == trackingNumber)?.generalInfo.comments.unshift(comment);}
        else {
          this.masterTrackings = trackings;
        }
        this.masterTrackingsUpdated.next({
          trackings: [...this.masterTrackings],
          count: this.masterTrackings.length
        });
        break;
      default:
        this.alertService.error("Couldn't find transformed trackings type", GlobalConstants.flashMessageOptions);
        return;
    }
  }

  addUpdatePricing(formData: any) {
    this.httpClient
      .post<{message: string, tracking: any}>(PRICING_BACKEND_URL, formData)
      .subscribe((responseData) => {
        console.log(responseData);
        this.zone.run(() => {
          this.router.navigate(["/"]);
        });
      });
  }

  getPricing(pricingId: string) {
    return this.httpClient.get<PricingModel>(PRICING_BACKEND_URL + pricingId); // return an observable
  }
}
