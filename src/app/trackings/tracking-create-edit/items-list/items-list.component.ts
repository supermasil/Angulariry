import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { AutoCompleteInputComponent } from 'src/app/custom-components/auto-complete-input/auto-complete-input.component';
import { PricingItemModel, PricingModel } from 'src/app/models/pricing.model';
import { ListItemModel } from 'src/app/models/tracking-models/list-item.model';
import { TrackingGlobals } from '../../tracking-globals';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'items-list',
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.css', '../tracking-create-edit.component.css']
})
export class ItemsListComponent implements OnInit, AfterViewInit, AfterViewChecked{

  itemsForm: FormGroup;

  @Input() pricingObservable: Observable<PricingModel> = new Observable();
  pricing: PricingModel;

  senderId: string;
  origin: string;
  destination: string;
  @Input() pricingUpdatedObservable: Observable<{sender: string, origin: string, destination: string}> = new Observable();

  @Input() updateExistingItemsObservable: Observable<ListItemModel[]> = new Observable(); // Edit case
  totalOldItems = -1;

  currentValidItems = [] // For when edit item is not avaiable anymore

  items = new BehaviorSubject<PricingItemModel[]>([]); // Subject won't work for some reason
  itemFields = ["name"];

  insurance = ["5 %", "2 %"];
  increment = 0; // for items order


  @ViewChildren('itemName') itemNamesRef: QueryList<AutoCompleteInputComponent>;

