import { AfterViewChecked, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ReplaySubject } from "rxjs";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { AuthService } from "src/app/auth/auth.service";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingModel } from "src/app/models/pricing.model";
import { UserModel } from "src/app/models/user.model";
import { PricingService } from "../pricing.service";


@Component({
  selector: '/custom-pricing-form',
  templateUrl: './custom-pricing.component.html',
  styleUrls: ['./custom-pricing.component.css'],
})
export class CustomPricingComponent implements OnInit {

  customPricingForm: FormGroup;
  selectedUser: UserModel;
  orgDefaultPricing: PricingModel;
  organization: OrganizationModel;
  users: UserModel[];

  userCodes = new ReplaySubject<string[]>();
  selectedUserSubject = new ReplaySubject<UserModel>();

  constructor(
    private authService: AuthService,
    public pricingService: PricingService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
      this.users = response.users.filter(u => u.role === AuthGlobals.roles.Customer);
      this.userCodes.next(this.users.map(user => `${user.userCode} | ${user.name} | ${user.email}`));
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    })
  }

  userSelected(user: string) {
    this.selectedUser = this.users.filter(u => u.userCode == user.split(" ")[0])[0];
    this.selectedUserSubject.next(this.selectedUser);
  }

}
