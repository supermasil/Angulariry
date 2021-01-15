import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core/';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent implements OnInit, OnDestroy{
  constructor(private authService: AuthService, private changeDetector: ChangeDetectorRef, private zone: NgZone, private router: Router) {}
  userIsAuthenticated = false;
  private authListenerSub: Subscription;
  ngOnInit() {
    this.authListenerSub = this.authService.getAuthStatusListener().subscribe(
      isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        // this.changeDetector.detectChanges();
      }
    );
    this.userIsAuthenticated = this.authService.getIsAuth();
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

};