  @Output() formValidity = new EventEmitter<any>();

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private translateService: TranslateService) {
  }

  ngOnInit() {
    this.pricingObservable.subscribe((p: PricingModel) => {
      this.pricing = p;
      this.currentValidItems = p.items;
      this.items.next(p.items);
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });

    this.itemsForm = new FormGroup({
      items: new FormArray([])
    });

    this.pricingUpdatedObservable.subscribe(changes => {
      this.senderId = changes.sender;
      this.origin = changes.origin;
      this.destination = changes.destination;
      this.itemsForm.get('items')['controls'].forEach((item, index) => {
        if (index > this.totalOldItems - 1) {
          this.pricingChangeCheck(item.get('name').value, this.itemsForm.get('items')['controls'][index].get('order').value); // Only new items
        }
      });
    });

    this.itemsForm.valueChanges.subscribe(valid => {
      let validity = this.itemsForm.valid;
      if (this.itemsForm.get('items')['controls'].length == 0) {
        validity = false;
      }
      this.formValidity.emit({valid: validity, data: this.itemsForm.getRawValue()});
    });

    this.updateExistingItemsObservable.subscribe((items: ListItemModel[]) => {
      this.totalOldItems = items.length;
      items.forEach(item => {
        this.addItem(item);
      });
    });
  }

  ngAfterViewChecked() {
    this.cd.detectChanges(); // To prevent problems when selectItem()
  }

  pricingChangeCheck(itemName: string, order: number) {
    if (itemName) {
      let itemPricingIndex = this.pricing.items.findIndex(i => i.name == itemName);
      let itemFormIndex = this.itemsForm.get('items')['controls'].findIndex(i => i.get('order').value === order);
      if (itemPricingIndex >= 0 && itemFormIndex >= 0) {
        try {
          let routeIndex = this.pricing.items[itemPricingIndex].routes.findIndex(r => r.origin == this.origin);
          let destinationIndex = this.pricing.items[itemPricingIndex].routes[routeIndex].destinations.findIndex(d => d.name == this.destination);
          let discountIndex = this.pricing.items[itemPricingIndex].routes[routeIndex].destinations[destinationIndex].discounts.findIndex(discount => discount.userId == this.senderId);
          let destination = this.pricing.items[itemPricingIndex].routes[routeIndex].destinations[destinationIndex];
          let discount = this.pricing.items[itemPricingIndex].routes[routeIndex].destinations[destinationIndex].discounts[discountIndex];

          this.itemsForm.get('items')['controls'][itemFormIndex].get('extraChargeUnit').setValue(destination.extraChargeUnit);

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
          }

        } catch (error) {
          this.translateService.get(`error-messages.item-not-set-up-for-route`).subscribe(translatedMessage => {
            this.toastr.warning(translatedMessage);
          });
          this.itemsForm.get('items')['controls'][itemFormIndex].get('unitCharge').setValue(null);
          this.itemsForm.get('items')['controls'][itemFormIndex].get('extraCharge').setValue(null);
        }
      }
    }
  }

  ngAfterViewInit() {
    this.items.next(this.pricing.items);
  }

  createItem(formData: ListItemModel): FormGroup {
    let form = new FormGroup({
      name: new FormControl(formData?.name? formData.name : "", {validators:[Validators.required]}),
      declaredValue: new FormControl(formData?.declaredValue? formData.declaredValue : 0, {validators:[Validators.required]}),
      quantity: new FormControl(formData?.quantity? formData.quantity : 0, {validators:[Validators.required]}),
      unitCharge: new FormControl(formData?.unitCharge? formData.unitCharge : 0, {validators:[Validators.required]}),
      extraCharge: new FormControl(formData?.extraCharge? formData.extraCharge : 0, {validators:[Validators.required]}),
      extraChargeUnit: new FormControl(formData?.extraChargeUnit? formData.extraChargeUnit : '$', {validators:[Validators.required]}),
      unitChargeSaving: new FormControl(formData?.unitChargeSaving? formData.unitChargeSaving : 0, {validators:[Validators.required]}),
      extraChargeSaving: new FormControl(formData?.extraChargeSaving? formData.extraChargeSaving : 0, {validators:[Validators.required]}),
      weight: new FormControl(formData?.weight? formData.weight : 0, {validators:[Validators.required]}),
      insurance: new FormControl(formData?.insurance? formData.insurance : 0, {validators: [Validators.required]}),
      status: new FormControl(formData?.status? formData.status : TrackingGlobals.trackingStatuses.Created, {validators:[Validators.required]}),
      order: new FormControl(this.increment)
    });

    if (!formData) { // edit case
      form.get('name').valueChanges.subscribe(value => {
        this.pricingChangeCheck(value, form.get('order').value);
      })
    }

    this.increment ++;
    return form;
  }

  addItem(formData: ListItemModel) {
    (this.itemsForm.get('items') as FormArray).push(this.createItem(formData));
    this.items.next(this.pricing.items);
  }

  removeItem(i: number) {
    // if((this.itemsForm.get('items') as FormArray).length == 1) {
    //   return;
    // }
    // this.addItemName(this.itemsForm.get('items')['controls'][i].get('name').value);
    if (i <= this.totalOldItems - 1) {
      this.totalOldItems -= 1;
    }

    (this.itemsForm.get('items') as FormArray).removeAt(i);
  }

  itemSelected(item: PricingItemModel, index: number) {
    // let previousValue = this.itemsForm.get('items')['controls'][index].get('name').value;
    // if (previousValue) {
    //   this.addItemName(previousValue);
    // }
    this.itemsForm.get('items')['controls'][index].get('name').setValue(item.name);
    // this.subtractItemName(value);
  }

  // subtractItemName(value: string) {
  //   this.itemNames = this.itemNames.filter(i => i !== value);
  //   this.itemNamesSubject.next(this.itemNames);
  // }

  // addItemName(value: string) {
  //   if (value && this.currentValidItemNames.includes(value)) { // Can be empty string
  //     this.itemNames.unshift(value);
  //     this.itemNamesSubject.next(this.itemNames);
  //   }
  // }

  itemInvalid(item: PricingItemModel, index: number) {
    // let previousValue = this.itemsForm.get('items')['controls'][index].get('name').value;
    // if (previousValue && !this.itemNames.includes(previousValue)) {
    //   this.addItemName(previousValue);
    // }
    if (index > this.totalOldItems - 1) { // Only new items
      this.itemsForm.get('items')['controls'][index].get('name').setValue('');
      this.itemsForm.get('items')['controls'][index].get('unitCharge').setValue(null);
      this.itemsForm.get('items')['controls'][index].get('extraCharge').setValue(null);
    }
  }

  getExtraChargeUnit(index: number) {
    return this.itemsForm.get('items')['controls'][index].get('extraChargeUnit').value;
  }

  getDefaultValue(index: number) {
    if (index > this.totalOldItems - 1) {
      return "";
    } else {
      return this.itemsForm.get('items')['controls'][index].get('name').value;;
    }
  }

  getLockOption(index: number) {
    if (index > this.totalOldItems - 1) {
      return false;
    } else {
      return true;
    }
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
