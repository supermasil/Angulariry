import { AfterViewChecked, ChangeDetectorRef, Component, OnInit, ViewChild } from "@angular/core";
import { AbstractControl, Form, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from "src/app/auth/auth.service";
import { UserModel } from "src/app/models/user.model";
import { OrganizationModel } from "src/app/models/organization.model";
import { PricingDestinationModel, PricingDiscountModel, PricingItemModel, PricingModel, PricingRouteModel } from "src/app/models/pricing.model";
import { Router } from "@angular/router";
import { ReplaySubject } from "rxjs";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { PricingService } from "./pricing.service";
import { AlertService } from "../alert-message";
import { GlobalConstants } from "../global-constants";

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
export class PricingComponent implements OnInit, AfterViewChecked {
  pricingForm: FormGroup;
  newPricingForm: FormGroup;
  editPricingForm: FormGroup
  currentUser: UserModel;
  users: UserModel[];
  orgDefaultPricing: PricingModel;
  organization: OrganizationModel;
  editFilteredItem: PricingItemModel[];
  selectedUser: UserModel;
  selectedItem: PricingItemModel;
  isLoading = false;

  selectedIndex = 0;

  defaultLocations = new ReplaySubject<string[]>();
  itemNames = new ReplaySubject<string[]>();
  customerCodes = new ReplaySubject<string[]>();

  units = ["kg"];
  extraChargeUnits = ["$", "%"];
  discountUnits = ["%", "$", "Fixed"];

  constructor(
    private authService: AuthService,
    private pricingService: PricingService,
    private alertService: AlertService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.newPricingForm = this.createPricingForm(null);

    this.authService.getMongoDbUserListener().subscribe((user: UserModel) => {
      this.currentUser = user;
      this.authService.getUserOrgListener().subscribe((org: OrganizationModel) => {
        this.organization = org;
        this.defaultLocations.next(org.locations.map(item => item.name));
        this.authService.getUsersByOrg(org._id).subscribe((users: UserModel[] ) => {
          this.users = users;
          this.customerCodes.next(users.map(user => user.customerCode));
          this.pricingService.getPricing(org.pricings).subscribe((pricing: PricingModel) => {
            this.orgDefaultPricing = pricing;
            this.itemNames.next(pricing.items.map(i => i.name));
            this.editPricingForm = this.createPricingForm(this.orgDefaultPricing);
          }, error => {
            this.authService.redirectOnFailedSubscription("Couldn't fetch pricing");
          });
        }, error => {
          this.authService.redirectOnFailedSubscription("Couldn't fetch users");
        })
      }, error => {
        this.authService.redirectOnFailedSubscription("Couldn't fetch organization");
      });
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch user");
    });
  }

  ngAfterViewChecked() {
    this.cd.detectChanges();
  }

  userSelected(user: string) {
    this.isLoading = true;
    this.pricingForm = null;
    this.selectedUser = this.users.filter(u => u.customerCode == user)[0];
    this.pricingForm = this.createPricingForm(this.orgDefaultPricing);
    this.updateData(this.orgDefaultPricing.items);
    this.isLoading = false;
  }

  itemSelected(itemName: string) {
    this.isLoading = true;
    this.selectedItem = this.orgDefaultPricing.items.filter(i => i.name == itemName)[0];
    this.editPricingForm = this.createPricingForm(this.orgDefaultPricing); // Refresh the form
    this.isLoading = false;
  }

  itemNamesValidator(form: FormGroup): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      let currentItems = [];

      if ((control && control.value)) {
        let currentFormItems = form.get('items')['controls'].map(item => item['controls'].name.value.toLowerCase());// Tricky as fuck, can't use .value because the value is not updated
        if (this.selectedIndex == 0 && this.orgDefaultPricing) {
          currentItems = this.orgDefaultPricing.items.map(item => item.name.toLowerCase());
          currentItems = currentItems.concat(currentFormItems);
        } else {
          currentItems = currentFormItems;
        }

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

  setItemNamesValidator(formInput: FormGroup) {
    formInput.get('items')['controls'].forEach(control => {
      control.get('name').setValidators([Validators.required, this.itemNamesValidator(formInput)]);
    })
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
      _id: new FormControl(pricing?._id? pricing._id : null),
      items: new FormArray(createdItems),
      organization: new FormControl("", {validators: [Validators.required]})
    });

    this.setItemNamesValidator(form);

    return form;
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
    let createdDiscounts = [];
    if (destination?.discounts?.length > 0) {
      destination.discounts.forEach(discount => {
        createdDiscounts.push(this.createDiscount(discount));
      })
    }

    if (this.selectedUser && destination?.discounts?.filter(discount => discount.userId == this.selectedUser._id).length == 0) {
      createdDiscounts.push(
        this.createDiscount({
          userId: this.selectedUser._id,
          perUnitDiscountUnit: '%',
          perUnitDiscountAmount: 0,
          extraChargeDiscountUnit: '%',
          extraChargeDiscountAmount: 0,
        } as PricingDiscountModel))
    }

    let form = new FormGroup({
      _id: new FormControl(destination?._id? destination._id : null),
      name: new FormControl(destination?.name? destination.name: "", {validators: [Validators.required]}),
      pricePerUnit: new FormControl(destination?.pricePerUnit? destination.pricePerUnit: 0, {validators: [Validators.required]}),
      extraCharge: new FormControl(destination?.extraCharge? destination.extraCharge: 0, {validators: [Validators.required]}),
      extraChargeUnit: new FormControl({value: destination?.extraChargeUnit? destination.extraChargeUnit: "$", disabled: disableExtraChargeUnit}, {validators: [Validators.required]}),
      discounts: new FormArray(createdDiscounts)
    })

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

  onAddNewItems() {
    // this.newPricingForm.get('items')['controls'].forEach(control => control.get('name').updateValueAndValidity()); // Item names validator
    this.newPricingForm.get('organization').setValue(this.organization._id);
    this.newPricingForm.get('_id').setValue(this.orgDefaultPricing._id);
    if (!this.newPricingForm.valid) {
      this.alertService.warn("Items have invalid fields", GlobalConstants.flashMessageOptions)
      return
    }

    this.pricingService.addItems(this.newPricingForm.getRawValue());
  }

  onUpdateItems() {
    this.pricingForm.get('organization').setValue(this.organization._id);
    this.pricingForm.get('_id').setValue(this.orgDefaultPricing._id);
    if (!this.pricingForm.valid) {
      this.alertService.warn("Items have invalid fields", GlobalConstants.flashMessageOptions)
      return
    }

    this.pricingService.updateItems(this.pricingForm.getRawValue());
  }

  onEditItem() {
    this.editPricingForm.markAllAsTouched();
    // this.editPricingForm.get('items')['controls'].forEach(control => control.get('name').updateValueAndValidity()); // Item names validator
    this.editPricingForm.get('organization').setValue(this.organization._id);
    this.editPricingForm.get('_id').setValue(this.orgDefaultPricing._id);
    console.log(this.editPricingForm.getRawValue())
    if (!this.editPricingForm.valid) {
      this.alertService.warn("Items have invalid fields", GlobalConstants.flashMessageOptions)
      return
    }

    this.pricingService.updateItems(this.editPricingForm.getRawValue());
  }

  definedColumns: string[] = ['name', 'unit'];
  displayedColumns: string[] = ['Item Name', 'Unit'];
  expandedElement: PricingItemModel | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<PricingItemModel> = new MatTableDataSource();
  discountForm: FormGroup;

  discountObject : any = {};

  updateData(data: PricingItemModel[]) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.filterPredicate = (data: PricingItemModel, filter: string) => {
      return data.name.includes(filter);
    };
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.expandedElement = null;
    // Sort needs to be set after datasource is set
    // Don't ever use detectChanges on table, it will delay stuff

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.expandedElement = null;
  }

  getDestination(itemId: string, routeId: string, destinationId: string) : PricingDestinationModel {
    try {
      let result =  this.pricingForm.getRawValue().items.filter(item => item._id == itemId)[0]
        .routes.filter(route => route._id == routeId)[0]
        .destinations.filter(destination => destination._id == destinationId)[0]
      return result;
    } catch (error) {
      console.log(error);
      this.authService.redirectOnFailedSubscription("Couldn't load pricing");
    }
  }

  getDiscountsForDestination(itemId: string, routeId: string, destinationId: string) : PricingDiscountModel{
    try {
      let result =  this.pricingForm.getRawValue().items.filter(item => item._id == itemId)[0]
        .routes.filter(route => route._id == routeId)[0]
        .destinations.filter(destination => destination._id == destinationId)[0]
        .discounts.filter(discount => discount.userId == this.selectedUser._id)[0]
      return result? result: {perUnitDiscountAmount: 0, extraChargeDiscountAmount: 0};
    } catch (error) {
      console.log(error);
      this.authService.redirectOnFailedSubscription("Couldn't load pricing");
    }
  }

  onDiscountChange(itemId: string, routeId: string, destinationId: string, perUnitDiscountUnit: string, perUnitDiscountAmount: number, extraChargeDiscountUnit: string, extraChargeDiscountAmount: number) {
    try {
      let itemIndex = this.pricingForm.getRawValue().items.findIndex(item => item._id == itemId);
      let routeIndex = this.pricingForm.getRawValue().items[itemIndex].routes.findIndex(route => route._id == routeId);
      let destinationIndex = this.pricingForm.getRawValue().items[itemIndex].routes[routeIndex].destinations.findIndex(destination => destination._id == destinationId);
      let discountIndex = this.pricingForm.getRawValue().items[itemIndex].routes[routeIndex].destinations[destinationIndex].discounts.findIndex(discount => discount.userId == this.selectedUser._id);
      if (perUnitDiscountUnit) {
        this.pricingForm.get('items')['controls'][itemIndex].get('routes')['controls'][routeIndex].get('destinations')['controls'][destinationIndex].get('discounts')['controls'][discountIndex].get('perUnitDiscountUnit').setValue(perUnitDiscountUnit);
      } else if (perUnitDiscountAmount) {
        this.pricingForm.get('items')['controls'][itemIndex].get('routes')['controls'][routeIndex].get('destinations')['controls'][destinationIndex].get('discounts')['controls'][discountIndex].get('perUnitDiscountAmount').setValue(perUnitDiscountAmount);
      } else if (extraChargeDiscountUnit) {
        this.pricingForm.get('items')['controls'][itemIndex].get('routes')['controls'][routeIndex].get('destinations')['controls'][destinationIndex].get('discounts')['controls'][discountIndex].get('extraChargeDiscountUnit').setValue(extraChargeDiscountUnit);
      } else if (extraChargeDiscountAmount) {
        this.pricingForm.get('items')['controls'][itemIndex].get('routes')['controls'][routeIndex].get('destinations')['controls'][destinationIndex].get('discounts')['controls'][discountIndex].get('extraChargeDiscountAmount').setValue(extraChargeDiscountAmount);
      }
    } catch (error) {
      console.log(error);
      this.authService.redirectOnFailedSubscription("Couldn't load pricing");
    }
  }

  getDiscountUnits(unit: string) { // limit to % if extra charge unit is %
    if (unit === "%") {
      return ["%"];
    } else if (unit === "$") {
      return this.discountUnits;
    }
  }
}
