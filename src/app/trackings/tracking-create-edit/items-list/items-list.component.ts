import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
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

  @Input() userIdObservable: Observable<string> = new Observable();
  userId: string;

  @Input() originObservable: Observable<string> = new Observable();
  origin: string;

  @Input() destinationObservable: Observable<string> = new Observable();
  destination: string;

  itemNames = [];
  itemNamesSubject = new BehaviorSubject<string[]>([]); // Subject won't work for some reason

  insurance = ["Regular", "2%"];

  @ViewChild('submitButton') submitButton: ElementRef<HTMLInputElement>;

  constructor(private authService: AuthService) {
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

    this.originObservable.subscribe((o: string) => {
      this.origin = o;
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch user origin");
    });

    this.destinationObservable.subscribe((d: string) => {
      this.destination = d;
    }, error => {
      this.authService.redirectOnFailedSubscription("Couldn't fetch user destination");
    });
  }

  ngAfterViewInit() {
    this.itemNamesSubject.next(this.itemNames);
  }

  createItem(): FormGroup {
    let form = new FormGroup({
      name: new FormControl("", {validators:[Validators.required]}),
      value: new FormControl(0, {validators:[Validators.required]}),
      quantity: new FormControl(0, {validators:[Validators.required]}),
      unitCharge: new FormControl({value: 0, disabled: true}, {validators:[Validators.required]}),
      extraCharge: new FormControl({value: 0, disabled: true}, {validators:[Validators.required]}),
      weight: new FormControl(0, {validators:[Validators.required]}),
      insurance: new FormControl(this.insurance[0], {validators: [Validators.required]}),
      status: new FormControl({value: "Unknown", disabled: true}, {validators:[Validators.required]})
    });
    // form.markAllAsTouched();
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
  }

  getFormValidity() {
    return this.itemsForm.valid;
  }

  getRawValues() {
    return this.itemsForm.getRawValue();
  }

  triggerValidation() {
    this.submitButton.nativeElement.click();
    return this.itemsForm.valid;
  }
}
