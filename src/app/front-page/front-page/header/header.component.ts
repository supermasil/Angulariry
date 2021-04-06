import { Component, OnInit, OnDestroy, NgZone, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core/';
import { Router } from '@angular/router';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { UserModel } from 'src/app/models/user.model';
import { OrganizationModel } from 'src/app/models/organization.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy{

  private authListenerSub: Subscription;
  authGlobals = AuthGlobals;
  user: UserModel;
  organization: OrganizationModel;
  @Output() sideMenuClicked = new EventEmitter();

  canView = this.authService.canView;
  isAuth = this.authService.isAuth;

  constructor(
    private authService: AuthService,
    private zone: NgZone,
    private router: Router,
    private translateService: TranslateService) {}


  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe(user => {
      this.user = this.authService.getMongoDbUser();
    });

    this.authService.getUserOrgListener().subscribe(organization => {
      this.organization = this.authService.getUserOrg();
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

  sideMenuPressed() {
    this.sideMenuClicked.emit();
  }

  languageChange(language: string) {
    this.translateService.setDefaultLang(language);
    this.translateService.use(language);
    localStorage.setItem("language", language);
  }
};
