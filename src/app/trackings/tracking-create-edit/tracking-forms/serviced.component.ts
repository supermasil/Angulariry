import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Component, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from "@angular/material/chips";
import { CarrierTrackingModel } from "../../../models/tracking-models/carrier-tracking.model";


@Component({
  selector: 'serviced-form-create',
  templateUrl: './serviced.component.html',
  styleUrls: ['./serviced.component.css', '../tracking-create-edit.component.css']
})
export class ServicedFormCreateComponent implements OnInit {
  servicedForm: FormGroup;
  userCodes = ["Alex", "John", "Kay"];
  internalStatus = ["Received at US WH", "Consolidated"];

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  carrierTrackings: string[] = ["12312", "sgasdgfsfd", "fa32423fds"];

  orderNumbers: string[] = [
    "1231431431", "4353452342", "43634542"
  ]

  constructor() {}


  ngOnInit() {
    this.servicedForm = new FormGroup({
      trackingNumber: new FormControl({value: "sev-" + Date.now() + Math.floor(Math.random() * 10000), disabled: true}),
      items: new FormArray([this.createItem()]),
      content: new FormControl(""),
    });
  }

  onSave() {

  }

  // Requested Item Row
  createItem(): FormGroup {
    return new FormGroup({
      productLink: new FormControl("", {validators: [Validators.required]}),
      productPrice: new FormControl("", {validators: [Validators.required, Validators.min(0.01)]}),
      specifications: new FormControl("", {validators: [Validators.required]}),
      quantity: new FormControl("", {validators: [Validators.required]}),
      orderNumbers: new FormControl(this.orderNumbers),
      carrierTrackings: new FormControl(this.carrierTrackings)
    });
  }

  addItem() {
    (this.servicedForm.get('items') as FormArray).push(this.createItem());
  }

  removeItem(i: number) {
    if((this.servicedForm.get('items') as FormArray).length == 1) {
      return;
    }
    (this.servicedForm.get('items') as FormArray).removeAt(i);
  }

  // Mat chips
  addChipNumber(event: MatChipInputEvent, type: number, index: number): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      switch (type) {
        case 0: {// Order number
          let form = (this.servicedForm.get('items') as FormArray).at(index);
          let orderNumbers = form['controls'].get('orderNumbers').value;
          orderNumbers.push(value.trim());
          form['controls'].get('orderNumbers').setValue(orderNumbers);
          break;
        }
        case 1: {// Tracking number
          let formArray = (this.servicedForm.get('items') as FormArray);
          let carrierTrackings = formArray.controls['carrierTrackings'].value;
          carrierTrackings.push(value.trim());
          formArray.controls['carrierTrackings'].setValue(carrierTrackings);
          break;
        }
      }
    }

    if (input) {
      input.value = '';
    }
  }

  removeChipNumber(number: string, type: number,  index: number): void {
    switch (type) {
      case 0: {// Order number
        let formArray = (this.servicedForm.get('items') as FormArray);
        let orderNumbers = formArray.controls['orderNumbers'].value;
        orderNumbers = orderNumbers.filter(item => !(item == number));
        formArray.controls['orderNumbers'].setValue(orderNumbers);

        break;
      }
      case 1: {// Tracking number
        let formArray = (this.servicedForm.get('items') as FormArray);
        let carrierTrackings = formArray.controls['carrierTrackings'].value;
        carrierTrackings = carrierTrackings.filter(item => !(item.trackingNumber == number));
        formArray.controls['carrierTrackings'].setValue(carrierTrackings);
        break;
      }
    }
  }

  getChipColor(status: string) {
    switch (status) {
      case "Unknown": {
        return "basic"
      }
      case "In Transit": {
        return "accent"
      }
      case "Delivered": {
        return "primary"
      }
    }
  }
}
