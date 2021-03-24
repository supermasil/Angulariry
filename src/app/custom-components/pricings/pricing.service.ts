import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PricingModel } from '../../models/pricing.model';

const BACKEND_URL = environment.apiURL + "/pricings/";

@Injectable({ providedIn: "root"})
export class PricingService {

  public units = ["kg"];
  public extraChargeUnits = ["$", "%"];
  public discountUnits = ["%", "$", "Fixed"];

  public getDiscountUnits(unit: string) { // limit to % if extra charge unit is %
    if (unit === "%") {
      return ["%"];
    } else if (unit === "$") {
      return this.discountUnits;
    }
  }

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private zone: NgZone,
    ) {}


  addItems(formData: any) {
    this.httpClient
      .post<{message: string, pricing: PricingModel}>(BACKEND_URL, formData)
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate(["/"]);
        });
      });
  }

  getPricing(pricingId: string) {
    return this.httpClient.get<PricingModel>(BACKEND_URL + pricingId); // return an observable
  }

  updateItem(formData: any) {
    this.httpClient
      .put<{message: string, tracking: PricingModel}>(BACKEND_URL + 'updateItem/' + formData._id, formData)
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate(["/"]);
        });
      });
  }

  updateCustomPricing(formData: any) {
    this.httpClient
      .put<{message: string, tracking: PricingModel}>(BACKEND_URL + 'updateCustomPricing/' + formData._id, formData)
      .subscribe((responseData) => {
        this.zone.run(() => {
          this.router.navigate(["/"]);
        });
      });
  }

  detetePricing(id: string) {
    return this.httpClient.delete<{message: string}>(BACKEND_URL + id);
  }

  deleteItem(pricingId: string, itemId: string) {
    return this.httpClient.delete<{message: string}>(BACKEND_URL + pricingId + "/item/" + itemId);
  }
}
