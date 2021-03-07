import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthGlobals } from '../auth-globals';
import { AuthService } from '../auth.service';

@Component({
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private zone: NgZone,
    private router: Router
  ) {}

  isLoading = true;
  selectedTabIndex = 0;

  authGlobals = AuthGlobals;
  enabled = [true, true, true, true, true, true];

  ngOnInit() {
    if (this.router.url != "/auth") {
      this.route.paramMap.subscribe((paramMap) => {
        if (this.router.url === "/auth/orgs/new") {
          this.selectedTabIndex = 2;
        } else if (paramMap.has("orgId")) {
          this.selectedTabIndex = 3;
        } else if (this.router.url === "/auth/users/new") {
          this.selectedTabIndex = 0;
        } else if (paramMap.has("userId")) {
          this.selectedTabIndex = 1;
        } else if (this.router.url === ("/auth/users/edit")) {
          this.selectedTabIndex = 4;
        } else if (this.router.url === ("/auth/users/adjustCredit")) {
          this.selectedTabIndex = 5;
        } else {
          return this.authService.redirect404();
        }
      });
      this.disableTheRest(this.selectedTabIndex);
    } else {
      if (this.isAuth()) {
        return this.authService.redirectToMainPageWithoutMessage();
      }
    }

    this.authService.getAuthStatusListener().subscribe(authenticated => {
      this.zone.run(() => {
        this.isLoading = false;
      })
    });
  }

  disableTheRest(index: number) {
    let temp = [...this.enabled];
    this.enabled.forEach((tab, i) => {
      if (i != index) {
        temp[i] = false;
      } else {
        temp[i] = true;
      }
    });
    this.enabled = [...temp];
  }

  canView(roles: string[]) {
    return this.authService.canView(roles);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
