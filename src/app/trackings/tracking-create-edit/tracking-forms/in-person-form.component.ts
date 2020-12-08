import { Component, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { mimeType } from '../mime-type.validator';


@Component({
  selector: 'in-person-form-create',
  templateUrl: './in-person-form.component.html',
  styleUrls: ['./in-person-form.component.css', '../tracking-create.component.css']
})
export class inPersonFormCreateComponent implements OnInit{
  inPersonForm: FormGroup;

  customerCodes = ["Online", "Serviced", "In-person", "Consolidated", "Master"];
  filteredCustomerCodes: Observable<string[]>;

  recipients = ["1", "Serviced", "In-person", "3", "Master"];
  filteredRecipients: Observable<string[]>;

  itemNames = ["Drug", "Cocaine", "Weed", "Estasy", "Meth"];
  filteredItemNames: Observable<string[]>;

  origins = ["California", "Oregon"];
  destinations = ["Saigon", "Hanoi"];

  ngOnInit() {
    this.inPersonForm = new FormGroup({
      orderNumber: new FormControl({value: "inp-" + Date.now(), disabled: true}, {validators: [Validators.required]}),
      customerCode: new FormControl(null, {validators: [Validators.required]}),
      recipient: new FormControl(null, {validators: [Validators.required]}),
      origin: new FormControl(null, {validators: [Validators.required]}),
      destination: new FormControl(null, {validators: [Validators.required]}),
      items: new FormArray([this.createInPersonItem()]),
      content: new FormControl(""),
      weight: new FormControl(null, {validators: [Validators.required]}),
      insurance: new FormControl(false, {validators: [Validators.required]}),
      payAtDestination: new FormControl(false, {validators: [Validators.required]}),
      fileValidator: new FormControl(null, {asyncValidators: [mimeType]})
    });
  }

  createInPersonItem(): FormGroup {
    let form =  new FormGroup({
      name: new FormControl("", {validators:[Validators.required]}),
      value: new FormControl("", {validators:[Validators.required]}),
      quantity: new FormControl("", {validators:[Validators.required]}),
      extraCharge: new FormControl("", {validators:[Validators.required]}),
    })

    return form;
  }

  addFormItem(form: FormGroup) {
    (form.get('items') as FormArray).push(this.createInPersonItem());
  }

  removeFormItem(i: number, form: FormGroup) {
    (form.get('items') as FormArray).removeAt(i);
 }

  filterAutoCompleteItems(value: string, values: string[]) {
    const filterValue = value.toLowerCase();
    return of(values.filter(option => option.toLowerCase().includes(filterValue)));
  }

  onSave() {

  }

  onFilePicked(event: Event) {

  }

  deleteFile(index: number, url: string) {

  }
}
