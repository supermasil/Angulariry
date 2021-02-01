import { Component, OnInit } from '@angular/core';
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
    private authService: AuthService
  ) {}

  selectedTabIndex = 0;
  mode = 'create'
  authGlobals = AuthGlobals;

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.has("orgId")) {
        this.selectedTabIndex = 2;
      } else if (paramMap.has("userId")) {
        this.selectedTabIndex = 0;
        this.mode = 'edit'
      }
    });
  }

  setTabIndex(index: number) {
    this.selectedTabIndex = index;
  }

  canView(roles: string[]) {
    return roles.includes(this.authService.getMongoDbUser().role);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
