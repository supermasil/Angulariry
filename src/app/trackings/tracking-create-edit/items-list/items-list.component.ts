import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/alert-message';
import { AuthService } from 'src/app/auth/auth.service';
import { AutoCompleteInputComponent } from 'src/app/custom-components/auto-complete-input/auto-complete-input.component';
import { GlobalConstants } from 'src/app/global-constants';
import { PricingModel } from 'src/app/models/pricing.model';

@Component({
  selector: 'items-list',
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.css', '../tracking-create-edit.component.css']
})
export class ItemsListComponent implements OnInit, AfterViewInit{

  itemsForm: FormGroup;

  @Input() pricingObservable: Observable<PricingModel> = new Observable();
  pricing: PricingModel;

  senderId: string;
  origin: string;
  destination: string;
  @Input() pricingUpdatedObservable: Observable<{sender: string, origin: string, destination: string}> = new Observable();

  @Input() userIdObservable: Observable<string> = new Observable();
  userId: string;

  itemNames = [];
  itemNamesSubject = new BehaviorSubject<string[]>([]); // Subject won't work for some reason

  insurance = ["5 %", "2 %"];

  @ViewChildren('itemName') itemNamesRef: QueryList<AutoCompleteInputComponent>;

  @Output() formValidityStatus = new EventEmitter<boolean>();

  constructor(
    private authService: AuthService,
    private alertService: AlertService) {
  }

  ngOnInit() {
    this.pricingObservable.subscribe((p: PricingModel) => {
      this.pricing = p;
      this.itemNames = p.items.map(i => i.name);
      this.itemNamesSubject.next(this.itemNames);
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch pricing");
    });

    this.itemsForm = new FormGroup({
      items: new FormArray([this.createItem()])
    });

    this.userIdObservable.subscribe((u: string) => {
      this.userId = u;
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch user id");
    });

    this.pricingUpdatedObservable.subscribe(changes => {
      this.senderId = changes.sender;
      this.origin = changes.origin;
      this.destination = changes.destination;

      this.itemsForm.get('items')['controls'].forEach((item) => {
        this.pricingChangeCheck(item.get('name').value);
      });
    });

    this.itemsForm.valueChanges.subscribe(valid => {
      this.formValidityStatus.emit(this.itemsForm.valid);
    })
  }

  pricingChangeCheck(itemName: string) {
    if (itemName) {
      let itemIndex = this.pricing.items.findIndex(i => i.name == itemName);
      let itemFormIndex = this.itemsForm.get('items')['controls'].findIndex(i => i['controls'].name.value == itemName);
      if (itemIndex >= 0 && itemFormIndex >= 0) {
        try {
          let routeIndex = this.pricing.items[itemIndex].routes.findIndex(r => r.origin == this.origin);
          let destinationIndex = this.pricing.items[itemIndex].routes[routeIndex].destinations.findIndex(d => d.name == this.destination);
          let discountIndex = this.pricing.items[itemIndex].routes[routeIndex].destinations[destinationIndex].discounts.findIndex(discount => discount.userId == this.senderId);

          let destination = this.pricing.items[itemIndex].routes[routeIndex].destinations[destinationIndex];
          let discount = this.pricing.items[itemIndex].routes[routeIndex].destinations[destinationIndex].discounts[discountIndex];

          this.itemsForm.get('items')['controls'][itemFormIndex].controls['extraChargeUnit'].setValue(destination.extraChargeUnit);

          let originalUnitCharge = destination.pricePerUnit;
          let originalExtraCharge = destination.extraCharge; // Can be $ or %

          let finalUnitCharge = 0;
          let finalExtraCharge = 0;

          // Complicated af
          if (discount) {
            if (discount.perUnitDiscountUnit === '$') {
              finalUnitCharge = originalUnitCharge -  discount.perUnitDiscountAmount;
            } else if (discount.perUnitDiscountUnit === '%') {
              finalUnitCharge = originalUnitCharge *  (1 - (discount.perUnitDiscountAmount/ 100))
            } else if (discount.perUnitDiscountUnit === 'Fixed') {
              finalUnitCharge = discount.perUnitDiscountAmount;
            }

            if (destination.extraChargeUnit === '$') {
              if (discount.extraChargeDiscountUnit === '$') {
                finalExtraCharge = originalExtraCharge - discount.extraChargeDiscountAmount;
              } else if (discount.extraChargeDiscountUnit === '%') {
                finalExtraCharge = originalExtraCharge * (1 - (discount.extraChargeDiscountAmount / 100));
              } else if (discount.extraChargeDiscountUnit === "Fixed") {
                finalExtraCharge = discount.extraChargeDiscountAmount;
              }
            } else if (destination.extraChargeUnit === '%') {
              if (discount.extraChargeDiscountUnit === '%') { // Can only be this case
                finalExtraCharge = originalExtraCharge - discount.extraChargeDiscountAmount;
              }
            }
            this.itemsForm.get('items')['controls'][itemFormIndex].get('unitCharge').setValue(finalUnitCharge);
            this.itemsForm.get('items')['controls'][itemFormIndex].get('extraCharge').setValue(finalExtraCharge);
            this.itemsForm.get('items')['controls'][itemFormIndex].get('unitChargeSaving').setValue(originalUnitCharge - finalUnitCharge);
            this.itemsForm.get('items')['controls'][itemFormIndex].get('extraChargeSaving').setValue(originalExtraCharge - finalExtraCharge); // Can be $ or %
          } else {
            this.itemsForm.get('items')['controls'][itemFormIndex].get('unitCharge').setValue(originalUnitCharge);
            this.itemsForm.get('items')['controls'][itemFormIndex].get('extraCharge').setValue(originalExtraCharge);
            this.itemsForm.get('items')['controls'][itemFormIndex].get('unitChargeSaving').setValue(0);
            this.itemsForm.get('items')['controls'][itemFormIndex].get('extraChargeSaving').setValue(0);
          }

        } catch (error) {
          this.alertService.warn("Probably this route is not set up for this item", GlobalConstants.flashMessageOptions);
          this.itemsForm?.get('items')['controls'][itemFormIndex]?.get('unitCharge')?.setValue(0);
          this.itemsForm?.get('items')['controls'][itemFormIndex]?.get('extraCharge')?.setValue(0);
        }
      }
    }
  }

