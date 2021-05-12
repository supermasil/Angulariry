import { Component, OnInit } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { PricingModel } from "src/app/models/pricing.model";
import { PricingService } from "../pricing.service";

@Component({
  selector: 'new-pricing-form',
  templateUrl: './new-pricing.component.html',
  styleUrls: ['./new-pricing.component.css', '../pricing.component.css']
})
export class NewPricingComponent implements OnInit {

  formDataSubject = new ReplaySubject<PricingModel>();

  constructor(
    public pricingService: PricingService
  ) {}

  ngOnInit() {
    this.formDataSubject.next(null);
  }
}
