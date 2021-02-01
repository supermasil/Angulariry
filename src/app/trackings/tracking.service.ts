import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { CommentService } from '../custom-components/comments/comment.service';
import { OnlineTrackingModel } from '../models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from '../models/tracking-models/serviced-tracking.model';
import { InPersonTrackingModel } from '../models/tracking-models/in-person-tracking.model';
import { ConsolidatedTrackingModel } from '../models/tracking-models/consolidated-tracking.model';
import { MasterTrackingModel } from '../models/tracking-models/master-tracking.model';
import { AlertService } from '../custom-components/alert-message';
import { GlobalConstants } from '../global-constants';
import { CommentModel } from '../models/comment.model';
import { query } from '@angular/animations';
import { TrackingGlobals } from './tracking-globals';

const BACKEND_URL = environment.apiURL + "/trackings/";


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

  fuzzySearch(searchTerm: string, orgId: string, type: string) {
    const queryParams = `search?searchTerm=${searchTerm}&orgId=${orgId}&type=${type}`;
    return this.httpClient
      .get<{trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((trackingData) => {
        console.log(trackingData.trackings)
        return {
          trackings: trackingData.trackings.map(tracking => {return tracking as OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel | ConsolidatedTrackingModel | MasterTrackingModel}),
          count: trackingData.count
        };
      })
    );
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

  getTracking(trackingNumber: string, orgId: string) {
    return this.httpClient.get<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel |ConsolidatedTrackingModel | MasterTrackingModel>(BACKEND_URL + orgId + "/" +trackingNumber ); // return an observable
  }

  getTrackings(trackingsPerPage: number, currentPage: number, type: string, orgId: string, origin: string, destination: string, sender: string) {
    let queryParams = `?pageSize=${trackingsPerPage}&currentPage=${currentPage}&orgId=${orgId}&type=${type}`;
    if (origin) {
      queryParams = queryParams.concat(`&origin=${origin}`);
    }
    if (destination) {
      queryParams = queryParams.concat(`&destination=${destination}`);
    }
    if(sender) {
      queryParams = queryParams.concat(`&sender=${sender}`);
    }

    return this.httpClient
      .get<{trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((response) => {
        return {
          trackings: response.trackings.map(tracking => {return this.setTrackingModel(tracking)}),
          count: response.count};
        })
      );
  }

  deleteTracking(trackingNumber: string) {
    return this.httpClient.delete(BACKEND_URL + trackingNumber);
  }

  setTrackingModel(tracking: any) {
    let prefix = tracking.trackingNumber.substring(0, 3);
    switch (prefix) {
      case TrackingGlobals.trackingTypes.ONLINE:
        return tracking as OnlineTrackingModel;
      case TrackingGlobals.trackingTypes.SERVICED:
        return tracking as ServicedTrackingModel;
      case TrackingGlobals.trackingTypes.INPERSON:
        return tracking as InPersonTrackingModel;
      case TrackingGlobals.trackingTypes.CONSOLIDATED:
        return tracking as ConsolidatedTrackingModel;
      case TrackingGlobals.trackingTypes.MASTER:
        return tracking as MasterTrackingModel;
      default:
        this.alertService.error("Couldn't find tracking type", GlobalConstants.flashMessageOptions);
        return tracking;
    }
  }

  setTransformedTrackings(trackings: any, comment: CommentModel, trackingNumber: string) {
    let prefix = trackings[0]?.trackingNumber.substring(0, 3);
    switch (prefix) {
      case TrackingGlobals.trackingTypes.ONLINE:
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
      case TrackingGlobals.trackingTypes.SERVICED:
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
      case TrackingGlobals.trackingTypes.INPERSON:
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
      case TrackingGlobals.trackingTypes.CONSOLIDATED:
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
      case TrackingGlobals.trackingTypes.MASTER:
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
}
