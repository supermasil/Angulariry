import { HttpInterceptor, HttpRequest, HttpHandler, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

// Intercepting out going request
@Injectable() // To inject services to this service
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService){}
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const authToken = this.authService.getToken();
    const headers = new HttpHeaders({
      "Authorization": "Bearer " + authToken
    });
    const authRequest = req.clone({headers});

    return next.handle(authRequest);
  }
}
