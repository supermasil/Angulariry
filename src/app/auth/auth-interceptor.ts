import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

// Intercepting out going request
@Injectable() // To inject services to this service
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService){}
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const authToken = this.authService.getToken();
    const authRequest = req.clone({ // Don't modify the original one
      headers: req.headers.set('Authorization', "Bearer " + authToken) // Will add or override, not overwrite
    });

    return next.handle(authRequest);
  }
}
