import { AfterViewChecked, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ReplaySubject } from "rxjs";
import { AuthGlobals } from "src/app/auth/auth-globals";
import { AuthService } from "src/app/auth/auth.service";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingItemModel, PricingModel } from "src/app/models/pricing.model";
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
  items = new ReplaySubject<PricingItemModel[]>();
  selectedItem: PricingItemModel;
  orgDefaultPricing: PricingModel;
  organization: OrganizationModel;
  users: UserModel[];

  usersSubject = new ReplaySubject<UserModel[]>();
  selectedUserSubject = new ReplaySubject<UserModel>();
  selectedItemSubject = new ReplaySubject<PricingItemModel>();
  userFields = ["name", "userCode", "role", "email"];
  itemFields = ["name"];

  constructor(
    private authService: AuthService,
    public pricingService: PricingService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.authService.getUsers().subscribe((response: {users: UserModel[], count: number}) => {
      this.users = response.users.filter(u => u.role === AuthGlobals.roles.Customer);
      this.usersSubject.next(this.users);
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });

    this.pricingService.getPricing(this.authService.getUserOrg().pricings).subscribe((pricing: PricingModel) => {
      this.orgDefaultPricing = pricing;
      this.items.next(pricing.items);
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });
  }

  userSelected(user: UserModel) {
    this.selectedUser = user;
    this.selectedUserSubject.next(this.selectedUser);
  }

  itemSelected(item: PricingItemModel) {
    this.selectedItem = item;
    this.selectedItemSubject.next(this.selectedItem);
  }
}
