import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { TranslateService } from '@ngx-translate/core';
import { AuthGlobals } from './auth/auth-globals';
import { AuthService } from './auth/auth.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  @ViewChild(MatAccordion) accordion: MatAccordion;
  authGlobals = AuthGlobals;

  constructor(private translate: TranslateService, private authService: AuthService) {
    translate.setDefaultLang('en');
  }
  ngOnInit() {}

  canView(roles: string[]) {
    return this.authService.canView(roles);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
