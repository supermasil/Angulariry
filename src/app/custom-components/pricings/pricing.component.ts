import { Component, OnInit } from "@angular/core";
import { FormGroup } from '@angular/forms';
import { AuthService } from "src/app/auth/auth.service";
import { UserModel } from "src/app/models/user.model";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingItemModel, PricingModel } from "src/app/models/pricing.model";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'pricing-form',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})), // After sort is clicked, the state is void
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('1ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('1ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class PricingComponent implements OnInit {
  pricingForm: FormGroup;
  newPricingForm: FormGroup;
  editPricingForm: FormGroup;
  currentUser: UserModel;
  users: UserModel[];
  orgDefaultPricing: PricingModel;
  organization: OrganizationModel;
  editFilteredItem: PricingItemModel[];
  selectedUser: UserModel;
  selectedItem: PricingItemModel;
  isLoading = false;

  selectedIndex = 0;

  enabled = [false, false, false];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap.get('type')?.includes("new")) {
        this.selectedIndex = 0;
      } else if (paramMap.get('type')?.includes('edit')) {
        this.selectedIndex = 1;
      } else if (paramMap.get('type')?.includes('custom')) {
        this.selectedIndex = 2;
      } else {
        return this.authService.redirect404();
      }
      this.disableTheRest(this.selectedIndex);
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
