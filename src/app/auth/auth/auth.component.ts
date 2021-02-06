import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
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
    private zone: NgZone
  ) {}

  isLoading = true;
  mode = 'create'
  selectedTabIndex = 0;

  authGlobals = AuthGlobals;
  enabled = [true, true, true, true, true, true];

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has("orgId")) {
        this.disableTheRest(4);
      } else if (paramMap.has("userId")) {
        this.mode = 'edit'
        this.disableTheRest(2);
      }
    });
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
    return roles.includes(this.authService.getMongoDbUser().role);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
