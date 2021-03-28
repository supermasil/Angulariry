import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { AlertService } from '../custom-components/alert-message';
import { GlobalConstants } from '../global-constants';
import { AuthGlobals } from './auth-globals';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private alertService: AlertService, private zone: NgZone) {}
  route = null;
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | import("@angular/router").UrlTree | Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
    this.route = route;
    let splitUrl = state.url.split(';');
    let url = splitUrl[0];
    let data = {};
    if (splitUrl.length > 1) {
      splitUrl.splice(1).forEach(element => {
        let split = element.split('=');
        data[split[0]] = split[1];
      });
    }
    if (route.url.length === 0) { // path /
      return this.checkAuthentication(url, data);
    } else {
      return this.checkAuthentication(url, data) &&  this.checkAuthorization(route.data.roles);
    }

  }

  checkAuthentication(url: string, data: {}) {
    const isAuth = this.authService.getIsAuth();
    this.authService.redirectUrl = url;
    this.authService.redirectData = data;

    if(!isAuth) {
      this.zone.run(() => {
        this.router.navigate(["/auth"]);
        // this.alertService.warn("Please log in to proceed", GlobalConstants.flashMessageOptions);
      });
      return false;
    } else if (isAuth && !this.authService.getUserOrg() && this.authService.getMongoDbUser()?.role != AuthGlobals.roles.SuperAdmin && this.route.url.length > 0) {
      this.zone.run(() => {
        this.router.navigate(["/"]);
        this.alertService.warn("You have not logged into any organization", GlobalConstants.flashMessageOptions);
      });
      return false;
    } else if (!this.authService.getMongoDbUser().active && this.route.url.length > 0) {
      this.zone.run(() => {
        this.router.navigate(["/"]);
        this.alertService.error("Your account is inactive with this organization", GlobalConstants.flashMessageOptions);
      });
    }

    return true;
  }

  checkAuthorization(roles: string[]) {
    let result = roles.includes(this.authService.getMongoDbUser()?.role);
    if (!result) {
      this.authService.redirectToMainPageWithMessage("You're not authorized");
      return false;
    }
    return true
  }
}
