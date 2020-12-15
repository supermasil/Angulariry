import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'master-form-create',
  templateUrl: './master-form.component.html',
  styleUrls: ['./master-form.component.css', '../tracking-create.component.css']
})
export class MasterFormCreateComponent implements OnInit {
  masterForm: FormGroup;

  customerCodes = ["Alex", "John", "Kay"];

  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredFruits: Observable<string[]>;
  allFruits: string[] = ['Apple', 'Lemon', 'Lime', 'Orange', 'Strawberry', 'Straw1berry', 'Straw2berry', 'Straw3berry', 'Straw4berry', 'Straw5berry', 'Straw6berry', 'Straw7berry'];

  fruitCtrl = new FormControl();
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor() {
    this.filteredFruits = this.fruitCtrl.valueChanges.pipe(
        startWith(null),
        map((fruit: string | null) => fruit ? this._filter(fruit) : this.allFruits.slice()));
  }

  ngOnInit() {
    this.masterForm = new FormGroup({
      trackingNumber: new FormControl({value: "mst-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}, {validators: [Validators.required]}),
      items: new FormArray([this.createBox()]),
    });
  }

  removeItem(fruit: string, index: number): void {
    let form: FormGroup = this.masterForm.get('items')['controls'][index];
    let items = form.controls['items'].value;

    const i = items.indexOf(fruit);

    if (i >= 0) {
      items.splice(i, 1);
    }
    this.allFruits.push(fruit);

    // console.log(this.masterForm.get('items')['controls'][index].controls['items'].value)
  }

  selectItem(event: MatAutocompleteSelectedEvent, index: number): void {
    let form: FormGroup = this.masterForm.get('items')['controls'][index];
    form.controls['items'].value.push(event.option.viewValue);
    this.fruitCtrl.setValue(null);
    this.allFruits.splice(this.allFruits.indexOf(event.option.viewValue), 1); // no need to index check here
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allFruits.filter(fruit => fruit.toLowerCase().indexOf(filterValue) === 0);
  }

  createBox(): FormGroup {
    let form =  new FormGroup({
      palletNumber: new FormControl(null, {validators:[Validators.required]}),
      boxNumber: new FormControl(null, {validators:[Validators.required]}),
      items: new FormControl([], {validators:[Validators.required]}),
      content: new FormControl(null, {validators:[Validators.required]}),
    })

    return form;
  }

  addBox(form: FormGroup) {
    (form.get('items') as FormArray).push(this.createBox());
  }

  removeBox(i: number, form: FormGroup) {
    if((this.masterForm.get('items') as FormArray).length == 1) {
      return;
    }

    let saveItems = this.masterForm.get('items')['controls'][i].controls['items'].value;
    this.allFruits.push(...saveItems);
    (form.get('items') as FormArray).removeAt(i);
  }
}
