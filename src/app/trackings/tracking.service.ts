import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { OnlineTrackingModel } from '../models/tracking-models/online-tracking.model';
import { ServicedTrackingModel } from '../models/tracking-models/serviced-tracking.model';
import { InPersonTrackingModel } from '../models/tracking-models/in-person-tracking.model';
import { ConsolidatedTrackingModel } from '../models/tracking-models/consolidated-tracking.model';
import { MasterTrackingModel } from '../models/tracking-models/master-tracking.model';
import { TrackingGlobals } from './tracking-globals';

const BACKEND_URL = environment.apiURL + "/trackings/";


@Injectable({ providedIn: "root"})
export class TrackingService{
  private onlineTrackingsUpdated = new Subject<{trackings: OnlineTrackingModel[], count: number}>();
  private servicedTrackingsUpdated = new Subject<{trackings: ServicedTrackingModel[], count: number}>();
  private inPersonTrackingsUpdated = new Subject<{trackings: InPersonTrackingModel[], count: number}>();
  private consolidatedTrackingsUpdated = new Subject<{trackings: ConsolidatedTrackingModel[], count: number}>();
  private masterTrackingsUpdated = new Subject<{trackings: MasterTrackingModel[], count: number}>();

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private zone: NgZone
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

  createUpdateTracking(formData: any) {
    this.httpClient
      .post<{message: string, tracking: any}>(BACKEND_URL, formData)
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate([`/trackings/${responseData.tracking.generalInfo.type}`]);
        });
      });
  }

  getTracking(trackingNumber: string, type: string) {
    return this.httpClient.get<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel |ConsolidatedTrackingModel | MasterTrackingModel>(BACKEND_URL + "/" + trackingNumber + `?type=${type}`); // return an observable
  }

  getTrackings(trackingsPerPage: number, currentPage: number, type: string, additionalParams?: any) {
    let queryParams = `?pageSize=${trackingsPerPage}&currentPage=${currentPage}&type=${type}`;

    if (additionalParams) {
      for (const [key, value] of Object.entries(additionalParams)) {
        if (value != null) {
          queryParams = queryParams.concat(`&${key}=${value}`);
        }
      }
    }

    return this.httpClient
      .get<{trackings: any[], count: number}>(BACKEND_URL + queryParams)
      .pipe(map((response) => {
        return {
          trackings: response.trackings,
          count: response.count};
        })
      );
  }

  deleteTracking(trackingNumber: string) {
    return this.httpClient.delete(BACKEND_URL + trackingNumber);
  }

  changeTrackingStatus(status: string, _id: string, type: string, parentId: string) {
    let formData = {
      status: status,
      _id: _id,
      parentId: parentId,
      type: type
    }
    return this.httpClient
      .post<{message: string, tracking: any}>(BACKEND_URL + "changeStatus", formData);
  }

  getTrackingTypeFromString(term: string) {
    if (!term) return null;
    
    if ((term.match(/-/g) || []).length == 2) {
      return TrackingGlobals.trackingTypes.INPERSONSUB;
    }

    switch (term.substring(0,3).toLowerCase()) {
      case 'onl':
        return TrackingGlobals.trackingTypes.ONLINE;
      case 'sev':
        return TrackingGlobals.trackingTypes.SERVICED;
      case 'inp':
        return TrackingGlobals.trackingTypes.INPERSON;
      case 'csl':
        return TrackingGlobals.trackingTypes.CONSOLIDATED;
      case 'mst':
        return TrackingGlobals.trackingTypes.MASTER;
      default:
        return null;
    }
  }
}
