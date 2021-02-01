import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from '@angular/router';
import { stringify } from 'querystring';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CommentModel } from '../../models/comment.model';

const BACKEND_URL = environment.apiURL + "/comments/"

@Injectable({ providedIn: "root"})
export class CommentService {
  constructor(private httpClient: HttpClient, private router: Router) {}

  createComment(trackingId: string, trackingNumber, content: string, filePaths: string[]) {
    const commentData = {
      "trackingId": trackingId,
      "trackingNumber": trackingNumber,
      "content": content,
      "filePaths": filePaths
    }
    return this.httpClient.post<CommentModel>(BACKEND_URL, commentData);
  }

  // Comments are populated with tracking
  // getComments(trackingId: string) {
  //   const queryParams = `?trackingId=${trackingId}`;
  //   return this.httpClient.get<{message: string, comments: [CommentModel]}>(BACKEND_URL + queryParams)
  //     .subscribe(responseData => {
  //       return responseData.comments
  //     });
  // }
}
