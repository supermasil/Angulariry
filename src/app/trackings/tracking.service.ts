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

  fuzzySearch(searchTerm: string, type: string) {
    const queryParams = `search?searchTerm=${searchTerm}&type=${type}`;
    return this.httpClient
      .get<{trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((trackingData) => {
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
          this.router.navigate([`/trackings/${responseData.tracking.generalInfo.type}`]);
        });
      });
  }

  getTracking(trackingNumber: string, type: string) {
    return this.httpClient.get<OnlineTrackingModel | ServicedTrackingModel | InPersonTrackingModel |ConsolidatedTrackingModel | MasterTrackingModel>(BACKEND_URL + "/" + trackingNumber + `?type=${type}`); // return an observable
  }

  getTrackings(trackingsPerPage: number, currentPage: number, type: string, origin: string, destination: string, sender: string) {
    let queryParams = `?pageSize=${trackingsPerPage}&currentPage=${currentPage}&type=${type}`;
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

  changeTrackingStatus(status: string, _id: string, type: string) {
    let formData = {
      status: status,
      _id: _id,
      type: type
    }
    return this.httpClient
      .post<{message: string, tracking: any}>(BACKEND_URL + "changeStatus", formData);
  }
}
