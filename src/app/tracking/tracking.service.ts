import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { AlertService } from '../alert-message';

const BACKEND_URL = environment.apiURL + "/trackings/"

@Injectable({ providedIn: "root"})
export class TrackingService {

  constructor(private httpClient: HttpClient, private alertService: AlertService) {}

  getTrackingInfo(trackingNumber: String, carrier: String) {
    const queryParams = `?trackingNumber=${trackingNumber}&carrier=${carrier}`;
    return this.httpClient.get<Object>(BACKEND_URL + queryParams);
  }
}
