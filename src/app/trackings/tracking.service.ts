import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Tracking } from './models/tracking.model';
import { map } from 'rxjs/operators';
import { CommentService } from '../comments/comment.service';

const BACKEND_URL = environment.apiURL + "/trackings/"

@Injectable({ providedIn: "root"})
export class TrackingService {
  private trackings: Tracking[] = [];
  private trackingsUpdated = new Subject<{trackings: Tracking[], count: number}>();

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    public commentService: CommentService,
    private zone: NgZone
    ) {}

  getTrackingUpdateListener() {
    return this.trackingsUpdated.asObservable();
  }

  getTrackingInfo(trackingNumber: String, carrier: String) {
    const queryParams = `trackings/tracking-tool/?trackingNumber=${trackingNumber}&carrier=${carrier}`;
    return this.httpClient.get<Object>(BACKEND_URL + queryParams);
  }

  fuzzySearch(trackingsPerPage: number, currentPage: number, searchTerm: string) {
    const queryParams = `trackings/search/?pageSize=${trackingsPerPage}&currentPage=${currentPage}&searchTerm=${searchTerm}`;
    this.httpClient
      .get<{message: string, trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((trackingData) => {
        return {trackings: trackingData.trackings.map(tracking => {
            return tracking as Tracking;
            }),
          count: trackingData.count};
        })
      )
      .subscribe((transformedTrackings) => {
        this.trackings = transformedTrackings.trackings;
        this.trackingsUpdated.next({
          trackings: [...this.trackings],
          count: transformedTrackings.count
        });
    });
  }

  getTrackings(trackingsPerPage: number, currentPage: number) {
    const queryParams = `trackings/?pageSize=${trackingsPerPage}&currentPage=${currentPage}`;
    this.httpClient
      .get<{message: string, trackings: any, count: number}>(BACKEND_URL + queryParams)
      .pipe(map((trackingData) => {
        return {trackings: trackingData.trackings.map(tracking => {
            return tracking as Tracking;
            }),
          count: trackingData.count};
        })
      )
      .subscribe((transformedTrackings) => {
        this.trackings = transformedTrackings.trackings;
        this.trackingsUpdated.next({
          trackings: [...this.trackings],
          count: transformedTrackings.count
        });
    });
  }

  getTracking(id: String) {
    return this.httpClient.get<Tracking>(BACKEND_URL + id); // return an observable
  }

  createTracking(trackingNumber: string, carrier: string, content: string, received: boolean, files: string[], fileNames: string[]) {
    const trackingData = new FormData();
    trackingData.append("files", JSON.stringify(files)); // Only works with array
    trackingData.append("fileNames", JSON.stringify(fileNames)); // Only works with array
    trackingData.append('trackingNumber', trackingNumber);
    trackingData.append('content', content);
    trackingData.append('carrier', carrier);
    trackingData.append('received', JSON.stringify(received));

    // files.forEach(file => {
      // trackingData.append("files[]", file, files['name']); // For any file types
    // });

    this.httpClient
      .post<{message: string, tracking: Tracking}>(BACKEND_URL, trackingData)
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate(["/trackings"]);
        });
    });
  }

  deleteTracking(id: string) {
    return this.httpClient.delete(BACKEND_URL + id);
  }

  updateTracking(id: string, trackingNumber: string, carrier: string, content: string, received: boolean, files: string[], fileNames: string[], filesToDelete: string[]) {
    let trackingData = new FormData();
    trackingData.append('_id', id);
    trackingData.append('trackingNumber', trackingNumber);
    trackingData.append('content', content);
    trackingData.append('carrier', carrier);
    trackingData.append("files", JSON.stringify(files)); // Only works with array
    trackingData.append("fileNames", JSON.stringify(fileNames)); // Only works with array
    trackingData.append("filesToDelete", JSON.stringify(filesToDelete)); // Only works with array
    trackingData.append('received', JSON.stringify(received));

    // files.forEach(file => {
    //   trackingData.append("files[]", file, files['name']);
    // });

    this.httpClient.put<{message: string, tracking: Tracking}>(BACKEND_URL + id, trackingData)
    .subscribe(response => {
      const oldTrackingIndex = [...this.trackings].findIndex(p => p._id === response.tracking._id);
      this.trackings[oldTrackingIndex] = response.tracking as Tracking;
      this.trackingsUpdated.next({
        trackings: [...this.trackings],
        count: this.trackings.length
      });
      this.zone.run(() => {
        this.router.navigate(["/trackings"]);
      });
    });
  }

  createComment(trackingId: string, content: string, imagePaths: string[], attachmentPaths: string[]) {
    this.commentService.createComment(trackingId, content, imagePaths, attachmentPaths)
      .subscribe(responseData => {
        this.trackings.find(item => item._id == trackingId)?.comments.unshift(responseData.comment);
        // console.log(this.trackings.find(item => item._id == trackingId).comments[0]);
        this.trackingsUpdated.next({
          trackings: [...this.trackings],
          count: this.trackings.length
        });
      });
  }

}