  ngAfterViewInit() {
    this.itemNamesSubject.next(this.itemNames);
  }

  createItem(): FormGroup {
    let form = new FormGroup({
      name: new FormControl("", {validators:[Validators.required]}),
      value: new FormControl(0, {validators:[Validators.required]}),
      quantity: new FormControl(0, {validators:[Validators.required]}),
      unitCharge: new FormControl(0, {validators:[Validators.required]}),
      extraCharge: new FormControl(0, {validators:[Validators.required]}),
      extraChargeUnit: new FormControl(null, {validators:[Validators.required]}),
      unitChargeSaving: new FormControl(0, {validators:[Validators.required]}),
      extraChargeSaving: new FormControl(0, {validators:[Validators.required]}),
      weight: new FormControl(0, {validators:[Validators.required]}),
      insurance: new FormControl(0, {validators: [Validators.required]}),
      status: new FormControl("Unknown", {validators:[Validators.required]})
    });

    form.get('name').valueChanges.subscribe(value => {
      this.pricingChangeCheck(value);
    })
    return form;
  }

  addItem() {
    (this.itemsForm.get('items') as FormArray).push(this.createItem());
    this.itemNamesSubject.next(this.itemNames);
  }

  removeItem(i: number) {
    // if((this.itemsForm.get('items') as FormArray).length == 1) {
    //   return;
    // }
    (this.itemsForm.get('items') as FormArray).removeAt(i);
  }

  itemSelected(value: string, index: number) {
    this.itemsForm.get('items')['controls'][index].controls['name'].setValue(value);
    // let unitCharge = this.pricing.items.filter(i => i.name == value).
  }

  itemInvalid(index: number) {
    this.itemsForm.get('items')['controls'][index].controls['name'].setValue('');
    this.itemsForm.get('items')['controls'][index].get('unitCharge')?.setValue(0);
    this.itemsForm.get('items')['controls'][index].get('extraCharge')?.setValue(0);
  }

  getExtraChargeUnit(index: number) {
    return this.itemsForm.get('items')['controls'][index].controls['extraChargeUnit'].value;
  }

  getFormValidity() {
    this.itemsForm.markAllAsTouched();
    this.itemNamesRef.forEach(i => {
      i.getFormValidity();
    })
    return this.itemsForm.valid
  }

  getRawValues() {
    return this.itemsForm.getRawValue();
  }
}
