import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlertService } from '../alert-message';
import { Tracking } from './tracking.model';
import { map } from 'rxjs/operators';
import { kMaxLength } from 'buffer';

const BACKEND_URL = environment.apiURL + "/trackings/"

@Injectable({ providedIn: "root"})
export class TrackingService {
  private trackings: Tracking[] = [];
  private trackingsUpdated = new Subject<{trackings: Tracking[], maxTracking: number}>();

  constructor(private httpClient: HttpClient, private alertService: AlertService, private router: Router) {}

  getTrackingInfo(trackingNumber: String, carrier: String) {
    const queryParams = `tracking-tool/?trackingNumber=${trackingNumber}&carrier=${carrier}`;
    return this.httpClient.get<Object>(BACKEND_URL + queryParams);
  }

  getTrackings(trackingsPerPage: number, currentPage: number) {
    const queryParams = `?pageSize=${trackingsPerPage}&currentPage=${currentPage}`;
    this.httpClient
      .get<{message: string, trackings: any, maxTracking: number}>(BACKEND_URL + queryParams)
      .pipe(map((trackingData) => {
        return {trackings: trackingData.trackings.map(tracking => {
            return tracking as Tracking;
            }),
          maxTracking: trackingData.maxTracking};
        })
      )
      .subscribe((transformedTrackings) => {
        this.trackings = transformedTrackings.trackings;
        this.trackingsUpdated.next({
          trackings: [...this.trackings],
          maxTracking: transformedTrackings.maxTracking
        });
    });
  }

  getTracking(id: String) {
    return this.httpClient.get<Tracking>(BACKEND_URL + id); // return an observable
  }

  getTrackingUpdateListener() {
    return this.trackingsUpdated.asObservable();
  }

  addTracking(trackingNumber: string, carrier: string, content: string, image: File) {
    const trackingData = new FormData();
    trackingData.append('trackingNumber', trackingNumber);
    trackingData.append('content', content);
    if (image) {
      trackingData.append('image', image, trackingNumber);
    }
    trackingData.append('carrier', carrier);
    this.httpClient
      .post<{message: string, tracking: Tracking}>(BACKEND_URL, trackingData)
      .subscribe((responseData) => {
        this.router.navigate(['/trackings']); // Will reload, no need to emit
    });
  }

  deleteTracking(id: string) {
    return this.httpClient.delete(BACKEND_URL + id);
  }

  updateTracking(id: string, trackingNumber: string, carrier: string, content: string, image: File | string) {
    let trackingData = new FormData();
    trackingData.append('_id', id);
    trackingData.append('trackingNumber', trackingNumber);
    trackingData.append('content', content);
    trackingData.append('carrier', carrier);
    if (image && typeof(image) === 'object') {
      console.log(image);
      trackingData.append('image', image, trackingNumber);
    } else if (image && typeof(image) === 'string') { // no change in edit
      console.log(image);
      trackingData.append('image', image);
    }

      this.httpClient.put<{message: string, updatedTracking: Tracking}>(BACKEND_URL + id, trackingData)
      .subscribe(response => {
        const updatedTrackings = [...this.trackings]; // create a copy
        const oldTrackingIndex = updatedTrackings.findIndex(p => p._id === id);
        const tracking: Tracking = response.updatedTracking as Tracking;
        updatedTrackings[oldTrackingIndex] = tracking;
        this.trackings = updatedTrackings;
        this.router.navigate(['/trackings']); // Will reload, no need to emit
      });
  }

}
