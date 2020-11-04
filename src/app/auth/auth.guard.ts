import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AlertService } from '../alert-message';
import { GlobalConstants } from '../global-constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private alertService: AlertService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | import("@angular/router").UrlTree | Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
    let url = state.url;
    return this.checkLogin(url);
  }

  checkLogin(url: string) {
    const isAuth = this.authService.getIsAuth();
    if(!isAuth) {
      this.authService.redirectUrl = url;
      this.alertService.warn("Please log in to proceed", GlobalConstants.flashMessageOptions);
      this.router.navigate(["/auth"]);
      return false;
    } else {
      return true;
    }
  }
}
