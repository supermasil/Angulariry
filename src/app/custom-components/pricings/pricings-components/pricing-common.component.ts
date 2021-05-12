import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { AuthService } from "src/app/auth/auth.service";
import { PricingService } from "../pricing.service";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from "@angular/forms";
import { Observable, ReplaySubject } from "rxjs";
import { OrganizationLocationModel, OrganizationModel } from "src/app/models/organization.model";
import { PricingModel, PricingItemModel, PricingRouteModel, PricingDestinationModel, PricingDiscountModel } from "src/app/models/pricing.model";
import { UserModel } from "src/app/models/user.model";
import { AutoCompleteInputComponent } from "../../auto-complete-input/auto-complete-input.component";
import { trigger, state, style, transition, animate } from "@angular/animations";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'pricing-common-form',
  templateUrl: './pricing-common.component.html',
  styleUrls: ['./pricing-common.component.css', '../pricing.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px', minHeight: '0'})), // After sort is clicked, the state is void
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('1ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('1ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class PricingCommonComponent implements OnInit, AfterViewChecked {
  commonPricingForm: FormGroup;
  organization: OrganizationModel;
  orgDefaultPricing: PricingModel;
  selectedItem: PricingItemModel
  selectedUser: UserModel
  users: UserModel[];

  selectedDiscountIndex = 0;

  @Input() mode = "create";
  @Input() selectedItemObservable = new Observable<PricingItemModel>();
  @Input() selectedUserObservable = new Observable<UserModel>();
  defaultLocations = new ReplaySubject<OrganizationLocationModel[]>();
  userCodes = new ReplaySubject<string[]>();

  locationFields = ["name"];
  destinationFields = ["name"];

  @ViewChildren('origin') originRef: QueryList<AutoCompleteInputComponent>;
  @ViewChildren('destination') destinationRef: QueryList<AutoCompleteInputComponent>;

  constructor(
    private authService: AuthService,
    public pricingService: PricingService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.organization = this.authService.getUserOrg();
    this.defaultLocations.next(this.organization.locations);
    this.pricingService.getPricing(this.organization.pricings).subscribe((pricing: PricingModel) => {
      this.orgDefaultPricing = pricing;

      this.selectedItemObservable.subscribe((item: PricingItemModel) => {
        this.selectedItem = item;
        this.createSingleItemForm();
      });

      this.selectedUserObservable.subscribe((user: UserModel) => {
        this.selectedUser = user;
        this.createSingleItemForm();
      });

      if (this.mode == "create") {
        this.commonPricingForm = this.createPricingForm(null);
      }
    }, error => {
      this.authService.redirectToMainPageWithoutMessage();
    });
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  createSingleItemForm() {
    this.commonPricingForm = null;
    if ((this.mode == "edit" && this.selectedItem) || (this.mode == "custom" && this.selectedUser && this.selectedItem)) {
      let pricingCopy = Object.create(this.orgDefaultPricing);
      pricingCopy.items = [this.selectedItem];
      this.commonPricingForm = this.createPricingForm(pricingCopy);
    }
  }

  createPricingForm(pricing: PricingModel) {
    let createdItems = [];
    if (pricing?.items?.length > 0) {
      pricing.items.forEach(item => {
        createdItems.push(this.createItem(item));
      })
    } else {
      createdItems.push(this.createItem(null));
    }

    let form = new FormGroup({
      _id: new FormControl(this.orgDefaultPricing._id),
      items: new FormArray(createdItems),
      organization: new FormControl(this.organization._id, {validators: [Validators.required]})
    });

    this.setItemNamesValidator(form);

    return form;
  }

  setItemNamesValidator(formInput: FormGroup) {
    formInput.get('items')['controls'].forEach(control => {
      control.get('name').setValidators([Validators.required, this.itemNamesValidator(formInput)]);
    })
  }


  itemNamesValidator(form: FormGroup): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      let currentItems = [];

      if ((control && control.value)) {
        let currentFormItems = form.get('items')['controls'].map(item => item['controls'].name.value.toLowerCase());// Tricky as fuck, can't use .value because the value is not updated
        currentItems = this.orgDefaultPricing.items.map(item => item.name.toLowerCase());
        if(this.mode == 'edit' || this.mode == 'custom') {
          currentItems = currentItems.filter(item => item != this.selectedItem.name);
        }
        currentItems = currentItems.concat(currentFormItems);

        form.get('items')['controls'].forEach(element => {
          if (currentFormItems.filter(item => item === element['controls'].name.value.toLowerCase()).length > 1) {
            element['controls'].name.setErrors({error: "Duplicate item name"});
            return {error: "Duplicate item name"};
          } else if (currentItems.filter(item => item === element['controls'].name.value.toLowerCase()).length > 1) {
            element['controls'].name.setErrors({error: "Item name existed"});
            return {error: "Item name existed"};
          } else {
            element['controls'].name.setErrors(null);
            return null;
          }
        });
        // This block is needed for the current field
        if (currentFormItems.filter(item => item ===  control.value.toLowerCase()).length > 1) {
          control.setErrors({error: "Item name existed"});
          return {error: "Duplicate item name"};
        } else if (currentItems.filter(item => item === control.value.toLowerCase()).length > 1) {
          control.setErrors({error: "Item name existed"});
          return {error: "Item name existed"};
        }
        return null;
      } else {
        control.setErrors({error: "Please enter an item name"});
        return {error: "Please enter an item name"};
      }
    };
  }

  createItem(item: PricingItemModel) {
    let createdRoutes = [];
    if (item?.routes?.length > 0) {
      item.routes.forEach(route => {
        createdRoutes.push(this.createRoute(route, true));
      })
    } else {
      createdRoutes.push(this.createRoute(null, false));
    }

    let form = new FormGroup({
      _id: new FormControl(item?._id? item._id : null),
      name: new FormControl(item?.name? item.name: null, {validators: [Validators.required]}),
      unit: new FormControl(item?.unit? item.unit: "kg"),
      content: new FormControl(item?.content? item.content: ""),
      routes: new FormArray(createdRoutes)
    })

    return form
  }

  addItem(form: FormGroup) {
    (form.get('items') as FormArray).push(this.createItem(null));
    this.setItemNamesValidator(form);
  }

  removeItem(form: FormGroup, i: number) {
    if((form.get('items') as FormArray).length == 1) {
      return;
    }

    (form.get('items') as FormArray).removeAt(i);
  }

  createRoute(route: PricingRouteModel, disableExtraChargeUnit: boolean) {
    let createdDestinations = [];
    if (route?.destinations?.length > 0) {
      route.destinations.forEach(destination => {
        createdDestinations.push(this.createDestination(destination, disableExtraChargeUnit));
      })
    } else {
      createdDestinations.push(this.createDestination(null, disableExtraChargeUnit));
    }

    let form = new FormGroup({
      _id: new FormControl(route?._id? route._id : null),
      origin: new FormControl(route?.origin? route.origin: "", {validators: [Validators.required]}),
      destinations: new FormArray(createdDestinations)
    });

    return form;
  }

  addRoute(form: FormGroup, i: number) {
    (form.get('items')['controls'][i].get('routes') as FormArray).push(this.createRoute(null, false));
  }

  removeRoute(form: FormGroup, i: number, r: number) {
    if((form.get('items')['controls'][i].get('routes') as FormArray).length == 1) {
      return;
    }

    (form.get('items')['controls'][i].get('routes') as FormArray).removeAt(r);
  }

  createDestination(destination: PricingDestinationModel, disableExtraChargeUnit: boolean) {
    // For new custom pricing
    let createdDiscounts = [];
    if (destination?.discounts?.length > 0) {
      destination.discounts.forEach(discount => {
        createdDiscounts.push(this.createDiscount(discount));
      })
    }

    if (this.mode == "custom" && this.selectedUser && destination?.discounts?.filter(discount => discount.userId == this.selectedUser._id).length == 0) {
      let newDiscount = {
        userId: this.selectedUser._id,
        perUnitDiscountUnit: '%',
        perUnitDiscountAmount: 0,
        extraChargeDiscountUnit: '%',
        extraChargeDiscountAmount: 0,
      }
      createdDiscounts.push(this.createDiscount(newDiscount as PricingDiscountModel));
      destination.discounts.push(newDiscount);
      this.selectedDiscountIndex = destination?.discounts?.findIndex(discount => discount.userId == this.selectedUser._id);
    }

    let form = new FormGroup({
      _id: new FormControl(destination?._id? destination._id : null),
      name: new FormControl(destination?.name? destination.name: "", {validators: [Validators.required]}),
      pricePerUnit: new FormControl(destination?.pricePerUnit? destination.pricePerUnit: 0, {validators: [Validators.required]}),
      extraCharge: new FormControl(destination?.extraCharge? destination.extraCharge: 0, {validators: [Validators.required]}),
      extraChargeUnit: new FormControl({value: destination?.extraChargeUnit? destination.extraChargeUnit: "$", disabled: disableExtraChargeUnit}, {validators: [Validators.required]}),
      discounts: new FormArray(createdDiscounts),
    })

    return form;
  }

  createDiscount(discount: PricingDiscountModel) {
    let form = new FormGroup({
      userId: new FormControl(discount?.userId? discount.userId : null),
      perUnitDiscountUnit: new FormControl(discount?.perUnitDiscountUnit? discount.perUnitDiscountUnit : "%", {validators: [Validators.required]}),
      perUnitDiscountAmount: new FormControl(discount?.perUnitDiscountAmount? discount.perUnitDiscountAmount : 0, {validators: [Validators.required]}),
      extraChargeDiscountUnit: new FormControl(discount?.extraChargeDiscountUnit? discount.extraChargeDiscountUnit : "%", {validators: [Validators.required]}),
      extraChargeDiscountAmount: new FormControl(discount?.extraChargeDiscountAmount? discount.extraChargeDiscountAmount : 0, {validators: [Validators.required]}),
    });
    return form;
  }

  addDestination(form: FormGroup, i: number, r: number) {
    (form.get('items')['controls'][i].get('routes')['controls'][r].get('destinations') as FormArray).push(this.createDestination(null, false));
  }

  removeDestination(form: FormGroup, i: number, r: number, d: number) {
    if((form.get('items')['controls'][i].get('routes')['controls'][r].get('destinations') as FormArray).length == 1) {
      return;
    }

    (form.get('items')['controls'][i].get('routes')['controls'][r].get('destinations') as FormArray).removeAt(d);
  }

  originDestinationValidation() {
    let valid = true;
    let rawForm = this.commonPricingForm.getRawValue();
    for (let item of rawForm.items) {
      let currentOrigin = null;
      for (let route of item.routes) {
        if (route.origin == currentOrigin) {
          valid = false;
          break;
        } else {
          currentOrigin = route.origin;
          let currentDestination = null;
          for (let destination of route.destinations) {
            if (destination.name == currentDestination || destination.name == currentOrigin) {
              valid = false;
              break;
            } else {
              currentDestination = destination.name;
            }
          }
        }
      }
    }
    return valid;
  }


  onSubmit() {
    let originValidity = true;
    let destinationValidity = true;

    this.originRef.forEach((i, index) => {
      i.getFormValidity()
      originValidity = i.getFormValidity() && originValidity;
    });

    this.destinationRef.forEach((i, index) => {
      i.getFormValidity()
      destinationValidity = i.getFormValidity() && destinationValidity;
    });

    this.commonPricingForm.markAllAsTouched();

    if (!this.commonPricingForm.valid || !originValidity || !destinationValidity) {
      return
    }

    if (!this.originDestinationValidation()) {
      this.translateService.get(`error-messages.duplicate-origins-destinations`).subscribe(translatedMessage => {
        this.toastr.warning(translatedMessage);
      });
      return;
    }

    if (this.mode == 'create') {
      this.pricingService.addItems(this.commonPricingForm.getRawValue());
    } else {
      this.pricingService.updateItem(this.commonPricingForm.getRawValue());
    }
  }
}
