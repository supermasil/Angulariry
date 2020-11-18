import { HttpClient } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router } from '@angular/router';
import { stringify } from 'querystring';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Comment } from './comment.model';

const BACKEND_URL = environment.apiURL + "/comments/"

@Injectable({ providedIn: "root"})
export class CommentService {
  constructor(private httpClient: HttpClient, private router: Router) {}

  createComment(trackingId: string, content: string, imagePaths: string[], attachmentPaths: string[]) {
    const commentData = {
      "trackingId": trackingId,
      "content": content,
      "imagePaths": imagePaths,
      "attachementPaths": attachmentPaths
    }
    return this.httpClient.post<{message: string, comment: Comment}>(BACKEND_URL, commentData);
  }

  getComments(trackingId: string) {
    const queryParams = `?trackingId=${trackingId}`;
    return this.httpClient.get<{message: string, comments: [Comment]}>(BACKEND_URL + queryParams)
      .subscribe(responseData => {
        return responseData.comments
      });
  }
}
