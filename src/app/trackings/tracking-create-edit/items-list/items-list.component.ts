import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Component({
  selector: 'items-list',
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.css', '../tracking-create-edit.component.css']
})
export class ItemsListComponent implements OnInit, AfterViewInit{

  itemsForm: FormGroup;

  itemNames = ['Apple', 'Lemon', 'Lime', 'Orange', 'Strawberry', 'Straw1berry', 'Straw2berry', 'Straw3berry', 'Straw4berry', 'Straw5berry', 'Straw6berry', 'Straw7berry'];
  itemNamesSubject = new BehaviorSubject<string[]>([]); // Subject won't work for some reason
  filteredItemNames: Observable<string[]>;
  itemNameInputCtrl = new FormControl();

  insurance = ["Regular", "2%"];

  @ViewChild('submitButton') submitButton: ElementRef<HTMLInputElement>;

  constructor() {
  }

  ngOnInit() {
    this.itemsForm = new FormGroup({
      items: new FormArray([this.createItem()])
    });
  }

  ngAfterViewInit() {
    this.itemNamesSubject.next(this.itemNames);
  }

  filterAutoCompleteItems(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredItemNames = of(this.itemNames.filter(option => option.toLowerCase().includes(filterValue)));
  }

  createItem(): FormGroup {
    let form = new FormGroup({
      name: new FormControl("", {validators:[Validators.required]}),
      value: new FormControl(0, {validators:[Validators.required]}),
      quantity: new FormControl(0, {validators:[Validators.required]}),
      extraCharge: new FormControl({value: 0, disabled: true}, {validators:[Validators.required]}),
      weight: new FormControl(0, {validators:[Validators.required]}),
      insurance: new FormControl(this.insurance[0], {validators: [Validators.required]})
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

  selectItem(event: MatAutocompleteSelectedEvent, index: number): void {
    this.filteredItemNames = of(this.itemNames); // Reset the list
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
