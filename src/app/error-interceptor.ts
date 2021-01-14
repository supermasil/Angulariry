import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from './alert-message/alert.service';
import { GlobalConstants } from './global-constants';
import { Router } from '@angular/router';

// Any outgoing requests that return an error will be caught in this class
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private alertService: AlertService
    ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe (
      tap(event => {
        if (event instanceof HttpResponse) {
          if (event.body.message) {
            this.alertService.success(event.body.message, GlobalConstants.flashMessageOptions);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = "Unknown Error Occurred!";
        if (error.error.message) {
          errorMessage = error.error.message;
        }
        this.alertService.error(errorMessage, GlobalConstants.flashMessageOptions);
        return throwError(error);
      })
    );
  }
}
