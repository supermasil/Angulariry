import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthGlobals } from 'src/app/auth/auth-globals';
import { UserModel } from 'src/app/models/user.model';
import { AuthService } from '../../../auth/auth.service';
import { OrganizationModel } from '../../../models/organization.model';
// import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-onboarding',
  templateUrl: 'onboarding.component.html',
  styleUrls: ['onboarding.component.css']
})
export class OnboardingComponent implements OnInit{
  organizations : OrganizationModel[] = [];
  // companiesSubject = new ReplaySubject<string[]>();
  currentUser: UserModel;
  currentOrg: OrganizationModel;
  authGlobals = AuthGlobals;
  canView = this.authService.canView;
  isAuth = this.authService.isAuth;

  constructor(
    private authService: AuthService,
    private zone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getMongoDbUser();
    this.currentOrg = this.authService.getUserOrg();
    this.authService.getOrganizationsByIds(this.currentUser.organizations.map(o => o.organization)).subscribe((orgs: OrganizationModel[]) => {
      this.organizations = orgs;
      // let filteredNames = this.organizations.map(o => `${o.name} | ${o.email}`);
      // filteredNames.unshift("Onboard to new organization");
      // this.companiesSubject.next(filteredNames);
    }, error => {
      console.log("FrontPageComponent: Couldn't get organizations", error.message);
    });
  }


  companySelected(index: number) {
    if (index == -1) {
      let el: HTMLElement = document.getElementById("onboardButton");
      el.click();
    } else {
      let selectedOrg = this.organizations[index];
      this.authService.logInToOrg(selectedOrg._id);
      this.currentOrg = selectedOrg;
    }
  }

  onboard(registerCode: string, referralCode: string) {
    this.authService.onboardToNewOrg(registerCode, referralCode);
  }
}
