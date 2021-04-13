import { Component, OnInit } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { AuthService } from "src/app/auth/auth.service";
import { PricingItemModel, PricingModel } from "src/app/models/pricing.model";
import { PricingService } from "../pricing.service";

@Component({
  selector: 'edit-pricing-form',
  templateUrl: './edit-pricing.component.html',
  styleUrls: ['./edit-pricing.component.css', '../pricing.component.css']
})
export class EditPricingComponent implements OnInit {
  items = new ReplaySubject<PricingItemModel[]>();
  selectedItem: PricingItemModel;
  orgDefaultPricing: PricingModel;

  selectedItemSubject = new ReplaySubject<PricingItemModel>();
  itemFields = ["name"];

  constructor(public pricingService: PricingService, private authService: AuthService) {}

  ngOnInit() {
    this.pricingService.getPricing(this.authService.getUserOrg().pricings).subscribe((pricing: PricingModel) => {
      this.orgDefaultPricing = pricing;
      this.items.next(pricing.items);
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });
  }

  itemSelected(item: PricingItemModel) {
    this.selectedItem = item;
    this.selectedItemSubject.next(this.selectedItem);
  }
}
