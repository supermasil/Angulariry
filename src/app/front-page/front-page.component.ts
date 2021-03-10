import { Component, OnInit } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { OrganizationModel } from '../models/organization.model';
import { UserModel } from '../models/user.model';

@Component({
  selector: 'app-front-page',
  templateUrl: 'front-page.component.html',
  styleUrls: ['front-page.component.css']
})
export class FrontPageComponent implements OnInit{
  organizations : OrganizationModel[] = [];
  companiesSubject = new ReplaySubject<string[]>();

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.authService.getManyOrganizations(user.organizations.map(o => o.organization)).subscribe((orgs: OrganizationModel[]) => {
        this.organizations = orgs;
        let filteredNames = this.organizations.map(o => `${o.name} | ${o.email}`);
        filteredNames.unshift("Onboard to new organization");
        this.companiesSubject.next(filteredNames);
      }, error => {
        console.log("FrontPageComponent: Couldn't get organizations", error.message);
      })
    }, error => {
      console.log("FrontPageComponent: Couldn't get user");
    })
  }

  companySelected(selectedItem: string) {
    if (selectedItem === "Onboard to new organization") {
      let el: HTMLElement = document.getElementById("onboardButton");
      el.click();
    } else {
      let selectedOrg = this.organizations.filter(o => o.name === selectedItem.split(" | ")[0])[0];
      this.authService.logInToOrg(selectedOrg._id);
    }
  }

  onboard(registerCode: string, referralCode: string) {
    this.authService.onboardToNewOrg(registerCode, referralCode);
  }
}
