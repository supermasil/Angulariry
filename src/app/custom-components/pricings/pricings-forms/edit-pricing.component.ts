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
  itemNames = new ReplaySubject<string[]>();
  selectedItem: PricingItemModel;
  orgDefaultPricing: PricingModel;

  formDataSubject = new ReplaySubject<PricingModel>();
  selectedItemSubject = new ReplaySubject<PricingItemModel>();

  constructor(public pricingService: PricingService, private authService: AuthService) {}

  ngOnInit() {
    this.pricingService.getPricing(this.authService.getUserOrg().pricings).subscribe((pricing: PricingModel) => {
      this.orgDefaultPricing = pricing;
      this.itemNames.next(pricing.items.map(i => i.name));
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });
  }

  itemSelected(itemName: string) {
    this.selectedItem = this.orgDefaultPricing.items.filter(i => i.name == itemName)[0];
    this.selectedItemSubject.next(this.selectedItem);
    this.formDataSubject.next(this.orgDefaultPricing);
  }
}
