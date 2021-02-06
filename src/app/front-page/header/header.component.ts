import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core/';
import { Router } from '@angular/router';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { UserModel } from 'src/app/models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent implements OnInit, OnDestroy{
  constructor(private authService: AuthService, private changeDetector: ChangeDetectorRef, private zone: NgZone, private router: Router) {}
  private authListenerSub: Subscription;
  authGlobals = AuthGlobals;
  user: UserModel;

  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe(user => {
      this.user = user;
    });
  }

  onLogOut() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListenerSub.unsubscribe();
  }

  // Always route in a zone to prevent 'https://stackoverflow.com/questions/53645534/navigation-triggered-outside-angular-zone-did-you-forget-to-call-ngzone-run'
  redirect(route: string) {
    this.zone.run(() => {
      this.router.navigate([route]);
    });
  }

  canView(roles: string[]) {
    return roles.includes(this.authService.getMongoDbUser().role);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }

};
