import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
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

  constructor(
    private authService: AuthService,
    private zone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    // this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = this.authService.getMongoDbUser();
      this.currentOrg = this.authService.getUserOrg();
      this.authService.getManyOrganizations(this.currentUser.organizations.map(o => o.organization)).subscribe((orgs: OrganizationModel[]) => {
        this.organizations = orgs;
        // let filteredNames = this.organizations.map(o => `${o.name} | ${o.email}`);
        // filteredNames.unshift("Onboard to new organization");
        // this.companiesSubject.next(filteredNames);
      }, error => {
        console.log("FrontPageComponent: Couldn't get organizations", error.message);
      })
    // }, error => {
    //   console.log("FrontPageComponent: Couldn't get user");
    // })
  }

  // companySelected(selectedItem: string) {
  //   if (selectedItem === "Onboard to new organization") {
  //     let el: HTMLElement = document.getElementById("onboardButton");
  //     el.click();
  //   } else {
  //     let selectedOrg = this.organizations.filter(o => o.name === selectedItem.split(" | ")[0])[0];
  //     this.authService.logInToOrg(selectedOrg._id);
  //   }
  // }

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

  redirect(route: string) {
    this.zone.run(() => {
      this.router.navigate([route]);
    });
  }

  canView(roles: string[]) {
    return this.authService.canView(roles);
  }

  isAuth() {
    return this.authService.getIsAuth();
  }
}
