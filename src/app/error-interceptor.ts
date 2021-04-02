import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

// Any outgoing requests that return an error will be caught in this class
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private toastr: ToastrService,
    private translateService: TranslateService
    ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          if (event.body.message) {
            this.translateService.get(`success-messages.${event.body.message}`).subscribe(translatedMessage => {
              this.toastr.success(translatedMessage);
            });
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = "something-went-wrong";
        if (error.error.message) {
          errorMessage = error.error.message;
        }
        this.translateService.get(`error-messages.${errorMessage}`).subscribe(translatedMessage => {
          if (error.status == 400) {
            this.toastr.warning(error.error.requestId, translatedMessage);
          } else if (error.status == 500) {
            this.toastr.error(error.error.requestId, translatedMessage);
          }
        });

        return throwError(error);
      })
    );
  }
}
